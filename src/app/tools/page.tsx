'use client';
import React from 'react';
import Link from 'next/link';
import { PackageOpen, Database, Wand2, MonitorSmartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AppsHub() {
  const handleOuyrieClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info("This is currently in development", {
      position: "bottom-center",
      theme: "dark"
    });
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

          {/* Ouyrie MTG Client (Disabled) */}
          <div onClick={handleOuyrieClick} className="md:col-span-2">
            <motion.div whileHover={{ scale: 1.02 }} className="bg-slate-900/50 border border-white/5 hover:border-white/10 rounded-3xl p-8 shadow-xl cursor-pointer group relative overflow-hidden transition-colors">
              <div className="absolute top-0 right-0 p-8 opacity-5"><MonitorSmartphone size={100} /></div>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10 text-center md:text-left">
                <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 shrink-0">
                  <MonitorSmartphone size={48} className="text-slate-500 group-hover:text-fuchsia-400 transition-colors" />
                </div>
                <div className="flex flex-col justify-center h-full pt-2">
                  <h2 className="text-3xl font-black text-white mb-2">Ouyrie MTG Client</h2>
                  <p className="text-slate-500 text-lg">Launch the integrated MTG web client. Play Magic: The Gathering directly from your browser using your digital collection.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
