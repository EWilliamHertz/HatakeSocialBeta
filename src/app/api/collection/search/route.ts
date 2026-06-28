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

    // Magic (Scryfall)
    if (game === 'MAGIC') {
      let q = query ? query : '';
      
      const oracle = searchParams.get('oracle');
      const power = searchParams.get('power');
      const toughness = searchParams.get('toughness');
      const colors = searchParams.get('colors');

      if (setCode) q += ` set:${setCode}`;
      if (collectorNumber) q += ` cn:${collectorNumber}`;
      if (oracle) q += ` o:"${oracle}"`;
      if (power) q += ` pow:${power}`;
      if (toughness) q += ` tou:${toughness}`;
      if (colors) q += ` c:${colors}`;
      
      if (!q) q = 'type:planeswalker'; // just a fallback so it doesn't fail empty

      // Note: Scryfall supports &page=...
      const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q.trim())}&unique=prints&page=${page}`, {
        headers: {
          'User-Agent': 'HatakeSocialBeta/1.0',
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const scryData = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        externalCards = (scryData.data || []).map((c: any) => ({
          apiId: c.id,
          name: c.name,
          game: 'MAGIC',
          imageUrl: c.image_uris?.normal || c.image_uris?.large || c.card_faces?.[0]?.image_uris?.normal || '',
          price: parseFloat(c.prices?.usd || c.prices?.eur || '0'),
          setCode: c.set ? c.set.toUpperCase() : '',
          collectorNumber: c.collector_number || '',
          apiPayload: c
        }));
      }
    }
    
    // (Removed api.pokemontcg.io fetch, now handled by local TCGCSV DB below)
    
    // Pokemon, Naruto, One Piece, Lorcana, Riftbound (Local Database)
    else if (
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
        setCode: c.setCode || '',
        collectorNumber: c.apiId || '',
        apiPayload: c.apiPayload
      }));
    }

    return NextResponse.json({ cards: externalCards });
  } catch (err) {
    console.error('Search Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
