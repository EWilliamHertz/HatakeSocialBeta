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

    const dbUser = await db.user.findUnique({ where: { id: user.id as string } });
    if (!dbUser || !dbUser.referralCode) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const referralLink = `https://beta.hatake.social/register?ref=${dbUser.referralCode}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Hatake Social <invites@hatake.social>',
        to: [email],
        subject: `${dbUser.username || 'Your friend'} invited you to Hatake.Social!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; text-align: center;">
            <div style="margin-bottom: 24px;">
              <a href="https://hatake.social"><img src="https://i.imgur.com/B06rBhI.png" alt="Hatake Social" width="100" style="border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.1);" /></a>
            </div>
            <h1 style="color: #22d3ee; margin-bottom: 24px;">Join the Ultimate TCG Social Network</h1>
            <p style="font-size: 16px; line-height: 1.5; color: #cbd5e1;">
              You've been invited to join Hatake.Social, the comprehensive platform for TCG collectors and players in Europe.
            </p>
            <div style="margin: 32px 0;">
              <a href="${referralLink}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Accept Invite & Register
              </a>
            </div>
            <p style="font-size: 14px; color: #94a3b8; margin-bottom: 40px;">
              When you join using this link, your friend will earn progress towards their Giveaway criteria!
            </p>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <a href="https://hatake.social"><img src="https://i.imgur.com/B06rBhI.png" alt="Hatake Social" width="50" style="border-radius: 50%; opacity: 0.5;" /></a>
              <p style="font-size: 12px; color: #475569; margin-top: 10px;">&copy; ${new Date().getFullYear()} Hatake Social</p>
            </div>
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
