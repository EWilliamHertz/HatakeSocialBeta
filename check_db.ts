import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const counts = await prisma.cardReference.groupBy({
    by: ['game'],
    _count: true
  });
  console.log("Card Counts:", counts);
}
main().finally(() => prisma.$disconnect());
