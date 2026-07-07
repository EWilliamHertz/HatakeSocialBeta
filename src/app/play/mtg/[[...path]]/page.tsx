'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PhaseEngineFrame() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => {
    // Map /play/mtg/xxx to /xxx for the iframe
    const internalPath = pathname.replace('/play/mtg', '') || '/';
    const qs = searchParams.toString();
    const fullPath = `${internalPath}${qs ? `?${qs}` : ''}`;
    
    // In production, Next.js serves Phase's static dist from /phase
    // In dev, assuming Phase Vite runs on 5173
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5173' 
      : '/phase';
      
    setIframeSrc(`${baseUrl}${fullPath}`);
  }, [pathname, searchParams]);

  if (!iframeSrc) return <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white">Loading Engine...</div>;

  return (
    <div className="h-screen w-full bg-slate-950">
      {/* 
        Phase Engine Wrapper
        "Phase on the top, Magic the gathering on the bottom based on an engine created by Matt."
      */}
      <iframe 
        src={iframeSrc} 
        className="w-full h-full border-0"
        allow="fullscreen; clipboard-read; clipboard-write; display-capture"
      />
    </div>
  );
}
