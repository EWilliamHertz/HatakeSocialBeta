const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const brainstorm = await prisma.cardReference.findFirst({
    where: { name: 'Brainstorm' }
  });
  console.log(JSON.stringify(brainstorm?.apiPayload?.extendedData || null, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
