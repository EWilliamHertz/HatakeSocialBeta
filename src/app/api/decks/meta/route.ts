import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game');
  
  try {
    const decks = await db.deck.findMany({
      where: {
        isMeta: true,
        ...(game ? { game: game as any } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ decks });
  } catch (err) {
    console.error('Fetch Meta Decks Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
