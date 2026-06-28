import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const listings = await db.marketListing.findMany({
      where: {
        sellerId: user.id as string,
        status: 'ACTIVE'
      },
      include: {
        cardInstance: {
          include: { cardReference: true }
        },
        packageItems: {
          include: { cardReference: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ listings });
  } catch (err) {
    console.error('Market My GET Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const idsParam = searchParams.get('ids');
    const ids = idsParam ? idsParam.split(',') : (id ? [id] : []);

    if (ids.length === 0) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await db.marketListing.deleteMany({
      where: {
        id: { in: ids },
        sellerId: user.id as string
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Market My DELETE Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await request.json();
    
    // Support bulk or single edit
    if (payload.ids && Array.isArray(payload.ids)) {
      await db.marketListing.updateMany({
        where: { id: { in: payload.ids }, sellerId: user.id as string },
        data: {
          price: payload.price !== undefined ? parseFloat(payload.price) : undefined,
          type: payload.type,
          auctionEndsAt: payload.auctionEndsAt ? new Date(payload.auctionEndsAt) : undefined,
        }
      });
    } else if (payload.id) {
      await db.marketListing.update({
        where: { id: payload.id, sellerId: user.id as string },
        data: {
          price: payload.price !== undefined ? parseFloat(payload.price) : undefined,
          type: payload.type,
          auctionEndsAt: payload.auctionEndsAt ? new Date(payload.auctionEndsAt) : undefined,
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Market My PUT Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
