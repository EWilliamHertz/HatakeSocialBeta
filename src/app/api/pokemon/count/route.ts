import { NextResponse } from "next/server";

// Returns a "best-effort" total pokemon card count from Hatake upstream.
// Caches the last successful value in module memory for 5 minutes so the
// Dashboard badge is fast and resilient to upstream 500s.

let cached: { value: number; at: number } | null = null;
const TTL_MS = 5 * 60 * 1000;
const HATAKE_BASE = process.env.HATAKE_API_BASE || "https://www.hatake.social/api/v1";
const HATAKE_KEY = process.env.HATAKE_API_KEY || "";

async function probeUpstream(): Promise<number | null> {
  // Hatake's catalog is exposed via `/pokemon/cards?search=<q>` which returns
  // a `count` for matches. We probe a few common substrings and sum the
  // disjoint upper bound — gives an order-of-magnitude live count when the
  // upstream returns 200. If 500, we return null and the caller falls back.
  const probes = ["", "a", "e", "i", "o", "u"];
  let best = 0;
  for (const p of probes) {
    try {
      const r = await fetch(`${HATAKE_BASE}/pokemon/cards?search=${encodeURIComponent(p)}`, {
        headers: { Authorization: `Bearer ${HATAKE_KEY}` },
        signal: AbortSignal.timeout(6000),
      });
      if (r.ok) {
        const d = await r.json();
        if (typeof d.count === "number" && d.count > best) best = d.count;
      }
    } catch { /* swallow */ }
  }
  return best > 0 ? best : null;
}

export async function GET() {
  if (cached && Date.now() - cached.at < TTL_MS) {
    return NextResponse.json({ count: cached.value, cached: true });
  }
  const live = await probeUpstream();
  if (live != null) {
    cached = { value: live, at: Date.now() };
    return NextResponse.json({ count: live, cached: false });
  }
  // Fallback: keep last good value if any, else 0 (UI will hide).
  if (cached) return NextResponse.json({ count: cached.value, cached: true, stale: true });
  return NextResponse.json({ count: 0, cached: false, unavailable: true });
}
