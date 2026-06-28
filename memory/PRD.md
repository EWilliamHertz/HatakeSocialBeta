# Hatake Social — PRD

## Architecture
- Next.js 14 (App Router, TS) at repo root, deployed on Vercel
- Postgres on Neon (Prisma 5.22)
- JWT auth via `jose`, Resend for email
- Daily Vercel cron triggers TCGCSV + Scryfall sync + price/value snapshots

## Implemented (Jan 2026)
- Landing page fully i18n (EN/SV) with LanguageSwitcher in header
- HaloNav: half-halo bottom bar with conic-gradient profile bubble, layoutId active pill, Euryx Arena cross-app link
- Apps page: Euryx Arena flagship card at top + 5 sub-app tiles
- Admin user: `Swagyser9@gmail.com` (ADMIN role) with 6 per-game API keys generated
- Database seeded: 78,200 cards + 3,951 sealed across Magic / Pokemon / One Piece / Lorcana / Riftbound / Naruto
- Daily cron at `/api/cron/daily-sync` (TCGCSV recent-10 + Scryfall price refresh + PriceHistory + CollectionValueHistory snapshots)
- Resumable bulk backfill at `/api/cron/backfill` + `scripts/run_backfill.sh` chainer
- Public API endpoints for every game: `/api/v1/{mtg,pokemon,one-piece,naruto,lorcana,riftbound}/cards` (Bearer hk_*)
- Price-history endpoint: `/api/v1/cards/[id]/price-history`
- Profile chart: `<CollectionValueChart />` on `/profile` (Recharts area chart with 7D/30D/90D/1Y ranges)
- Pagination fix on /collection All Cards tab (functional setState, no premature hasMore=false)
- Lorcana & Riftbound now show in All Cards game selector + search API

## Known limitations
- Per-day-cap rate limiting on /api/v1/* not enforced yet
- Set codes shown instead of full set names (deferred per user choice)
- Naruto only 201 cards (source CSV is incomplete)
- Profile chart shows empty state until first day of cron runs add historical points

## Backlog (P1)
- Full-text search index on CardReference(name, setCode)
- next/image migration on collection cards (LCP)
- Set names backfill + Set model
- API rate limiting
- Euryx ↔ Hatake SSO via shared cookie domain
