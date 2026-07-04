const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const swamp = await prisma.cardReference.findFirst({
    where: { name: 'Swamp' }
  });
  console.log(JSON.stringify(swamp, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
