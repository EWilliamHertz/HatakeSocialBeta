const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ACHIEVEMENTS = [
  {
    code: 'FIRST_TRADE',
    name: 'First Blood',
    description: 'Successfully complete your first peer-to-peer trade.',
    points: 10
  },
  {
    code: 'MASTER_COLLECTOR',
    name: 'Master Collector',
    description: 'Add over 1,000 cards to your digital binder.',
    points: 50
  },
  {
    code: 'GUILD_FOUNDER',
    name: 'Guild Founder',
    description: 'Create your very first Hatake Guild and invite a member.',
    points: 25
  },
  {
    code: 'WHALE',
    name: 'The Whale',
    description: 'Possess a single card valued at over €500.',
    points: 100
  },
  {
    code: 'BETA_TESTER',
    name: 'Beta Pioneer',
    description: 'Join Hatake Social during the initial Beta phase.',
    points: 500
  }
];

async function seedAchievements() {
  console.log('Seeding achievements...');
  for (const ach of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: ach,
      create: ach
    });
  }
  console.log('Successfully seeded achievements!');
}

seedAchievements()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
