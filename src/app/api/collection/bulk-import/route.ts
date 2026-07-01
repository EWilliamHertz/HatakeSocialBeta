import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { game, lines } = await request.json();
    
    if (!game || !lines || !Array.isArray(lines)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cards: any[] = [];
    
    // Search local database for all games
    const promises = lines.slice(0, 100).map(async (l: any) => {
      const c = await db.cardReference.findFirst({
        where: {
          game: game,
          name: { equals: l.name, mode: 'insensitive' }
        },
        orderBy: { price: 'desc' }
      });

      if (c) {
        return {
          apiId: c.apiId,
          name: c.name,
          game: game,
          imageUrl: c.imageUrl,
          price: c.price || 0,
          cmc: c.apiPayload?.cmc || 0,
          apiPayload: c.apiPayload
        };
      }
      return null;
    });

    const results = await Promise.all(promises);
    cards = results.filter(Boolean);

    return NextResponse.json({ cards });
  } catch (err) {
    console.error('Bulk Import Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
