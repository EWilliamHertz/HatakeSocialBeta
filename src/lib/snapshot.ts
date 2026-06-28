import { db } from './db';

/**
 * Records a daily price-history snapshot for every CardReference,
 * plus a CollectionValueHistory row for every user. Idempotent per UTC day.
 */
export function startOfUtcDay(d = new Date()): Date {
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

  const cards = await db.cardReference.findMany({
    where: { price: { not: null } },
    select: { id: true, price: true },
  });

  const alreadySnapped = new Set(
    (
      await db.priceHistory.findMany({
        where: { recordedAt: { gte: today, lt: tomorrow } },
        select: { cardReferenceId: true },
      })
    ).map((r) => r.cardReferenceId),
  );

  const newPoints = cards.filter((c) => !alreadySnapped.has(c.id));
  for (let i = 0; i < newPoints.length; i += 500) {
    const slice = newPoints.slice(i, i + 500);
    await db.priceHistory.createMany({
      data: slice.map((c) => ({
        cardReferenceId: c.id,
        price: c.price ?? 0,
        source,
      })),
    });
    pricePoints += slice.length;
  }

  const users = await db.user.findMany({ select: { id: true } });
  for (const u of users) {
    const instances = await db.cardInstance.findMany({
      where: { ownerId: u.id },
      select: { cardReference: { select: { price: true } } },
    });
    const totalValue = instances.reduce(
      (s, i) => s + (i.cardReference.price ?? 0),
      0,
    );

    const exists = await db.collectionValueHistory.findFirst({
      where: { userId: u.id, recordedAt: { gte: today, lt: tomorrow } },
      select: { id: true },
    });
    if (exists) continue;

    await db.collectionValueHistory.create({
      data: { userId: u.id, totalValue, cardCount: instances.length },
    });
    userPoints++;
  }

  return { pricePoints, userPoints };
}
