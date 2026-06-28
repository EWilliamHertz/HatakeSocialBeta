import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const decks = await db.deck.findMany({
      include: {
        owner: { select: { username: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return NextResponse.json({ decks });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch decks' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await db.deck.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete deck' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, format, metaAuthor, metaWinRate, isMeta } = body;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const updated = await db.deck.update({
      where: { id },
      data: { name, format, metaAuthor, metaWinRate, isMeta }
    });
    return NextResponse.json({ deck: updated });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update deck' }, { status: 500 });
  }
}
