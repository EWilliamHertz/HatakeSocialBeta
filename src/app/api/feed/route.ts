import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');
    let whereClause: any = { guildId: null };

    if (guildId === 'GUILDS_FRIENDS') {
      const token = cookies().get('hatake_session')?.value;
      if (token) {
        const user = await decrypt(token);
        if (user && user.id) {
          const me = await db.user.findUnique({ where: { id: user.id as string }, include: { guilds: true, ownedGuilds: true } });
          const myGuildIds = [...(me?.guilds.map(g => g.id) || []), ...(me?.ownedGuilds.map(g => g.id) || [])];
          whereClause = { guildId: { in: myGuildIds } };
        }
      }
    } else if (guildId) {
      whereClause = { guildId };
    }

    const posts = await db.post.findMany({
      where: whereClause,
      include: {
        author: {
          select: { username: true }
        },
        reactions: {
          include: { user: { select: { username: true } } }
        },
        comments: {
          where: { parentId: null },
          include: { 
            author: { select: { username: true } },
            reactions: { include: { user: { select: { username: true } } } },
            replies: {
              include: {
                author: { select: { username: true } },
                reactions: { include: { user: { select: { username: true } } } }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50
    });

    return NextResponse.json({ posts });
  } catch (err: any) {
    console.error('Feed GET Error:', err);
    return NextResponse.json({ error: 'Internal server error: ' + String(err.message || err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content, imageUrls, youtubeId, guildId } = await request.json();

    const isContentEmpty = !content || !content.trim();
    const hasMedia = (imageUrls && imageUrls.length > 0) || youtubeId;

    if (isContentEmpty && !hasMedia) {
      return NextResponse.json({ error: 'Post cannot be empty' }, { status: 400 });
    }

    const userRecord = await db.user.findUnique({ where: { id: user.id as string } });
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found in database. Please log in again.' }, { status: 404 });
    }

    const newPost = await db.post.create({
      data: {
        authorId: user.id as string,
        content: content ? content.trim() : '',
        images: Array.isArray(imageUrls) ? imageUrls : [],
        youtubeId: youtubeId || null,
        guildId: guildId && guildId !== 'PUBLIC' && guildId !== 'GUILDS_FRIENDS' ? guildId : null
      },
      include: {
        author: {
          select: { username: true }
        }
      }
    });

    return NextResponse.json({ success: true, post: newPost });
  } catch (err: any) {
    console.error('Feed POST Error:', err);
    return NextResponse.json({ error: 'Internal server error: ' + String(err.message || err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { postId, content } = await request.json();
    if (!postId || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post || post.authorId !== user.id) {
      return NextResponse.json({ error: 'Not authorized or not found' }, { status: 403 });
    }

    const updatedPost = await db.post.update({
      where: { id: postId },
      data: { content: content.trim() }
    });

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post || post.authorId !== user.id) {
      return NextResponse.json({ error: 'Not authorized or not found' }, { status: 403 });
    }

    await db.post.delete({ where: { id: postId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { postId, isPinned } = await request.json();
    if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 });

    const post = await db.post.findUnique({ where: { id: postId }, include: { guild: true } });
    if (!post || !post.guildId || post.guild?.ownerId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updated = await db.post.update({
      where: { id: postId },
      data: { isPinned }
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
