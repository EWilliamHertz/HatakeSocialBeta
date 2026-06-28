import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { game, lines } = await request.json();
    
    if (!game || !lines || !Array.isArray(lines)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cards: any[] = [];

    if (game === 'MAGIC') {
      // Scryfall allows up to 75 cards per request. We'll slice it to 75 for safety.
      const identifiers = lines.slice(0, 75).map(l => ({ name: l.name }));
      
      const res = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers })
      });
      
      if (res.ok) {
        const scryData = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cards = (scryData.data || []).map((c: any) => ({
          apiId: c.id,
          name: c.name,
          game: 'MAGIC',
          imageUrl: c.image_uris?.normal || c.image_uris?.large || c.card_faces?.[0]?.image_uris?.normal || '',
          price: parseFloat(c.prices?.usd || c.prices?.eur || '0'),
          cmc: c.cmc || 0,
          apiPayload: c
        }));
      }
    } else if (game === 'POKEMON') {
      // Pokemon TCG has no bulk name endpoint, loop promises
      const promises = lines.slice(0, 20).map(async l => {
        const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(l.name)}"`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          const c = data.data[0];
          return {
            apiId: c.id,
            name: c.name,
            game: 'POKEMON',
            imageUrl: c.images?.large || c.images?.small || '',
            price: parseFloat(c.cardmarket?.prices?.averageSellPrice || c.tcgplayer?.prices?.normal?.market || '0'),
            cmc: 0,
            apiPayload: c
          };
        }
        return null;
      });
      const results = await Promise.all(promises);
      cards = results.filter(Boolean);
    }

    return NextResponse.json({ cards });
  } catch (err) {
    console.error('Bulk Import Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
