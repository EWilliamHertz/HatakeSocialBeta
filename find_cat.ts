async function findCat() {
  const headers = { 'Accept': 'application/json', 'User-Agent': 'HatakeSocial/1.0' };
  const res = await fetch('https://tcgcsv.com/tcgplayer/categories', { headers });
  if (res.ok) {
    const data = await res.json();
    for (const cat of data.results) {
      if (cat.name.toLowerCase().includes('piece')) console.log('ONE PIECE:', cat);
    }
  } else {
    console.log('categories failed:', res.status);
  }
}
findCat();
