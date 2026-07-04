const { parseCardData } = require('./src/lib/cardParser.js');
const card = parseCardData({
  name: 'Underground Sea',
  type_line: 'Land',
  oracle_text: 'T: Add either B or U to your mana pool.\nCounts as both swamp and islands'
});
console.log("type_line:", card.type_line);
console.log("manaAbilities:", card.engineMetadata.manaAbilities);
