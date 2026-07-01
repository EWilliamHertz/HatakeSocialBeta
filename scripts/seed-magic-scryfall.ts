import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function run() {
  console.log('Fetching Scryfall Bulk Data info...');
  
  // 1. Get Bulk Data URI
  const bulkReq = await fetch('https://api.scryfall.com/bulk-data/default-cards');
  const bulkData = await bulkReq.json();
  const downloadUri = bulkData.download_uri;
  
  if (!downloadUri) {
    console.error('Failed to get download URI for Scryfall bulk data');
    return;
  }

  console.log(`Downloading Scryfall JSON from: ${downloadUri}... (This may take a minute)`);
  
  // 2. Download and parse the JSON (warning: it is large, ~400MB uncompressed)
  const jsonReq = await fetch(downloadUri);
  const cards = await jsonReq.json();

  console.log(`Downloaded ${cards.length} cards from Scryfall.`);

  // 3. Delete existing MAGIC cards
  console.log('Deleting existing MAGIC cards from database...');
  await db.cardReference.deleteMany({
    where: { game: 'MAGIC' }
  });
  console.log('Existing MAGIC cards deleted.');

  // 4. Map cards to our database schema
  console.log('Mapping cards to database schema...');
  const BATCH_SIZE = 5000;
  
  // We only want cards that are primarily printed (e.g. English, not purely digital unless necessary, but Scryfall default-cards handles this mostly)
  // Let's filter out tokens and art series to save space if needed
  const validCards = cards.filter((c: any) => 
    c.layout !== 'token' && 
    c.layout !== 'art_series' && 
    c.layout !== 'double_faced_token'
  );

  let insertedCount = 0;

  for (let i = 0; i < validCards.length; i += BATCH_SIZE) {
    const batch = validCards.slice(i, i + BATCH_SIZE);
    
    const prismaData = batch.map((c: any) => {
      // Scryfall has multiple ways of storing images (double sided cards have them in card_faces)
      const image_uris = c.image_uris || c.card_faces?.[0]?.image_uris;
      const imageUrl = image_uris?.normal || image_uris?.large || '';
      
      const price = parseFloat(c.prices?.usd || '0');
      const foilPrice = parseFloat(c.prices?.usd_foil || '0');
      const apiPayload = {
        cmc: c.cmc,
        color_identity: c.color_identity,
        colors: c.colors || c.card_faces?.[0]?.colors || [],
        oracle_text: c.oracle_text || c.card_faces?.[0]?.oracle_text || '',
        type_line: c.type_line,
        artist: c.artist || c.card_faces?.[0]?.artist || '',
        mana_cost: c.mana_cost || c.card_faces?.[0]?.mana_cost || '',
        image_uris: image_uris
      };

      return {
        game: 'MAGIC',
        apiId: c.id,
        name: c.name,
        imageUrl: imageUrl,
        setCode: c.set,
        rarity: c.rarity,
        price: isNaN(price) ? 0 : price,
        foilPrice: isNaN(foilPrice) ? 0 : foilPrice,
        apiPayload: apiPayload
      };
    });

    await db.cardReference.createMany({
      data: prismaData,
      skipDuplicates: true
    });

    insertedCount += prismaData.length;
    console.log(`Inserted ${insertedCount} / ${validCards.length} cards...`);
  }

  console.log('Successfully reseeded Magic cards using Scryfall!');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
