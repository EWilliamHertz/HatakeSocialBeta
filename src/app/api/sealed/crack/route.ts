import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const setCode = searchParams.get('setCode');
    const game = searchParams.get('game') || 'MAGIC';

    if (!setCode) {
      return NextResponse.json({ error: 'Set code is required to crack a pack.' }, { status: 400 });
    }

    // Fetch all cards from the global dictionary for this set
    const cards = await db.cardReference.findMany({
      where: { setCode, game }
    });

    if (cards.length === 0) {
      return NextResponse.json({ error: `No cards found for set ${setCode} in the database.` }, { status: 404 });
    }

    // Categorize by rarity
    const commons = cards.filter(c => c.rarity?.toLowerCase().includes('common') && !c.rarity?.toLowerCase().includes('uncommon'));
    const uncommons = cards.filter(c => c.rarity?.toLowerCase().includes('uncommon'));
    const rares = cards.filter(c => {
      const r = c.rarity?.toLowerCase() || '';
      return r.includes('rare') || r.includes('mythic') || r.includes('holo') || r.includes('secret') || r.includes('ultra') || r.includes('special');
    });

    // Fallbacks just in case the API payload didn't map rarities perfectly
    const poolC = commons.length > 0 ? commons : cards;
    const poolU = uncommons.length > 0 ? uncommons : cards;
    const poolR = rares.length > 0 ? rares : cards;

    const pickRandom = (pool: any[], count: number) => {
      const picked = [];
      for(let i=0; i < count; i++) {
        picked.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      return picked;
    };

    let pulls = [];
    
    // Distribution Mathematics
    if (game === 'MAGIC' || game === 'LORCANA') {
      // Standard MTG/Lorcana layout: 10 C, 3 U, 1 Rare/Mythic
      pulls = [...pickRandom(poolC, 10), ...pickRandom(poolU, 3), ...pickRandom(poolR, 1)];
    } else {
      // Standard Pokemon/One Piece layout: 6 C, 3 U, 1 Rare/Holo
      pulls = [...pickRandom(poolC, 6), ...pickRandom(poolU, 3), ...pickRandom(poolR, 1)];
    }

    // We keep the Rare card at the very end of the array (the "pack hit")
    
    return NextResponse.json({ pulls });

  } catch (error) {
    console.error('Pack crack error:', error);
    return NextResponse.json({ error: 'Failed to generate pack pulls.' }, { status: 500 });
  }
}