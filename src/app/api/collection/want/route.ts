import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function POST(req: Request) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { cardId, minCondition, maxPrice } = body;

    // Find the actual internal CardReference
    const cardRef = await db.cardReference.findUnique({
      where: { apiId: cardId }
    });

    if (!cardRef) {
      return NextResponse.json({ error: 'Card not found in database' }, { status: 404 });
    }

    // Add to want list using upsert so we don't crash on duplicates
    const wantItem = await db.wantList.upsert({
      where: {
        userId_cardId: {
          userId: user.id,
          cardId: cardRef.id
        }
      },
      update: {
        minCondition,
        maxPrice
      },
      create: {
        userId: user.id,
        cardId: cardRef.id,
        minCondition,
        maxPrice
      }
    });

    return NextResponse.json({ success: true, wantItem });
  } catch (err) {
    console.error('Add to Want List Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const wantList = await db.wantList.findMany({
      where: { userId: user.id },
      include: {
        card: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ wantList });
  } catch (err) {
    console.error('Fetch Want List Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
