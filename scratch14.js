const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deck = await prisma.deck.findFirst({
    where: { game: 'MAGIC' }
  });
  const cards = Array.isArray(deck.cards) ? deck.cards : Object.values(deck.cards);
  
  for (let c of cards) {
     console.log(c.name);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
