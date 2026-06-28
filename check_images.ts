import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const sealed = await prisma.sealedReference.findMany({ take: 10 });
  console.log(sealed.map(s => ({ name: s.name, image: s.imageUrl })));
}
run();
