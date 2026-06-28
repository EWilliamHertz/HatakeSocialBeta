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

    const { postId, content, parentId } = await request.json();
    if (!postId || !content || !content.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const newComment = await db.comment.create({
      data: {
        postId,
        authorId: user.id as string,
        content: content.trim(),
        parentId: parentId || null
      },
      include: {
        author: {
          select: { username: true }
        }
      }
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
