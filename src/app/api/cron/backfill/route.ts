/**
 * Resumable bulk backfill endpoint.
 *
 * Designed for Vercel where every invocation has a 5-minute hard limit.
 * Each call processes a fixed chunk of groups (sets), then returns a
 * `nextCursor` JSON object you can pass to the next call to continue.
 *
 * Usage (no args = start at the beginning, process default chunk):
 *   GET  /api/cron/backfill
 *   GET  /api/cron/backfill?game=LORCANA&offset=20&chunk=15
 *
 * Response:
 *   {
 *     processed: { game, fromIndex, toIndex, totalGroups, cards, sealed },
 *     done: boolean,
 *     nextCursor: { game, offset } | null
 *   }
 *
 * For Magic the bulk file is too big to process inside a single request,
 * so this endpoint will instead refresh Scryfall prices for cards already in
 * the DB in batches of `chunk * 200` rows.
 *
 * Header (optional):  Authorization: Bearer <CRON_SECRET>
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GameType } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const TCG_HEADERS = { Accept: 'application/json', 'User-Agent': 'HatakeSocial/1.0' };

const SEALED_RE =
  /(booster (box|pack)|elite trainer box|display|case|blister|theme deck|starter deck|collection box|premium collection|bundle|gift box|tin)/i;

const ORDER: { game: GameType; categoryId: number | null }[] = [
  { game: GameType.POKEMON, categoryId: 3 },
  { game: GameType.ONE_PIECE, categoryId: 68 },
  { game: GameType.LORCANA, categoryId: 71 },
  { game: GameType.RIFTBOUND, categoryId: 89 },
  { game: GameType.MAGIC, categoryId: null }, // Scryfall handled separately
];

function nextGame(g: GameType): GameType | null {
  const i = ORDER.findIndex((x) => x.game === g);
  return i >= 0 && i + 1 < ORDER.length ? ORDER[i + 1].game : null;
}

async function fetchJson(url: string): Promise<any> {
  const r = await fetch(url, { headers: TCG_HEADERS });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function processTcgCsvChunk(
  categoryId: number,
  game: GameType,
  offset: number,
  chunk: number,
) {
  const groupsData = await fetchJson(
    `https://tcgcsv.com/tcgplayer/${categoryId}/groups`,
  );
  const groups: any[] = (groupsData.results || []).slice().sort(
    (a: any, b: any) =>
      new Date(b.publishedOn || 0).getTime() -
      new Date(a.publishedOn || 0).getTime(),
  );
  const totalGroups = groups.length;
  const slice = groups.slice(offset, offset + chunk);

  let cards = 0;
  let sealed = 0;
  for (const group of slice) {
    const setCode = group.abbreviation || group.name;
    const [pData, prData] = await Promise.all([
      fetchJson(
        `https://tcgcsv.com/tcgplayer/${categoryId}/${group.groupId}/products`,
      ).catch(() => ({ results: [] })),
      fetchJson(
        `https://tcgcsv.com/tcgplayer/${categoryId}/${group.groupId}/prices`,
      ).catch(() => ({ results: [] })),
    ]);
    const priceMap = new Map<number, number>();
    for (const pr of prData.results || []) {
      priceMap.set(pr.productId, pr.marketPrice || pr.midPrice || pr.lowPrice || 0);
    }
    for (const p of pData.results || []) {
      const apiId = String(p.productId);
      const imageUrl = p.imageUrl || 'https://i.imgur.com/B06rBhI.png';
      const price = priceMap.get(p.productId) || 0;
      const isSealed = SEALED_RE.test(p.name || '');
      try {
        if (isSealed) {
          await db.sealedReference.upsert({
            where: { id: apiId },
            update: { name: p.name, imageUrl, setCode, price },
            create: {
              id: apiId,
              game,
              name: p.name,
              type: 'SEALED_PRODUCT',
              setCode,
              imageUrl,
              price,
              apiPayload: p,
            },
          });
          sealed++;
        } else {
          await db.cardReference.upsert({
            where: { apiId },
            update: { name: p.name, imageUrl, setCode, price },
            create: {
              apiId,
              game,
              name: p.name,
              imageUrl,
              setCode,
              rarity:
                p.extendedData?.find((e: any) => e.name === 'Rarity')?.value || null,
              price,
              apiPayload: p,
            },
          });
          cards++;
        }
      } catch {
        // continue
      }
    }
  }

  const newOffset = offset + slice.length;
  return { totalGroups, fromIndex: offset, toIndex: newOffset, cards, sealed };
}

/**
 * Process one chunk of Scryfall default_cards. We page through the bulk file
 * by Scryfall's own search API (`page=` query), which lets us cursor cleanly.
 * Each Scryfall page returns 175 cards; `chunk` controls how many pages we
 * burn through per invocation.
 */
async function processScryfallChunk(offset: number, chunk: number) {
  let cards = 0;
  let lastPage = offset;
  let hasMore = true;
  for (let i = 0; i < chunk && hasMore; i++) {
    const page = offset + i + 1; // Scryfall pages are 1-indexed
    const url = `https://api.scryfall.com/cards/search?q=game%3Apaper&order=released&unique=prints&page=${page}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HatakeSocial/1.0' } });
    if (!res.ok) {
      hasMore = false;
      break;
    }
    const data = await res.json();
    hasMore = !!data.has_more;
    for (const card of data.data || []) {
      if (!card.id || !card.name) continue;
      const imageUrl =
        card.image_uris?.normal ||
        card.image_uris?.large ||
        card.card_faces?.[0]?.image_uris?.normal ||
        'https://i.imgur.com/B06rBhI.png';
      const price = parseFloat(card.prices?.usd || card.prices?.usd_foil || '0') || 0;
      try {
        await db.cardReference.upsert({
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
        cards++;
      } catch {
        // skip failures
      }
    }
    lastPage = page;
    // Be polite to Scryfall
    await new Promise((r) => setTimeout(r, 80));
  }
  return { cards, lastPage, hasMore };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const gameParam = (url.searchParams.get('game') || 'POKEMON').toUpperCase() as GameType;
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const chunk = Math.max(
    1,
    Math.min(parseInt(url.searchParams.get('chunk') || '20', 10), 100),
  );

  const cfg = ORDER.find((o) => o.game === gameParam);
  if (!cfg) {
    return NextResponse.json({ error: `Unknown game: ${gameParam}` }, { status: 400 });
  }

  let processed: any;
  let done: boolean;
  let nextCursor: { game: GameType; offset: number } | null;

  if (cfg.categoryId === null) {
    // Magic via Scryfall pages
    const r = await processScryfallChunk(offset, chunk);
    processed = { game: gameParam, ...r };
    done = !r.hasMore;
    if (done) {
      const ng = nextGame(gameParam);
      nextCursor = ng ? { game: ng, offset: 0 } : null;
    } else {
      nextCursor = { game: gameParam, offset: r.lastPage };
    }
  } else {
    const r = await processTcgCsvChunk(cfg.categoryId, gameParam, offset, chunk);
    processed = { game: gameParam, ...r };
    done = r.toIndex >= r.totalGroups;
    if (done) {
      const ng = nextGame(gameParam);
      nextCursor = ng ? { game: ng, offset: 0 } : null;
    } else {
      nextCursor = { game: gameParam, offset: r.toIndex };
    }
  }

  return NextResponse.json({
    processed,
    done,
    nextCursor,
    hint: nextCursor
      ? `Call again: /api/cron/backfill?game=${nextCursor.game}&offset=${nextCursor.offset}&chunk=${chunk}`
      : 'Backfill complete — every game seeded.',
  });
}
