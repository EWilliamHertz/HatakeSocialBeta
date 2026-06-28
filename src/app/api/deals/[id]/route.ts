import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userSession = await decrypt(token);
    if (!userSession || !userSession.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dealId = params.id;

    const deal = await db.deal.findUnique({
      where: { id: dealId },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            shippingName: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            paypalEmail: true,
            bankIban: true,
          }
        },
        listing: {
          include: {
            cardInstance: {
              include: {
                cardReference: true
              }
            }
          }
        }
      }
    });

    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    
    if (deal.buyerId !== userSession.id && deal.sellerId !== userSession.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ deal });
  } catch (err) {
    console.error('Deal Fetch Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userSession = await decrypt(token);
    if (!userSession || !userSession.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dealId = params.id;
    const { status, trackingNumber, shippingProvider } = await request.json();

    const deal = await db.deal.findUnique({ where: { id: dealId } });
    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

    // Simple validation (can be expanded)
    if (deal.buyerId !== userSession.id && deal.sellerId !== userSession.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update status
    const updatedDeal = await db.deal.update({
      where: { id: dealId },
      data: { 
        status,
        ...(trackingNumber && { trackingNumber }),
        ...(shippingProvider && { shippingProvider })
      }
    });

    // If completed or cancelled, might want to update listing status too
    if (status === 'COMPLETED') {
      await db.marketListing.update({
        where: { id: deal.listingId },
        data: { status: 'SOLD' }
      });
    } else if (status === 'CANCELLED') {
      await db.marketListing.update({
        where: { id: deal.listingId },
        data: { status: 'ACTIVE' }
      });
    }

    return NextResponse.json({ success: true, deal: updatedDeal });
  } catch (err) {
    console.error('Deal Update Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
