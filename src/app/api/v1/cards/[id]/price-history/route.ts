/**
 * GET /api/v1/cards/:id/price-history
 *
 * Public price-history endpoint. Requires `Bearer hk_...` API key for the matching game.
 *
 * Query params:
 *   from=YYYY-MM-DD  start date (default: 90 days ago)
 *   to=YYYY-MM-DD    end date (default: today)
 *
 * Response:
 *   {
 *     card: { id, apiId, name, setCode, game },
 *     points: [{ price, recordedAt }, ...]
 *   }
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function bearer(req: Request): string | null {
  const h = req.headers.get('authorization') || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  const u = new URL(req.url);
  return u.searchParams.get('apiKey');
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const apiKey = bearer(req);
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }

  const card = await db.cardReference.findFirst({
    where: { OR: [{ id: params.id }, { apiId: params.id }] },
  });
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  // Validate API key belongs to the game of this card
  const apiKeyRecord = await db.apiKey.findUnique({ where: { key: apiKey } });
  if (!apiKeyRecord || apiKeyRecord.game !== card.game) {
    return NextResponse.json(
      { error: `API key not authorized for ${card.game}` },
      { status: 403 },
    );
  }
  await db.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: { hits: { increment: 1 } },
  });

  const url = new URL(req.url);
  const to = url.searchParams.get('to')
    ? new Date(url.searchParams.get('to')!)
    : new Date();
  const from = url.searchParams.get('from')
    ? new Date(url.searchParams.get('from')!)
    : new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);

  const points = await db.priceHistory.findMany({
    where: {
      cardReferenceId: card.id,
      recordedAt: { gte: from, lte: to },
    },
    orderBy: { recordedAt: 'asc' },
    select: { price: true, recordedAt: true, source: true },
  });

  return NextResponse.json({
    card: {
      id: card.id,
      apiId: card.apiId,
      name: card.name,
      setCode: card.setCode,
      game: card.game,
      currentPrice: card.price,
    },
    range: { from, to },
    points,
  });
}
