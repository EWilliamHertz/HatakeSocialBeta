const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lotus = await prisma.cardReference.findFirst({
    where: { name: 'Lotus Petal' }
  });
  console.log(JSON.stringify(lotus?.apiPayload?.extendedData || null, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
