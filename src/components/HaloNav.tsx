'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Image as ImageIcon, Sparkles, MessageCircle, Newspaper, Store, Layers, Users, Wand2, Handshake } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';

type NavIcon = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  match?: (p: string) => boolean;
};

export default function HaloNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) setIsLoggedIn(true);
        }
      } catch {
        // ignore
      }
    }
    checkAuth();
  }, [pathname]);

  // 8 icons arranged along a half-halo arc (4 left + 4 right of center button)
  const leftIcons: NavIcon[] = [
    { href: '/feed', label: t('nav.feed'), Icon: Newspaper },
    { href: '/guilds', label: t('nav.guilds') || 'Guilds', Icon: Users },
    { href: '/collection', label: t('nav.cards'), Icon: ImageIcon },
    { href: '/deals', label: 'Deals', Icon: Handshake, match: (p) => p === '/deals' || p.startsWith('/deals/') },
  ];
  const rightIcons: NavIcon[] = [
    { href: '/deck', label: 'Deck', Icon: Layers },
    { href: '/market', label: t('nav.market'), Icon: Store },
    { href: '/apps', label: 'Apps', Icon: Wand2, match: (p) => p === '/apps' || p.startsWith('/apps/') },
    { href: '/messages', label: t('nav.messages'), Icon: MessageCircle },
  ];

  // Arc geometry: half-ellipse, center at (50%, bottom of svg). Place icons along it.
  // Angles measured from center going up: -90° (left) ... 0° (top) ... +90° (right)
  // Skip the very top (reserved for center login/profile button)
  const total = leftIcons.length + rightIcons.length; // 8
  // Distribute across [-78°, -10°] and [+10°, +78°]
  const positions: { x: number; y: number; angle: number }[] = [];
  const leftAngles = [-78, -55, -34, -14];
  const rightAngles = [14, 34, 55, 78];
  const rx = 46; // % of container width
  const ry = 110; // px vertical radius
  const cx = 50; // %
  const cy = 130; // px (bottom anchor)

  const computePos = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    // Point on ellipse, angle from vertical top
    const x = cx + rx * Math.sin(rad);
    const y = cy - ry * Math.cos(rad);
    return { x, y, angle: deg };
  };

  for (const a of leftAngles) positions.push(computePos(a));
  for (const a of rightAngles) positions.push(computePos(a));

  const allIcons = [...leftIcons, ...rightIcons];

  const isActive = (item: NavIcon) =>
    item.match ? item.match(pathname) : pathname === item.href;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center select-none" data-testid="halo-nav">
      <div className="relative w-full max-w-5xl h-44 mb-2 pointer-events-auto">
        {/* Outer glow halo */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 flex items-end justify-center">
          <div className="w-[88%] h-[140px] rounded-t-[100%] bg-cyan-500/10 blur-3xl"></div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 flex items-end justify-center">
          <div className="w-[60%] h-[120px] rounded-t-[100%] bg-fuchsia-500/15 blur-3xl"></div>
        </div>

        {/* The half-halo arc (SVG) */}
        <svg
          className="absolute inset-x-0 bottom-0 w-full h-44 overflow-visible"
          viewBox="0 0 1000 180"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="haloStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="20%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="80%" stopColor="#d946ef" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
            </linearGradient>
            <filter id="haloGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Wide soft glow underlay */}
          <path
            d="M 40 180 A 460 150 0 0 1 960 180"
            fill="none"
            stroke="#06b6d4"
            strokeOpacity="0.25"
            strokeWidth="14"
            filter="url(#haloGlow)"
          />
          {/* Main halo stroke */}
          <path
            d="M 40 180 A 460 150 0 0 1 960 180"
            fill="none"
            stroke="url(#haloStroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#haloGlow)"
          />
          {/* Inner thin highlight */}
          <path
            d="M 60 180 A 440 138 0 0 1 940 180"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.35"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
        </svg>

        {/* Icons positioned along the arc */}
        {allIcons.map((item, i) => {
          const pos = positions[i];
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`halo-nav-${item.href.replace(/\//g, '') || 'home'}`}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`group flex flex-col items-center gap-1 transition-all duration-300 ${
                active ? 'text-cyan-300 scale-110 drop-shadow-[0_0_10px_rgba(6,182,212,0.9)]' : 'text-slate-400 hover:text-white hover:scale-110'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-400/70 shadow-[0_0_18px_rgba(6,182,212,0.7)]'
                    : 'bg-slate-950/80 border-white/10 group-hover:border-cyan-400/40 group-hover:shadow-[0_0_14px_rgba(6,182,212,0.4)]'
                }`}
              >
                <item.Icon size={18} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Center Login / Profile button at apex of halo */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: '-8px' }}
        >
          {isLoggedIn ? (
            <Link
              href="/profile"
              data-testid="halo-nav-profile"
              className="relative group block"
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/40 to-fuchsia-500/40 rounded-full blur-2xl group-hover:from-cyan-400/60 group-hover:to-fuchsia-400/60 transition-all"></div>
              <div className="relative flex flex-col items-center justify-center w-[86px] h-[86px] bg-gradient-to-tr from-fuchsia-600 to-cyan-600 rounded-full border-[3px] border-slate-950 shadow-[0_0_35px_rgba(6,182,212,0.55)] group-hover:shadow-[0_0_45px_rgba(217,70,239,0.7)] group-hover:scale-105 transition-all text-white">
                <User size={26} className="mb-0.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {t('nav.profile')}
                </span>
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              data-testid="halo-nav-login"
              className="relative group block"
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/40 to-fuchsia-500/40 rounded-full blur-2xl group-hover:from-cyan-400/60 group-hover:to-fuchsia-400/60 transition-all"></div>
              <div className="relative flex flex-col items-center justify-center w-[86px] h-[86px] bg-gradient-to-tr from-cyan-600 to-fuchsia-600 rounded-full border-[3px] border-slate-950 shadow-[0_0_35px_rgba(6,182,212,0.55)] group-hover:shadow-[0_0_45px_rgba(217,70,239,0.7)] group-hover:scale-105 transition-all text-white">
                <Sparkles size={26} className="mb-0.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Login
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
