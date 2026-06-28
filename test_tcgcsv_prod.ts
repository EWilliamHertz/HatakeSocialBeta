async function run() {
  const pRes = await fetch(`https://tcgcsv.com/tcgplayer/3/22873/products`, { headers: { 'Accept': 'application/json', 'User-Agent': 'HatakeSocial/1.0' } });
  const data = await pRes.json();
  console.log(`Total returned results: ${data.results?.length}`);
  console.log(`TotalItems in response: ${data.totalItems}`);
}
run();
