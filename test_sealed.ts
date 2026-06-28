const headers = { 'Accept': 'application/json', 'User-Agent': 'HatakeSocial/1.0' };
async function run() {
  const pRes = await fetch(`https://tcgcsv.com/tcgplayer/68/22880/products`, { headers });
  const pData = await pRes.json();
  const products = pData.results || [];
  console.log(products[0]);
}
run();
