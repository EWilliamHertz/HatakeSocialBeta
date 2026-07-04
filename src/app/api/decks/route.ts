import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game');
  
  try {
    const decks = await db.deck.findMany({
      where: {
        isPublic: true,
        isMeta: false,
        ...(game ? { game: game as any } : {})
      },
      include: {
        owner: {
          select: { username: true, handle: true, profilePictureUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ decks });
  } catch (err) {
    console.error('Fetch Community Decks Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, name, game, format, isPublic, cards, isMeta, metaAuthor, metaWinRate } = body;

    if (!name || !game || !cards) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (id) {
      // Update existing deck
      const existing = await db.deck.findUnique({ where: { id } });
      if (!existing || existing.ownerId !== user.id) {
        return NextResponse.json({ error: 'Not authorized or deck not found' }, { status: 403 });
      }

      const updated = await db.deck.update({
        where: { id },
        data: { name, game, format, isPublic, isMeta, metaAuthor, metaWinRate, cards }
      });
      return NextResponse.json({ deck: updated });
    } else {
      // Create new deck
      const created = await db.deck.create({
        data: {
          ownerId: user.id,
          name,
          game,
          format,
          isPublic: isPublic || false,
          isMeta: isMeta || false,
          metaAuthor,
          metaWinRate,
          cards
        }
      });
      return NextResponse.json({ deck: created });
    }
  } catch (err) {
    console.error('Save Deck Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing deck ID' }, { status: 400 });

    const existing = await db.deck.findUnique({ where: { id } });
    if (!existing || existing.ownerId !== user.id) {
      return NextResponse.json({ error: 'Not authorized or deck not found' }, { status: 403 });
    }

    await db.deck.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete Deck Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
