import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game');
  const query = searchParams.get('q');
  const setCode = searchParams.get('setCode');
  const collectorNumber = searchParams.get('collectorNumber');
  const pageStr = searchParams.get('page') || '1';
  const sort = searchParams.get('sort');
  let page = parseInt(pageStr);
  if (isNaN(page) || page < 1) page = 1;
  const pageSize = 50;
  
  if (!game) {
    return NextResponse.json({ error: 'Game parameter is required' }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let externalCards: any[] = [];

    // Pokemon, Naruto, One Piece, Lorcana, Riftbound, Magic (Local Database)
    if (
      game === 'MAGIC' ||
      game === 'POKEMON' ||
      game === 'NARUTO' ||
      game === 'ONE_PIECE' ||
      game === 'LORCANA' ||
      game === 'RIFTBOUND'
    ) {
      const element = searchParams.get('element');
      const cost = searchParams.get('cost');
      const language = searchParams.get('language');

      let searchName = query || '';
      // If filtering for Japanese, TCGCSV appends "Japanese" to the product name
      if (language === 'Japanese') {
        searchName = searchName ? `${searchName} Japanese` : 'Japanese';
      } else if (language === 'English' && !searchName) {
        // If English, we might exclude "Japanese" but Prisma doesn't support NOT contains easily in one field alongside contains without AND.
        // We will just do a standard search.
      }

      const cards = await prisma.cardReference.findMany({
        where: {
          game: game,
          name: searchName ? { contains: searchName, mode: 'insensitive' } : undefined,
          setCode: setCode ? { equals: setCode, mode: 'insensitive' } : undefined,
          // Language exclusion for English
          ...(language === 'English' ? {
            NOT: { name: { contains: 'Japanese', mode: 'insensitive' } }
          } : {}),
          // Filter out 0 price cards if sorting by highest price to avoid showing unpriced cards
          ...(sort === 'PRICE_DESC' ? { price: { gt: 0 } } : {})
        },
        orderBy: sort === 'PRICE_DESC' ? { price: 'desc' } :
                 sort === 'PRICE_ASC' ? { price: 'asc' } :
                 sort === 'NAME_ASC' ? { name: 'asc' } : undefined,
        skip: (page - 1) * pageSize,
        take: pageSize
      });

      externalCards = cards.map(c => ({
        apiId: c.apiId,
        name: c.name,
        game: game,
        imageUrl: c.imageUrl,
        price: c.price || 0,
        foilPrice: c.foilPrice || 0,
        reverseHoloPrice: c.reverseHoloPrice || 0,
        setCode: c.setCode || '',
        collectorNumber: (c.apiPayload as any)?.collector_number || (c.apiPayload as any)?.collectorNumber || '',
        apiPayload: c.apiPayload
      }));
    }

    return NextResponse.json({ cards: externalCards });
  } catch (err) {
    console.error('Search Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
