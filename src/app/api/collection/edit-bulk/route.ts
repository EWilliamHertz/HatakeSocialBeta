import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function PATCH(req: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { ids, condition, isFoil, isSigned, customImageUrl } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid ID array payload' }, { status: 400 });
    }

    // Execute multi-row updates across items matching user ownership constraints
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {};
    if (condition) updatePayload.condition = condition;
    if (isFoil !== undefined) updatePayload.isFoil = isFoil;
    if (isSigned !== undefined) updatePayload.isSigned = isSigned;
    if (customImageUrl !== undefined) updatePayload.customImageUrl = customImageUrl;

    const batch = await db.cardInstance.updateMany({
      where: {
        id: { in: ids },
        ownerId: user.id as string
      },
      data: updatePayload
    });

    return NextResponse.json({ success: true, count: batch.count });
  } catch (error) {
    console.error('Bulk PATCH error vector:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}