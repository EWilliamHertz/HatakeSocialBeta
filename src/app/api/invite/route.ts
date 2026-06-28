import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function POST(request: Request) {
  const token = cookies().get('hatake_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await decrypt(token);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate a simple referral link (in a real app, this would be tied to the DB)
    const referralLink = `https://beta.hatake.social/register?ref=${user.id}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Hatake Social <invites@resend.dev>', // resend.dev allows testing without domain verification
        to: [email],
        subject: `${user.username || 'Your friend'} invited you to Hatake.Social!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
            <h1 style="color: #22d3ee; margin-bottom: 24px;">Join the Ultimate TCG Social Network</h1>
            <p style="font-size: 16px; line-height: 1.5; color: #cbd5e1;">
              You've been invited to join Hatake.Social, the comprehensive platform for TCG collectors and players in Europe.
            </p>
            <div style="margin: 32px 0;">
              <a href="${referralLink}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Accept Invite & Register
              </a>
            </div>
            <p style="font-size: 14px; color: #94a3b8;">
              When you join using this link, your friend will earn progress towards their Giveaway criteria!
            </p>
          </div>
        `
      })
    });

    if (res.ok) {
      return NextResponse.json({ success: true });
    } else {
      const errorText = await res.text();
      console.error('Resend error:', errorText);
      return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500 });
    }
  } catch (err) {
    console.error('Invite Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
