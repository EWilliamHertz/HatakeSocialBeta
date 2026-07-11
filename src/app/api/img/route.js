import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/img?u=<encoded url>[&n=<card name>]
 *
 * Server-side proxy for card images and Scryfall API calls, used by the Phase
 * game client. Client networks that block scryfall.io/scryfall.com still work
 * because the fetch happens from the Hatake server. If the upstream fetch
 * fails and a card name is provided, we fall back to the NeonDB CardReference
 * image (193k+ cards).
 */
const ALLOWED_HOSTS = new Set([
  'cards.scryfall.io',
  'api.scryfall.com',
  'svgs.scryfall.io',
  'c1.scryfall.com',
  'c2.scryfall.com',
  'errors.scryfall.com',
  'tcgplayer-cdn.tcgplayer.com',
]);

async function neonFallback(name) {
  if (!name) return null;
  try {
    const card = await db.cardReference.findFirst({
      where: { game: 'MAGIC', name: { equals: name, mode: 'insensitive' } },
      select: { imageUrl: true },
    });
    return card?.imageUrl || null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('u');
  const name = searchParams.get('n');

  if (!raw) return NextResponse.json({ error: 'Missing u parameter.' }, { status: 400 });

  let target;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 });
  }

  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: 'Host not allowed.' }, { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { 'User-Agent': 'HatakeSocial/1.0 (Phase client proxy)' },
    });
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);
    const headers = new Headers({
      'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
      'Cache-Control': 'public, max-age=2592000, immutable',
      'Access-Control-Allow-Origin': '*',
    });
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (err) {
    // Fallback: serve the NeonDB card image for this card name, if any.
    const fallback = await neonFallback(name);
    if (fallback) return NextResponse.redirect(fallback, 302);
    console.error('[img-proxy] Failed:', target.hostname, err.message);
    return NextResponse.json({ error: 'Image unavailable.' }, { status: 502 });
  }
}
