const { PrismaClient } = require('@prisma/client');
const { classifySealedProduct } = require('../src/lib/classifySealed');

const prisma = new PrismaClient();

const sealedKeywords = [
  'booster box', 'elite trainer box', 'etb', 'booster pack', 'blister', 'theme deck', 
  'display case', 'premium collection', 'bundle', 'tin', 'sleeved booster', 'master carton',
  'build & battle', 'fat pack', 'commander deck', 'display', 'ultra-premium', 'collection box'
];

const whitelistExceptions = ['booster energy', 'ancient booster', 'future booster', 'trainer\'s toolkit'];

async function main() {
  console.log('Initiating Phase 1: The Great Database Reclassification...');
  
  const allCards = await prisma.cardReference.findMany();
  let migratedCount = 0;

  for (const card of allCards) {
    const nameStr = card.name.toLowerCase();
    
    // Skip if it's a known genuine gameplay card
    const isException = whitelistExceptions.some(ex => nameStr.includes(ex));
    if (isException) continue;
    
    // Check if it's a sealed product leaking into the card database
    const isSealed = sealedKeywords.some(kw => nameStr.includes(kw));
    
    if (isSealed) {
      console.log(`Found Leakage: [${card.game}] ${card.name}`);
      
      // Calculate the proper SealedType Enum
      const sealedType = classifySealedProduct(card.name);
      
      // Create it properly in the SealedReference table
      const newSealed = await prisma.sealedReference.create({
        data: {
          game: card.game,
          name: card.name,
          type: sealedType,
          setCode: card.setCode,
          price: card.price,
          imageUrl: card.imageUrl,
          apiPayload: card.apiPayload || {}
        }
      });

      // Move any user inventory (CardInstance -> SealedInstance)
      const userInstances = await prisma.cardInstance.findMany({ where: { cardReferenceId: card.id } });
      for (const inst of userInstances) {
        await prisma.sealedInstance.create({
          data: {
            ownerId: inst.ownerId,
            sealedReferenceId: newSealed.id,
            condition: 'FACTORY_SEALED',
            customImageUrl: inst.customImageUrl,
            notes: inst.notes,
            acquiredAt: inst.acquiredAt
          }
        });
        await prisma.cardInstance.delete({ where: { id: inst.id } });
      }

      // Destroy the polluting row in CardReference
      await prisma.cardReference.delete({ where: { id: card.id } });
      migratedCount++;
    }
  }

  console.log(`\nReclassification Complete! Successfully migrated ${migratedCount} products to the Sealed Vault.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());