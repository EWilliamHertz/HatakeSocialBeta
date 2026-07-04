const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getOracle(name) {
  const card = await prisma.cardReference.findFirst({ where: { name } });
  if (!card) return;
  const payload = card.apiPayload;
  let oracleText = payload.oracle_text;
  if (payload.extendedData && Array.isArray(payload.extendedData)) {
    const oracleAttr = payload.extendedData.find(d => d.name === 'OracleText');
    if (oracleAttr && !oracleText) oracleText = oracleAttr.value;
  }
  console.log(name, ":", oracleText);
}

async function main() {
  await getOracle('Dark Ritual');
  await getOracle('Cabal Ritual');
}
main().catch(console.error).finally(() => prisma.$disconnect());
