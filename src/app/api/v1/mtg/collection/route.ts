import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer hk_')) {
      return NextResponse.json({ error: 'Unauthorized. Invalid API Key format.' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];

    const apiKeyRecord = await db.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true }
    });

    if (!apiKeyRecord || apiKeyRecord.game !== 'MAGIC') {
      return NextResponse.json({ error: 'Unauthorized. Invalid API Key.' }, { status: 401 });
    }

    const user = apiKeyRecord.user;

    // Increment hits
    await db.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { hits: { increment: 1 } }
    });

    // Fetch MTG Card Instances for this user
    const collection = await db.cardInstance.findMany({
      where: {
        ownerId: user.id,
        cardReference: {
          game: 'MAGIC'
        }
      },
      include: {
        cardReference: true
      }
    });

    return NextResponse.json({
      success: true,
      owner: { id: user.id, handle: user.handle },
      collection: collection.map(c => ({
        instanceId: c.id,
        apiId: c.cardReference.apiId,
        name: c.cardReference.name,
        imageUrl: c.cardReference.imageUrl,
        condition: c.condition,
        isFoil: c.isFoil,
        price: c.cardReference.price
      }))
    });

  } catch (err: any) {
    console.error('API Error /v1/mtg/collection:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
