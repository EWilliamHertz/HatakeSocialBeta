const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const card = await prisma.cardReference.findFirst({ where: { name: 'Underground Sea' } });
  const payload = card.apiPayload;
  let typeLine = payload.type_line;
  let oracleText = payload.oracle_text;
  if (payload.extendedData && Array.isArray(payload.extendedData)) {
    const typeAttr = payload.extendedData.find(d => d.name === 'SubType');
    if (typeAttr && !typeLine) typeLine = typeAttr.value;
    const oracleAttr = payload.extendedData.find(d => d.name === 'OracleText');
    if (oracleAttr && !oracleText) oracleText = oracleAttr.value;
  }
  console.log("typeLine:", typeLine);
  console.log("oracleText:", oracleText);
}
main().catch(console.error).finally(() => prisma.$disconnect());
