import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.giveaway.create({
    data: {
      title: "First Hatake Official Giveaway",
      description: "We are giving away a Booster Box! Complete the criteria below to enter.",
      imageUrl: "https://i.imgur.com/B06rBhI.png",
      tag: "BOOSTER BOX",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      cardsRequired: 10,
      decksRequired: 1,
      tradesRequired: 0,
      invitesRequired: 0,
      isActive: true,
      winners: []
    }
  });

  await prisma.giveaway.create({
    data: {
      title: "Beta Tester Early Bird",
      description: "Exclusive promo card for our first 100 users.",
      imageUrl: "https://i.imgur.com/B06rBhI.png",
      tag: "PROMO",
      expiresAt: new Date(Date.now() - 100000), // Past
      cardsRequired: 0,
      decksRequired: 0,
      tradesRequired: 0,
      invitesRequired: 0,
      isActive: false,
      winners: ['ewilliam', 'euryx_master']
    }
  });

  console.log("Giveaways seeded!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
