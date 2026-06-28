'use client';
import React, { useState, useMemo } from 'react';
import { Building, Package, ArrowRight, ShieldCheck, Zap, Server, ChevronRight, ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  packSpec: string;
  costPrice: number; // For internal margin calc, though not shown to user
  retailPrice: number;
  imageUrl: string;
}

export default function B2BPortalPage() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [wholesaleProducts, setWholesaleProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/admin/products')
      .then(res => res.json())
      .then(data => {
        setWholesaleProducts(data.products?.filter((p: any) => p.isActive) || []);
        setLoading(false);
      });
  }, []);

  const handleQuantityChange = (id: string, qty: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, qty) }));
  };

  const getDiscountPercentage = (qty: number) => {
    if (qty >= 50) return 35;
    if (qty >= 36) return 25;
    if (qty >= 26) return 20;
    if (qty >= 16) return 18;
    if (qty >= 9) return 15;
    return 0;
  };

  const calculateItemTotal = (product: any, qty: number) => {
    const discount = getDiscountPercentage(qty);
    const unitPrice = product.price * (1 - discount / 100);
    return {
      unitPrice,
      total: unitPrice * qty,
      discount
    };
  };

  const orderSummary = useMemo(() => {
    let subtotal = 0;
    let totalItems = 0;
    let savings = 0;

    Object.entries(quantities).forEach(([id, qty]) => {
      if (qty > 0) {
        const product = wholesaleProducts.find(p => p.id === id);
        if (product) {
          const calc = calculateItemTotal(product, qty);
          subtotal += calc.total;
          totalItems += qty;
          savings += (product.price * qty) - calc.total;
        }
      }
    });

    return { subtotal, totalItems, savings };
  }, [quantities, wholesaleProducts]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-32">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-white/5 py-16 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 text-sm font-bold tracking-wider uppercase mb-4">
            <Building size={16} /> B2B & Wholesale Portal
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-amber-500">
            Stock Your Store. Fuel Your App.
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            The ultimate ecosystem for Local Game Stores and Developers. Purchase official Hatake merchandise at dynamic wholesale rates and seamlessly integrate our API for real-time market data.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-24">
        
        {/* API Integration Callout */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 rounded-3xl p-8 md:p-12 shadow-[0_0_40px_rgba(6,182,212,0.1)] flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded text-sm font-bold">
              <Server size={16} /> API Integration
            </div>
            <h2 className="text-3xl font-black text-white">Power Your Storefront with Hatake API</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              B2B partners gain prioritized access to our Business and Enterprise API tiers. Sync your store's inventory, display real-time market pricing from Hatake, and verify card authenticity seamlessly.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-300"><ShieldCheck className="text-emerald-400" size={20} /> Dedicated Partner Support Channel</li>
              <li className="flex items-center gap-3 text-slate-300"><Zap className="text-emerald-400" size={20} /> Advanced Rate Limits (100+ req/sec)</li>
              <li className="flex items-center gap-3 text-slate-300"><Package className="text-emerald-400" size={20} /> Direct Inventory Sync</li>
            </ul>
            <a href="/apps/api" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold mt-4 transition-colors">
              View Developer Docs <ChevronRight size={16} />
            </a>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-fuchsia-500/20 blur-3xl rounded-full"></div>
            <div className="bg-black border border-white/10 rounded-2xl p-6 relative shadow-2xl font-mono text-sm text-cyan-400 overflow-hidden">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <p className="text-slate-500">GET /api/v1/wholesale/inventory</p>
              <p className="text-emerald-400 mt-2">{`{`}</p>
              <p className="pl-4">"status": "success",</p>
              <p className="pl-4">"partner_tier": "B2B_DISTRIBUTOR",</p>
              <p className="pl-4">"discount_active": true,</p>
              <p className="pl-4">"data": [...]</p>
              <p className="text-emerald-400">{`}`}</p>
            </div>
          </div>
        </div>

        {/* Wholesale Order System */}
        <div>
          <div className="mb-12">
            <h2 className="text-4xl font-black text-white mb-4">Wholesale Direct Order</h2>
            <p className="text-slate-400 text-lg">Dynamic volume pricing automatically applies as you increase quantities.</p>
          </div>

          {/* Pricing Algorithm Explanation */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-12">
            {[
              { q: '1-8', d: '0%' },
              { q: '9-15', d: '15%' },
              { q: '16-25', d: '18%' },
              { q: '26-35', d: '20%' },
              { q: '36-49', d: '25%' },
              { q: '50+', d: '35%' },
            ].map((tier, i) => (
              <div key={i} className="bg-slate-900 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center shadow-lg">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Qty {tier.q}</span>
                <span className="text-2xl font-black text-emerald-400">-{tier.d}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {loading ? (
                <div className="flex justify-center p-12 text-emerald-500">Loading catalog...</div>
              ) : wholesaleProducts.length === 0 ? (
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-12 text-center text-slate-500 shadow-xl">
                  Catalog is currently being updated.
                </div>
              ) : (
                wholesaleProducts.map(product => {
                  const qty = quantities[product.id] || 0;
                  const calc = calculateItemTotal(product, qty);
                  return (
                    <div key={product.id} className="bg-slate-900 border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-6 items-center shadow-xl transition-colors hover:border-white/10">
                      <div className="w-24 h-24 bg-slate-950 rounded-xl overflow-hidden shrink-0 border border-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.imageUrl || 'https://images.unsplash.com/photo-1610992015762-52a35654acab?w=500&q=80'} alt={product.name} className="w-full h-full object-cover opacity-80" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="font-bold text-white text-lg leading-tight mb-1">{product.name}</h3>
                        <p className="text-slate-400 text-sm mb-2">{product.description || 'Wholesale Unit'}</p>
                        <div className="flex items-center justify-center md:justify-start gap-3">
                          <span className="text-slate-500 line-through text-sm">€{product.price.toFixed(2)}</span>
                          <span className="text-emerald-400 font-bold">€{calc.unitPrice.toFixed(2)} / unit</span>
                          {calc.discount > 0 && (
                            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black px-2 py-0.5 rounded uppercase">
                              {calc.discount}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-lg overflow-hidden w-full md:w-32">
                          <button onClick={() => handleQuantityChange(product.id, qty - 1)} className="px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-bold">-</button>
                          <input 
                            type="number" 
                            min="0"
                            value={qty} 
                            onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent text-center text-white font-bold py-2 outline-none appearance-none"
                          />
                          <button onClick={() => handleQuantityChange(product.id, qty + 1)} className="px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-bold">+</button>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-slate-500">Item Total: </span>
                          <span className="font-bold text-white">€{calc.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 border border-fuchsia-500/30 rounded-3xl p-8 sticky top-24 shadow-2xl">
                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                  <ShoppingCart className="text-fuchsia-400" /> Order Summary
                </h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Units:</span>
                    <span className="font-bold text-white">{orderSummary.totalItems}</span>
                  </div>
                  {orderSummary.savings > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Volume Savings:</span>
                      <span className="font-bold">-€{orderSummary.savings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="w-full h-px bg-white/10 my-4"></div>
                  <div className="flex justify-between items-end">
                    <span className="text-slate-400">Estimated Total:</span>
                    <span className="text-4xl font-black text-white">€{orderSummary.subtotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-500 text-right">Shipping & Taxes calculated at checkout</p>
                </div>

                <button 
                  disabled={orderSummary.totalItems === 0}
                  className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-amber-600 hover:from-fuchsia-500 hover:to-amber-500 disabled:opacity-50 disabled:grayscale text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight size={20} />
                </button>
                
                <div className="mt-6 flex items-start gap-3 bg-slate-950 p-4 rounded-xl border border-white/5">
                  <ShieldCheck className="text-slate-400 shrink-0" size={20} />
                  <p className="text-xs text-slate-400">Wholesale orders require manual verification of your business Tax ID prior to final processing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
