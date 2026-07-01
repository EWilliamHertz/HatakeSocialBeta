import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await decrypt(token);
    const user = await db.user.findUnique({ where: { id: session.id as string } });
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { giveawayId, numWinners = 1 } = body;

    if (!giveawayId) return NextResponse.json({ error: 'Giveaway ID required' }, { status: 400 });

    const giveaway = await db.giveaway.findUnique({ where: { id: giveawayId } });
    if (!giveaway) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Find eligible users
    const users = await db.user.findMany({
      where: {
        emailVerified: { not: null }
      },
      select: {
        id: true,
        username: true,
        _count: {
          select: {
            inventory: true,
            decks: true,
            referredUsers: true,
            buyerDeals: { where: { status: 'COMPLETED' } },
            sellerDeals: { where: { status: 'COMPLETED' } }
          }
        }
      }
    });

    const eligibleUsers = users.filter(u => {
      const trades = u._count.buyerDeals + u._count.sellerDeals;
      return u._count.inventory >= giveaway.cardsRequired &&
             u._count.decks >= giveaway.decksRequired &&
             u._count.referredUsers >= giveaway.invitesRequired &&
             trades >= giveaway.tradesRequired;
    });

    if (eligibleUsers.length === 0) return NextResponse.json({ error: 'No eligible users' }, { status: 400 });

    // Pick random winners
    const winners = [];
    const pool = [...eligibleUsers];
    for (let i = 0; i < numWinners && pool.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const winner = pool.splice(randomIndex, 1)[0];
      winners.push(winner.username);
    }

    const updatedGiveaway = await db.giveaway.update({
      where: { id: giveawayId },
      data: {
        winners,
        isActive: false // Mark as ended
      }
    });

    return NextResponse.json(updatedGiveaway);
  } catch (error) {
    console.error('Draw error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
