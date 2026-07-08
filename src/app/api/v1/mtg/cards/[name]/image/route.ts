import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const cardName = decodeURIComponent(params.name);
    
    // Hatake uses GameType.MAGIC or GameType.MTG
    const card = await prisma.cardReference.findFirst({
      where: {
        game: { in: ['MAGIC', 'MTG'] },
        name: { equals: cardName, mode: 'insensitive' }
      },
      select: { imageUrl: true },
      orderBy: { createdAt: 'desc' } // Just pick the first if multiple versions
    });

    if (card && card.imageUrl) {
      return NextResponse.redirect(card.imageUrl);
    }
    
    // If not found, attempt proxying Scryfall via name lookup as fallback
    // Or just return the card back
    return NextResponse.redirect('https://i.imgur.com/B06rBhI.png');
  } catch (err) {
    console.error('Image proxy error:', err);
    return NextResponse.redirect('https://i.imgur.com/B06rBhI.png');
  }
}
