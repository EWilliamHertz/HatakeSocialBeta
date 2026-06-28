const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const res = await prisma.user.updateMany({
    where: { email: 'swagyser9@gmail.com' },
    data: { role: 'ADMIN' }
  });
  console.log('Updated:', res);
}
main().catch(console.error).finally(() => prisma.$disconnect());
