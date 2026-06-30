import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  const page = parseInt(searchParams.get('page') || '1', 10);
  let limit = parseInt(searchParams.get('limit') || '20', 10);
  if (limit > 100) limit = 100;
  
  const exact = searchParams.get('exact') === 'true';
  
  let userId = null;
  try {
    const token = cookies().get('hatake_session')?.value;
    if (token) {
      const session = await decrypt(token);
      if (session && session.id) {
        userId = session.id;
      }
    }
  } catch (e) {
    // Ignore auth errors
  }
  
  const where = { game: 'MAGIC' };
  
  if (q) {
    if (exact) {
      where.name = { equals: q, mode: 'insensitive' };
    } else {
      where.name = { contains: q, mode: 'insensitive' };
    }
  }
  
  try {
    let cards = [];
    let total = 0;

    if (!q && userId) {
      // Show user's collection when there's no search query
      const instances = await db.cardInstance.findMany({
        where: { 
          ownerId: userId, 
          cardReference: { game: 'MAGIC' } 
        },
        select: { cardReference: true },
        distinct: ['cardReferenceId'],
        skip: (page - 1) * limit,
        take: limit,
      });
      cards = instances.map(i => i.cardReference);
      
      // We'll just estimate total as the number of cards found if it's less than limit
      total = cards.length < limit ? (page - 1) * limit + cards.length : (page * limit) + 1; 

      // If user has no cards, fallback to generic list so it's not totally empty
      if (cards.length === 0 && page === 1) {
        total = await db.cardReference.count({ where: { game: 'MAGIC' } });
        cards = await db.cardReference.findMany({
          where: { game: 'MAGIC' },
          orderBy: { name: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        });
      }
    } else {
      // Show search results or fallback if no user
      total = await db.cardReference.count({ where });
      cards = await db.cardReference.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    }
    
    const mappedCards = cards.map(c => {
      const p = c.apiPayload || {};
      return {
        scryfall_id: c.apiId,
        id: c.apiId,
        name: c.name,
        image_uri: c.imageUrl || p.image_uris?.normal || '',
        type_line: p.type_line || '',
        cmc: p.cmc || 0,
        colors: p.colors || [],
        mana_cost: p.mana_cost || '',
        rarity: c.rarity || p.rarity || 'common',
        oracle_text: p.oracle_text || '',
        power: p.power || '',
        toughness: p.toughness || ''
      };
    });

    return Response.json({
      cards: mappedCards,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
