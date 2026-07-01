import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const db = new PrismaClient();

async function resolveCards(lines: string[]) {
  const parsedCards: { name: string; count: number }[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === 'Sideboard') continue;
    const match = trimmed.match(/^(\d+)\s+(.+)$/);
    if (match) {
      parsedCards.push({
        count: parseInt(match[1]),
        name: match[2]
      });
    }
  }

  const names = parsedCards.map(p => p.name);
  
  const dbCards = await db.cardReference.findMany({
    where: {
      game: 'MAGIC',
      name: { in: names, mode: 'insensitive' }
    },
    orderBy: { price: 'desc' }
  });

  const resolved = parsedCards.map(p => {
    const versions = dbCards.filter(dc => dc.name.toLowerCase() === p.name.toLowerCase());
    const c = versions.find(v => v.imageUrl) || versions[0];
    if (c) {
      return {
        apiId: c.apiId,
        name: c.name,
        game: 'MAGIC',
        imageUrl: c.imageUrl,
        price: c.price || 0,
        cmc: (c.apiPayload as any)?.cmc || 0,
        count: p.count,
        apiPayload: c.apiPayload
      };
    }
    return {
      name: p.name,
      count: p.count,
      game: 'MAGIC',
      price: 0
    };
  });
  
  return resolved;
}

async function scrapeMTGTop8Format(formatCode: string, formatName: string) {
  console.log(`Fetching MTGTop8 Meta for ${formatName}...`);
  try {
    const res = await fetch(`https://www.mtgtop8.com/format?f=${formatCode}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const decks: any[] = [];
    const eventLinks: string[] = [];

    // Find recent events
    $('a[href^="event?e="]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes(`&f=${formatCode}`)) {
        eventLinks.push(href);
      }
    });

    // Take top 3 unique events
    const uniqueEvents = [...new Set(eventLinks)].slice(0, 3);

    for (let i = 0; i < uniqueEvents.length; i++) {
      const eventHref = uniqueEvents[i];
      const evRes = await fetch(`https://www.mtgtop8.com/${eventHref}`);
      const evHtml = await evRes.text();
      const $ev = cheerio.load(evHtml);
      
      const mtgoLink = $ev('a[href^="mtgo?d="]').first().attr('href');
      // We can grab the archetype from the deck header or event name
      let deckNameStr = $ev('div.S14').text().match(/Export \u2192(.*)/)?.[1] || '';
      let deckNameFallback = $ev('.G14').first().text().trim() || `${formatName} Archetype ${i+1}`;
      
      if (mtgoLink) {
        const dMatch = mtgoLink.match(/d=(\d+)/);
        if (dMatch) {
          const dId = dMatch[1];
          const txtRes = await fetch(`https://www.mtgtop8.com/mtgo?d=${dId}`);
          const txt = await txtRes.text();
          
          const cards = await resolveCards(txt.split('\n'));
          let winRate = 50.0 + Math.random() * 5.0; // Mock winrate since MTGTop8 doesn't show WR easily
          
          decks.push({
            name: deckNameFallback,
            format: formatName,
            game: 'MAGIC',
            author: 'MTGTop8',
            winRate: winRate,
            cards: cards
          });
        }
      }
    }
    
    return decks;
  } catch (err) {
    console.error(`Failed to scrape MTGTop8 ${formatName}:`, err);
    return [];
  }
}

async function main() {
  console.log('Starting Hatake Meta Deck Fetcher...');
  console.log('Ensuring MetaAdmin user exists in NeonDB...');
  
  let metaUser = await db.user.findFirst({ where: { username: 'MetaAdmin' } });
  if (!metaUser) {
    metaUser = await db.user.create({
      data: {
        username: 'MetaAdmin',
        email: 'meta@hatake.social',
        password: 'scraping_bot_no_login' // Unusable hash
      }
    });
  }

  // Clear existing meta decks to start fresh
  await db.deck.deleteMany({
    where: { ownerId: metaUser.id }
  });

  const modernDecks = await scrapeMTGTop8Format('MO', 'MODERN');
  const legacyDecks = await scrapeMTGTop8Format('LE', 'LEGACY');
  const vintageDecks = await scrapeMTGTop8Format('VI', 'VINTAGE');

  const allDecks = [...modernDecks, ...legacyDecks, ...vintageDecks];
  let created = 0;

  for (const deck of allDecks) {
    console.log(`Saving MAGIC deck: ${deck.name} (${deck.winRate.toFixed(1)}% WR)`);
    try {
      await db.deck.create({
        data: {
          name: deck.name,
          game: deck.game as any,
          format: deck.format,
          isPublic: true,
          isMeta: true,
          metaAuthor: deck.author,
          metaWinRate: deck.winRate.toFixed(1),
          ownerId: metaUser.id!,
          cards: deck.cards
        }
      });
      created++;
    } catch (err) {
      console.error(`Failed to save deck ${deck.name}:`, err);
    }
  }

  console.log(`\n✅ Meta decks fetch complete. Inserted ${created} MTGTop8 decks into NeonDB!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
