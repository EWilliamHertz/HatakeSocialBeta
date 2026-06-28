import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const game = url.searchParams.get('game');
  
  if (!game) return NextResponse.json({ error: 'Missing game parameter' }, { status: 400 });

  try {
    const sets = await db.cardReference.groupBy({
      by: ['setCode'],
      where: { game: game.toUpperCase() as any },
      _count: { apiId: true }
    });
    
    // Sort descending by card count to show big sets first
    const sortedSets = sets.filter(s => s.setCode).sort((a, b) => b._count.apiId - a._count.apiId);
    
    const packs = sortedSets.map(s => ({
      id: s.setCode,
      name: `${s.setCode} Booster Pack`,
      type: 'BOOSTER_PACK'
    }));
    
    return NextResponse.json({ packs });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
