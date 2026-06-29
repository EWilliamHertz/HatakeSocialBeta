import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const games = searchParams.get('games')?.split(',') || [];
    
    const mtgColors = searchParams.get('mtgColors')?.split(',') || [];
    const pokemonTypes = searchParams.get('pokemonTypes')?.split(',') || [];
    const isFoil = searchParams.get('isFoil') === 'true';
    const isSigned = searchParams.get('isSigned') === 'true';
    const isAltered = searchParams.get('isAltered') === 'true';
    const condition = searchParams.get('condition');

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: 'ACTIVE'
    };

    if (q) {
      where.cardInstance = {
        cardReference: {
          name: { contains: q, mode: 'insensitive' }
        }
      };
    }

    if (games.length > 0) {
      // Map MAGIC to MTG for database query
      const dbGames = games.map(g => g === 'MAGIC' ? 'MTG' : g);
      if (!where.cardInstance) where.cardInstance = {};
      if (!where.cardInstance.cardReference) where.cardInstance.cardReference = {};
      where.cardInstance.cardReference.game = { in: dbGames };
    }

    if (isFoil || isSigned || isAltered || condition) {
      if (!where.cardInstance) where.cardInstance = {};
      if (isFoil) where.cardInstance.isFoil = true;
      if (isSigned) where.cardInstance.isSigned = true;
      if (isAltered) where.cardInstance.isAltered = true;
      if (condition) where.cardInstance.condition = condition;
    }

    let listings = await db.marketListing.findMany({
      where,
      include: {
        seller: { select: { id: true, username: true, reputationScore: true, totalReviews: true } },
        bids: {
          orderBy: { amount: 'desc' },
          include: { bidder: { select: { username: true } } }
        },
        cardInstance: {
          include: {
            cardReference: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    // In-memory filter for complex JSON attributes
    if (mtgColors.length > 0) {
      listings = listings.filter(l => {
        if (l.cardInstance?.cardReference?.game !== 'MTG') return true; 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = l.cardInstance.cardReference.apiPayload;
        const colors = payload?.colors || [];
        return mtgColors.some(c => colors.includes(c));
      });
    }

    if (pokemonTypes.length > 0) {
      listings = listings.filter(l => {
        if (l.cardInstance?.cardReference?.game !== 'POKEMON') return true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = l.cardInstance.cardReference.apiPayload;
        const types = payload?.types || [];
        return pokemonTypes.some(t => types.includes(t));
      });
    }

    return NextResponse.json({ listings: listings.slice(0, 100) });
  } catch (err) {
    console.error('Market GET Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await request.json();
    
    // Support either single object or array of listings (Bulk List Handler)
    const listingsPayload = Array.isArray(payload) ? payload : [payload];

    if (listingsPayload.length === 0) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 });
    }

    const results = [];

    for (const item of listingsPayload) {
      if (item.isPackage) {
        const { packageTitle, packageDesc, packageImageUrl, type, auctionDays, price, cardInstanceIds } = item;
        
        let auctionEndsAt = null;
        if (type === 'AUCTION' && auctionDays) {
          auctionEndsAt = new Date();
          auctionEndsAt.setDate(auctionEndsAt.getDate() + Number(auctionDays));
        }

        // Verify ownership of all items in package
        const instances = await db.cardInstance.findMany({
          where: {
            id: { in: cardInstanceIds },
            ownerId: user.id
          }
        });

        if (instances.length !== cardInstanceIds.length) {
          return NextResponse.json({ error: 'Unauthorized or invalid instances' }, { status: 401 });
        }

        const listing = await db.marketListing.create({
          data: {
            sellerId: user.id as string,
            isPackage: true,
            packageTitle,
            packageDesc,
            packageImageUrl,
            type: type || 'FIXED_PRICE',
            price: Number(price),
            currentBid: type === 'AUCTION' ? Number(price) : null,
            auctionEndsAt,
            status: 'ACTIVE',
            packageItems: {
              connect: cardInstanceIds.map((id: string) => ({ id }))
            }
          }
        });
        results.push(listing);
        continue;
      }

      // Individual / Bulk Item Listing
      const { cardInstanceId, price, customImageUrl, notes, type, auctionDays, condition, isFoil, isSigned, isAltered, isGraded, isHolo, isReverseHolo, isManga } = item;

      if (!cardInstanceId || price === undefined) continue;

      const instance = await db.cardInstance.findUnique({
        where: { id: cardInstanceId }
      });

      if (!instance || instance.ownerId !== user.id) {
        continue;
      }

      // Sync any updated instance fields from the modal
      await db.cardInstance.update({
        where: { id: cardInstanceId },
        data: {
          ...(customImageUrl !== undefined && { customImageUrl }),
          ...(notes !== undefined && { notes }),
          ...(condition !== undefined && { condition }),
          ...(isFoil !== undefined && { isFoil }),
          ...(isSigned !== undefined && { isSigned }),
          ...(isAltered !== undefined && { isAltered }),
          ...(isGraded !== undefined && { isGraded }),
          ...(isHolo !== undefined && { isHolo }),
          ...(isReverseHolo !== undefined && { isReverseHolo }),
          ...(isManga !== undefined && { isManga }),
        }
      });

      let auctionEndsAt = null;
      if (type === 'AUCTION' && auctionDays) {
        auctionEndsAt = new Date();
        auctionEndsAt.setDate(auctionEndsAt.getDate() + Number(auctionDays));
      }

      const listingType = type || 'FIXED_PRICE';

      const listing = await db.marketListing.upsert({
        where: { cardInstanceId },
        update: {
          price: Number(price),
          type: listingType,
          ...(listingType === 'AUCTION' && { currentBid: Number(price) }),
          auctionEndsAt,
          status: 'ACTIVE'
        },
        create: {
          sellerId: user.id as string,
          cardInstanceId,
          price: Number(price),
          type: listingType,
          ...(listingType === 'AUCTION' && { currentBid: Number(price) }),
          auctionEndsAt,
          status: 'ACTIVE'
        },
        include: {
          cardInstance: {
            include: { cardReference: true }
          }
        }
      });
      
      results.push(listing);
    }

    return NextResponse.json({ success: true, listings: results });
  } catch (err) {
    console.error('Market POST Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}