import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.time('random');
  const cards = await prisma.$queryRaw`SELECT id FROM "CardReference" ORDER BY random() LIMIT 50`;
  console.timeEnd('random');
  console.log(cards.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
