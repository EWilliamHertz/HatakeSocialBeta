import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const cards = await prisma.cardReference.findMany({ where: { setCode: { contains: 'ascended', mode: 'insensitive' } }, take: 1 });
  console.log('Cards matching ascended:', cards);
}
run();
