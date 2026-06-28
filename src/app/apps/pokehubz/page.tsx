import { db } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PokehubzApp() {
  let sets: Array<{ setCode: string | null; _count: { apiId: number } }> = [];

  try {
    const setsData = await db.cardReference.groupBy({
      by: ['setCode'],
      where: { game: 'POKEMON' },
      _count: { apiId: true },
    });
    sets = setsData.sort((a, b) => b._count.apiId - a._count.apiId);
  } catch (e) {
    // DB unreachable or table missing — render empty state instead of crashing the build
    console.error('Pokehubz: failed to load sets', (e as Error).message);
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 pt-24 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 mb-2">
              PokeHubz Tracker
            </h1>
            <p className="text-slate-400">Track your Pokédex and Set completion using Hatake&apos;s live database.</p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-colors">Sets</button>
            <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-colors">Pokédex</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sets.map(set => (
            <Link href={`/collection?game=POKEMON&setCode=${set.setCode}`} key={set.setCode} className="bg-slate-900 border border-white/5 hover:border-red-500/50 rounded-2xl p-6 transition-all group cursor-pointer block">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold group-hover:text-red-400 transition-colors truncate">{set.setCode || 'Promo'}</h3>
                <span className="bg-slate-950 px-3 py-1 rounded-full text-xs font-black text-slate-400 border border-white/5">{set._count.apiId} Cards</span>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-3 mb-2 overflow-hidden border border-white/5">
                <div className="bg-gradient-to-r from-red-600 to-yellow-500 h-3 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <p className="text-xs text-slate-500 font-bold">0 / {set._count.apiId} Collected (0%)</p>
            </Link>
          ))}
        </div>

        {sets.length === 0 && (
          <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-3xl border border-white/5">
            <p>Database is currently syncing... Pokemon sets will appear here soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
