/**
 * Seeds Magic: The Gathering cards from Scryfall's bulk data API.
 *
 * Usage:
 *   npx tsx scripts/seed_scryfall.ts             # default_cards (full, ~100k)
 *   npx tsx scripts/seed_scryfall.ts oracle      # oracle_cards (lighter, ~30k)
 *   npx tsx scripts/seed_scryfall.ts --limit=500 # cap for quick local seed
 *   npx tsx scripts/seed_scryfall.ts oracle --limit=2000
 */
import { PrismaClient, GameType } from '@prisma/client';
import { createWriteStream, createReadStream, existsSync, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import readline from 'readline';

const prisma = new PrismaClient();
const UA = 'HatakeSocial/1.0 (+https://hatake.social)';

const args = process.argv.slice(2);
const wantOracle = args.includes('oracle');
const limitArg = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 0;

async function getBulkUrl(): Promise<{ uri: string; type: string }> {
  const res = await fetch('https://api.scryfall.com/bulk-data', {
    headers: { 'User-Agent': UA },
  });
  const data = await res.json();
  const wanted = wantOracle ? 'oracle_cards' : 'default_cards';
  const entry = data.data.find((d: any) => d.type === wanted);
  if (!entry) throw new Error(`Could not find ${wanted} bulk endpoint`);
  return { uri: entry.download_uri, type: wanted };
}

async function download(url: string, dest: string) {
  console.log(`Downloading ${url} → ${dest}`);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok || !res.body) throw new Error(`Failed to fetch ${url}`);
  // @ts-ignore — Node 20 web stream → node stream
  await pipeline(res.body as any, createWriteStream(dest));
  console.log('Download complete.');
}

async function upsertCard(card: any) {
  if (!card?.id || !card?.name) return false;
  const imageUrl =
    card.image_uris?.normal ||
    card.image_uris?.large ||
    card.card_faces?.[0]?.image_uris?.normal ||
    'https://i.imgur.com/B06rBhI.png';
  const price = parseFloat(card.prices?.usd || card.prices?.usd_foil || '0') || 0;
  await prisma.cardReference.upsert({
    where: { apiId: card.id },
    update: {
      name: card.name,
      imageUrl,
      setCode: (card.set || '').toUpperCase(),
      rarity: card.rarity || null,
      price,
      apiPayload: card,
    },
    create: {
      apiId: card.id,
      game: GameType.MAGIC,
      name: card.name,
      imageUrl,
      setCode: (card.set || '').toUpperCase(),
      rarity: card.rarity || null,
      price,
      apiPayload: card,
    },
  });
  return true;
}

/**
 * Scryfall ships its bulk JSON as a single huge `[...]` array — NOT NDJSON.
 * We avoid loading the whole file into memory by reading char-by-char and
 * splitting on top-level commas (depth-aware brace tracking).
 */
async function* streamCards(filePath: string): AsyncGenerator<any> {
  const rl = readline.createInterface({
    input: createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  let buffer = '';
  let depth = 0;
  let inString = false;
  let escape = false;
  let started = false;

  for await (const line of rl) {
    for (const ch of line + '\n') {
      if (!started) {
        if (ch === '[') started = true;
        continue;
      }
      if (escape) {
        buffer += ch;
        escape = false;
        continue;
      }
      if (ch === '\\') {
        buffer += ch;
        escape = true;
        continue;
      }
      if (ch === '"') inString = !inString;
      if (!inString) {
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            buffer += ch;
            try {
              yield JSON.parse(buffer.trim());
            } catch {
              // ignore parse failure
            }
            buffer = '';
            continue;
          }
        }
      }
      if (depth > 0) buffer += ch;
    }
  }
}

async function run() {
  const tmp = path.join('/tmp', 'scryfall');
  if (!existsSync(tmp)) mkdirSync(tmp, { recursive: true });
  const { uri, type } = await getBulkUrl();
  const file = path.join(tmp, `${type}.json`);
  if (!existsSync(file)) {
    await download(uri, file);
  } else {
    console.log(`Reusing cached file ${file}`);
  }

  console.log(`Streaming and upserting Scryfall ${type}...`);
  let count = 0;
  let skipped = 0;
  let batch: Array<Promise<unknown>> = [];

  for await (const card of streamCards(file)) {
    if (LIMIT && count >= LIMIT) break;
    if (!card?.id || !card?.name) {
      skipped++;
      continue;
    }
    batch.push(upsertCard(card).catch(() => false));
    count++;
    if (batch.length >= 50) {
      await Promise.all(batch);
      batch = [];
      if (count % 500 === 0) console.log(`  …upserted ${count} cards`);
    }
  }
  if (batch.length) await Promise.all(batch);

  console.log(`Done. Upserted ${count} MAGIC cards (skipped ${skipped}).`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
