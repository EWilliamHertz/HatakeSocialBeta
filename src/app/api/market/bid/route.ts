import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { listingId, amount } = body;

    if (!listingId || !amount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const listing = await db.marketListing.findUnique({
      where: { id: listingId }
    });

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    if (listing.type !== 'AUCTION') return NextResponse.json({ error: 'Not an auction' }, { status: 400 });
    if (listing.auctionEndsAt && new Date(listing.auctionEndsAt) < new Date()) {
      return NextResponse.json({ error: 'Auction has ended' }, { status: 400 });
    }

    const currentHigh = listing.currentBid || listing.price;
    if (Number(amount) <= currentHigh) {
      return NextResponse.json({ error: 'Bid must be higher than current bid' }, { status: 400 });
    }

    // Create the bid and update the listing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bid = await db.$transaction(async (tx: any) => {
      const newBid = await tx.bid.create({
        data: {
          amount: Number(amount),
          listingId,
          bidderId: user.id as string
        },
        include: { bidder: { select: { username: true } } }
      });

      await tx.marketListing.update({
        where: { id: listingId },
        data: { currentBid: Number(amount) }
      });

      return newBid;
    });

    return NextResponse.json({ success: true, bid });
  } catch (error) {
    console.error('Bid error:', error);
    return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 });
  }
}