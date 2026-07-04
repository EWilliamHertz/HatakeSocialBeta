/**
 * GET /api/collection/value-history
 *
 * Returns the signed-in user's collection-value snapshots (chronological).
 * Used by the front-end to render a value-over-time chart.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = cookies().get('hatake_session')?.value;
  const payload = session ? await decrypt(session) : null;
  if (!payload?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get('days') || '90', 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const history = await db.collectionValueHistory.findMany({
    where: { userId: payload.id as string, recordedAt: { gte: since } },
    orderBy: { recordedAt: 'asc' },
    select: { totalValue: true, cardCount: true, recordedAt: true },
  });

  // Calculate accurate live value
  const instances = await db.cardInstance.findMany({
    where: { ownerId: payload.id as string },
    select: {
      quantity: true,
      condition: true,
      isFoil: true,
      isHolo: true,
      isReverseHolo: true,
      isSigned: true,
      cardReference: { select: { price: true, foilPrice: true, reverseHoloPrice: true } }
    },
  });

  const getPrice = (inst: any) => {
    let p = inst.cardReference.price || 0;
    if (inst.isFoil || inst.isHolo) p = inst.cardReference.foilPrice || p;
    if (inst.isReverseHolo) p = inst.cardReference.reverseHoloPrice || inst.cardReference.foilPrice || p;
    
    let conditionMultiplier = 1.0;
    if (inst.condition === 'MINT') conditionMultiplier = 1.2;
    if (inst.condition === 'LIGHTLY_PLAYED') conditionMultiplier = 0.8;
    if (inst.condition === 'MODERATELY_PLAYED') conditionMultiplier = 0.65;
    if (inst.condition === 'HEAVILY_PLAYED') conditionMultiplier = 0.45;
    if (inst.condition === 'DAMAGED') conditionMultiplier = 0.25;

    let calculated = p * conditionMultiplier;
    if (inst.isSigned) calculated += 8.00;
    
    return calculated;
  };

  let liveTotal = instances.reduce(
    (s, i) => s + (getPrice(i) * (i.quantity || 1)),
    0
  );

  const sealedInstances = await db.sealedInstance.findMany({
    where: { ownerId: payload.id as string },
    select: { sealedReference: { select: { price: true } } }
  });

  const sealedTotal = sealedInstances.reduce(
    (s, i) => s + (i.sealedReference.price || 0),
    0
  );

  liveTotal += sealedTotal;

  // Track the unique cards and sealed items total length
  const cardCount = instances.reduce((s, i) => s + (i.quantity || 1), 0) + sealedInstances.length;

  return NextResponse.json({
    days,
    points: history,
    live: { totalValue: liveTotal, cardCount, asOf: new Date() },
  });
}
