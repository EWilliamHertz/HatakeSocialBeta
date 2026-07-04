'use client';

import React from 'react';
import HaloNav from '@/components/HaloNav';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { HatakeDeckBuilder } from '@/components/HatakeDeckBuilder';

export default function LoryxDeckBuilder() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col pt-24 px-4">
      <HaloNav />
      
      <div className="max-w-[1400px] w-full mx-auto">
        <Link href="/play/loryx" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 transition">
          <ArrowLeft size={16} /> Back to Loryx Lobby
        </Link>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <HatakeDeckBuilder 
            initialDeck={{ game: 'LORCANA', format: 'Standard', name: 'New Loryx Deck' }} 
          />
        </div>
      </div>
    </div>
  );
}
