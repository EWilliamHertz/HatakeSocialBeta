'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Search, Box, Tag } from 'lucide-react';

export default function ShopPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/shop')
      .then(res => res.json())
      .then(data => {
        if (data.products) setProducts(data.products);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCheckout = async (productId: string) => {
    // This will redirect to Stripe Checkout later
    try {
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
        else alert('No checkout URL returned. Stripe might not be configured.');
      } else {
        alert('Failed to initiate checkout.');
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to Stripe.');
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-500 mb-2">
              Official Shop
            </h1>
            <p className="text-slate-400">Exclusive Hatake Merchandise & Admin Products</p>
          </div>

          <div className="relative w-full md:w-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full md:w-80 bg-slate-900 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-500">
            <Box className="animate-spin mr-3" /> Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-slate-500 py-20 bg-slate-900/50 rounded-3xl border border-white/5">
            <Tag size={48} className="mx-auto mb-4 opacity-30" />
            <h2 className="text-xl font-bold text-white mb-2">No Products Found</h2>
            <p>Check back later for new exclusive drops.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col group hover:shadow-[0_0_30px_rgba(217,70,239,0.15)] hover:border-fuchsia-500/30 transition-all">
                <div className="aspect-square bg-slate-950 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={product.imageUrl || 'https://i.imgur.com/B06rBhI.png'} 
                    alt={product.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                  {product.stock <= 5 && product.stock > 0 && (
                    <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg">
                      Only {product.stock} left!
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-300 shadow-lg border border-white/10">
                      Out of Stock
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                  <p className="text-slate-400 text-sm mb-6 flex-1">{product.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-2xl font-black text-white">
                      €{parseFloat(product.price).toFixed(2)}
                    </span>
                    <button 
                      onClick={() => handleCheckout(product.id)}
                      disabled={product.stock === 0}
                      className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:hover:bg-fuchsia-600 text-white w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(217,70,239,0.4)]"
                    >
                      <ShoppingCart size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
