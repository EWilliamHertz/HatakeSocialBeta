import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log('Fetching MTG cards...');
  const cards = await prisma.cardReference.findMany({
    where: { game: 'MAGIC' },
    select: { id: true, apiPayload: true, imageUrl: true }
  });
  
  let updated = 0;
  for (const card of cards) {
    const payload = card.apiPayload as any;
    if (payload && payload.tcgplayer_id) {
      const tcgUrl = `https://tcgplayer-cdn.tcgplayer.com/product/${payload.tcgplayer_id}_200w.jpg`;
      if (card.imageUrl !== tcgUrl) {
        await prisma.cardReference.update({
          where: { id: card.id },
          data: { imageUrl: tcgUrl }
        });
        updated++;
      }
    }
  }
  
  console.log(`Updated ${updated} MAGIC cards to use TCGPlayer images.`);
  await prisma.$disconnect();
}

run().catch(console.error);
