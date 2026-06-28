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

  // Always include the live current value as the last point
  const instances = await db.cardInstance.findMany({
    where: { ownerId: payload.id as string },
    select: { cardReference: { select: { price: true } } },
  });
  const liveTotal = instances.reduce(
    (s, i) => s + (i.cardReference.price ?? 0),
    0,
  );

  return NextResponse.json({
    days,
    points: history,
    live: { totalValue: liveTotal, cardCount: instances.length, asOf: new Date() },
  });
}
