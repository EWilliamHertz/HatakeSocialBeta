const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const wg = await prisma.cardReference.findFirst({
    where: { name: 'Watery Grave' }
  });
  if (!wg) { console.log('no watery grave'); return; }
  const payloadWG = wg.apiPayload;
  let extractedTypeLineWG = payloadWG.type_line;
  if (payloadWG.extendedData && Array.isArray(payloadWG.extendedData)) {
    const typeAttr = payloadWG.extendedData.find(d => d.name === 'SubType');
    if (typeAttr && !extractedTypeLineWG) extractedTypeLineWG = typeAttr.value;
  }
  console.log("WG type_line:", extractedTypeLineWG);
}
main().catch(console.error).finally(() => prisma.$disconnect());
