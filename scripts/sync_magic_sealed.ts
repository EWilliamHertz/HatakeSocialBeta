const { PrismaClient } = require('@prisma/client');
const { classifySealedProduct } = require('../src/lib/classifySealed');

const prisma = new PrismaClient();
const TCGCSV_BASE = 'https://tcgcsv.com';
const MAGIC_CATEGORY_ID = 1; 

async function main() {
  console.log('Fetching MTG Sealed products from TCGCSV...');

  // Get all MTG Groups (Sets)
  const groupsRes = await fetch(`${TCGCSV_BASE}/${MAGIC_CATEGORY_ID}/groups`);
  const groupsData = await groupsRes.json();
  const groups = groupsData.results || [];

  let importedCount = 0;

  for (const group of groups) {
    // TCGCSV flags sets that contain sealed products
    if (!group.isSealed) continue;

    console.log(`Syncing Sealed for MTG Set: ${group.name}...`);
    const prodsRes = await fetch(`${TCGCSV_BASE}/${MAGIC_CATEGORY_ID}/${group.groupId}/products`);
    const prodsData = await prodsRes.json();
    const products = prodsData.results || [];

    for (const prod of products) {
      const nameStr = prod.name.toLowerCase();
      
      // Look for MTG specific sealed keywords
      const isSealed = ['booster box', 'fat pack', 'commander deck', 'bundle', 'prerelease', 'theme deck', 'draft booster', 'set booster', 'collector booster'].some(kw => nameStr.includes(kw));

      if (isSealed) {
        const sealedType = classifySealedProduct(prod.name);

        await prisma.sealedReference.upsert({
          where: { tcgcsvId: prod.productId.toString() },
          update: {
            price: prod.marketPrice || null,
            imageUrl: prod.imageUrl || null,
          },
          create: {
            tcgcsvId: prod.productId.toString(),
            game: 'MAGIC',
            name: prod.name,
            type: sealedType,
            setCode: group.abbreviation || null,
            releaseDate: group.publishedOn ? new Date(group.publishedOn) : null,
            price: prod.marketPrice || null,
            imageUrl: prod.imageUrl || null,
            apiPayload: prod
          }
        });
        importedCount++;
      }
    }
  }

  console.log(`\nMTG Sealed Sync Complete! Imported ${importedCount} sealed products.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());