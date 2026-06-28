import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await decrypt(token);
    if (!session || !session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const guilds = await db.guild.findMany({
      include: {
        members: { select: { id: true, username: true, reputationScore: true } },
        owner: { select: { id: true, username: true } }
      }
    });
    
    // Also fetch the current user's memberships
    const me = await db.user.findUnique({
      where: { id: session.id as string },
      include: { guilds: true, ownedGuilds: true }
    });

    return NextResponse.json({ guilds, myGuilds: me?.guilds || [], ownedGuilds: me?.ownedGuilds || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await decrypt(token);
    if (!session || !session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, name, description, isPrivate, inviteCode, guildId } = await request.json();

    if (action === 'CREATE') {
      const g = await db.guild.create({
        data: {
          name, description, isPrivate, inviteCode: inviteCode || null,
          ownerId: session.id as string,
          members: { connect: { id: session.id as string } }
        }
      });
      return NextResponse.json({ success: true, guild: g });
    }

    if (action === 'JOIN') {
      // Find guild
      const g = await db.guild.findUnique({ where: { id: guildId } });
      if (!g) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      
      if (g.isPrivate) {
        if (g.inviteCode !== inviteCode) return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
      }

      await db.guild.update({
        where: { id: guildId },
        data: { members: { connect: { id: session.id as string } } }
      });
      return NextResponse.json({ success: true });
    }
    
    if (action === 'LEAVE') {
      await db.guild.update({
        where: { id: guildId },
        data: { members: { disconnect: { id: session.id as string } } }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
