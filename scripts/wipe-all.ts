import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function run() {
  console.log('Wiping all Cards and Sealed products...');

  // Delete CardInstances to satisfy foreign key constraints
  const instances = await db.cardInstance.deleteMany({});
  console.log(`Deleted ${instances.count} CardInstances (User Inventory).`);

  // Delete all CardReferences
  const cards = await db.cardReference.deleteMany({});
  console.log(`Deleted ${cards.count} CardReferences.`);

  // Delete all SealedReferences
  const sealed = await db.sealedReference.deleteMany({});
  console.log(`Deleted ${sealed.count} SealedReferences.`);

  console.log('Wipe complete.');
}

run()
  .catch(console.error)
  .finally(() => process.exit(0));
