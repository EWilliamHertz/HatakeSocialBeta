import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const session = await decrypt(token);
    if (!session || !session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Check if user is admin
    const user = await db.user.findUnique({ where: { id: session.id as string } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.giveaway.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete giveaway', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
