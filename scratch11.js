const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const swamp = await prisma.cardReference.findFirst({
    where: { name: 'Swamp' }
  });
  const payload = swamp.apiPayload;
  let extractedTypeLine = payload.type_line;
  if (payload.extendedData && Array.isArray(payload.extendedData)) {
    const typeAttr = payload.extendedData.find(d => d.name === 'SubType');
    if (typeAttr && !extractedTypeLine) extractedTypeLine = typeAttr.value;
  }
  console.log("Swamp type_line:", extractedTypeLine);

  const delta = await prisma.cardReference.findFirst({
    where: { name: 'Polluted Delta' }
  });
  const payloadDelta = delta.apiPayload;
  let extractedTypeLineDelta = payloadDelta.type_line;
  if (payloadDelta.extendedData && Array.isArray(payloadDelta.extendedData)) {
    const typeAttr = payloadDelta.extendedData.find(d => d.name === 'SubType');
    if (typeAttr && !extractedTypeLineDelta) extractedTypeLineDelta = typeAttr.value;
  }
  console.log("Delta type_line:", extractedTypeLineDelta);
}
main().catch(console.error).finally(() => prisma.$disconnect());
