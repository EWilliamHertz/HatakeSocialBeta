const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cards = ['Underground Sea', 'Volcanic Island', 'Island', 'Watery Grave'];
  for (let name of cards) {
    const card = await prisma.cardReference.findFirst({ where: { name } });
    if (!card) continue;
    const payload = card.apiPayload;
    let typeLine = payload.type_line;
    if (payload.extendedData && Array.isArray(payload.extendedData)) {
      const typeAttr = payload.extendedData.find(d => d.name === 'SubType');
      if (typeAttr && !typeLine) typeLine = typeAttr.value;
    }
    console.log(name, "type_line:", typeLine);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
