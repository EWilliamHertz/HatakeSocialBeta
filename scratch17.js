const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const decks = await prisma.deck.findMany({
    where: { game: 'MAGIC' },
    orderBy: { createdAt: 'desc' }
  });
  
  for (let d of decks) {
     console.log("Deck:", d.name);
     const cards = Array.isArray(d.cards) ? d.cards : Object.values(d.cards);
     let hasDelta = false;
     let targets = [];
     for (let c of cards) {
        if (c.name === 'Polluted Delta') hasDelta = true;
        if (c.name.includes('Island') || c.name.includes('Swamp') || c.name.includes('Grave') || c.name.includes('Sea')) {
           targets.push(c.name);
        }
     }
     console.log("Has Delta:", hasDelta, "Targets:", targets);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
