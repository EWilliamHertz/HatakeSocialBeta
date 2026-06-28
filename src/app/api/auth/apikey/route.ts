export const dynamic = 'force-dynamic';




import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { GameType } from '@prisma/client';




export async function GET(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userSession = await decrypt(token);
    if (!userSession || !userSession.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKeys = await db.apiKey.findMany({
      where: { userId: userSession.id as string },
      select: { game: true, key: true }
    });

    return NextResponse.json({ success: true, apiKeys });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userSession = await decrypt(token);
    if (!userSession || !userSession.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const game = body.game as GameType;
    if (!game) return NextResponse.json({ error: 'Game parameter required' }, { status: 400 });

    const newKey = 'hk_' + randomBytes(16).toString('hex');

    const upsertedKey = await db.apiKey.upsert({
      where: { userId_game: { userId: userSession.id as string, game } },
      update: { key: newKey },
      create: {
        userId: userSession.id as string,
        game,
        key: newKey
      }
    });

    return NextResponse.json({ success: true, apiKey: upsertedKey.key, game: upsertedKey.game });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to generate key: ' + err.message }, { status: 500 });
  }
}
