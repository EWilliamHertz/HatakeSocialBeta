# Phase ⇄ Hatake Integration

How the embedded Phase game client (`/play/mtg`, iframe at `/phase`) is wired
into hatake.social.

## Card data (MTGJSON — no direct Scryfall)
- The Phase client is built with `CARD_DATA_URL=/api/phase-data/card-data.json`
  and `DATA_BASE_URL=/api/phase-data`. The route
  `src/app/api/phase-data/[...file]/route.js` proxies + disk-caches the
  MTGJSON/Scryfall-derived data files from `data.phase-rs.dev` (card-data.json
  is ~80 MB, cached in `/tmp/phase-data-cache`).
- `IMAGE_PROXY_URL=/api/img` makes the client route **all**
  scryfall.io/scryfall.com URLs (card images + token search API) through
  `src/app/api/img/route.js`, so networks that block Scryfall still work.
  On upstream failure it falls back to the NeonDB `CardReference` image
  (`?n=<card name>`).
- The Rust `phase-server` downloads the real `card-data.json` at container
  boot via `phase-server-start.sh` (the Docker build only fakes it with `{}`).

## postMessage protocol (iframe ⇄ /play/mtg page)
| Direction | Message | Meaning |
|---|---|---|
| Phase → page | `PHASE_READY` | Client booted; page replies with identity / pending join |
| page → Phase | `HATAKE_IDENTITY { displayName, userId }` | Carries hatake.social profile name into the client |
| Phase → page | `FIND_MATCH` | User clicked "Find Match" in the Phase lobby |
| page → Phase | `MATCH_HOST` | Matchmaker chose this player as host |
| Phase → page | `HOST_CREATED { roomCode }` | Host room ready; relayed to guest via socket.io |
| page → Phase | `MATCH_JOIN { roomCode }` | Join a room (matchmaking, or `/play/mtg?join=CODE` friend invite) |
| Phase → page | `MATCH_RESULT { result: win/loss/draw }` | Game over; forwarded for Elo |

## Matchmaking + Elo (`src/lib/socketHandler.js`)
- Sockets are authenticated from the `hatake_session` JWT cookie.
- Queue pairs the two closest-Elo players; the window widens ±50 per 5 s waited.
- Both clients report the result; when reports agree (win/loss or draw/draw)
  Elo is applied (K=32, start 1200) to `PlayerRating`, and a `Match` row is
  written. A lone report is trusted after 60 s. Conflicts skip Elo.
- Ratings + match history render on the profile page via
  `MatchHistoryDisplay` (`ratings`, `matches` from Prisma).

## Friend challenges
- After hosting, the `/play/mtg` page shows an invite panel: copy the
  `/play/mtg?join=CODE` link or send a `GAME_CHALLENGE` notification to a
  username via `POST /api/mtg/challenge`.
