'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, TrendingUp, Filter, X, Check, Box, Loader2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18nContext';
import ListForSaleModal from '@/components/ListForSaleModal';
import BulkEditModal from '@/components/BulkEditModal';
import PackOpener from '@/components/PackOpener';

type Tab = 'ALL_CARDS' | 'YOUR_COLLECTION' | 'SEALED';
import AllCardsTab from './components/AllCardsTab';
import YourCollectionTab from './components/YourCollectionTab';
import EditCollectionCardModal from './components/EditCollectionCardModal';
import EditSealedProductModal from './components/EditSealedProductModal';
import SealedActionModal from './components/SealedActionModal';
import SealedTab from './components/SealedTab';
import CardModal from './components/CardModal';
type Game = 'MAGIC' | 'POKEMON' | 'ONE_PIECE' | 'NARUTO' | 'LORCANA' | 'RIFTBOUND';

type CardData = {
  id: string;
  name: string;
  game: string;
  imageUrl: string;
  price: number;
  foilPrice?: number;
  reverseHoloPrice?: number;
  apiId?: string;
  setCode?: string;
  collectorNumber?: string;
  prices?: any;
};

export default function CollectionPage() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab === 'ALL_CARDS' || tab === 'SEALED') {
        return tab as Tab;
      }
    }
    return 'YOUR_COLLECTION';
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myInstances, setMyInstances] = useState<any[]>([]);
  const [mySealedInstances, setMySealedInstances] = useState<any[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    async function fetchMyCollection() {
      try {
        const res = await fetch('/api/collection/my');
        if (res.ok) {
          const data = await res.json();
          setMyInstances(data.instances || []);
          setMySealedInstances(data.sealedInstances || []);
        }
      } catch {
        // ignore
      }
    }
    fetchMyCollection();
  }, []);

  const cardValue = myInstances.reduce((sum, inst) => sum + (inst.cardReference.price || 0), 0);
  const sealedValue = mySealedInstances.reduce((sum, inst) => sum + (inst.sealedReference?.price || 0), 0);
  const totalValue = cardValue + sealedValue;
  
  const cardsOwnedCount = myInstances.length;
  const activeListingsCount = myInstances.filter(inst => 
    inst.marketListing && (inst.marketListing.status === 'ACTIVE' || inst.marketListing.status === 'IN_DEAL')
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-32">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Header & Stats */}
        <div className="mb-12 border-b border-white/10 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-2">
                {t('collection.title')}
              </h1>
              <p className="text-slate-400 text-lg">{t('collection.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/sales" className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2">
                <TrendingUp size={18} /> Handle Sales
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition-colors">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{t('profile.value')} (Combined)</p>
                <p className="text-3xl font-black text-emerald-400">€{totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <div className="flex flex-col mt-2 gap-1 text-xs font-bold">
                  <p className="text-emerald-500/70">Cards: €{cardValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  <p className="text-fuchsia-500/70">Sealed: €{sealedValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-colors" onClick={() => setActiveTab('YOUR_COLLECTION')}>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{t('profile.inventory')}</p>
                <p className="text-3xl font-black text-white">{cardsOwnedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Box size={24} />
              </div>
            </div>
            <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer hover:border-fuchsia-500/30 transition-colors">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{t('profile.listings')}</p>
                <p className="text-3xl font-black text-cyan-400">{activeListingsCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
                <Check size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('YOUR_COLLECTION')}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${activeTab === 'YOUR_COLLECTION' ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
          >
            {t('collection.tab.yours')}
          </button>
          <button 
            onClick={() => setActiveTab('ALL_CARDS')}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${activeTab === 'ALL_CARDS' ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
          >
            {t('collection.tab.all')}
          </button>
          <button 
            onClick={() => setActiveTab('SEALED')}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'SEALED' ? 'bg-fuchsia-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
          >
            <Box size={16} /> {t('collection.tab.sealed')}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'ALL_CARDS' && <AllCardsTab />}
            {activeTab === 'YOUR_COLLECTION' && <YourCollectionTab instances={myInstances} sealedInstances={mySealedInstances} />}
            {activeTab === 'SEALED' && <SealedTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── All Cards Tab ──────────────────────────────────────────────────────────
// ─── Your Collection Tab ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// ─── Edit Collection Card Modal ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// ─── Edit Sealed Product Modal ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// ─── Sealed Action Modal (High-Res & Pack Cracking) ─────────────────────────
// ─── Sealed Tab (The Overhaul) ──────────────────────────────────────────────
// ─── Edit Card Modal ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any