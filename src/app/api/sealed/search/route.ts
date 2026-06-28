import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game');
  const query = searchParams.get('q');

  if (!game) {
    return NextResponse.json({ error: 'Game parameter is required' }, { status: 400 });
  }

  try {
    const products = await db.sealedReference.findMany({
      where: {
        game: game as any,
        name: {
          contains: query || '',
          mode: 'insensitive'
        }
      },
      take: 20,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ products });
  } catch (err) {
    console.error('Sealed Search Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
