import { createReadStream } from 'fs';
import readline from 'readline';

async function* streamCards(filePath: string): AsyncGenerator<any> {
  const rl = readline.createInterface({
    input: createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  let buffer = '';
  let depth = 0;
  let inString = false;
  let escape = false;
  let started = false;

  for await (const line of rl) {
    for (const ch of line + '\n') {
      if (!started) {
        if (ch === '[') started = true;
        continue;
      }
      if (escape) {
        buffer += ch;
        escape = false;
        continue;
      }
      if (ch === '\\') {
        buffer += ch;
        escape = true;
        continue;
      }
      if (ch === '"') inString = !inString;
      if (!inString) {
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            buffer += ch;
            try {
              yield JSON.parse(buffer.trim());
            } catch {
              console.error("Parse failed");
            }
            buffer = '';
            continue;
          }
        }
      }
      if (depth > 0) buffer += ch;
    }
  }
}

async function run() {
  let count = 0;
  let bolts = 0;
  for await (const card of streamCards('/tmp/scryfall/default_cards.json')) {
    count++;
    if (card.name === 'Lightning Bolt') bolts++;
  }
  console.log('Total valid cards parsed:', count);
  console.log('Total Bolts parsed:', bolts);
}
run();
