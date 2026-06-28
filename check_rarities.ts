import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const rarities = await prisma.cardReference.groupBy({
    by: ['game', 'rarity'],
    _count: true
  });
  console.log("Rarities:", rarities);
}
main().finally(() => prisma.$disconnect());
