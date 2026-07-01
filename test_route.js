const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const lines = [
    { count: 4, name: 'Flow State' },
    { count: 4, name: 'Brainstorm' },
    { count: 4, name: 'Ponder' },
    { count: 4, name: 'Dark Ritual' },
    { count: 1, name: 'Tendrils of Agony' }
  ];
  
  const promises = lines.slice(0, 100).map(async (l) => {
    const c = await prisma.cardReference.findFirst({
      where: {
        game: 'MAGIC',
        name: { equals: l.name, mode: 'insensitive' }
      },
      orderBy: { price: 'desc' }
    });

    if (c) {
      return {
        apiId: c.apiId,
        name: c.name,
        game: 'MAGIC',
        imageUrl: c.imageUrl,
        price: c.price || 0,
        cmc: c.apiPayload?.cmc || 0,
        apiPayload: c.apiPayload
      };
    }
    
    return {
      apiId: 'phantom-' + Buffer.from(l.name).toString('base64'),
      name: l.name,
      game: 'MAGIC',
      imageUrl: 'https://i.imgur.com/B06rBhI.png',
      price: 0,
      cmc: 0,
      apiPayload: {}
    };
  });

  const results = await Promise.all(promises);
  const cards = results.filter(Boolean);
  console.log(cards);
  await prisma.$disconnect();
}
run();
