import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET(req: Request) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId') || user.id;

    // Fetch earned achievements
    const earned = await db.userAchievement.findMany({
      where: { userId: targetUserId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' }
    });

    // Fetch all available achievements for progress display
    const allAchievements = await db.achievement.findMany({
      orderBy: { points: 'asc' }
    });

    return NextResponse.json({ 
      earned,
      allAchievements,
      totalPoints: earned.reduce((sum, uA) => sum + uA.achievement.points, 0)
    });
  } catch (err) {
    console.error('Fetch Achievements Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
