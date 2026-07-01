import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST() {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const session = await decrypt(token);
    if (!session || !session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await db.user.findUnique({ where: { id: session.id as string } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ error: 'Already verified' }, { status: 400 });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await db.user.update({
      where: { id: user.id },
      data: { verificationToken }
    });

    const success = await sendVerificationEmail(user.email, user.username, verificationToken);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Resend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
