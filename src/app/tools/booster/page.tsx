'use client';

import React, { useState, useEffect } from 'react';
import { Package, Search, Wand2, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SealedActionModal from '@/app/collection/components/SealedActionModal';

export default function ToolsPage() {
  const [selectedGame, setSelectedGame] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('sealedSimGame') || 'ALL';
    return 'ALL';
  });
  const [query, setQuery] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('sealedSimQuery') || '';
    return '';
  });
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('sealedSimGame', selectedGame);
    localStorage.setItem('sealedSimQuery', query);
  }, [selectedGame, query]);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/sealed/search?game=${selectedGame}&q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    };

    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [selectedGame, query]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 p-8 pb-40">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-4 flex items-center justify-center gap-4">
            <Wand2 size={48} className="text-cyan-400" /> Sealed Simulator
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Simulate booster boxes, bundles, and pack openings using our hyper-accurate Slot System algorithms based on real-world configurations.
          </p>
        </div>

        {/* Simulator Section */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden min-h-[600px]">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div>
              <h2 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
                <Package className="text-cyan-400" /> Catalog
              </h2>
              <p className="text-slate-400">Search and select a sealed product to crack.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-slate-400" size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-slate-950 text-white font-bold border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-cyan-500 w-full"
                />
              </div>

              <select 
                value={selectedGame}
                onChange={e => setSelectedGame(e.target.value)}
                className="bg-slate-950 text-white font-bold border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 cursor-pointer w-full md:w-auto"
              >
                <option value="ALL">All Games</option>
                <option value="NARUTO">Naruto Mythos</option>
                <option value="MTG">Magic: The Gathering</option>
                <option value="POKEMON">Pokémon TCG</option>
                <option value="ONE_PIECE">One Piece TCG</option>
                <option value="LORCANA">Disney Lorcana</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="relative z-10">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {products.map(product => (
                  <div 
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="bg-slate-950 border border-white/5 rounded-2xl overflow-hidden cursor-pointer group hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-slate-900 flex items-center justify-center p-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
                      <img 
                        src={product.imageUrl || 'https://i.imgur.com/B06rBhI.png'} 
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 relative z-0 drop-shadow-2xl"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-1 line-clamp-1">{product.type?.replace('_', ' ') || 'SEALED'}</p>
                      <h3 className="text-white font-bold text-sm line-clamp-2 mb-2 flex-1">{product.name}</h3>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-emerald-400 font-black text-sm">€{(product.price || 0).toFixed(2)}</span>
                        <div className="bg-slate-800 text-slate-300 p-1.5 rounded-lg group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                          <Box size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Package size={48} className="mb-4 opacity-50" />
                <p className="font-bold tracking-widest uppercase text-sm">No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {selectedProduct && (
          <SealedActionModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
