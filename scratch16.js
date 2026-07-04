const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const swamp = await prisma.cardReference.findFirst({ where: { name: 'Swamp' } });
  const payload = swamp.apiPayload;
  let typeLine = payload.type_line;
  if (payload.extendedData && Array.isArray(payload.extendedData)) {
    const typeAttr = payload.extendedData.find(d => d.name === 'SubType');
    if (typeAttr && !typeLine) typeLine = typeAttr.value;
  }
  
  const searchCriteria = ['Island', 'Swamp'];
  const isValid = searchCriteria.some(t => typeLine?.includes(t));
  console.log("typeLine:", typeLine);
  console.log("isValid:", isValid);
}
main().catch(console.error).finally(() => prisma.$disconnect());
