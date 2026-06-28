import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const isSealedProduct = (name: string) => {
  const lower = name.toLowerCase();
  return lower.includes('booster box') || 
         lower.includes('booster pack') || 
         lower.includes('elite trainer box') || 
         lower.includes('display') || 
         lower.includes('case') || 
         lower.includes('blister') ||
         lower.includes('deck') ||
         lower.includes('collection box') ||
         lower.includes('premium collection') ||
         lower.includes('tin') ||
         lower.includes('bundle') ||
         lower.includes('collection') ||
         lower.includes('kit') ||
         lower.includes('pack') ||
         lower.includes('box');
};

async function run() {
  const allCards = await prisma.cardReference.findMany();
  console.log(`Found ${allCards.length} total cards.`);
  let count = 0;
  
  for (const card of allCards) {
    if (isSealedProduct(card.name)) {
      console.log(`Migrating to Sealed: ${card.name}`);
      
      const instances = await prisma.cardInstance.findMany({
        where: { cardReferenceId: card.id }
      });
      
      const newSealedRef = await prisma.sealedReference.upsert({
        where: { id: card.apiId },
        update: { 
          name: card.name, 
          imageUrl: card.imageUrl, 
          setCode: card.setCode, 
          price: card.price, 
          type: 'SEALED_PRODUCT' 
        },
        create: {
          id: card.apiId,
          game: card.game,
          name: card.name,
          imageUrl: card.imageUrl,
          setCode: card.setCode,
          price: card.price,
          type: 'SEALED_PRODUCT',
          apiPayload: card.apiPayload as any
        }
      });
      
      for (const inst of instances) {
        await prisma.sealedInstance.create({
          data: {
            ownerId: inst.ownerId,
            sealedReferenceId: newSealedRef.id,
            condition: 'FACTORY_SEALED',
            acquiredAt: inst.acquiredAt
          }
        });
        await prisma.cardInstance.delete({ where: { id: inst.id } });
      }
      
      await prisma.cardReference.delete({ where: { id: card.id } });
      count++;
    }
  }
  
  console.log(`Migrated ${count} sealed products.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
