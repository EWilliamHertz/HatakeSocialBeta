import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game');
  const query = searchParams.get('q');

  const pageStr = searchParams.get('page') || '1';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  
  let page = parseInt(pageStr);
  if (isNaN(page) || page < 1) page = 1;
  const pageSize = 24;

  if (!game) {
    return NextResponse.json({ error: 'Game parameter is required' }, { status: 400 });
  }

  try {
    const whereClause: any = {
      name: {
        contains: query || '',
        mode: 'insensitive'
      }
    };

    if (game !== 'ALL') {
      whereClause.game = game as any;
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(minPrice);
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
    }

    const products = await db.sealedReference.findMany({
      where: whereClause,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ products });
  } catch (err) {
    console.error('Sealed Search Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
