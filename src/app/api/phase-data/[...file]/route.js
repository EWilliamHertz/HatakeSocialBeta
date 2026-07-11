import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

/**
 * GET /api/phase-data/<file>
 *
 * Proxies the Phase engine's MTGJSON/Scryfall-derived data files from the
 * official Phase CDN, with an on-disk cache so each file is downloaded at most
 * once per deploy. This keeps the Docker image small (card-data.json alone is
 * ~80 MB) and works on networks where third-party hosts are blocked — the
 * browser only ever talks to hatake.social.
 */
const UPSTREAM = 'https://data.phase-rs.dev';
const CACHE_DIR = process.env.PHASE_DATA_CACHE_DIR || '/tmp/phase-data-cache';

const ALLOWED = new Set([
  'card-data.json',
  'card-data-meta.json',
  'card-data.de.json',
  'card-data.es.json',
  'card-data.fr.json',
  'card-data.it.json',
  'card-data.pt.json',
  'card-names.json',
  'changelog.json',
  'changelog-meta.json',
  'coverage-data.json',
  'coverage-summary.json',
  'decks.json',
  'draft-pools.json',
  'scryfall-data.json',
  'scryfall-token-images.json',
  'scryfall-printings.json',
  'scryfall-sets.json',
  'semantic-audit.json',
  'set-list.json',
]);

// De-duplicate concurrent downloads of the same file.
const inflight = new Map();

async function ensureCached(file) {
  const target = path.join(CACHE_DIR, file);
  if (fs.existsSync(target) && fs.statSync(target).size > 0) return target;

  if (inflight.has(file)) return inflight.get(file);

  const promise = (async () => {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const res = await fetch(`${UPSTREAM}/${file}`);
    if (!res.ok) throw new Error(`Upstream ${res.status} for ${file}`);
    const tmp = `${target}.download-${process.pid}-${Date.now()}`;
    const out = fs.createWriteStream(tmp);
    await new Promise((resolve, reject) => {
      Readable.fromWeb(res.body).pipe(out).on('finish', resolve).on('error', reject);
    });
    fs.renameSync(tmp, target);
    return target;
  })().finally(() => inflight.delete(file));

  inflight.set(file, promise);
  return promise;
}

export async function GET(_req, { params }) {
  const parts = params?.file || [];
  const file = Array.isArray(parts) ? parts.join('/') : String(parts);

  if (!ALLOWED.has(file)) {
    return NextResponse.json({ error: 'Unknown data file.' }, { status: 404 });
  }

  try {
    const cached = await ensureCached(file);
    const stat = fs.statSync(cached);
    const stream = Readable.toWeb(fs.createReadStream(cached));
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(stat.size),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error(`[phase-data] Failed to serve ${file}:`, err.message);
    return NextResponse.json({ error: 'Data file temporarily unavailable.' }, { status: 502 });
  }
}
