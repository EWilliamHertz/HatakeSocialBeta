async function test() {
  const headers = { 'Accept': 'application/json', 'User-Agent': 'HatakeSocial/1.0' };
  const res = await fetch('https://tcgcsv.com/categories', { headers });
  if (res.ok) {
    const data = await res.json();
    for (const cat of data.results) {
      if (cat.name.toLowerCase().includes('piece')) console.log('ONE PIECE:', cat);
      if (cat.name.toLowerCase().includes('pokemon')) console.log('POKEMON:', cat);
    }
  } else { console.log('no categories endpoint', res.status); }
}
test();
