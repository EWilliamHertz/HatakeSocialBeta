import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { game, lines } = await request.json();
    
    if (!game || !lines || !Array.isArray(lines)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cards: any[] = [];
    
    // We'll search the DB for each card name.
    // To minimize DB roundtrips, we can fetch all potential matches.
    const names = lines.map((l: any) => l.name);
    
    // For simplicity, find the first match for each name in the requested game.
    // Since names might have slight variations, we'll use a direct case-insensitive match.
    // If the list is large, doing 75 queries in parallel is perfectly fine for Prisma locally.
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const promises = lines.slice(0, 100).map(async (l: any) => {
      const c = await prisma.cardReference.findFirst({
        where: {
          game: game,
          name: { equals: l.name, mode: 'insensitive' }
        },
        orderBy: { price: 'desc' } // prioritize a printing with a price
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
    await prisma.$disconnect();

    return NextResponse.json({ cards });
  } catch (err) {
    console.error('Bulk Import Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
