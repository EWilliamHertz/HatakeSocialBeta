import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  await prisma.$queryRawUnsafe(`UPDATE "CardReference" SET game = 'LEGACY_POKEMON' WHERE game = 'POKEMON' AND "apiId" LIKE '%-%'`);
  console.log('Fixed old Pokemon cards');
}
run();
