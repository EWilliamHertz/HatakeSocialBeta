import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userSession = await decrypt(token);
    if (!userSession || !userSession.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { listingId } = await request.json();

    const listing = await db.marketListing.findUnique({
      where: { id: listingId }
    });

    if (!listing || listing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Listing not available' }, { status: 400 });
    }

    if (listing.sellerId === userSession.id) {
      return NextResponse.json({ error: 'Cannot buy your own listing' }, { status: 400 });
    }

    // Create the deal and mark listing as IN_DEAL
    const deal = await db.$transaction(async (tx) => {
      const newDeal = await tx.deal.create({
        data: {
          listingId: listing.id,
          buyerId: userSession.id as string,
          sellerId: listing.sellerId,
          price: listing.price,
          status: 'PENDING_PAYMENT'
        }
      });

      await tx.marketListing.update({
        where: { id: listing.id },
        data: { status: 'IN_DEAL' }
      });

      return newDeal;
    });

    return NextResponse.json({ success: true, deal });
  } catch (err) {
    console.error('Deal Create Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userSession = await decrypt(token);
    if (!userSession || !userSession.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = userSession.id as string;

    const deals = await db.deal.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      },
      include: {
        buyer: { select: { id: true, username: true } },
        seller: { select: { id: true, username: true } },
        listing: {
          include: {
            cardInstance: {
              include: {
                cardReference: true,
                sealedReference: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ deals });
  } catch (err) {
    console.error('Deal Fetch Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userSession = await decrypt(token);
    if (!userSession || !userSession.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dealId, status } = await request.json();

    const deal = await db.deal.findUnique({ where: { id: dealId } });
    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

    // Only seller can accept/reject if it's PENDING
    if (deal.sellerId !== userSession.id && (status === 'ACCEPTED' || status === 'CANCELLED')) {
       return NextResponse.json({ error: 'Unauthorized action' }, { status: 403 });
    }

    const updated = await db.$transaction(async (tx) => {
       const u = await tx.deal.update({
         where: { id: dealId },
         data: { status }
       });

       if (status === 'CANCELLED') {
         await tx.marketListing.update({
           where: { id: deal.listingId },
           data: { status: 'ACTIVE' }
         });
       } else if (status === 'DELIVERED') {
         await tx.marketListing.update({
           where: { id: deal.listingId },
           data: { status: 'SOLD' }
         });
         
         const listing = await tx.marketListing.findUnique({ 
           where: { id: deal.listingId },
           include: { packageItems: true } 
         });
         
         if (listing) {
           if (listing.isPackage && listing.packageItems.length > 0) {
             const ids = listing.packageItems.map((item: any) => item.id);
             await tx.cardInstance.updateMany({
               where: { id: { in: ids } },
               data: { ownerId: deal.buyerId }
             });
           } else if (listing.cardInstanceId) {
             await tx.cardInstance.update({
               where: { id: listing.cardInstanceId },
               data: { ownerId: deal.buyerId }
             });
           }
         }
       }
       return u;
    });

    return NextResponse.json({ success: true, deal: updated });
  } catch (err) {
    console.error('Deal Update Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
