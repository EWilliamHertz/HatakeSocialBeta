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
      const language = searchParams.get('language');

      let searchName = query || '';
      // If filtering for Japanese, TCGCSV appends "Japanese" to the product name
      if (language === 'Japanese') {
        searchName = searchName ? `${searchName} Japanese` : 'Japanese';
      }

      const searchTerms = searchName ? searchName.split(/\s+/).filter(Boolean) : [];
      const andConditions: any[] = [];
      
      if (searchTerms.length > 0) {
        searchTerms.forEach(term => {
          andConditions.push({ name: { contains: term, mode: 'insensitive' } });
        });
      }
      if (setCode) {
        andConditions.push({ setCode: { equals: setCode, mode: 'insensitive' } });
      }
      if (language === 'English') {
        andConditions.push({ NOT: { name: { contains: 'Japanese', mode: 'insensitive' } } });
      }
      if (sort === 'PRICE_DESC') {
        andConditions.push({ price: { gt: 0 } });
      }
      andConditions.push({ game: game });

      const cards = await prisma.cardReference.findMany({
        where: {
          AND: andConditions.length > 0 ? andConditions : undefined
        },
        orderBy: sort === 'PRICE_DESC' ? { price: 'desc' } :
                 sort === 'PRICE_ASC' ? { price: 'asc' } :
                 sort === 'NAME_ASC' ? { name: 'asc' } : undefined,
        skip: (page - 1) * 200,
        take: 200
      });

      externalCards = cards
        .slice(0, pageSize)
        .map(c => ({
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
