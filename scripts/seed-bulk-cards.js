const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const https = require('https');

const prisma = new PrismaClient();

async function fetchMtgBulk() {
  console.log('Fetching MTG cards from Scryfall (Paginated)...');
  
  try {
    let url = 'https://api.scryfall.com/cards/search?q=game:paper';
    let totalInserted = 0;

    // Fetch the first 2 pages (350 cards) for the sake of time in this script
    for (let page = 0; page < 2; page++) {
      if (!url) break;

      const res = await fetch(url, { headers: { 'User-Agent': 'HatakeSocial/1.0' } });
      const data = await res.json();
      
      if (!data.data) break;

      console.log(`Found ${data.data.length} MTG cards on this page. Upserting...`);
      
      for (const card of data.data) {
        if (card.layout !== 'normal' && card.layout !== 'split') continue;
        
        await prisma.cardReference.upsert({
          where: { apiId: card.id },
          update: {},
          create: {
            game: 'MTG',
            apiId: card.id,
            name: card.name,
            imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '',
            setCode: card.set,
            rarity: card.rarity,
            apiPayload: card,
          }
        });
        totalInserted++;
      }
      
      console.log(`Inserted ${totalInserted} MTG cards so far...`);
      url = data.has_more ? data.next_page : null;
      
      // Wait 100ms between pages to respect Scryfall rate limits
      await new Promise(r => setTimeout(r, 100));
    }
  } catch (e) {
    console.error('Failed MTG paginated fetch', e);
  }
}

async function fetchPokemonBulk() {
  console.log('Fetching Pokemon Cards (Page 1) from Pokemon TCG API...');
  
  // Note: There are over 16,000 Pokemon cards. You would loop through pages until data is empty.
  try {
    const res = await fetch('https://api.pokemontcg.io/v2/cards?pageSize=250&page=1', {
      headers: {
        // 'X-Api-Key': 'YOUR_API_KEY' // Needed for higher rate limits
      }
    });
    const data = await res.json();
    
    console.log(`Found ${data.data.length} Pokemon cards on this page. Upserting...`);
    
    let count = 0;
    for (const card of data.data) {
      await prisma.cardReference.upsert({
        where: { apiId: card.id },
        update: {},
        create: {
          game: 'POKEMON',
          apiId: card.id,
          name: card.name,
          imageUrl: card.images?.large || card.images?.small || '',
          setCode: card.set?.id,
          rarity: card.rarity,
          apiPayload: card,
        }
      });
      count++;
      if (count % 50 === 0) console.log(`Inserted ${count} Pokemon cards...`);
    }
  } catch (e) {
    console.error('Failed Pokemon bulk fetch', e);
  }
}

async function main() {
  console.log('--- STARTING GLOBAL CARD SEED ---');
  await fetchMtgBulk();
  await fetchPokemonBulk();
  console.log('--- GLOBAL CARD SEED COMPLETE ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
