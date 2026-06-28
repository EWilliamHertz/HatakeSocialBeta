/**
 * Daily master sync (Vercel Cron).
 *
 *   1. Pull the latest Scryfall "default_cards" bulk (oracle text + prices)
 *   2. Pull the latest TCGCSV groups for Pokemon, One Piece, Lorcana, Riftbound
 *   3. Snapshot every card's price into PriceHistory (one row per UTC day)
 *   4. Snapshot every user's collection value
 *
 * Secured with CRON_SECRET — set the same value as an env var on Vercel and the
 * cron trigger will pass `Authorization: Bearer <CRON_SECRET>`.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GameType } from '@prisma/client';
import { snapshotPrices } from '@/lib/snapshot';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min, max for Vercel Pro

const TCG_HEADERS = { Accept: 'application/json', 'User-Agent': 'HatakeSocial/1.0' };
const SEALED_RE =
  /(booster (box|pack)|elite trainer box|display|case|blister|theme deck|starter deck|collection box|premium collection|bundle|gift box|tin)/i;

const CATEGORIES: { id: number; game: GameType; recent: number }[] = [
  // Daily cron only refreshes the 10 most recent sets per game to stay under
  // Vercel's 5-min execution budget. For the initial massive seed of every
  // historical set (200+), use /api/cron/backfill (paginated) instead.
  { id: 3, game: GameType.POKEMON, recent: 10 },
  { id: 68, game: GameType.ONE_PIECE, recent: 10 },
  { id: 71, game: GameType.LORCANA, recent: 10 },
  { id: 89, game: GameType.RIFTBOUND, recent: 10 },
];

async function syncTcgCsv(categoryId: number, game: GameType, recent: number) {
  const groupsRes = await fetch(`https://tcgcsv.com/tcgplayer/${categoryId}/groups`, {
    headers: TCG_HEADERS,
  });
  if (!groupsRes.ok) return { cards: 0, sealed: 0 };
  const groupsData = await groupsRes.json();
  let groups: any[] = groupsData.results || [];
  groups.sort(
    (a, b) =>
      new Date(b.publishedOn || 0).getTime() - new Date(a.publishedOn || 0).getTime(),
  );
  if (recent > 0) groups = groups.slice(0, recent);

  let cards = 0;
  let sealed = 0;
  for (const group of groups) {
    const setCode = group.abbreviation || group.name;
    const [pRes, prRes] = await Promise.all([
      fetch(`https://tcgcsv.com/tcgplayer/${categoryId}/${group.groupId}/products`, {
        headers: TCG_HEADERS,
      }),
      fetch(`https://tcgcsv.com/tcgplayer/${categoryId}/${group.groupId}/prices`, {
        headers: TCG_HEADERS,
      }),
    ]);
    if (!pRes.ok) continue;
    const pData = await pRes.json();
    const priceMap = new Map<number, number>();
    if (prRes.ok) {
      const prData = await prRes.json();
      for (const pr of prData.results || []) {
        priceMap.set(pr.productId, pr.marketPrice || pr.midPrice || pr.lowPrice || 0);
      }
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
  return { cards, sealed };
}

async function syncScryfallPrices(maxCards = 5000) {
  // Pull Scryfall bulk metadata, fetch default_cards. Within Vercel's 5-min budget
  // we can refresh prices for the most recent ~5000 entries by name.
  // For full Scryfall load, run `npx tsx scripts/seed_scryfall.ts` once manually.
  try {
    const bulkRes = await fetch('https://api.scryfall.com/bulk-data', {
      headers: { 'User-Agent': 'HatakeSocial/1.0' },
    });
    const bulk = await bulkRes.json();
    const entry = bulk.data.find((d: any) => d.type === 'default_cards');
    if (!entry) return { updated: 0 };

    const res = await fetch(entry.download_uri, {
      headers: { 'User-Agent': 'HatakeSocial/1.0' },
    });
    if (!res.ok) return { updated: 0 };
    const cards: any[] = await res.json();

    let updated = 0;
    for (const card of cards.slice(0, maxCards)) {
      if (!card.id || !card.name) continue;
      const price = parseFloat(card.prices?.usd || card.prices?.usd_foil || '0') || 0;
      try {
        await db.cardReference.update({
          where: { apiId: card.id },
          data: { price },
        });
        updated++;
      } catch {
        // card not yet in DB — skip; full seed will create it
      }
    }
    return { updated };
  } catch (e) {
    return { updated: 0, error: (e as Error).message };
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const report: Record<string, unknown> = { startedAt: new Date().toISOString() };

  try {
    // 1. TCGCSV games
    for (const cat of CATEGORIES) {
      const r = await syncTcgCsv(cat.id, cat.game, cat.recent);
      report[cat.game] = r;
    }

    // 2. Scryfall (Magic) price refresh
    report.MAGIC = await syncScryfallPrices(5000);

    // 3. Daily snapshots
    report.snapshot = await snapshotPrices('cron');

    report.finishedAt = new Date().toISOString();
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    console.error('Daily sync error:', err);
    return NextResponse.json(
      { success: false, error: err.message, report },
      { status: 500 },
    );
  }
}
