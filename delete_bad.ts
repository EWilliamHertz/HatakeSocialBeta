import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const badCards = await prisma.cardReference.findMany({
    where: { game: 'POKEMON', apiId: { contains: '-' } },
    select: { id: true }
  });
  const badIds = badCards.map(c => c.id);
  
  if (badIds.length > 0) {
    const deletedInstances = await prisma.cardInstance.deleteMany({
      where: { cardReferenceId: { in: badIds } }
    });
    console.log(`Deleted ${deletedInstances.count} CardInstances pointing to old Pokemon cards`);
    
    const deletedRefs = await prisma.cardReference.deleteMany({
      where: { id: { in: badIds } }
    });
    console.log(`Deleted ${deletedRefs.count} old Pokemon CardReferences`);
  } else {
    console.log('No bad cards found');
  }
}
run();
