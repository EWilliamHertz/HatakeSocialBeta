import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const systemUser = await prisma.user.findUnique({ where: { username: 'Hatake_Store' } });
  if (systemUser) {
    console.log('Cleaning up old MarketListings for Hatake_Store...');
    await prisma.marketListing.deleteMany({ where: { sellerId: systemUser.id } });
    await prisma.cardInstance.deleteMany({ where: { ownerId: systemUser.id } });
    console.log('Cleaned up old imports.');
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
