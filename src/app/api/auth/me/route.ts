import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const token = cookies().get('hatake_session')?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }
  
  try {
    const session = await decrypt(token);
    if (!session || !session.id) return NextResponse.json({ user: null });
    
    try {
      const user = await db.user.findUnique({
        where: { id: session.id as string },
        select: {
          id: true,
          username: true,
          email: true,
          shippingName: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          paypalEmail: true,
          bankIban: true,
          emailVerified: true,
          referralCode: true
        }
      });
      if (user) {
        return NextResponse.json({ user });
      }
    } catch (dbErr) {
      console.warn("Auth check DB fallback triggered");
    }
    
    return NextResponse.json({ 
      user: { 
        id: session.id, 
        username: session.username, 
        email: session.email,
        emailVerified: true 
      } 
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
