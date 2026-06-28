# Test Credentials

## Admin user (created Jan 2026)
- Email: Swagyser9@gmail.com
- Username: Swagyser9
- Password: Yb07tw44!
- Role: ADMIN
- emailVerified: true (auto-set on creation)

## Per-game API keys
Regenerated every time `npx tsx scripts/create_admin.ts` is re-run.
Latest set is printed at the end of that script's output.

## Database
- DATABASE_URL is set in /app/.env (and must be set in Vercel env vars)
- Schema in sync via `npx prisma db push`

## Required env vars (Vercel + local)
- DATABASE_URL          (Neon Postgres)
- JWT_SECRET            (for hatake_session cookies)
- RESEND_API_KEY        (for transactional email)
- NEXT_PUBLIC_EURYX_URL (Euryx Arena destination URL)
- CRON_SECRET           (optional — protects /api/cron/* endpoints when set)
