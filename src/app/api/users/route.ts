import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await decrypt(token);
    if (!session || !session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ users: [] });
    }

    const users = await db.user.findMany({
      where: {
        username: {
          contains: q,
          mode: 'insensitive'
        },
        id: {
          not: session.id as string
        }
      },
      select: {
        id: true,
        username: true
      },
      take: 10
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error('Users GET Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
