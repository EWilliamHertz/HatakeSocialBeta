'use client';
import React, { useState } from 'react';
import { Database, Key, Shield, Code, Zap, DollarSign, ExternalLink, Activity, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function ApiDeveloperPortal() {
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

 const handleGenerateKey = async () => {
  setIsGenerating(true);
  try {
    const res = await fetch('/api/auth/apikey', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'POKEMON' })
    });
    const data = await res.json();
    if (res.ok) {
      setApiKey(data.apiKey);
    } else {
      alert(`Error: ${data.error || 'Failed to generate API key'}`);
    }
  } catch (e) {
    console.error(e);
    alert('Network error while generating API key');
  }
  setIsGenerating(false);
};

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-32">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-white/5 py-16 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-bold tracking-wider uppercase mb-4">
            <Code size={16} /> Hatake.Social Developer Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
            Build the Future of TCG
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Access the most comprehensive TCG database. Live market prices, sealed vaults, deck analytics, and trading mechanics across MTG, Pokémon, One Piece, and Naruto.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-24">
        
        {/* Authentication & Keys */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Key size={200} className="text-cyan-500" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-black text-white mb-4 flex items-center gap-3">
              <Shield className="text-emerald-400" /> Your API Access
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Generate your persistent Developer API Key to authenticate requests. Do not share this key with anyone.
            </p>
            
            {apiKey ? (
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Secret API Key</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    readOnly 
                    value={apiKey} 
                    className="flex-1 bg-black border border-emerald-500/50 rounded-xl px-4 py-3 text-emerald-400 font-mono text-sm focus:outline-none"
                  />
                  <button onClick={() => { navigator.clipboard.writeText(apiKey); alert('Copied!'); }} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors border border-white/10">
                    Copy
                  </button>
                </div>
                <p className="text-xs text-amber-500 flex items-center gap-1"><Zap size={14} /> Only shown once. Store it securely.</p>
              </div>
            ) : (
              <button 
                onClick={handleGenerateKey} 
                disabled={isGenerating}
                className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white font-black rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all flex items-center gap-3 text-lg disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate API Key'} <ArrowRight size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Pricing & Quotas */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 text-lg">Start building for free. Scale when you're ready.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl shadow-xl flex flex-col">
              <h3 className="text-2xl font-black text-white mb-2">Starter</h3>
              <p className="text-slate-400 text-sm mb-6 flex-1">Perfect for testing, personal projects, and small community bots.</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-emerald-400">Free</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-300 text-sm"><Zap className="text-emerald-400" size={16} /> <strong>50 free requests / day</strong></li>
                <li className="flex items-center gap-3 text-slate-300 text-sm"><Database className="text-emerald-400" size={16} /> Read-only Market Data</li>
                <li className="flex items-center gap-3 text-slate-300 text-sm"><Database className="text-emerald-400" size={16} /> Card & Set Database</li>
              </ul>
              <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors border border-white/10">
                Included By Default
              </button>
            </div>

            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/50 p-8 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col relative transform lg:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-black text-xs font-black uppercase px-4 py-1 rounded-full">Pay As You Go</div>
              <h3 className="text-2xl font-black text-white mb-2">Professional</h3>
              <p className="text-slate-400 text-sm mb-6 flex-1">For growing apps that need more capacity without a fixed subscription.</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-cyan-400">€0.10</span>
                <span className="text-slate-500"> / request</span>
                <p className="text-xs text-slate-500 mt-1">Billed monthly after free tier limits.</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-300 text-sm"><Zap className="text-cyan-400" size={16} /> <strong>Unlimited requests</strong></li>
                <li className="flex items-center gap-3 text-slate-300 text-sm"><Activity className="text-cyan-400" size={16} /> Real-time Market Prices</li>
                <li className="flex items-center gap-3 text-slate-300 text-sm"><Database className="text-cyan-400" size={16} /> Collection Write Access</li>
                <li className="flex items-center gap-3 text-slate-300 text-sm"><Database className="text-cyan-400" size={16} /> Webhook Events</li>
              </ul>
              <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-colors">
                Enable Billing
              </button>
            </div>

            <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl shadow-xl flex flex-col">
              <h3 className="text-2xl font-black text-white mb-2">Innovator / Enterprise</h3>
              <p className="text-slate-400 text-sm mb-6 flex-1">Have a groundbreaking idea for the TCG community? We want to support you.</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-fuchsia-400">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-300 text-sm"><Zap className="text-fuchsia-400" size={16} /> Heavily discounted or free quotas</li>
                <li className="flex items-center gap-3 text-slate-300 text-sm"><Database className="text-fuchsia-400" size={16} /> Priority Support</li>
                <li className="flex items-center gap-3 text-slate-300 text-sm"><Database className="text-fuchsia-400" size={16} /> Revenue sharing opportunities</li>
              </ul>
              <button className="w-full py-3 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-400 font-bold rounded-xl transition-colors border border-fuchsia-500/30">
                Contact Partnership Team
              </button>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-slate-500">
            * Note: Requests exceeding your tier limit will automatically be closed off (Rate Limited with HTTP 429) unless billing is enabled.
          </div>
        </div>

        {/* What's Included */}
        <div>
          <h2 className="text-3xl font-black text-white mb-8 border-b border-white/10 pb-4">What's Included in the API?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl flex gap-4 hover:border-white/20 transition-colors">
              <div className="bg-blue-500/10 p-3 rounded-lg h-fit"><Database className="text-blue-400" size={24} /></div>
              <div>
                <h4 className="font-bold text-white mb-1">Global Card Database</h4>
                <p className="text-sm text-slate-400">Full metadata for MTG, Pokémon, One Piece, and Naruto. Sets, rarities, images, and rule texts.</p>
              </div>
            </div>
            <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl flex gap-4 hover:border-white/20 transition-colors">
              <div className="bg-emerald-500/10 p-3 rounded-lg h-fit"><DollarSign className="text-emerald-400" size={24} /></div>
              <div>
                <h4 className="font-bold text-white mb-1">Live Market Pricing</h4>
                <p className="text-sm text-slate-400">Access real-time aggregated market prices and active listings across the market.</p>
              </div>
            </div>
            <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl flex gap-4 hover:border-white/20 transition-colors">
              <div className="bg-purple-500/10 p-3 rounded-lg h-fit"><BookOpen className="text-purple-400" size={24} /></div>
              <div>
                <h4 className="font-bold text-white mb-1">User Collections & Decks</h4>
                <p className="text-sm text-slate-400">Read and write access to authenticated users' card collections, sealed vaults, and custom decklists.</p>
              </div>
            </div>
            <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl flex gap-4 hover:border-white/20 transition-colors">
              <div className="bg-amber-500/10 p-3 rounded-lg h-fit"><Activity className="text-amber-400" size={24} /></div>
              <div>
                <h4 className="font-bold text-white mb-1">Trades & Marketplace</h4>
                <p className="text-sm text-slate-400">Integrate peer-to-peer trade deals, matchmaking, and marketplace listings directly into your app.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
