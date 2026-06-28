'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User, Image as ImageIcon, Sparkles, MessageCircle, Newspaper,
  Store, Layers, Users, Wand2, Swords,
} from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';

export default function HaloNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : { user: null })
      .then((d) => {
        if (d.user) { setIsLoggedIn(true); setUsername(d.user.username); }
      })
      .catch(() => {});
  }, [pathname]);

  const NavLink = ({ href, icon: Icon, label, external = false }: any) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    const cls = `relative flex flex-col items-center gap-1 transition-all duration-300 ${
      active ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.9)] scale-110' : 'text-slate-400 hover:text-white hover:scale-105'
    }`;
    const inner = (
      <>
        {active && (
          <motion.span
            layoutId="halo-active-pill"
            className="absolute -inset-x-2 -top-1 -bottom-1 rounded-full bg-cyan-500/10 border border-cyan-400/40"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <Icon size={20} className="relative z-10" />
        <span className="text-[10px] font-bold uppercase tracking-widest relative z-10">{label}</span>
      </>
    );
    if (external) {
      return <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>;
    }
    return <Link href={href} className={cls}>{inner}</Link>;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center">
      <div className="relative w-full max-w-5xl mb-4 pointer-events-auto flex items-end justify-center px-4">
        {/* Ambient glow */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[70%] h-[60px] bg-cyan-500/25 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[35%] h-[80px] bg-fuchsia-500/20 rounded-full blur-3xl -z-10" />

        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="relative w-full md:w-[1040px] h-[92px] flex justify-between items-end pb-3 px-5 md:px-14 overflow-visible"
          style={{
            borderRadius: '50% 50% 22px 22px / 70% 70% 22px 22px',
            background: 'linear-gradient(180deg, rgba(2,6,23,0.96) 0%, rgba(2,6,23,0.78) 100%)',
            backdropFilter: 'blur(28px) saturate(160%)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderBottom: '1px solid rgba(217, 70, 239, 0.18)',
            boxShadow: 'inset 0 2px 30px rgba(6,182,212,0.18), inset 0 -10px 30px rgba(217,70,239,0.07), 0 14px 50px rgba(0,0,0,0.65)',
          }}
        >
          {/* Top curved highlight */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-[2px] pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.55) 30%, rgba(255,255,255,0.85) 50%, rgba(217,70,239,0.55) 70%, transparent 100%)',
              filter: 'blur(0.5px)',
            }}
          />

          {/* Left links */}
          <div className="flex gap-6 md:gap-10 items-center pb-1">
            <NavLink href="/feed" icon={Newspaper} label={t('nav.feed')} />
            <NavLink href="/guilds" icon={Users} label={t('nav.guilds')} />
            <NavLink href="/collection" icon={ImageIcon} label={t('nav.cards')} />
            <NavLink href="/deals" icon={Store} label="Deals" />
          </div>

          {/* Center profile bubble */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-10">
            {isLoggedIn ? (
              <Link href="/profile" className="relative group block">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-white to-fuchsia-500 opacity-50 rounded-full blur-2xl group-hover:opacity-90 transition-opacity duration-500" />
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                  className="relative flex flex-col items-center justify-center w-[96px] h-[96px] rounded-full border-[3px] border-slate-950 text-white"
                  style={{
                    background: 'conic-gradient(from 220deg at 50% 50%, #06b6d4 0deg, #ffffff 80deg, #d946ef 160deg, #06b6d4 280deg, #d946ef 340deg, #06b6d4 360deg)',
                    boxShadow: '0 0 30px rgba(6,182,212,0.55), 0 0 60px rgba(217,70,239,0.35), inset 0 0 18px rgba(0,0,0,0.4)',
                  }}
                >
                  <div className="absolute inset-[3px] rounded-full bg-slate-950 flex flex-col items-center justify-center">
                    <User size={26} className="mb-0.5 text-white" />
                    <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white max-w-[80px] truncate px-1">
                      {username || t('nav.profile')}
                    </span>
                  </div>
                </motion.div>
              </Link>
            ) : (
              <Link href="/login" className="relative group block">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-fuchsia-500 opacity-50 rounded-full blur-2xl group-hover:opacity-90 transition" />
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="relative flex flex-col items-center justify-center w-[96px] h-[96px] rounded-full border-[3px] border-slate-950 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #d946ef)',
                    boxShadow: '0 0 30px rgba(6,182,212,0.55), 0 0 60px rgba(217,70,239,0.35)',
                  }}
                >
                  <Sparkles size={28} className="mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em]">Sign In</span>
                </motion.div>
              </Link>
            )}
          </div>

          {/* Right links */}
          <div className="flex gap-6 md:gap-10 items-center pb-1">
            <NavLink href="/deck" icon={Layers} label="Deck" />
            <NavLink href="/market" icon={Store} label={t('nav.market')} />
            {/* NEW: Euryx Arena cross-app link */}
            <NavLink
              href={process.env.NEXT_PUBLIC_EURYX_URL || 'https://tcg-nexus-play.preview.emergentagent.com/dashboard'}
              icon={Swords}
              label="Arena"
              external
            />
            <NavLink href="/apps" icon={Wand2} label="Apps" />
            <NavLink href="/messages" icon={MessageCircle} label={t('nav.messages')} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
