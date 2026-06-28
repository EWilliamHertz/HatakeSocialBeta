import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const cards = await prisma.$queryRawUnsafe(`
      SELECT * FROM "CardReference" 
      WHERE game = CAST('MTG' AS "GameType") AND rarity = 'common'
      ORDER BY RANDOM() 
      LIMIT 1
    `);
    console.log("Found:", cards);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
