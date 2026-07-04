const { parseCardData } = require('./src/lib/cardParser.js');
console.log(JSON.stringify(parseCardData({
  name: 'Lotus Petal',
  type_line: 'Artifact',
  oracle_text: 'T, Sacrifice Lotus Petal: Add one mana of any color to your mana pool. Play this ability as a mana source.'
}).engineMetadata, null, 2));
