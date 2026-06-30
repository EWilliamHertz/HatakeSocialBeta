'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Layers, Code2, Gamepad2, Crown } from 'lucide-react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18nContext';

export default function Home() {
  const { t } = useI18n();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.4 } },
  };

  const games = [
    { name: 'Magic: The Gathering', code: 'MTG', color: 'from-fuchsia-600 to-indigo-900', icon: 'M' },
    { name: 'Pokémon TCG', code: 'PKMN', color: 'from-yellow-400 to-red-500', icon: 'P' },
    { name: 'One Piece TCG', code: 'OP', color: 'from-orange-500 to-red-700', icon: 'O' },
    { name: 'Naruto Mythos', code: 'NRT', color: 'from-amber-400 to-orange-600', icon: 'N' },
    { name: 'Riftbound', code: 'RIFT', color: 'from-emerald-400 to-cyan-600', icon: 'R' },
    { name: 'Lorcana', code: 'LORC', color: 'from-pink-400 to-purple-600', icon: 'L' },
  ];

  return (
    <main className="min-h-screen bg-slate-950 font-sans selection:bg-cyan-500/30 overflow-hidden text-slate-200">
      {/* Ambient Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-fuchsia-600/10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.04]"></div>
      </div>

      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Navigation & Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center mb-20 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-white/10 text-white text-xs font-bold rounded-full tracking-wider uppercase flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]" data-testid="landing-badge">
              <Sparkles size={12} className="text-cyan-400" /> {t('landing.badge')}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 items-center" data-testid="landing-header-actions">
            <LanguageSwitcher />
          </div>
        </motion.div>

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-32">
          <motion.div variants={itemVariants} className="mb-10 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-[2.5rem] blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
            <Image
              src="https://i.imgur.com/B06rBhI.png"
              alt="Hatake Social Logo"
              width={180}
              height={180}
              className="relative rounded-[2.5rem] border border-white/10 shadow-2xl transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500 bg-slate-900 object-contain p-3"
              priority
            />
          </motion.div>

          <motion.h1 variants={itemVariants} data-testid="landing-hero-title" className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-2xl leading-tight">
            {t('landing.hero.title1')} <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">{t('landing.hero.title2')}</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-2xl font-light max-w-4xl leading-relaxed text-slate-300 mb-10">
            {t('landing.hero.subtitle')}
            <strong className="text-white font-bold block mt-2">{t('landing.hero.subtitleBold')}</strong>
          </motion.p>
        </div>

        {/* Core Features Grid */}
        <motion.div variants={itemVariants} className="mb-12">
          <h2 className="text-3xl font-black text-white mb-2">{t('landing.features.title')}</h2>
          <p className="text-slate-400 mb-8">{t('landing.features.subtitle')}</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-32"
          variants={containerVariants}
        >
          {/* Feature 1 */}
          <motion.div variants={itemVariants} className="group relative bg-slate-900/50 border border-white/5 rounded-3xl p-8 hover:bg-slate-800/50 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all"></div>
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Layers size={28} />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">{t('landing.feature1.title')}</h3>
            <p className="text-slate-400 leading-relaxed">
              {t('landing.feature1.desc')}
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div variants={itemVariants} className="group relative bg-slate-900/50 border border-white/5 rounded-3xl p-8 hover:bg-slate-800/50 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Code2 size={28} />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">{t('landing.feature2.title')}</h3>
            <p className="text-slate-400 leading-relaxed">
              {t('landing.feature2.desc')}
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div variants={itemVariants} className="group relative bg-slate-900/50 border border-white/5 rounded-3xl p-8 hover:bg-slate-800/50 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl group-hover:bg-fuchsia-500/20 transition-all"></div>
            <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center mb-6 border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
              <Gamepad2 size={28} />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">{t('landing.feature3.title')}</h3>
            <p className="text-slate-400 leading-relaxed">
              {t('landing.feature3.desc')}
            </p>
          </motion.div>

          {/* Feature 4 */}
          <motion.div variants={itemVariants} className="group relative bg-slate-900/50 border border-white/5 rounded-3xl p-8 hover:bg-slate-800/50 transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-6 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Crown size={28} />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">{t('landing.feature4.title')}</h3>
            <p className="text-slate-400 leading-relaxed">
              {t('landing.feature4.desc')}
            </p>
          </motion.div>
        </motion.div>

        {/* Supported Games Grid */}
        <motion.div variants={itemVariants} className="mb-10 text-center">
          <h2 className="text-4xl font-black text-white mb-4">{t('landing.games.title')}</h2>
          <p className="text-slate-400 mb-12">{t('landing.games.subtitle')}</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
        >
          {games.map((game) => (
            <motion.div
              key={game.code}
              variants={itemVariants}
              className="relative group bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md overflow-hidden hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] cursor-pointer"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${game.color} opacity-50 group-hover:opacity-100 transition-opacity`}></div>

              <div className="flex justify-between items-start mb-10">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-3xl font-black text-white shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
                  {game.icon}
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white border border-white/20">{t('landing.games.clientWip')}</span>
              </div>

              <h3 className="text-xl font-black text-white mb-2">{game.name}</h3>
              <p className="text-xs text-slate-400 font-bold tracking-widest">{game.code} {t('landing.games.database')}</p>

              <div className="absolute -bottom-4 -right-4 opacity-5 text-white transform -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <Gamepad2 size={120} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.footer variants={itemVariants} className="mt-40 text-center border-t border-white/10 pt-12 text-slate-500 text-sm">
          <p className="font-bold text-slate-400 mb-2">Hatake Social &copy; {new Date().getFullYear()}</p>
          <p>{t('landing.footer.tagline')}</p>
        </motion.footer>
      </motion.div>
    </main>
  );
}
