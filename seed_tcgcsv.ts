import { PrismaClient, GameType } from '@prisma/client';

const prisma = new PrismaClient();
const headers = { 'Accept': 'application/json', 'User-Agent': 'HatakeSocial/1.0' };

// Helper to check if a product name sounds like a sealed box
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
         lower.includes('premium collection');
};

async function syncCategory(categoryId: number, game: typeof GameType.ONE_PIECE | typeof GameType.POKEMON) {
  let count = 0;
  console.log(`Fetching groups for ${game}...`);
  const groupsRes = await fetch(`https://tcgcsv.com/tcgplayer/${categoryId}/groups`, { headers });
  if (!groupsRes.ok) {
    console.error(`Failed to fetch groups for ${game}`);
    return 0;
  }
  
  const groupsData = await groupsRes.json();
  const groups = groupsData.results || [];
  console.log(`Found ${groups.length} groups for ${game}. Fetching products...`);

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    console.log(`[${i+1}/${groups.length}] Fetching ${group.name}...`);
    
    const pRes = await fetch(`https://tcgcsv.com/tcgplayer/${categoryId}/${group.groupId}/products`, { headers });
    if (!pRes.ok) continue;
    const pData = await pRes.json();
    
    const prRes = await fetch(`https://tcgcsv.com/tcgplayer/${categoryId}/${group.groupId}/prices`, { headers });
    const pricesMap = new Map();
    if (prRes.ok) {
      const prData = await prRes.json();
      for (const pr of (prData.results || [])) {
        pricesMap.set(pr.productId, pr.marketPrice || pr.midPrice || 0);
      }
    }

    const products = pData.results || [];
    for (const card of products) {
      const imageUrl = card.imageUrl || 'https://i.imgur.com/B06rBhI.png';
      const price = pricesMap.get(card.productId) || 0;
      const setCode = group.abbreviation || group.name;
      const isSealed = isSealedProduct(card.name);

      if (isSealed) {
        await prisma.sealedReference.upsert({
          where: { id: card.productId.toString() }, // Using id as fallback since SealedReference might not have apiId
          update: { name: card.name, imageUrl, setCode, price, type: 'SEALED_PRODUCT' },
          create: {
            id: card.productId.toString(), // Hardcode id so we don't duplicate
            game,
            name: card.name,
            imageUrl,
            setCode,
            price,
            type: 'SEALED_PRODUCT',
            apiPayload: card as any
          }
        });
      } else {
        await prisma.cardReference.upsert({
          where: { apiId: card.productId.toString() },
          update: { name: card.name, imageUrl, setCode, price },
          create: {
            apiId: card.productId.toString(),
            game,
            name: card.name,
            imageUrl,
            setCode,
            price,
            apiPayload: card as any
          }
        });
      }
      count++;
    }
  }
  return count;
}

async function run() {
  console.log('Starting full TCGCSV Seed...');
  const opCount = await syncCategory(68, GameType.ONE_PIECE);
  console.log(`Finished One Piece: ${opCount} cards seeded.`);
  
  const pokeCount = await syncCategory(3, GameType.POKEMON);
  console.log(`Finished Pokemon: ${pokeCount} cards seeded.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
