import { PrismaClient, GameType } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const packs = [
    { game: GameType.NARUTO, name: 'Konoha Shidō Booster Pack', type: 'BOOSTER_PACK', setCode: 'KS', imageUrl: 'https://i.imgur.com/B06rBhI.png', price: 4.99 },
    { game: GameType.MTG, name: 'Outlaws of Thunder Junction Play Booster', type: 'BOOSTER_PACK', setCode: 'OTJ', imageUrl: 'https://i.imgur.com/B06rBhI.png', price: 5.49 },
    { game: GameType.POKEMON, name: 'Twilight Masquerade Booster Pack', type: 'BOOSTER_PACK', setCode: 'TWM', imageUrl: 'https://i.imgur.com/B06rBhI.png', price: 4.49 },
    { game: GameType.ONE_PIECE, name: 'Wings of the Captain Booster Pack', type: 'BOOSTER_PACK', setCode: 'OP06', imageUrl: 'https://i.imgur.com/B06rBhI.png', price: 4.99 }
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
