import React from 'react';
import Link from 'next/link';
import { Gamepad2, Package, TrendingUp, Building } from 'lucide-react';

export default function AppsDashboard() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 p-8 pb-40">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-4 flex items-center justify-center gap-4">
            <Gamepad2 size={48} className="text-cyan-400" /> App Hub
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Discover our expanding universe of mini-apps and tools tailored for TCG enthusiasts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Booster Simulator */}
          <Link href="/tools/booster" className="group block bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] hover:border-cyan-500/50">
            <div className="absolute -inset-2 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500"></div>
            <div className="relative z-10 flex items-start gap-6">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                <Package size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2 group-hover:text-cyan-400 transition-colors">Booster Simulator</h2>
                <p className="text-slate-400 leading-relaxed">Experience the thrill of cracking packs virtually. Uses real-world drop rates and up-to-date market prices for full box simulations.</p>
              </div>
            </div>
          </Link>

          {/* PokeHubz */}
          <Link href="/apps/pokehubz" className="group block bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(239,68,68,0.3)] hover:border-red-500/50">
            <div className="absolute -inset-2 bg-gradient-to-br from-red-500/20 to-yellow-500/20 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500"></div>
            <div className="relative z-10 flex items-start gap-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                <Gamepad2 size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2 group-hover:text-red-400 transition-colors">PokeHubz</h2>
                <p className="text-slate-400 leading-relaxed">Your ultimate Pokémon tracking companion. Track your Pokédex, measure set completions, and manage alternate variations easily.</p>
              </div>
            </div>
          </Link>
          
          {/* API Developer Portal */}
          <Link href="/apps/api" className="group block bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(217,70,239,0.3)] hover:border-fuchsia-500/50">
            <div className="absolute -inset-2 bg-gradient-to-br from-fuchsia-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500"></div>
            <div className="relative z-10 flex items-start gap-6">
              <div className="w-16 h-16 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center text-fuchsia-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                <TrendingUp size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2 group-hover:text-fuchsia-400 transition-colors">Developer Portal & API</h2>
                <p className="text-slate-400 leading-relaxed">Access our comprehensive European TCG database via API. Free tier included for developers.</p>
              </div>
            </div>
          </Link>

          {/* Giveaways */}
          <Link href="/giveaways" className="group block bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:border-emerald-500/50">
            <div className="absolute -inset-2 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500"></div>
            <div className="relative z-10 flex items-start gap-6">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                <Package size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">Giveaways & Rewards</h2>
                <p className="text-slate-400 leading-relaxed">Complete challenges, invite friends, and enter raffles for sealed boxes and premium rewards.</p>
              </div>
            </div>
          </Link>

          {/* B2B Portal */}
          <Link href="/b2b" className="group block bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:border-amber-500/50 md:col-span-2">
            <div className="absolute -inset-2 bg-gradient-to-br from-amber-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500"></div>
            <div className="relative z-10 flex items-start gap-6">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                <Building size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2 group-hover:text-amber-400 transition-colors">B2B & Wholesale Portal</h2>
                <p className="text-slate-400 leading-relaxed">Deep integration for retailers and developers. Access dynamic wholesale pricing up to 35% off on official Hatake merchandise, and direct API inventory sync tools.</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
