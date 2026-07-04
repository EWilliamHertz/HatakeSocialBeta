const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const delta = await prisma.cardReference.findFirst({
    where: { name: 'Polluted Delta' }
  });
  console.log(JSON.stringify(delta?.apiPayload?.extendedData || null, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
