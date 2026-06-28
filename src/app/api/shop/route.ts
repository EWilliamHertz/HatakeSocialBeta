import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ products });
  } catch (err) {
    console.error('Shop API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
