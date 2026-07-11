import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mtg/challenge
 * Body: { username: string, roomCode: string }
 * Sends a game-challenge notification (with a join link) to another user.
 */
export async function POST(req: Request) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const session = await decrypt(token);
  if (!session?.id) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  let body: { username?: string; roomCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const username = (body.username || '').trim();
  const roomCode = (body.roomCode || '').trim();
  if (!username || !roomCode || roomCode.length > 64) {
    return NextResponse.json({ error: 'Username and room code are required.' }, { status: 400 });
  }

  const [me, target] = await Promise.all([
    db.user.findUnique({ where: { id: session.id as string }, select: { id: true, username: true } }),
    db.user.findUnique({ where: { username }, select: { id: true } }),
  ]);

  if (!me) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  if (target.id === me.id) return NextResponse.json({ error: 'You cannot challenge yourself.' }, { status: 400 });

  await db.notification.create({
    data: {
      userId: target.id,
      type: 'GAME_CHALLENGE',
      content: `${me.username} challenged you to a Magic: The Gathering duel! Click to join.`,
      link: `/play/mtg?join=${encodeURIComponent(roomCode)}`,
    },
  });

  return NextResponse.json({ ok: true });
}
