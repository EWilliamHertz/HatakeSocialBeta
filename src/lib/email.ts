export const sendVerificationEmail = async (email: string, username: string, verificationToken: string) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY environment variable');
    return false;
  }

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://hatake.social'}/api/auth/verify?token=${verificationToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your Hatake Social account</title>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center; }
        .logo { margin-bottom: 30px; }
        .card { background-color: #0f172a; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        h1 { font-size: 24px; font-weight: 900; margin-top: 0; margin-bottom: 20px; background: linear-gradient(to right, #22d3ee, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p { font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 30px; }
        .btn { display: inline-block; background-color: #0891b2; color: #ffffff; text-decoration: none; font-weight: bold; padding: 16px 32px; border-radius: 12px; transition: background-color 0.2s; }
        .btn:hover { background-color: #06b6d4; }
        .footer { margin-top: 40px; font-size: 12px; color: #475569; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <h1>Welcome to Hatake Social!</h1>
          <p>Hi <strong>${username}</strong>,</p>
          <p>You're almost there! We just need to verify your email address to ensure you're a real human and to protect our marketplace auctions. Please click the button below to verify your account.</p>
          <a href="${verifyUrl}" class="btn">Verify Email Address</a>
          <p style="margin-top: 30px; font-size: 14px;">If you did not create an account on Hatake Social, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Hatake Social. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Hatake Social <hello@hatake.social>',
        to: email,
        subject: 'Verify your Hatake Social account',
        html: htmlContent
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Failed to send Resend email:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
};
