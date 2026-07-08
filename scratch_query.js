const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.cardReference.findMany({
    take: 5
  });
  console.log(cards.map(c => ({ 
    game: c.game,
    name: c.name, 
    apiId: c.apiId
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
