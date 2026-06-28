import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function POST(request: Request) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { game, name, type, setCode, price, imageUrl } = body;

    if (!game || !name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const reference = await db.sealedReference.create({
      data: {
        game,
        name,
        type,
        setCode,
        price: price ? parseFloat(price) : null,
        imageUrl
      }
    });

    return NextResponse.json({ reference });
  } catch (err) {
    console.error('Create Sealed Reference Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
