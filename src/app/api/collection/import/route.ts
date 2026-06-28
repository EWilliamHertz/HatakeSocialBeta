import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const game = formData.get('game') as string | null;

    if (!file || !game) {
      return NextResponse.json({ success: false, error: 'File and game are required' }, { status: 400 });
    }

    const text = await file.text();
    // A very simple CSV parser for Name, Set, Collector Number (assuming standard formats)
    // Real implementation would use csv-parse, but this is a placeholder MVP
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // Skip header line
    const rows = lines.slice(1);
    
    let addedCount = 0;
    
    for (const row of rows) {
      // Very basic comma split (fails on quoted commas, but works for MVP)
      const parts = row.split(',');
      if (parts.length < 1) continue;
      
      const cardName = parts[0].replace(/"/g, '').trim();
      if (!cardName) continue;
      
      // Attempt to find card reference in our database
      const cardRef = await prisma.cardReference.findFirst({
        where: {
          game: game as any,
          name: { contains: cardName, mode: 'insensitive' }
        }
      });
      
      if (cardRef) {
        // Add instance to inventory
        await prisma.cardInstance.create({
          data: {
            ownerId: user.id as string,
            cardReferenceId: cardRef.id,
            condition: 'NEAR_MINT',
            isFoil: false
          }
        });
        addedCount++;
      }
    }

    return NextResponse.json({ success: true, count: addedCount });
  } catch (error) {
    console.error('Import Error:', error);
    return NextResponse.json({ success: false, error: 'Import processing failed' }, { status: 500 });
  }
}
