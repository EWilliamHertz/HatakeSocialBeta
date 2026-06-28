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

    const { targetType, targetId, reactionType } = await request.json();
    if (!targetId || !reactionType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    if (targetType === 'POST') {
      const existing = await db.postReaction.findUnique({
        where: { postId_userId: { postId: targetId, userId: user.id as string } }
      });
      
      if (existing) {
        if (existing.type === reactionType) {
          await db.postReaction.delete({ where: { id: existing.id } });
          return NextResponse.json({ success: true, action: 'removed' });
        } else {
          await db.postReaction.update({ where: { id: existing.id }, data: { type: reactionType } });
          return NextResponse.json({ success: true, action: 'updated', type: reactionType });
        }
      } else {
        await db.postReaction.create({ data: { postId: targetId, userId: user.id as string, type: reactionType } });
        return NextResponse.json({ success: true, action: 'added', type: reactionType });
      }
    } else if (targetType === 'COMMENT') {
      const existing = await db.commentReaction.findUnique({
        where: { commentId_userId: { commentId: targetId, userId: user.id as string } }
      });
      if (existing) {
        if (existing.type === reactionType) {
          await db.commentReaction.delete({ where: { id: existing.id } });
          return NextResponse.json({ success: true, action: 'removed' });
        } else {
          await db.commentReaction.update({ where: { id: existing.id }, data: { type: reactionType } });
          return NextResponse.json({ success: true, action: 'updated', type: reactionType });
        }
      } else {
        await db.commentReaction.create({ data: { commentId: targetId, userId: user.id as string, type: reactionType } });
        return NextResponse.json({ success: true, action: 'added', type: reactionType });
      }
    }

    return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error: ' + String(err.message || err) }, { status: 500 });
  }
}
