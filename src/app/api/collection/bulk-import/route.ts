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
    
    // Search local database using a single IN query to avoid connection pool exhaustion
    const names = lines.slice(0, 100).map((l: any) => l.name);
    
    const dbCards = await db.cardReference.findMany({
      where: {
        game: game,
        name: { in: names, mode: 'insensitive' }
      },
      orderBy: { price: 'desc' }
    });

    cards = lines.slice(0, 100).map((l: any) => {
      const c = dbCards.find((dc: any) => dc.name.toLowerCase() === l.name.toLowerCase());

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
      
      // Fallback: return a phantom card so the user can still build hypothetical decks
      return {
        apiId: 'phantom-' + Buffer.from(l.name).toString('base64'),
        name: l.name,
        game: game,
        imageUrl: 'https://i.imgur.com/B06rBhI.png',
        price: 0,
        cmc: 0,
        apiPayload: {}
      };
    });

    return NextResponse.json({ cards });
  } catch (err) {
    console.error('Bulk Import Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
