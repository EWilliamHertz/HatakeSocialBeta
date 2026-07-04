const { PrismaClient } = require('@prisma/client');
const { parseCardData } = require('./src/lib/cardParser.js');
const prisma = new PrismaClient();

async function testRitual(name) {
  const card = await prisma.cardReference.findFirst({ where: { name } });
  if (!card) return console.log(name, "not found");
  const payload = card.apiPayload;
  let oracleText = payload.oracle_text;
  if (payload.extendedData && Array.isArray(payload.extendedData)) {
    const oracleAttr = payload.extendedData.find(d => d.name === 'OracleText');
    if (oracleAttr && !oracleText) oracleText = oracleAttr.value;
  }
  const parsed = parseCardData({ name, oracle_text: oracleText, type_line: 'Instant' });
  console.log(name, "spellEffects:", parsed.engineMetadata.spellEffects);
}
testRitual('Dark Ritual').catch(console.error).finally(() => prisma.$disconnect());
