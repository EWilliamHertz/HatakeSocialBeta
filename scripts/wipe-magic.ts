import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function run() {
  console.log('Wiping MAGIC cards...');

  // Delete CardInstances related to MAGIC
  const magicInstances = await db.cardInstance.deleteMany({
    where: {
      cardReference: {
        game: 'MAGIC'
      }
    }
  });
  console.log(`Deleted ${magicInstances.count} MAGIC CardInstances.`);

  // Delete MAGIC CardReferences
  const magicRefs = await db.cardReference.deleteMany({
    where: {
      game: 'MAGIC'
    }
  });
  console.log(`Deleted ${magicRefs.count} MAGIC CardReferences.`);

  console.log('Wipe complete.');
}

run()
  .catch(console.error)
  .finally(() => process.exit(0));
