const { PrismaClient } = require('@prisma/client');
const { parseCardData } = require('./src/lib/cardParser.js');
const prisma = new PrismaClient();

async function main() {
  const card = await prisma.cardReference.findFirst({ where: { name: 'Cabal Ritual' } });
  if (!card) return console.log("Cabal Ritual not found");
  const payload = card.apiPayload;
  let oracleText = payload.oracle_text;
  if (payload.extendedData && Array.isArray(payload.extendedData)) {
    const oracleAttr = payload.extendedData.find(d => d.name === 'OracleText');
    if (oracleAttr && !oracleText) oracleText = oracleAttr.value;
  }
  const parsed = parseCardData({ name: 'Cabal Ritual', oracle_text: oracleText, type_line: 'Instant' });
  console.log("Cabal Ritual spellEffects:", parsed.engineMetadata.spellEffects);
}
main().catch(console.error).finally(() => prisma.$disconnect());
