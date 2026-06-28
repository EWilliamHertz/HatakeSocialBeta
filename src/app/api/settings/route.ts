import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(request: Request) {
  try {
    const token = cookies().get('hatake_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userSession = await decrypt(token);
    if (!userSession || !userSession.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();

    const updatedUser = await db.user.update({
      where: { id: userSession.id as string },
      data: {
        shippingName: data.shippingName,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        paypalEmail: data.paypalEmail,
        bankIban: data.bankIban
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Settings Update Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
