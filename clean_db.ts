import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function clean() {
  const result = await prisma.cardReference.deleteMany({ where: { game: 'ONE_PIECE' } });
  console.log('Deleted ONE_PIECE cards:', result.count);
}
clean().finally(() => prisma.$disconnect());
