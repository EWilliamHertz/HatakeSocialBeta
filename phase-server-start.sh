#!/bin/sh
# Boot wrapper for the Phase Rust game server.
#
# The Docker build fakes card-data.json with '{}' to keep build storage low.
# A server-authoritative Magic game needs the real MTGJSON-derived card
# database, so we download it once at container start (~80 MB) before the
# server boots. If the download fails we still start with whatever is on disk
# so the container doesn't crash-loop.
set -u

DATA_DIR="${PHASE_DATA_DIR:-/var/lib/phase-server}"
UPSTREAM="https://data.phase-rs.dev"
mkdir -p "$DATA_DIR"

fetch_if_missing() {
  file="$1"
  target="$DATA_DIR/$file"
  # Re-download when missing or suspiciously small (the '{}' build fake).
  size=$(wc -c < "$target" 2>/dev/null || echo 0)
  if [ "$size" -lt 1024 ]; then
    echo "[phase-server-start] Downloading $file ..."
    if curl -fsSL --retry 3 -o "$target.tmp" "$UPSTREAM/$file"; then
      mv "$target.tmp" "$target"
      echo "[phase-server-start] $file ready ($(wc -c < "$target") bytes)"
    else
      rm -f "$target.tmp"
      echo "[phase-server-start] WARNING: failed to download $file" >&2
    fi
  fi
}

fetch_if_missing card-data.json
fetch_if_missing decks.json
fetch_if_missing draft-pools.json

exec /usr/local/bin/phase-server
