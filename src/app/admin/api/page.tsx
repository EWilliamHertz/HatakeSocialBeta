import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Shield, Key, Activity, Users } from 'lucide-react';
import Link from 'next/link';

export default async function AdminApiDashboard() {
  const token = cookies().get('hatake_session')?.value;
  if (!token) redirect('/admin/login');
  
  const userSession = await decrypt(token);
  if (!userSession || userSession.role !== 'ADMIN') redirect('/admin/login');

  const keys = await db.apiKey.findMany({
    include: {
      user: { select: { handle: true, email: true } }
    },
    orderBy: {
      hits: 'desc'
    }
  });

  const totalHits = keys.reduce((sum, k) => sum + k.hits, 0);

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white flex items-center gap-4">
              <Shield className="text-fuchsia-500" size={40} /> Admin API Dashboard
            </h1>
            <p className="text-slate-400 mt-2">Monitor third-party developer API usage and key distribution.</p>
          </div>
          <Link href="/admin" className="px-6 py-2 bg-slate-900 border border-white/10 rounded-xl hover:bg-slate-800 transition-colors font-bold text-sm">
            Back to Admin Hub
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-4 bg-emerald-500/20 rounded-xl"><Key className="text-emerald-400" /></div>
            <div>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Active Keys</p>
              <p className="text-3xl font-black text-white">{keys.length}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-4 bg-cyan-500/20 rounded-xl"><Activity className="text-cyan-400" /></div>
            <div>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Total API Hits</p>
              <p className="text-3xl font-black text-white">{totalHits.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-4 bg-fuchsia-500/20 rounded-xl"><Users className="text-fuchsia-400" /></div>
            <div>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Developers</p>
              <p className="text-3xl font-black text-white">{new Set(keys.map(k => k.userId)).size}</p>
            </div>
          </div>
        </div>

        {/* Keys Table */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/50 border-b border-white/5">
                <tr>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-500">Developer</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-500">Game API</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-500">Hits (Usage)</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-500">API Key</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-500 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keys.map(key => (
                  <tr key={key.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <p className="text-white font-bold text-sm">@{key.user.handle}</p>
                      <p className="text-xs text-slate-500">{key.user.email}</p>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 bg-slate-800 text-cyan-400 text-[10px] font-black uppercase rounded-full border border-cyan-500/30">
                        {key.game.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Activity size={14} className={key.hits > 1000 ? 'text-rose-500' : key.hits > 100 ? 'text-amber-500' : 'text-emerald-500'} />
                        <span className="text-white font-black">{key.hits.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <code className="bg-slate-950 px-2 py-1 rounded text-xs text-slate-400 font-mono">
                        {key.key.substring(0, 10)}...
                      </code>
                    </td>
                    <td className="p-6 text-right text-xs text-slate-500">
                      {key.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {keys.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-500 font-bold">
                      No API keys have been generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
