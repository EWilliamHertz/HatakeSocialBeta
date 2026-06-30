import { PrismaClient } from '@prisma/client';
import { createReadStream, existsSync } from 'fs';
import readline from 'readline';

const prisma = new PrismaClient();

// A simple parser for Scryfall's bulk JSON file
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
  const file = '/tmp/scryfall/default_cards.json';
  if (!existsSync(file)) {
    console.error('Bulk JSON not found! Please run seed_scryfall.ts first to download it.');
    process.exit(1);
  }

  console.log('Scanning bulk JSON to update missing artist names...');
  let updated = 0;

  for await (const card of streamCards(file)) {
    if (!card?.id || !card?.artist) continue;

    // Find the card in the database
    const existing = await prisma.cardReference.findUnique({
      where: { apiId: card.id },
      select: { id: true, apiPayload: true }
    });

    if (existing) {
      const payload = existing.apiPayload as any;
      if (payload && !payload.artist) {
        payload.artist = card.artist;
        await prisma.cardReference.update({
          where: { id: existing.id },
          data: { apiPayload: payload }
        });
        updated++;
        if (updated % 500 === 0) console.log(`Updated ${updated} artists...`);
      }
    }
  }

  console.log(`Done! Successfully added artist data to ${updated} cards.`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
