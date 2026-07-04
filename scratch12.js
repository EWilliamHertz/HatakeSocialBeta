const oracle = "T, Pay 1 life, Sacrifice Polluted Delta: Search your library for an Island or Swamp card, put it onto the battlefield, then shuffle.";
const fetchMatch = oracle.match(/Search your library for an? (.*?) card/i);
if (fetchMatch && /Pay 1 life/i.test(oracle) && /Sacrifice/i.test(oracle)) {
  const typesStr = fetchMatch[1];
  const allowedTypes = [];
  if (typesStr.includes('Plains'))   allowedTypes.push('Plains');
  if (typesStr.includes('Island'))   allowedTypes.push('Island');
  if (typesStr.includes('Swamp'))    allowedTypes.push('Swamp');
  if (typesStr.includes('Mountain')) allowedTypes.push('Mountain');
  if (typesStr.includes('Forest'))   allowedTypes.push('Forest');
  console.log(allowedTypes);
}
