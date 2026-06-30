import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const res = await prisma.cardReference.deleteMany({ where: { game: 'MAGIC' } });
  console.log(res);
}
run();
