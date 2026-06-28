import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }});
  const key = await prisma.apiKey.findFirst({ where: { game: 'POKEMON' }});
  console.log('POKEMON API KEY EXISTS:', !!key);
  if (key) {
    console.log('KEY:', key.key);
  }
}
test();
