'use client';
import React from 'react';
import Link from 'next/link';
import { PackageOpen, Database, Wand2, MonitorSmartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AppsHub() {
  const handlePhaseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Phase MTG integration is located at https://phase-rs.dev/");
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 pb-40 text-slate-200">
      <ToastContainer />
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center pt-10 mb-12">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 flex items-center justify-center gap-4 mb-4">
            <Wand2 size={48} className="text-cyan-400" /> TCG Apps Hub
          </h1>
          <p className="text-slate-400 text-lg">Select a utility below to manage your collection, simulate pack openings, or launch connected clients.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/tools/booster">
            <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900 border border-white/5 hover:border-cyan-500/50 rounded-3xl p-8 shadow-xl cursor-pointer group h-full relative overflow-hidden transition-colors">
              <div className="absolute -top-10 -right-10 bg-cyan-500/10 w-40 h-40 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors"></div>
              <PackageOpen size={64} className="text-cyan-400 mb-6 group-hover:scale-110 transition-transform" />
              <h2 className="text-3xl font-black text-white mb-2">Booster Simulator</h2>
              <p className="text-slate-400">Open virtual booster packs using hyper-accurate slot system drop rates for MTG, Pokémon, and Naruto.</p>
            </motion.div>
          </Link>

          <Link href="/tools/api">
            <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900 border border-white/5 hover:border-emerald-500/50 rounded-3xl p-8 shadow-xl cursor-pointer group h-full relative overflow-hidden transition-colors">
              <div className="absolute -top-10 -right-10 bg-emerald-500/10 w-40 h-40 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors"></div>
              <Database size={64} className="text-emerald-400 mb-6 group-hover:scale-110 transition-transform" />
              <h2 className="text-3xl font-black text-white mb-2">API & Webhooks</h2>
              <p className="text-slate-400">Generate your developer API key and access our expansive JSON database programmatically.</p>
            </motion.div>
          </Link>

          {/* Phase MTG Client */}
          <div onClick={handlePhaseClick} className="md:col-span-2">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 hover:border-fuchsia-500/50 transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-500/10 rounded-full blur-3xl group-hover:bg-fuchsia-500/20 transition-all"></div>
              
              <div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <h2 className="text-3xl font-black text-white mb-2">Phase MTG Client</h2>
                  <span className="px-3 py-1 bg-fuchsia-500/20 text-fuchsia-400 text-[10px] font-black uppercase rounded-full border border-fuchsia-500/30">Native App</span>
                </div>
                <p className="text-slate-400 mb-6 relative z-10 max-w-lg">
                  A high-performance WebGL client for Magic: The Gathering. Rules enforced, animations injected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
