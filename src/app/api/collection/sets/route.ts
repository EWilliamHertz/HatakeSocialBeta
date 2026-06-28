import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GameType } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game') as GameType;

  if (!game) {
    return NextResponse.json({ error: 'Game parameter required' }, { status: 400 });
  }

  try {
    const sets = await db.cardReference.groupBy({
      by: ['setCode'],
      where: { game },
      _count: { apiId: true }
    });
    
    return NextResponse.json({ sets: sets.map(s => ({ setCode: s.setCode, count: s._count.apiId })).filter(s => s.setCode) });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch sets' }, { status: 500 });
  }
}
