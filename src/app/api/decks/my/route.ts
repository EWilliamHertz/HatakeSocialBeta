import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET(request: Request) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const game = searchParams.get('game');

    const decks = await db.deck.findMany({
      where: {
        ownerId: user.id,
        ...(game ? { game: game as any } : {})
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ decks });
  } catch (err) {
    console.error('Fetch My Decks Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
