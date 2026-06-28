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

    const { revieweeId, dealId, rating, comment } = await request.json();

    if (!revieweeId || !dealId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify the deal exists and the user is involved (either buyer or seller)
    const deal = await db.deal.findUnique({ where: { id: dealId } });
    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });

    const isBuyer = deal.buyerId === user.id;
    const isSeller = deal.sellerId === user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: 'Not authorized for this deal' }, { status: 403 });
    }

    // Determine the reviewee should be the other party
    const expectedRevieweeId = isBuyer ? deal.sellerId : deal.buyerId;
    if (expectedRevieweeId !== revieweeId) {
      return NextResponse.json({ error: 'Invalid reviewee' }, { status: 400 });
    }

    // Check if review already exists
    const existingReview = await db.review.findUnique({ where: { dealId } });
    if (existingReview) {
      return NextResponse.json({ error: 'Review already submitted for this deal' }, { status: 400 });
    }

    // Create review
    const newReview = await db.review.create({
      data: {
        rating,
        comment,
        reviewerId: user.id as string,
        revieweeId,
        dealId,
      }
    });

    // Update user's reputation score
    const userReviews = await db.review.findMany({ where: { revieweeId } });
    const totalReviews = userReviews.length;
    const averageRating = userReviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews;

    await db.user.update({
      where: { id: revieweeId },
      data: {
        reputationScore: averageRating,
        totalReviews,
      }
    });

    return NextResponse.json({ success: true, review: newReview });
  } catch (err) {
    console.error('Reviews POST Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const reviews = await db.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error('Reviews GET Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
