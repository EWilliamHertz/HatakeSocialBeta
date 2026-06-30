import { PrismaClient, GameType } from '@prisma/client';

const db = new PrismaClient();

const sealedProducts = [
  { game: GameType.MTG, name: "Strixhaven: School of Mages Draft Booster Box", type: "BOOSTER_BOX", setCode: "STX", price: 120.00, imageUrl: "https://i.imgur.com/B06rBhI.png" },
  { game: GameType.MTG, name: "Strixhaven: School of Mages Set Booster Box", type: "BOOSTER_BOX", setCode: "STX", price: 145.00, imageUrl: "https://i.imgur.com/B06rBhI.png" },
  { game: GameType.MTG, name: "Strixhaven: School of Mages Collector Booster Box", type: "BOOSTER_BOX", setCode: "STX", price: 299.99, imageUrl: "https://i.imgur.com/B06rBhI.png" }
];

async function seed() {
  console.log("Seeding strixhaven products...");
  for (const p of sealedProducts) {
    const existing = await db.sealedReference.findFirst({
      where: { name: p.name }
    });
    if (!existing) {
      await db.sealedReference.create({
        data: p
      });
      console.log(`Created ${p.name}`);
    } else {
      console.log(`${p.name} already exists.`);
    }
  }
  console.log("Done seeding.");
}

seed().catch(console.error).finally(() => db.$disconnect());
