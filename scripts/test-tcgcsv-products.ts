const headers = { Accept: 'application/json', 'User-Agent': 'HatakeSocial/1.0' };

async function fetchJson(url: string) {
  const res = await fetch(url, { headers });
  return res.json();
}

const SEALED_RE = /(booster (box|pack)|elite trainer box|display|case|blister|theme deck|starter deck|collection box|premium collection|bundle|gift box|tin)/i;

async function run() {
  const data = await fetchJson('https://tcgcsv.com/tcgplayer/1/1/products');
  const products = data.results;
  for (const p of products) {
    if (SEALED_RE.test(p.name)) {
      console.log(`\n--- SEALED: ${p.name} ---`);
      console.log(JSON.stringify(p.extendedData, null, 2));
    }
  }
}
run();
