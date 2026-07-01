import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const cards = await db.cardReference.findMany({
    where: { name: { in: ['Island', "Lion's Eye Diamond", 'Tendrils of Agony'] }, game: 'MAGIC' },
    select: { id: true, name: true, imageUrl: true, apiPayload: true }
  });
  console.log(cards);
}
main();
