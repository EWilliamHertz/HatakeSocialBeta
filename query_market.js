const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const listings = await prisma.marketListing.findMany();
  console.log("Total listings:", listings.length);
  console.log(listings);
}
main();
