import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const res = await prisma.$executeRawUnsafe(`UPDATE "CardReference" SET "apiPayload" = jsonb_build_object('tcgplayer_id', "apiPayload"->'tcgplayer_id', 'cmc', "apiPayload"->'cmc', 'collector_number', "apiPayload"->'collector_number') WHERE game = 'MAGIC'`);
    console.log('Successfully stripped apiPayload!', res);
  } catch(e) {
    console.error(e);
  }
}
run();
