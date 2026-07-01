import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET() {
  try {
    const giveaways = await db.giveaway.findMany({
      orderBy: {
        expiresAt: 'desc'
      }
    });
    return NextResponse.json(giveaways);
  } catch (error) {
    console.error('Failed to fetch giveaways', error);
    return NextResponse.json({ error: 'Failed to fetch giveaways' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {

    const body = await request.json();
    const { title, description, imageUrl, tag, expiresAt, cardsRequired, decksRequired, tradesRequired, invitesRequired, isActive } = body;

    const giveaway = await db.giveaway.create({
      data: {
        title,
        description,
        imageUrl,
        tag,
        expiresAt: new Date(expiresAt),
        cardsRequired: Number(cardsRequired),
        decksRequired: Number(decksRequired),
        tradesRequired: Number(tradesRequired),
        invitesRequired: Number(invitesRequired),
        isActive: isActive !== undefined ? isActive : true,
      }
    });

    return NextResponse.json(giveaway);
  } catch (error) {
    console.error('Failed to create giveaway', error);
    return NextResponse.json({ error: 'Failed to create giveaway' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {

    const body = await request.json();
    const { id, title, description, imageUrl, tag, expiresAt, cardsRequired, decksRequired, tradesRequired, invitesRequired, isActive } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const giveaway = await db.giveaway.update({
      where: { id },
      data: {
        title,
        description,
        imageUrl,
        tag,
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
        ...(cardsRequired !== undefined && { cardsRequired: Number(cardsRequired) }),
        ...(decksRequired !== undefined && { decksRequired: Number(decksRequired) }),
        ...(tradesRequired !== undefined && { tradesRequired: Number(tradesRequired) }),
        ...(invitesRequired !== undefined && { invitesRequired: Number(invitesRequired) }),
        ...(isActive !== undefined && { isActive }),
      }
    });

    return NextResponse.json(giveaway);
  } catch (error) {
    console.error('Failed to update giveaway', error);
    return NextResponse.json({ error: 'Failed to update giveaway' }, { status: 500 });
  }
}
