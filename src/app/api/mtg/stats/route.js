import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const count = await db.cardReference.count();
    return Response.json({ cardCount: count });
  } catch (error) {
    return Response.json({ cardCount: 0 });
  }
}
