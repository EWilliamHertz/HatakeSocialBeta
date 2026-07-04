const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deck = await prisma.deck.findFirst({
    where: { game: 'MAGIC' }
  });
  console.log(JSON.stringify(deck.cards).slice(0, 500));
}
main().catch(console.error).finally(() => prisma.$disconnect());
