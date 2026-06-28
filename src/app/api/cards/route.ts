import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game');
  
  try {
    const cards = await prisma.cardReference.findMany({
      where: game ? { game: game as any } : undefined,
      take: 250, // limit for public API
      select: {
        id: true,
        name: true,
        game: true,
        apiId: true,
        setCode: true,
        rarity: true,
        imageUrl: true,
        price: true,
        apiPayload: true
      }
    });

    const response = NextResponse.json({ success: true, count: cards.length, cards });
    
    // Add CORS headers for public API
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch cards' }, { status: 500 });
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
