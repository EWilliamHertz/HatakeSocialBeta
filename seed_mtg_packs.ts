import { PrismaClient, GameType } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const packs = [
    { game: GameType.MTG, name: 'Modern Horizons 3 Play Booster', type: 'BOOSTER_PACK', setCode: 'MH3', imageUrl: 'https://i.imgur.com/B06rBhI.png', price: 7.99 },
    { game: GameType.MTG, name: 'Commander Masters Draft Booster', type: 'BOOSTER_PACK', setCode: 'CMM', imageUrl: 'https://i.imgur.com/B06rBhI.png', price: 12.99 },
    { game: GameType.MTG, name: 'Murders at Karlov Manor Play Booster', type: 'BOOSTER_PACK', setCode: 'MKM', imageUrl: 'https://i.imgur.com/B06rBhI.png', price: 4.49 },
  ];

  for (const pack of packs) {
    const existing = await prisma.sealedReference.findFirst({
      where: { game: pack.game, setCode: pack.setCode, type: 'BOOSTER_PACK' }
    });
    if (!existing) {
      await prisma.sealedReference.create({ data: pack });
      console.log(`Seeded ${pack.name}`);
    } else {
      console.log(`${pack.name} already exists.`);
    }
  }
}

main().finally(() => prisma.$disconnect());
