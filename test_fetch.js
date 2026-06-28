const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const listings = await prisma.marketListing.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        cardInstance: {
          include: { cardReference: true }
        },
        packageItems: {
          include: { cardReference: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log("Success, got", listings.length);
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
