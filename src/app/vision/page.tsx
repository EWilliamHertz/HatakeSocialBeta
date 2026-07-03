import React from 'react';
import { ShieldCheck, Globe, Handshake, Shield } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vår vision – Hatake Social',
  description: 'Our vision is to break down the borders that divide us. A secure, transparent, and international safe haven to trade and share passion for TCGs.',
};

export default function VisionPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-32 pt-32 px-4 md:px-8">
      
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-24">
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-8 leading-tight">
          Unifying the Continent
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 leading-relaxed max-w-3xl mx-auto">
          Our vision is to break down the borders that divide us. We believe every collector—no matter where they live—deserves a secure, transparent, and international safe haven to trade and share their passion.
        </p>
      </div>

      {/* Core Values */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6">
            <Globe size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">A Borderless Community</h3>
          <p className="text-slate-400">
            From North America to Europe, Asia, and beyond. We are building the infrastructure necessary to connect local trading card communities into a single, cohesive global network.
          </p>
        </div>

        <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 mb-6">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">The Ultimate Safe Haven</h3>
          <p className="text-slate-400">
            Trust is the foundation of our network. With our secure escrow services and strict community moderation, we ensure that you can buy, sell, and trade with absolute confidence.
          </p>
        </div>

        <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
            <Handshake size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Empowering Collectors</h3>
          <p className="text-slate-400">
            We are more than just a marketplace; we are a hub for guilds, teams, and tournament players to communicate in real-time, regardless of their native language.
          </p>
        </div>
      </div>

      {/* Manifesto */}
      <div className="max-w-4xl mx-auto bg-slate-900 border border-cyan-500/30 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
        <div className="flex items-center gap-4 mb-8 text-cyan-400">
          <Shield size={32} />
          <h2 className="text-3xl font-black text-white">Our Manifesto</h2>
        </div>
        <div className="space-y-6 text-slate-300 text-lg leading-relaxed">
          <p>
            For too long, the trading card game community has been fragmented by geography, language barriers, and fragmented marketplaces. We are changing that.
          </p>
          <p>
            By integrating real-time translation, a robust escrow system, and high-fidelity global matchmaking, we are providing the definitive platform for all players—from casual Pokemon collectors to competitive Magic: The Gathering veterans.
          </p>
          <p className="font-bold text-fuchsia-400">
            We don&apos;t just want to facilitate trades; we want to foster lifelong connections. Welcome to the future of collecting.
          </p>
        </div>
      </div>
      
    </div>
  );
}
