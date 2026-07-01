const list = `4 Flow State
4 Brainstorm
4 Ponder
4 Dark Ritual
4 Duress
4 Thoughtseize
4 Cabal Ritual
1 Tendrils of Agony
1 Ad Nauseam
2 Past in Flames
1 Swamp
2 Underground Sea
1 Undercity Sewers
1 Volcanic Island
4 Lion's Eye Diamond
2 Misty Rainforest
4 Polluted Delta
4 Lotus Petal
2 Island
1 Raucous Theater
4 Infernal Tutor
2 Scalding Tarn
Sideboard
2 Echoing Truth
3 Steel Sabotage
2 Dress Down
2 Chain of Vapor
2 Flusterstorm
3 Hexing Squelcher
1 Empty the Warrens`;

const lines = list.split('\n').filter(l => l.trim().length > 0 && l.trim().toLowerCase() !== 'sideboard' && l.trim().toLowerCase() !== 'deck');
const parsed = lines.map(line => {
  const match = line.trim().match(/^(\d+)x?\s+(.+)$/i);
  if (match) return { count: parseInt(match[1]), name: match[2].trim() };
  return { count: 1, name: line.trim() };
});
console.log(parsed);
