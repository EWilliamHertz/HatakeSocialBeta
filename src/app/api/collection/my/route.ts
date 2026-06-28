import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET() {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const instances = await db.cardInstance.findMany({
      where: { ownerId: user.id },
      include: {
        cardReference: true,
        marketListing: true
      },
      orderBy: { acquiredAt: 'desc' }
    });

    const sealedInstances = await db.sealedInstance.findMany({
      where: { ownerId: user.id },
      include: { sealedReference: true },
      orderBy: { acquiredAt: 'desc' }
    });

    return NextResponse.json({ instances, sealedInstances });
  } catch (err) {
    console.error('My Collection Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
