import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const users = await db.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { shippingName: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        username: true,
        shippingName: true,
        reputationScore: true,
        totalReviews: true
      },
      take: 10
    });

    return NextResponse.json({ users });
  } catch (e) {
    console.error('User Search Error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
