import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function bearer(req: Request): string | null {
  const h = req.headers.get('authorization') || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  const u = new URL(req.url);
  return u.searchParams.get('apiKey');
}

export async function GET(request: Request) {
  const apiKey = bearer(request);
  if (!apiKey) {
    return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 });
  }

  const apiKeyRecord = await db.apiKey.findUnique({ where: { key: apiKey } });
  if (!apiKeyRecord || apiKeyRecord.game !== 'RIFTBOUND') {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid API Key for Riftbound' },
      { status: 403 },
    );
  }

  await db.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: { hits: { increment: 1 } },
  });

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500);
  const cursor = url.searchParams.get('cursor');

  const cards = await db.cardReference.findMany({
    where: { game: 'RIFTBOUND' },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { id: 'asc' },
  });

  const hasMore = cards.length > limit;
  const rows = hasMore ? cards.slice(0, -1) : cards;
  return NextResponse.json({
    success: true,
    count: rows.length,
    nextCursor: hasMore ? rows[rows.length - 1].id : null,
    data: rows,
  });
}
