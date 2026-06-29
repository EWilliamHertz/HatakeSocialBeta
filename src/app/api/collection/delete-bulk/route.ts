import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid ID collection payload' }, { status: 400 });
    }

    // Safeguard deletion vector against cross-user authorization attacks
    const batch = await db.cardInstance.deleteMany({
      where: {
        id: { in: ids },
        ownerId: user.id as string
      }
    });

    return NextResponse.json({ success: true, count: batch.count });
  } catch (error) {
    console.error('Bulk POST delete error vector:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}