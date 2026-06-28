#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Hatake Social — Full Backfill Chainer
#
# Calls /api/cron/backfill repeatedly until every game is seeded with every
# historical set. Each call processes one chunk of sets and returns the cursor
# for the next call. Safe to re-run (everything is upserted).
#
# Usage:
#   ./scripts/run_backfill.sh https://your-app.vercel.app YOUR_CRON_SECRET
#   ./scripts/run_backfill.sh http://localhost:3000        # if CRON_SECRET unset locally
#
# Optional env:
#   START_GAME=POKEMON|ONE_PIECE|LORCANA|RIFTBOUND|MAGIC   (default POKEMON)
#   START_OFFSET=0
#   CHUNK=20                                                (per-call size)
# ─────────────────────────────────────────────────────────────────────────────
set -e

BASE_URL="${1:-http://localhost:3000}"
SECRET="${2:-}"
GAME="${START_GAME:-POKEMON}"
OFFSET="${START_OFFSET:-0}"
CHUNK="${CHUNK:-20}"

if [ -n "$SECRET" ]; then
  AUTH=(-H "Authorization: Bearer $SECRET")
else
  AUTH=()
fi

echo "→ Starting backfill at $BASE_URL  ($GAME offset=$OFFSET chunk=$CHUNK)"
TOTAL_CARDS=0
TOTAL_SEALED=0
CALL=0

while true; do
  CALL=$((CALL + 1))
  URL="$BASE_URL/api/cron/backfill?game=$GAME&offset=$OFFSET&chunk=$CHUNK"
  echo ""
  echo "[$CALL] GET $URL"
  RESP=$(curl -sS "${AUTH[@]}" "$URL")
  echo "$RESP" | head -c 400
  echo

  CARDS=$(echo "$RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);p=d.get('processed',{});print(p.get('cards',0))")
  SEALED=$(echo "$RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);p=d.get('processed',{});print(p.get('sealed',0))")
  TOTAL_CARDS=$((TOTAL_CARDS + CARDS))
  TOTAL_SEALED=$((TOTAL_SEALED + SEALED))

  DONE=$(echo "$RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);print('1' if d.get('nextCursor') is None else '0')")
  if [ "$DONE" = "1" ]; then
    echo ""
    echo "✓ Backfill complete."
    echo "  Cards upserted this run: $TOTAL_CARDS"
    echo "  Sealed upserted this run: $TOTAL_SEALED"
    break
  fi

  GAME=$(echo "$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['nextCursor']['game'])")
  OFFSET=$(echo "$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['nextCursor']['offset'])")
  sleep 1  # be polite to Vercel and upstream
done
