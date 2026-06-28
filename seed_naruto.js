const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

async function main() {
  console.log('Reading naruto_master.csv...');
  const fileContent = fs.readFileSync('naruto_master.csv', 'utf-8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true
  });

  console.log(`Found ${records.length} cards. Seeding...`);

  let count = 0;
  for (const row of records) {
    if (!row.ID) continue;
    
    // Parse the row
    const id = row.ID;
    const name = row['Character Name'] || 'Unknown';
    const rarity = row.Rarity || null;
    const setCode = row.Set || 'Unknown';
    const imageUrl = row.Image || null;

    const apiPayload = {
      version: row['Character Version'],
      chakra: row.Chakra,
      power: row.Power,
      keyword: row.Keyword,
      group: row.Group,
      effectsType: row['Effects Type'],
      effectsTiming: row['Effects Timing'],
      effect: row.Effect
    };

    // Upsert the card
    await prisma.cardReference.upsert({
      where: {
        // since we don't have a unique constraint on ID alone in schema (it's random cuid),
        // we use a compound or just search first. Actually, schema has random cuid for id.
        // Let's just create them if they don't exist by matching setName and cardNumber.
        // But Prisma upsert needs a unique field. We don't have a unique constraint on (setName, cardNumber).
        // So we do findFirst, then create/update.
        id: 'dummy' // we'll skip upsert and do findFirst
      }
    }).catch(() => {}); // hack to ignore, will do findFirst

    const existing = await prisma.cardReference.findFirst({
      where: {
        game: 'NARUTO',
        apiId: id,
      }
    });

    if (existing) {
      await prisma.cardReference.update({
        where: { id: existing.id },
        data: {
          name, rarity, setCode, imageUrl, apiPayload
        }
      });
    } else {
      await prisma.cardReference.create({
        data: {
          name,
          game: 'NARUTO',
          apiId: id,
          setCode,
          rarity,
          imageUrl,
          apiPayload
        }
      });
    }
    count++;
    if (count % 25 === 0) console.log(`Processed ${count} cards...`);
  }

  console.log('Seeding complete! Total cards: ' + count);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
