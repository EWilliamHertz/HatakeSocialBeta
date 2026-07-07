import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { cardId, game, name, imageUrl, condition, quantity, isFoil, isSigned, signedByArtist, signedByElse, isAltered, setCode, collectorNumber, price, notes, pileTogether, customImageUrl } = await request.json();

    if (!cardId || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // First ensure the CardReference exists, we might need to upsert it
    // since the user might be adding a card that's only in our mock data for now.
    const reference = await db.cardReference.upsert({
      where: { apiId: cardId },
      update: {
        // Do not overwrite global price with the user's specific estimated instance price
      },
      create: {
        apiId: cardId,
        game: game === 'MAGIC' ? 'MTG' : (game || 'MTG'),
        name: name,
        imageUrl: imageUrl,
        price: price ? parseFloat(price) : null,
        apiPayload: { setCode, collectorNumber }
      }
    });

    // Create CardInstances
    const instancesToCreate = [];
    
    // Map string condition to Prisma Enum
    const conditionMap: Record<string, string> = {
      'Mint': 'MINT',
      'Near Mint': 'NEAR_MINT',
      'Lightly Played': 'LIGHTLY_PLAYED',
      'Moderately Played': 'MODERATELY_PLAYED',
      'Heavily Played': 'HEAVILY_PLAYED',
      'Damaged': 'DAMAGED'
    };

    const enumCondition = conditionMap[condition] || 'NEAR_MINT';

    if (pileTogether) {
      instancesToCreate.push({
        ownerId: user.id as string,
        cardReferenceId: reference.id,
        condition: enumCondition as "MINT" | "NEAR_MINT" | "LIGHTLY_PLAYED" | "MODERATELY_PLAYED" | "HEAVILY_PLAYED" | "DAMAGED",
        isFoil: isFoil,
        isSigned: isSigned || false,
        signedByArtist: signedByArtist || false,
        signedByElse: signedByElse || false,
        isAltered: isAltered || false,
        notes: notes || null,
        customImageUrl: customImageUrl || null,
        quantity: parseInt(quantity)
      });
    } else {
      for (let i = 0; i < quantity; i++) {
        instancesToCreate.push({
          ownerId: user.id as string,
          cardReferenceId: reference.id,
          condition: enumCondition as "MINT" | "NEAR_MINT" | "LIGHTLY_PLAYED" | "MODERATELY_PLAYED" | "HEAVILY_PLAYED" | "DAMAGED",
          isFoil: isFoil,
          isSigned: isSigned || false,
          signedByArtist: signedByArtist || false,
          signedByElse: signedByElse || false,
          isAltered: isAltered || false,
          notes: notes || null,
          customImageUrl: customImageUrl || null,
          quantity: 1
        });
      }
    }

    await db.cardInstance.createMany({
      data: instancesToCreate
    });

    return NextResponse.json({ success: true, count: quantity });
  } catch (err) {
    console.error('Add Card Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
