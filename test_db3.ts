import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const isSealedProduct = (name: string) => {
  const lower = name.toLowerCase();
  return lower.includes('booster box') || 
         lower.includes('booster pack') || 
         lower.includes('elite trainer box') || 
         lower.includes('display') || 
         lower.includes('case') || 
         lower.includes('blister') ||
         lower.includes('deck') ||
         lower.includes('collection box') ||
         lower.includes('premium collection') ||
         lower.includes('box') ||
         lower.includes('tin') ||
         lower.includes('bundle') ||
         lower.includes('collection') ||
         lower.includes('kit') ||
         lower.includes('pack');
};

async function run() {
  const allCards = await prisma.cardReference.findMany({ where: { game: 'POKEMON' } });
  const sealed = allCards.filter(c => isSealedProduct(c.name));
  
  console.log(`Found ${sealed.length} more potential sealed products!`);
  console.log(sealed.slice(0, 10).map(c => c.name));
  
  // Actually, we don't migrate yet, just testing the heuristic.
}

run();
