import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET() {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const session = await decrypt(token);
    if (!session || !session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.id as string;

    const [cardsAdded, friendsInvited, deckCreated, tradesCompleted] = await Promise.all([
      db.cardInstance.count({ where: { ownerId: userId } }),
      db.user.count({ where: { referredById: userId } }),
      db.deck.count({ where: { userId } }),
      db.deal.count({ where: { OR: [{ buyerId: userId }, { sellerId: userId }], status: 'COMPLETED' } })
    ]);

    return NextResponse.json({
      cardsAdded,
      friendsInvited,
      deckCreated,
      tradesCompleted
    });
  } catch (error) {
    console.error('Failed to fetch giveaway progress', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
