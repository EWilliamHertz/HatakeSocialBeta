import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

// Phase 3: Intelligent Trade Matching
export async function GET(req: Request) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Get current user's Want List
    const myWantList = await db.wantList.findMany({
      where: { userId: user.id },
      include: { card: true }
    });
    
    if (myWantList.length === 0) {
      return NextResponse.json({ 
        matches: [], 
        message: 'Add cards to your Want List to see intelligent trade matches!' 
      });
    }

    const myWantedCardIds = myWantList.map(w => w.cardId);

    // 2. Get current user's Inventory (Cards they have and can trade)
    const myInventory = await db.cardInstance.findMany({
      where: { ownerId: user.id },
      include: { cardReference: true }
    });
    const myOwnedCardIds = myInventory.map(inv => inv.cardReference.id);

    // 3. Find other users who HAVE what I WANT
    // And ideally WANT what I HAVE.
    
    // First, find instances of the cards I want, owned by OTHER users
    const potentialProviders = await db.cardInstance.findMany({
      where: {
        cardReferenceId: { in: myWantedCardIds },
        ownerId: { not: user.id }
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            reputationScore: true
          }
        },
        cardReference: true
      }
    });

    // Group by User
    const userMatches = new Map<string, any>();
    
    for (const item of potentialProviders) {
      if (!userMatches.has(item.owner.id)) {
        userMatches.set(item.owner.id, {
          user: item.owner,
          theyHaveWhatIWant: [],
          iHaveWhatTheyWant: [],
          tradeScore: 0 // Higher is better
        });
      }
      const matchData = userMatches.get(item.owner.id);
      
      // Check if not already added
      if (!matchData.theyHaveWhatIWant.find((c: any) => c.id === item.cardReference.id)) {
        matchData.theyHaveWhatIWant.push(item.cardReference);
        matchData.tradeScore += (item.cardReference.price || 5); // Value base scoring
      }
    }

    // 4. Look up what those potential matched users WANT, and see if I have it
    const matchedUserIds = Array.from(userMatches.keys());
    if (matchedUserIds.length > 0 && myOwnedCardIds.length > 0) {
      const theirWantLists = await db.wantList.findMany({
        where: {
          userId: { in: matchedUserIds },
          cardId: { in: myOwnedCardIds }
        },
        include: {
          card: true
        }
      });

      for (const want of theirWantLists) {
        const matchData = userMatches.get(want.userId);
        if (matchData) {
          if (!matchData.iHaveWhatTheyWant.find((c: any) => c.id === want.card.id)) {
            matchData.iHaveWhatTheyWant.push(want.card);
            // Massive bonus to trade score if it's a mutual match
            matchData.tradeScore += (want.card.price || 5) * 3; 
          }
        }
      }
    }

    // Convert map to array and sort by tradeScore
    let finalMatches = Array.from(userMatches.values())
      .sort((a, b) => b.tradeScore - a.tradeScore)
      .slice(0, 10); // Top 10 matches

    // Calculate Trade Value Equalization for mutual matches
    finalMatches = finalMatches.map(match => {
      const valueTheyProvide = match.theyHaveWhatIWant.reduce((sum: number, c: any) => sum + (c.price || 0), 0);
      const valueIProvide = match.iHaveWhatTheyWant.reduce((sum: number, c: any) => sum + (c.price || 0), 0);
      
      let equalization = null;
      if (match.iHaveWhatTheyWant.length > 0) {
        const diff = valueIProvide - valueTheyProvide;
        if (Math.abs(diff) > 2) { // Only suggest equalization if difference > €2
          equalization = {
            suggestedAction: diff > 0 ? 'THEY_PAY' : 'YOU_PAY',
            amount: Math.abs(diff)
          };
        } else {
          equalization = { suggestedAction: 'EVEN_TRADE', amount: 0 };
        }
      }

      return {
        ...match,
        equalization
      };
    });

    return NextResponse.json({ matches: finalMatches });
  } catch (err) {
    console.error('Intelligent Match Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
