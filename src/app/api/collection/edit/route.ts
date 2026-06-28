import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function PATCH(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { instanceId, condition, isFoil, isSigned, notes, customImageUrl } = await request.json();

    const instance = await db.cardInstance.findUnique({ where: { id: instanceId } });
    if (!instance || instance.ownerId !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const updated = await db.cardInstance.update({
      where: { id: instanceId },
      data: {
        condition,
        isFoil,
        isSigned,
        notes,
        customImageUrl
      }
    });

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error('Update Error:', err);
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
    const instanceId = searchParams.get('id');

    if (!instanceId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const instance = await db.cardInstance.findUnique({ where: { id: instanceId } });
    if (!instance || instance.ownerId !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    await db.cardInstance.delete({ where: { id: instanceId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
