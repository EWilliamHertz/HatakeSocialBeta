const { PrismaClient } = require('@prisma/client');
const { parseCardData } = require('./src/lib/cardParser.js');
const prisma = new PrismaClient();

async function main() {
  const swamp = await prisma.cardReference.findFirst({ where: { name: 'Swamp' } });
  const payload = swamp.apiPayload;
  let typeLine = payload.type_line;
  if (payload.extendedData && Array.isArray(payload.extendedData)) {
    const typeAttr = payload.extendedData.find(d => d.name === 'SubType');
    if (typeAttr && !typeLine) typeLine = typeAttr.value;
  }
  
  const parsedSwamp = parseCardData({
    name: 'Swamp',
    type_line: typeLine,
    oracle_text: payload.oracle_text
  });
  console.log("Swamp manaAbilities:", parsedSwamp.engineMetadata.manaAbilities);
}
main().catch(console.error).finally(() => prisma.$disconnect());
