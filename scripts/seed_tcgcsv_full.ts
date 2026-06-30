/**
 * Full TCGCSV sync for any number of games.
 *
 * TCGCSV (https://tcgcsv.com) mirrors the daily TCGplayer dumps for free.
 * Category IDs we care about:
 *   1   Magic                                       (we use Scryfall for MTG cards, but TCGCSV for sealed)
 *   3   Pokemon
 *   68  One Piece Card Game
 *   71  Lorcana TCG
 *   89  Riftbound League of Legends Trading Card Game
 *
 * Usage:
 *   npx tsx scripts/seed_tcgcsv_full.ts                     # all (Pokemon, OP, Lorcana, Riftbound)
 *   npx tsx scripts/seed_tcgcsv_full.ts lorcana riftbound   # subset
 *   npx tsx scripts/seed_tcgcsv_full.ts --recent=3          # only the 3 most recent groups per game
 */
import { PrismaClient, GameType } from '@prisma/client';

const prisma = new PrismaClient();
const headers = { Accept: 'application/json', 'User-Agent': 'HatakeSocial/1.0' };

const CATEGORIES: Record<string, { id: number; game: GameType }> = {
  pokemon: { id: 3, game: GameType.POKEMON },
  'one-piece': { id: 68, game: GameType.ONE_PIECE },
  lorcana: { id: 71, game: GameType.LORCANA },
  riftbound: { id: 89, game: GameType.RIFTBOUND },
};

const SEALED_RE =
  /(booster (box|pack)|elite trainer box|display|case|blister|theme deck|starter deck|collection box|premium collection|bundle|gift box|tin)/i;

function arg(name: string, def?: string): string | undefined {
  const a = process.argv.slice(2).find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : def;
}

const recentLimit = parseInt(arg('recent', '0') || '0', 10);

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function syncCategory(name: string) {
  const cfg = CATEGORIES[name];
  if (!cfg) {
    console.warn(`Unknown game: ${name}`);
    return { cards: 0, sealed: 0 };
  }
  const { id: categoryId, game } = cfg;
  console.log(`\n=== Syncing ${game} (TCGCSV category ${categoryId}) ===`);

  const groupsData = await fetchJson(`https://tcgcsv.com/tcgplayer/${categoryId}/groups`);
  let groups: any[] = groupsData.results || [];
  groups.sort(
    (a, b) =>
      new Date(b.publishedOn || 0).getTime() - new Date(a.publishedOn || 0).getTime(),
  );
  if (recentLimit > 0) groups = groups.slice(0, recentLimit);
  console.log(`Will process ${groups.length} groups (sets).`);

  let cards = 0;
  let sealed = 0;

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    const setCode = group.abbreviation || group.name;
    process.stdout.write(`[${gi + 1}/${groups.length}] ${setCode}... `);

    const [pData, prData] = await Promise.all([
      fetchJson(
        `https://tcgcsv.com/tcgplayer/${categoryId}/${group.groupId}/products`,
      ).catch(() => ({ results: [] })),
      fetchJson(
        `https://tcgcsv.com/tcgplayer/${categoryId}/${group.groupId}/prices`,
      ).catch(() => ({ results: [] })),
    ]);

    const priceMap = new Map<number, { price: number; foilPrice: number; reverseHoloPrice: number }>();
    for (const pr of prData.results || []) {
      const amt = pr.marketPrice || pr.midPrice || pr.lowPrice || 0;
      const st = (pr.subTypeName || '').toLowerCase();
      const p = priceMap.get(pr.productId) || { price: 0, foilPrice: 0, reverseHoloPrice: 0 };
      
      if (st.includes('reverse')) {
        p.reverseHoloPrice = amt;
      } else if (st.includes('foil')) {
        p.foilPrice = amt;
      } else {
        p.price = amt;
      }
      
      priceMap.set(pr.productId, p);
    }

    for (const product of pData.results || []) {
      const imageUrl = product.imageUrl || 'https://i.imgur.com/B06rBhI.png';
      const p = priceMap.get(product.productId) || { price: 0, foilPrice: 0, reverseHoloPrice: 0 };
      // Fallback base price if only foil exists
      if (!p.price && p.foilPrice) p.price = p.foilPrice;
      
      const isSealed = SEALED_RE.test(product.name || '');
      const apiId = String(product.productId);

      try {
        if (isSealed) {
          await prisma.sealedReference.upsert({
            where: { id: apiId },
            update: { name: product.name, imageUrl, setCode, price: p.price },
            create: {
              id: apiId,
              game,
              name: product.name,
              type: 'SEALED_PRODUCT',
              setCode,
              imageUrl,
              price: p.price,
              apiPayload: product,
            },
          });
          sealed++;
        } else {
          await prisma.cardReference.upsert({
            where: { apiId },
            update: {
              name: product.name,
              imageUrl,
              setCode,
              rarity: product.extendedData?.find((e: any) => e.name === 'Rarity')?.value || null,
              price: p.price,
              foilPrice: p.foilPrice || null,
              reverseHoloPrice: p.reverseHoloPrice || null,
            },
            create: {
              apiId,
              game,
              name: product.name,
              imageUrl,
              setCode,
              rarity:
                product.extendedData?.find((e: any) => e.name === 'Rarity')?.value || null,
              price: p.price,
              foilPrice: p.foilPrice || null,
              reverseHoloPrice: p.reverseHoloPrice || null,
              apiPayload: product,
            },
          });
          cards++;
        }
      } catch (e) {
        console.error(`  upsert failed for ${product.name}:`, (e as Error).message);
      }
    }
    console.log(`${(pData.results || []).length} items (running totals: ${cards} cards, ${sealed} sealed)`);
  }

  console.log(`✓ ${game}: ${cards} cards + ${sealed} sealed upserted.`);
  return { cards, sealed };
}

async function run() {
  const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const targets = argv.length > 0 ? argv : Object.keys(CATEGORIES);
  let totalC = 0,
    totalS = 0;
  for (const t of targets) {
    const { cards, sealed } = await syncCategory(t);
    totalC += cards;
    totalS += sealed;
  }
  console.log(`\nTOTAL: ${totalC} cards + ${totalS} sealed across ${targets.length} games.`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
