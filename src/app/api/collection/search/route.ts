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
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
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
      game === 'ALL' ||
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
      if (collectorNumber) {
        andConditions.push({
          apiPayload: {
            path: ['extendedData'],
            array_contains: [{ name: 'Number', value: collectorNumber }]
          }
        });
      }
      if (minPrice) {
        andConditions.push({ price: { gte: parseFloat(minPrice) } });
      }
      if (maxPrice) {
        andConditions.push({ price: { lte: parseFloat(maxPrice) } });
      }
      if (language === 'English') {
        andConditions.push({ NOT: { name: { contains: 'Japanese', mode: 'insensitive' } } });
      }
      if (sort === 'PRICE_DESC' || sort === 'PRICE_ASC') {
        andConditions.push({ price: { gt: 0 } });
      }
      if (game !== 'ALL') {
        andConditions.push({ game: game });
      }

      let orderBy: any = undefined;
      switch (sort) {
        case 'PRICE_DESC': orderBy = { price: 'desc' }; break;
        case 'PRICE_ASC': orderBy = { price: 'asc' }; break;
        case 'NAME_ASC': orderBy = { name: 'asc' }; break;
        case 'NAME_DESC': orderBy = { name: 'desc' }; break;
        case 'NEWEST': orderBy = { createdAt: 'desc' }; break;
        case 'OLDEST': orderBy = { createdAt: 'asc' }; break;
      }

      let skip = (page - 1) * pageSize;
      let take = pageSize;
      let shouldShuffle = false;

      // If no search terms and no explicit sort, do a pseudo-random fetch
      if (!sort && andConditions.length <= (game !== 'ALL' ? 1 : 0)) {
        const seedStr = searchParams.get('seed');
        const seed = seedStr ? parseInt(seedStr) : Math.floor(Math.random() * 100000);
        
        // Custom seeded random generator
        const pseudoRandom = (max: number, offset: number) => {
          const val = Math.sin(seed + offset) * 10000;
          return Math.floor((val - Math.floor(val)) * max);
        };

        let cards: any[] = [];
        
        if (game === 'ALL') {
          // Fetch an even mix from all games
          const games = ['MAGIC', 'POKEMON', 'ONE_PIECE', 'NARUTO', 'LORCANA', 'RIFTBOUND'];
          const perGame = Math.ceil(take / games.length);
          
          const results = [];
          for (let i = 0; i < games.length; i++) {
            const g = games[i];
            const count = await prisma.cardReference.count({ where: { game: g as any } });
            if (count > 0) {
              const maxSkip = Math.max(0, count - perGame);
              const gameSkip = pseudoRandom(maxSkip, page + i);
              const gCards = await prisma.cardReference.findMany({
                where: { game: g as any },
                skip: gameSkip,
                take: perGame
              });
              results.push(gCards);
            }
          }
          
          cards = results.flat();
          // Shuffle the combined results using the seed so the mix is stable but interleaved
          cards.sort((a, b) => pseudoRandom(100, a.id.charCodeAt(0)) - 50);
        } else {
          const count = await prisma.cardReference.count({
             where: { AND: andConditions.length > 0 ? andConditions : undefined }
          });
          const maxSkip = Math.max(0, count - take);
          const singleSkip = pseudoRandom(maxSkip, page);
          
          cards = await prisma.cardReference.findMany({
            where: { AND: andConditions.length > 0 ? andConditions : undefined },
            skip: singleSkip,
            take
          });
        }
        
        externalCards = cards
          .slice(0, pageSize)
          .map(c => ({
          apiId: c.apiId,
          name: c.name,
          game: c.game,
          imageUrl: c.imageUrl,
          price: c.price || 0,
          foilPrice: c.foilPrice || 0,
          reverseHoloPrice: c.reverseHoloPrice || 0,
          setCode: c.setCode || '',
          collectorNumber: (c.apiPayload as any)?.collector_number || (c.apiPayload as any)?.collectorNumber || ((c.apiPayload as any)?.extendedData?.find?.((d: any) => d.name === 'Number' || d.name === 'Collector Number')?.value) || '',
          apiPayload: c.apiPayload
        }));
        
        return NextResponse.json({ cards: externalCards });
      }

      let cards = await prisma.cardReference.findMany({
        where: {
          AND: andConditions.length > 0 ? andConditions : undefined
        },
        orderBy,
        skip,
        take
      });

      externalCards = cards
        .slice(0, pageSize)
        .map(c => ({
        apiId: c.apiId,
        name: c.name,
        game: c.game,
        imageUrl: c.imageUrl,
        price: c.price || 0,
        foilPrice: c.foilPrice || 0,
        reverseHoloPrice: c.reverseHoloPrice || 0,
        setCode: c.setCode || '',
        collectorNumber: (c.apiPayload as any)?.collector_number || (c.apiPayload as any)?.collectorNumber || ((c.apiPayload as any)?.extendedData?.find?.((d: any) => d.name === 'Number' || d.name === 'Collector Number')?.value) || '',
        apiPayload: c.apiPayload
      }));
    }

    return NextResponse.json({ cards: externalCards });
  } catch (err) {
    console.error('Search Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
