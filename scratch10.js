const oracle = "T, Pay 1 life, Sacrifice Polluted Delta: Search your library for an Island or Swamp card, put it onto the battlefield, then shuffle.";
const fetchMatch = oracle.match(/Pay 1 life,\s*Sacrifice .+?:\s*Search your library for an? (.+?) card/i);
console.log(fetchMatch);
