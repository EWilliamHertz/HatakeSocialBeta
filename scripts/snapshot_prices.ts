/**
 * Records a daily price-history snapshot for every CardReference,
 * then records a CollectionValueHistory row for every user.
 *
 * Designed to be run from the Vercel cron (see /api/cron/snapshot-prices)
 * or manually: `npx tsx scripts/snapshot_prices.ts`.
 *
 * Only writes one PriceHistory row per card per UTC day (idempotent).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function startOfUtcDay(d = new Date()): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export async function snapshotPrices(source = 'tcgcsv') {
  const today = startOfUtcDay();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  let pricePoints = 0;
  let userPoints = 0;

  // 1. Price points: every card with a non-null price gets one row per UTC day
  const cards = await prisma.cardReference.findMany({
    where: { price: { not: null } },
    select: { id: true, price: true },
  });
  console.log(`Recording price history for ${cards.length} cards...`);

  // Bulk-skip cards that already have a snapshot today (idempotency)
  const alreadySnapped = new Set(
    (
      await prisma.priceHistory.findMany({
        where: { recordedAt: { gte: today, lt: tomorrow } },
        select: { cardReferenceId: true },
      })
    ).map((r) => r.cardReferenceId),
  );

  const newPoints = cards.filter((c) => !alreadySnapped.has(c.id));
  for (let i = 0; i < newPoints.length; i += 500) {
    const slice = newPoints.slice(i, i + 500);
    await prisma.priceHistory.createMany({
      data: slice.map((c) => ({
        cardReferenceId: c.id,
        price: c.price ?? 0,
        source,
      })),
    });
    pricePoints += slice.length;
    if (i % 2500 === 0) console.log(`  ...${pricePoints}/${newPoints.length}`);
  }
  console.log(`Wrote ${pricePoints} new price history points.`);

  // 2. Collection-value snapshot per user
  const users = await prisma.user.findMany({ select: { id: true } });
  console.log(`Recording collection value for ${users.length} users...`);

  for (const u of users) {
    const instances = await prisma.cardInstance.findMany({
      where: { ownerId: u.id },
      select: { cardReference: { select: { price: true } } },
    });
    const totalValue = instances.reduce(
      (sum, ci) => sum + (ci.cardReference.price ?? 0),
      0,
    );
    const cardCount = instances.length;

    // Don't double-write per day
    const exists = await prisma.collectionValueHistory.findFirst({
      where: { userId: u.id, recordedAt: { gte: today, lt: tomorrow } },
      select: { id: true },
    });
    if (exists) continue;

    await prisma.collectionValueHistory.create({
      data: { userId: u.id, totalValue, cardCount },
    });
    userPoints++;
  }
  console.log(`Wrote ${userPoints} new collection-value snapshots.`);

  return { pricePoints, userPoints };
}

if (require.main === module) {
  snapshotPrices()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
