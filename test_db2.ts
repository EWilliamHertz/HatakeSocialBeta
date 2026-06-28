import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const cards = await prisma.cardReference.findMany({ 
    where: { name: { contains: 'ascended', mode: 'insensitive' } }, 
    take: 5 
  });
  console.log('Cards matching ascended in name:', cards.map(c => c.name));
  
  const sealed = await prisma.sealedReference.findMany({
    where: { name: { contains: 'ascended', mode: 'insensitive' } },
    take: 5
  });
  console.log('Sealed matching ascended:', sealed.map(c => c.name));
}
run();
