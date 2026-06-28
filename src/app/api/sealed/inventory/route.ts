import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET() {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const inventory = await db.sealedInstance.findMany({
      where: { ownerId: user.id },
      include: { sealedReference: true },
      orderBy: { acquiredAt: 'desc' }
    });

    return NextResponse.json({ inventory });
  } catch (err) {
    console.error('Get Sealed Inventory Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { sealedReferenceId, condition, purchasePrice, notes } = body;

    if (!sealedReferenceId) {
      return NextResponse.json({ error: 'Sealed Reference ID required' }, { status: 400 });
    }

    const instance = await db.sealedInstance.create({
      data: {
        ownerId: user.id,
        sealedReferenceId,
        condition: condition || 'FACTORY_SEALED',
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        notes
      }
    });

    return NextResponse.json({ instance });
  } catch (err) {
    console.error('Add Sealed Instance Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, customImageUrl, condition, purchasePrice, notes } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const instance = await db.sealedInstance.findUnique({ where: { id } });
    if (!instance || instance.ownerId !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 403 });
    }

    const updated = await db.sealedInstance.update({
      where: { id },
      data: {
        ...(customImageUrl !== undefined && { customImageUrl }),
        ...(condition !== undefined && { condition }),
        ...(purchasePrice !== undefined && { purchasePrice: purchasePrice === '' ? null : parseFloat(purchasePrice) }),
        ...(notes !== undefined && { notes })
      }
    });

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error('Update Sealed Instance Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const instance = await db.sealedInstance.findUnique({ where: { id } });
    if (!instance || instance.ownerId !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 403 });
    }

    await db.sealedInstance.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete Sealed Instance Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
