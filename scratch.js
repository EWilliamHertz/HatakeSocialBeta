const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.cardReference.findMany({
    take: 5
  });
  console.log(cards.map(c => ({ id: c.apiId, name: c.name, imageUrl: c.imageUrl })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
