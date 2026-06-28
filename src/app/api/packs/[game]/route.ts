import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

function rollForRarity(baseRarity: string, upgradeRarity: string, upgradeChance: number) {
  const roll = Math.random() * 100;
  return roll <= upgradeChance ? upgradeRarity : baseRarity;
}

export async function GET(request: Request, { params }: { params: { game: string } }) {
  const { game } = params;
  const url = new URL(request.url);
  const packId = url.searchParams.get('packId');
  
  const generatedPack = [];
  let slots: any[] = [];
  let dbGame = game.toUpperCase();

  if (game === 'naruto') {
    slots = [
      { rarity: 'C', count: 5 },
      { rarity: 'UC', count: 2 },
      { rarity: rollForRarity('R', 'S', 10), count: 1 }, 
      { rarity: rollForRarity('R', 'M', 2), count: 1 } 
    ];
  } else if (game === 'mtg') {
    slots = [
      { rarity: 'common', count: 6 },
      { rarity: 'uncommon', count: 3 },
      { rarity: rollForRarity('rare', 'mythic', 14), count: 1 },
      { rarity: 'common', count: 1 }, // Wildcard
      { rarity: 'uncommon', count: 1 }, // Foil wildcard
      { rarity: 'common', count: 1 } // Basic Land fallback
    ];
  } else if (game === 'pokemon') {
    slots = [
      { rarity: 'Common', count: 4 },
      { rarity: 'Uncommon', count: 3 },
      { rarity: rollForRarity('Common', 'Rare Ultra', 15), count: 1 },
      { rarity: rollForRarity('Uncommon', 'Rare Holo V', 5), count: 1 },
      { rarity: rollForRarity('Rare Holo', 'Rare Ultra', 20), count: 1 },
      { rarity: 'Common', count: 1 }
    ];
  } else if (game === 'one_piece') {
    slots = [
      { rarity: 'Common', count: 6 },
      { rarity: 'Uncommon', count: 2 },
      { rarity: 'Leader', count: 1 },
      { rarity: 'DON!!', count: 1 },
      { rarity: rollForRarity('Rare', 'Super Rare', 25), count: 1 },
      { rarity: rollForRarity('Rare', 'Secret Rare', 10), count: 1 }
    ];
  } else {
    return NextResponse.json({ error: "Game not supported yet." }, { status: 400 });
  }

  try {
    for (const slot of slots) {
      let cards;
      if (packId) {
        cards = await db.$queryRawUnsafe(`
          SELECT * FROM "CardReference" 
          WHERE game = CAST($1 AS "GameType") AND rarity = $2 AND "setCode" = $4
          ORDER BY RANDOM() 
          LIMIT $3
        `, dbGame, slot.rarity, slot.count, packId);
      } else {
        cards = await db.$queryRawUnsafe(`
          SELECT * FROM "CardReference" 
          WHERE game = CAST($1 AS "GameType") AND rarity = $2
          ORDER BY RANDOM() 
          LIMIT $3
        `, dbGame, slot.rarity, slot.count);
      }
      
      if (Array.isArray(cards) && cards.length > 0) {
        // Handle case where limit > returned rows (e.g., requested 5, got 3)
        // If they ask for 5 and there are only 3 commons, it will just return 3 unless we loop
        generatedPack.push(...cards);
      } else {
        for(let i=0; i<slot.count; i++) {
          generatedPack.push({
            id: 'dummy-' + Math.random(),
            name: `Missing ${slot.rarity} Card`,
            imageUrl: 'https://i.imgur.com/B06rBhI.png',
            rarity: slot.rarity,
            game: dbGame
          });
        }
      }
    }
    return NextResponse.json({ pack: generatedPack });
  } catch (err: any) {
    console.error("Pack generation error:", err);
    return NextResponse.json({ error: "Failed to generate pack" }, { status: 500 });
  }
}
