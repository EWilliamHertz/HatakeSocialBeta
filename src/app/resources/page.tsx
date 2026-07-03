'use client';
import React, { useState } from 'react';
import { Database, Link2, Code, Zap, Image as ImageIcon, Download, Building, DollarSign } from 'lucide-react';

type Tab = 'API' | 'MARKETING' | 'B2B';

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('MARKETING');
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/auth/apikey', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.apiKey);
      } else {
        alert("Please login first to generate an API key.");
      }
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 pb-40">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center mb-12 pt-10">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-4">Resources & Portal</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Access marketing materials, B2B pricing, and API data for Hatake Network.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('MARKETING')}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'MARKETING' ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
          >
            <ImageIcon size={18} /> Marketing Materials
          </button>
          <button 
            onClick={() => setActiveTab('B2B')}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'B2B' ? 'bg-fuchsia-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
          >
            <Building size={18} /> B2B / Wholesale
          </button>
        </div>

        {/* Content */}
        {activeTab === 'MARKETING' && (
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <ImageIcon className="text-cyan-400" /> Brand & Marketing Kit
            </h2>
            <p className="text-slate-300 mb-8 max-w-3xl text-lg">
              Download our official logos, product photos, social media templates, and branding guidelines. 
              Perfect for local game stores (LGS) and content creators.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl flex flex-col items-center text-center group cursor-pointer hover:border-cyan-500/50 transition-colors">
                <Download size={48} className="text-cyan-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-white mb-2">Full Press Kit (.ZIP)</h3>
                <p className="text-sm text-slate-500 mb-4">Logos, banners, and brand guidelines.</p>
                <a href="/marketing/press_kit.zip" download className="px-6 py-2 bg-slate-800 hover:bg-cyan-600 rounded-lg text-sm font-bold text-white transition-colors">Download (24MB)</a>
              </div>
              <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl flex flex-col items-center text-center group cursor-pointer hover:border-fuchsia-500/50 transition-colors">
                <Download size={48} className="text-fuchsia-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-white mb-2">Product Photos (.ZIP)</h3>
                <p className="text-sm text-slate-500 mb-4">High-res photos of merchandise and accessories.</p>
                <a href="/marketing/product_images.zip" download className="px-6 py-2 bg-slate-800 hover:bg-fuchsia-600 rounded-lg text-sm font-bold text-white transition-colors">Download (13MB)</a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'B2B' && (
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Building className="text-fuchsia-400" /> B2B Wholesale Portal
            </h2>
            <p className="text-slate-300 mb-8 max-w-3xl text-lg">
              Are you a local game store or distributor? Access our wholesale pricing tiers and place bulk orders directly through our B2B portal.
            </p>
            <div className="bg-slate-950 border border-fuchsia-500/30 p-8 rounded-2xl">
              <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Apply for a Wholesale Account</h3>
                  <p className="text-slate-400">You must provide a valid Tax ID and business registration to unlock tier pricing.</p>
                </div>
                <button className="whitespace-nowrap px-8 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black rounded-xl shadow-lg transition-colors">
                  Submit Application
                </button>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-6 rounded-xl border border-white/5">
                <DollarSign className="text-emerald-400 mb-2" />
                <h4 className="font-bold text-white">Tier 1</h4>
                <p className="text-xs text-slate-500">Orders $500+</p>
              </div>
              <div className="bg-slate-950 p-6 rounded-xl border border-white/5">
                <DollarSign className="text-emerald-400 mb-2" />
                <h4 className="font-bold text-white">Tier 2</h4>
                <p className="text-xs text-slate-500">Orders $2,000+</p>
              </div>
              <div className="bg-slate-950 p-6 rounded-xl border border-white/5">
                <DollarSign className="text-emerald-400 mb-2" />
                <h4 className="font-bold text-white">Tier 3 (Distributor)</h4>
                <p className="text-xs text-slate-500">Orders $10,000+</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
