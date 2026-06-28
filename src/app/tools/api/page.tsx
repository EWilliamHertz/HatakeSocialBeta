'use client';
import React, { useState } from 'react';
import { Database, Key, Check } from 'lucide-react';

export default function ApiKeyPage() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/auth/apikey')
      .then(res => res.json())
      .then(data => {
        if (data.apiKeys) {
          const keys: Record<string, string> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.apiKeys.forEach((k: any) => keys[k.game] = k.key);
          setApiKeys(keys);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleGenerateKey = async (game: string) => {
    setIsGenerating(prev => ({ ...prev, [game]: true }));
    try {
      const res = await fetch('/api/auth/apikey', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game })
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(prev => ({ ...prev, [data.game]: data.apiKey }));
        setCopied(prev => ({ ...prev, [data.game]: false }));
      } else {
        alert("Failed to generate key. Please login first.");
      }
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(prev => ({ ...prev, [game]: false }));
  };

  const handleCopy = (game: string) => {
    const key = apiKeys[game];
    if (key) {
      navigator.clipboard.writeText(key);
      setCopied(prev => ({ ...prev, [game]: true }));
      setTimeout(() => setCopied(prev => ({ ...prev, [game]: false })), 2000);
    }
  };

  const GameKeyCard = ({ game, title, url }: { game: string, title: string, url: string }) => {
    const key = apiKeys[game];
    const gen = isGenerating[game];
    const cp = copied[game];

    return (
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-cyan-500/30 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded">GET</span>
            <code className="text-cyan-400 text-sm font-bold">{url}</code>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-400 mb-6">
            Generate an API key specifically for accessing the {title} master database.
          </p>
        </div>

        <div className="bg-slate-950 border border-white/5 p-4 rounded-xl">
          <button 
            onClick={() => handleGenerateKey(game)}
            disabled={gen || loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all disabled:opacity-50 mb-4 text-sm"
          >
            {loading ? 'Loading...' : gen ? 'Generating...' : key ? 'Regenerate Key' : 'Generate Key'}
          </button>

          {key && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <p className="text-[10px] uppercase font-black tracking-widest text-emerald-400 mb-2">Your Private Key</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={key} 
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg px-3 py-2 font-mono text-white text-xs outline-none"
                />
                <button 
                  onClick={() => handleCopy(game)}
                  className="px-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-white/5 transition-colors flex items-center justify-center min-w-[70px] text-xs font-bold"
                >
                  {cp ? <Check className="text-emerald-400" size={14} /> : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 pb-40 text-slate-200">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-10 shadow-2xl relative mt-12">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Database size={200} /></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-white flex items-center gap-4 mb-4">
              <Key className="text-emerald-400" size={40} /> Developer API Access
            </h1>
            <p className="text-slate-400 text-lg mb-12 max-w-xl">
              Generate game-specific API keys to authenticate requests against our master card databases. Each key provides secure, read-only access for your own applications.
            </p>

            <h2 className="text-2xl font-black text-white mb-6">Available Endpoints & Keys</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GameKeyCard 
                game="POKEMON" 
                title="Pokemon TCG API" 
                url="/api/v1/pokemon/cards" 
              />
              <GameKeyCard 
                game="ONE_PIECE" 
                title="One Piece TCG API" 
                url="/api/v1/one-piece/cards" 
              />
              <GameKeyCard 
                game="NARUTO" 
                title="Naruto Mythos API" 
                url="/api/v1/naruto/cards" 
              />
              <GameKeyCard 
                game="MAGIC" 
                title="MTG Integration API" 
                url="/api/v1/mtg/decks?username=..." 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
