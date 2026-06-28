import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { guildId } = await request.json();
    if (!guildId) return NextResponse.json({ error: 'Guild ID required' }, { status: 400 });

    const dbUser = await db.user.update({
      where: { id: user.id as string },
      data: { guildId }
    });

    return NextResponse.json({ success: true, user: dbUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to join guild' }, { status: 500 });
  }
}
