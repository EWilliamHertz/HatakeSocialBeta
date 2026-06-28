const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const JSONStream = require('JSONStream');

const prisma = new PrismaClient();

async function seedFromLocalJson() {
  const filePath = path.join(__dirname, '..', 'mtg-bulk-data.json');
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    console.error('Please run "node scripts/download-bulk-file.js" first.');
    process.exit(1);
  }

  console.log(`Starting local DB seed from ${filePath}...`);
  console.log('Using JSONStream to bypass memory limits. Extracting card prices...');

  let insertedCount = 0;
  let batch = [];
  const BATCH_SIZE = 100; // Small batch for NeonDB

  // The MTG bulk JSON is an array of objects. We parse each object.
  const pipeline = fs.createReadStream(filePath).pipe(JSONStream.parse('*'));

  pipeline.on('data', async (card) => {
    // Only import normal playable cards to save space
    if (card.layout !== 'normal' && card.layout !== 'split') return;
    
    // Extract price (fallback to 0 if none)
    let price = 0;
    if (card.prices && card.prices.usd) {
      price = parseFloat(card.prices.usd);
    } else if (card.prices && card.prices.usd_foil) {
      price = parseFloat(card.prices.usd_foil);
    }

    const payload = {
      game: 'MTG',
      apiId: card.id,
      name: card.name,
      imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '',
      setCode: card.set,
      rarity: card.rarity,
      price: price, // Now we capture the price
      apiPayload: card,
    };

    batch.push(payload);

    // Pause and insert batch
    if (batch.length >= BATCH_SIZE) {
      pipeline.pause();
      
      try {
        for (const item of batch) {
          await prisma.cardReference.upsert({
            where: { apiId: item.apiId },
            update: {
              price: item.price // Always update price so it stays fresh!
            },
            create: item,
          });
        }
        
        insertedCount += batch.length;
        console.log(`✅ Upserted ${insertedCount} cards to NeonDB (including prices)`);
        batch = [];
        pipeline.resume();
      } catch (err) {
        console.error('Failed batch upsert:', err);
        pipeline.resume();
      }
    }
  });

  pipeline.on('end', async () => {
    if (batch.length > 0) {
      try {
        for (const item of batch) {
          await prisma.cardReference.upsert({
            where: { apiId: item.apiId },
            update: { price: item.price },
            create: item,
          });
        }
        insertedCount += batch.length;
      } catch (err) {
        console.error('Failed final batch upsert:', err);
      }
    }
    console.log(`✅ Success! Stream processing complete. Total cards processed: ${insertedCount}`);
    await prisma.$disconnect();
  });
  
  pipeline.on('error', (err) => {
    console.error('Pipeline Error:', err);
  });
}

seedFromLocalJson();
