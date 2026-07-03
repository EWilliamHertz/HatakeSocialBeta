const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const games = ['MAGIC', 'POKEMON', 'ONE_PIECE', 'NARUTO', 'LORCANA', 'RIFTBOUND'];
  const take = 50;
  const perGame = Math.ceil(take / games.length);
  const page = 1;
  const seedStr = null;
  const seed = seedStr ? parseInt(seedStr) : Math.floor(Math.random() * 100000);
        
  const pseudoRandom = (max, offset) => {
    const val = Math.sin(seed + offset) * 10000;
    return Math.floor((val - Math.floor(val)) * max);
  };

  const results = [];
  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    const count = await prisma.cardReference.count({ where: { game: g } });
    if (count > 0) {
      const maxSkip = Math.max(0, count - perGame);
      const gameSkip = pseudoRandom(maxSkip, page + i);
      const gCards = await prisma.cardReference.findMany({
        where: { game: g },
        skip: gameSkip,
        take: perGame
      });
      results.push(gCards);
    }
  }
  
  let cards = results.flat();
  cards.sort((a, b) => pseudoRandom(100, a.id.charCodeAt(0)) - 50);
  console.log('Cards fetched sequentially:', cards.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
