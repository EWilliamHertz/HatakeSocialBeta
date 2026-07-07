import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const deck = await db.deck.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: { username: true, handle: true, profilePictureUrl: true }
        }
      }
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    return NextResponse.json({ deck });
  } catch (err) {
    console.error('Fetch Single Deck Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
