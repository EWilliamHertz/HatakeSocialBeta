async function test() {
  const headers = { 'Accept': 'application/json', 'User-Agent': 'HatakeSocial/1.0' };
  const g3 = await fetch('https://tcgcsv.com/tcgplayer/3/groups', { headers });
  const data = await g3.json();
  console.log('POKE GROUPS:', data.results.length);
}
test();
