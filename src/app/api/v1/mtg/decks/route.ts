export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer hk_')) {
      return NextResponse.json({ error: 'Unauthorized. Invalid API Key format.' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];

    const apiKeyRecord = await db.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true }
    });

    if (!apiKeyRecord || apiKeyRecord.game !== 'MAGIC') {
      return NextResponse.json({ error: 'Unauthorized. Invalid API Key.' }, { status: 401 });
    }

    const user = apiKeyRecord.user;

    // Increment hits
    await db.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { hits: { increment: 1 } }
    });

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const targetUsername = searchParams.get('username');

    if (!targetUsername) {
      return NextResponse.json({ error: 'Please provide a ?username= parameter to fetch decks.' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({
      where: { username: targetUsername }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Fetch MTG decks for the target user (only public decks, unless it's the API key owner's own username)
    const isSelf = targetUser.id === user.id;
    
    const decks = await db.deck.findMany({
      where: {
        ownerId: targetUser.id,
        game: 'MAGIC',
        ...(format ? { format } : {}),
        ...(!isSelf ? { isPublic: true } : {}) // Only public decks if querying someone else
      },
      select: {
        id: true,
        name: true,
        format: true,
        isPublic: true,
        cards: true, // The JSON payload containing the decklist
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      owner: { id: targetUser.id, username: targetUser.username, handle: targetUser.handle },
      decks
    });

  } catch (err: any) {
    console.error('API Error /v1/mtg/decks:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
