import { db } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game');
  
  const where = {};
  if (game && game !== 'ALL') {
    where.game = game;
  }
  
  try {
    const leaderboard = await db.matchRating.findMany({
      where,
      orderBy: { elo: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true
          }
        }
      }
    });

    return Response.json({ leaderboard });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
