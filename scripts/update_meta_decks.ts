import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Deleting current meta decks...");
  await prisma.deck.deleteMany({
    where: {
      isMeta: true,
      game: {
        in: ['LORCANA', 'POKEMON', 'MAGIC']
      }
    }
  });

  console.log("Finding admin user...");
  let admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!admin) {
    admin = await prisma.user.findFirst();
  }

  if (!admin) {
    console.error("No users found to own the meta decks!");
    return;
  }

  console.log(`Using user ${admin.username} (${admin.id}) as owner.`);

  const metaDecks = [
    {
      name: 'Ruby/Amethyst Bounce Control',
      game: 'LORCANA',
      format: 'Standard',
      isPublic: true,
      isMeta: true,
      metaAuthor: 'HatakeMeta',
      metaWinRate: '58%',
      cards: [
        { id: 'lorcana-1', name: 'Madam Mim - Fox', count: 4 },
        { id: 'lorcana-2', name: 'Merlin - Goat', count: 4 },
        { id: 'lorcana-3', name: 'Maui - Hero to All', count: 4 },
        { id: 'lorcana-4', name: 'Friends on the Other Side', count: 4 },
        { id: 'lorcana-5', name: 'Be Prepared', count: 4 },
        { id: 'lorcana-6', name: 'Arthur - Wizard\'s Apprentice', count: 4 }
      ]
    },
    {
      name: 'Amber/Steelsong',
      game: 'LORCANA',
      format: 'Standard',
      isPublic: true,
      isMeta: true,
      metaAuthor: 'HatakeMeta',
      metaWinRate: '56%',
      cards: [
        { id: 'lorcana-10', name: 'Ariel - Spectacular Singer', count: 4 },
        { id: 'lorcana-11', name: 'A Whole New World', count: 4 },
        { id: 'lorcana-12', name: 'Tinker Bell - Giant Fairy', count: 4 },
        { id: 'lorcana-13', name: 'Cinderella - Stouthearted', count: 4 },
        { id: 'lorcana-14', name: 'Let the Storm Rage On', count: 4 },
        { id: 'lorcana-15', name: 'Robin Hood - Champion of Sherwood', count: 4 }
      ]
    },
    {
      name: 'Charizard ex',
      game: 'POKEMON',
      format: 'Standard',
      isPublic: true,
      isMeta: true,
      metaAuthor: 'HatakeMeta',
      metaWinRate: '55%',
      cards: [
        { id: 'pkm-1', name: 'Charizard ex', count: 4 },
        { id: 'pkm-2', name: 'Pidgeot ex', count: 2 },
        { id: 'pkm-3', name: 'Charmander', count: 4 },
        { id: 'pkm-4', name: 'Rare Candy', count: 4 },
        { id: 'pkm-5', name: 'Arven', count: 4 },
        { id: 'pkm-6', name: 'Fire Energy', count: 8 }
      ]
    },
    {
      name: 'Chien-Pao ex / Baxcalibur',
      game: 'POKEMON',
      format: 'Standard',
      isPublic: true,
      isMeta: true,
      metaAuthor: 'HatakeMeta',
      metaWinRate: '53%',
      cards: [
        { id: 'pkm-10', name: 'Chien-Pao ex', count: 4 },
        { id: 'pkm-11', name: 'Baxcalibur', count: 3 },
        { id: 'pkm-12', name: 'Frigibax', count: 4 },
        { id: 'pkm-13', name: 'Superior Energy Retrieval', count: 4 },
        { id: 'pkm-14', name: 'Irida', count: 4 },
        { id: 'pkm-15', name: 'Water Energy', count: 10 }
      ]
    },
    {
      name: 'Rakdos Scam',
      game: 'MAGIC',
      format: 'Modern',
      isPublic: true,
      isMeta: true,
      metaAuthor: 'HatakeMeta',
      metaWinRate: '54%',
      cards: [
        { id: 'mtg-1', name: 'Grief', count: 4 },
        { id: 'mtg-2', name: 'Orcish Bowmasters', count: 4 },
        { id: 'mtg-3', name: 'Not Dead After All', count: 4 },
        { id: 'mtg-4', name: 'Dauthi Voidwalker', count: 4 },
        { id: 'mtg-5', name: 'Thoughtseize', count: 4 },
        { id: 'mtg-6', name: 'Bloodstained Mire', count: 4 }
      ]
    },
    {
      name: 'Boros Energy',
      game: 'MAGIC',
      format: 'Modern',
      isPublic: true,
      isMeta: true,
      metaAuthor: 'HatakeMeta',
      metaWinRate: '56%',
      cards: [
        { id: 'mtg-10', name: 'Guide of Souls', count: 4 },
        { id: 'mtg-11', name: 'Ocelot Pride', count: 4 },
        { id: 'mtg-12', name: 'Ajani, Nacatl Pariah', count: 4 },
        { id: 'mtg-13', name: 'Galvanic Discharge', count: 4 },
        { id: 'mtg-14', name: 'Phlage, Titan of Fire\'s Fury', count: 4 },
        { id: 'mtg-15', name: 'Amped Raptor', count: 4 }
      ]
    }
  ];

  for (const md of metaDecks) {
    await prisma.deck.create({
      data: {
        ...md,
        ownerId: admin.id,
        game: md.game as any
      }
    });
    console.log(`Created meta deck: ${md.name} (${md.game})`);
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
