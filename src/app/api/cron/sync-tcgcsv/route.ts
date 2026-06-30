import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GameType } from '@prisma/client';

// TCGplayer Category ID for One Piece is typically 71.
// TCGplayer Category IDs
const ONE_PIECE_CATEGORY_ID = 68;
const POKEMON_CATEGORY_ID = 3;

export async function GET(request: Request) {
  try {
    // 1. Verify Cron Secret (Security)
    // When deploying to Vercel, you should set a CRON_SECRET environment variable.
    // Vercel Cron will pass it as an Authorization header.
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the Products (Cards) from TCGCSV
    // TCGCSV provides daily dumps of TCGplayer's data. 
    console.log('Fetching One Piece products from TCGCSV...');
    const productsRes = await fetch(`https://tcgcsv.com/${ONE_PIECE_CATEGORY_ID}/products`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HatakeSocial/1.0 (Integration)'
      }
    });

    if (!productsRes.ok) {
      throw new Error(`Failed to fetch TCGCSV products. Status: ${productsRes.status}`);
    }

    const productsData = await productsRes.json();
    
    // TCGCSV usually returns { totalItems: number, results: [...] }
    const cards = productsData.results || [];
    console.log(`Found ${cards.length} One Piece products.`);

    if (cards.length === 0) {
       return NextResponse.json({ success: true, message: 'No cards found.' });
    }

    // 3. Batch Update our Database (Upsert)
    let opUpdatedCount = 0;
    let pokeUpdatedCount = 0;

    const headers = { 'Accept': 'application/json', 'User-Agent': 'HatakeSocial/1.0' };

    // Helper to fetch latest N groups for a category and upsert products
    async function syncCategory(categoryId: number, game: typeof GameType.ONE_PIECE | typeof GameType.POKEMON, maxGroups = 5) {
      let count = 0;
      const groupsRes = await fetch(`https://tcgcsv.com/tcgplayer/${categoryId}/groups`, { headers });
      if (!groupsRes.ok) return count;
      
      const groupsData = await groupsRes.json();
      let groups = groupsData.results || [];
      // Sort by publishedOn desc
      groups.sort((a: any, b: any) => new Date(b.publishedOn).getTime() - new Date(a.publishedOn).getTime());
      groups = groups.slice(0, maxGroups);

      for (const group of groups) {
        const pRes = await fetch(`https://tcgcsv.com/tcgplayer/${categoryId}/${group.groupId}/products`, { headers });
        if (!pRes.ok) continue;
        const pData = await pRes.json();
        
        const prRes = await fetch(`https://tcgcsv.com/tcgplayer/${categoryId}/${group.groupId}/prices`, { headers });
        const pricesMap = new Map();
        if (prRes.ok) {
          const prData = await prRes.json();
          for (const pr of (prData.results || [])) {
            if (!pricesMap.has(pr.productId)) pricesMap.set(pr.productId, { price: 0, foilPrice: null, reverseHoloPrice: null });
            const pObj = pricesMap.get(pr.productId);
            const pVal = pr.marketPrice || pr.midPrice || 0;
            if (pr.subTypeName === 'Normal') pObj.price = pVal;
            else if (pr.subTypeName === 'Foil' || pr.subTypeName === 'Holofoil') pObj.foilPrice = pVal;
            else if (pr.subTypeName === 'Reverse Holofoil' || pr.subTypeName === 'Reverse Holo') pObj.reverseHoloPrice = pVal;
            else pObj.price = pObj.price || pVal; // fallback
          }
        }

        for (const card of (pData.results || [])) {
          const imageUrl = card.imageUrl || 'https://i.imgur.com/B06rBhI.png';
          const pObj = pricesMap.get(card.productId) || { price: 0, foilPrice: null, reverseHoloPrice: null };
          
          await db.cardReference.upsert({
            where: { apiId: card.productId.toString() },
            update: { name: card.name, imageUrl, setCode: group.abbreviation || group.name, price: pObj.price, foilPrice: pObj.foilPrice, reverseHoloPrice: pObj.reverseHoloPrice },
            create: {
              apiId: card.productId.toString(),
              game,
              name: card.name,
              imageUrl,
              setCode: group.abbreviation || group.name,
              price: pObj.price,
              foilPrice: pObj.foilPrice,
              reverseHoloPrice: pObj.reverseHoloPrice,
              apiPayload: card
            }
          });
          count++;
        }
      }
      return count;
    }

    opUpdatedCount = await syncCategory(ONE_PIECE_CATEGORY_ID, GameType.ONE_PIECE, 5);
    pokeUpdatedCount = await syncCategory(POKEMON_CATEGORY_ID, GameType.POKEMON, 5);

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${opUpdatedCount} OP cards and ${pokeUpdatedCount} Poke cards from latest 5 sets.` 
    });

  } catch (err: any) {
    console.error('TCGCSV Sync Error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
