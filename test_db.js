const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const c1 = await prisma.cardReference.findFirst({ where: { game: 'MAGIC', price: { not: null } }, orderBy: { price: 'desc' } });
  console.log('Max price MAGIC:', c1?.price, c1?.name, c1?.game);
  await prisma.$disconnect();
}
run();
