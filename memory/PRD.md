# Hatake Social Beta — Task PRD

## Original Problem Statement
> git clone https://github.com/ewilliamhertz/hatakesocialbeta, use provided env (Neon Postgres + Resend + JWT), fix the landing page so it shows in English when EN is selected, and restyle HaloNav into a half-halo with glow and curved icon positioning.

## Architecture
- Next.js 14 app (TS) located at `/app/hatakesocialbeta`
- Auth: JWT (custom)
- DB: Neon Postgres via Prisma
- Email: Resend
- Deploy target: Vercel

## What's been implemented (2026-01)
- Cloned repo into `/app/hatakesocialbeta`
- Created `.env` with `DATABASE_URL` (typo `DATABASEw_URL` fixed → `DATABASE_URL`), `RESEND_API_KEY`, `JWT_SECRET`
- Refactored `src/app/page.tsx` landing page to use `useI18n()` translations (previously hardcoded Swedish)
- Added landing-page keys (`landing.*`) to both `en` and `sv` dictionaries in `src/lib/i18nContext.tsx`
- Added `<LanguageSwitcher />` to the landing-page top header so EN/SV toggle is visible on the landing
- Added missing `nav.guilds` Swedish translation
- Redesigned `src/components/HaloNav.tsx`:
  - Half-halo arc rendered with SVG (gradient stroke cyan → white → fuchsia + Gaussian-blur glow + dashed inner highlight)
  - 8 icons positioned mathematically along the arc (no longer in a straight row) using ellipse parameterisation
  - Center Login/Profile button sits at the apex with strong radial glow

## Notes for Vercel
- `.env` is gitignored — add the three variables in Vercel Project → Settings → Environment Variables before deploying.

## Future / Backlog
- Translate remaining hardcoded Swedish strings on other pages (register, login, etc.) if needed
- Consider per-language URL routing (next-intl) for SEO if multilingual SEO matters
