import { PrismaClient, GameType } from '@prisma/client';

const db = new PrismaClient();

const sealedProducts = [
  { game: GameType.POKEMON, name: "Scarlet & Violet - 151 Booster Bundle", type: "BUNDLE", setCode: "MEW", price: 35.99, imageUrl: "https://i.imgur.com/B06rBhI.png" },
  { game: GameType.POKEMON, name: "Crown Zenith Elite Trainer Box", type: "ELITE_TRAINER_BOX", setCode: "CRZ", price: 49.99, imageUrl: "https://i.imgur.com/B06rBhI.png" },
  { game: GameType.POKEMON, name: "Paldea Evolved Booster Box", type: "BOOSTER_BOX", setCode: "PAL", price: 110.00, imageUrl: "https://i.imgur.com/B06rBhI.png" },
  
  { game: GameType.MTG, name: "Commander Masters Draft Booster Box", type: "BOOSTER_BOX", setCode: "CMM", price: 299.99, imageUrl: "https://i.imgur.com/B06rBhI.png" },
  { game: GameType.MTG, name: "Modern Horizons 3 Play Booster Box", type: "BOOSTER_BOX", setCode: "MH3", price: 250.00, imageUrl: "https://i.imgur.com/B06rBhI.png" },
  { game: GameType.MTG, name: "Wilds of Eldraine Bundle", type: "BUNDLE", setCode: "WOE", price: 45.00, imageUrl: "https://i.imgur.com/B06rBhI.png" },
  
  { game: GameType.ONE_PIECE, name: "Romance Dawn Booster Box (OP-01)", type: "BOOSTER_BOX", setCode: "OP01", price: 180.00, imageUrl: "https://i.imgur.com/B06rBhI.png" },
  { game: GameType.ONE_PIECE, name: "Awakening of the New Era Booster Box (OP-05)", type: "BOOSTER_BOX", setCode: "OP05", price: 140.00, imageUrl: "https://i.imgur.com/B06rBhI.png" },
  
  { game: GameType.LORCANA, name: "The First Chapter Booster Box", type: "BOOSTER_BOX", setCode: "TFC", price: 145.00, imageUrl: "https://i.imgur.com/B06rBhI.png" },
  { game: GameType.LORCANA, name: "Rise of the Floodborn Illumineer's Trove", type: "ELITE_TRAINER_BOX", setCode: "ROF", price: 65.00, imageUrl: "https://i.imgur.com/B06rBhI.png" },
  
  { game: GameType.NARUTO, name: "Naruto Kayou Tier 4 Wave 1 Booster Box", type: "BOOSTER_BOX", setCode: "T4W1", price: 80.00, imageUrl: "https://i.imgur.com/B06rBhI.png" }
];

async function seed() {
  console.log("Seeding sealed products...");
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
