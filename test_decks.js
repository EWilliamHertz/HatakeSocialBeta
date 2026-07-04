fetch('http://localhost:3000/api/decks?game=LORCANA')
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
