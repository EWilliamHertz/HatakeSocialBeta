'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Package, CheckCircle, CreditCard, XCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DealPage({ params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingProvider, setShippingProvider] = useState('DHL');
  const router = useRouter();

  useEffect(() => {
    // Get current user id
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUserId(data.user.id);
        else router.push('/login');
      });

    // Fetch deal
    fetch(`/api/deals/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.deal) setDeal(data.deal);
        else router.push('/market');
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateStatus = async (status: string, extraPayload: any = {}) => {
    try {
      const res = await fetch(`/api/deals/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extraPayload })
      });
      if (res.ok) {
        const data = await res.json();
        setDeal(data.deal);
        // Refresh page to get nested relations if needed, or simply mutate
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
      alert('Network error updating deal.');
    }
  };

  if (loading || !deal || !userId) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-fuchsia-500" size={48} /></div>;
  }

  const isBuyer = deal.buyerId === userId;
  const isSeller = deal.sellerId === userId;

  const card = deal.listing.cardInstance.cardReference;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-32 pt-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        
        <Link href="/market" className="flex items-center gap-2 text-cyan-400 font-bold mb-6 hover:text-cyan-300 w-max">
          <ArrowLeft size={20} /> Back to Market
        </Link>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Card Summary */}
          <div className="w-full md:w-1/3 bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl text-center flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={deal.listing.cardInstance.customImageUrl || (card.imageUrl ? `/api/proxy?url=${encodeURIComponent(card.imageUrl)}` : 'https://i.imgur.com/B06rBhI.png')} 
              alt={card.name} 
              className="w-full rounded-xl shadow-lg border border-white/10 mb-4" 
            />
            <h2 className="text-xl font-black text-white mb-1">
              {card.name}
              {(() => {
                const setCode = card.setCode;
                const payload: any = card.apiPayload || {};
                const collectorNumber = payload.collector_number || payload.collectorNumber || 
                  (payload.extendedData && Array.isArray(payload.extendedData) ? payload.extendedData.find((d: any) => d.name === 'Number' || d.name === 'Collector Number')?.value : null);
                if (setCode || collectorNumber) {
                  return <span className="ml-2 text-[12px] text-slate-400 font-black uppercase">[{setCode}{setCode && collectorNumber ? ' · ' : ''}{collectorNumber ? `#${collectorNumber}` : ''}]</span>;
                }
                return null;
              })()}
            </h2>
            <p className="text-slate-400 text-sm mb-4">{deal.listing.cardInstance.condition.replace('_', ' ')}</p>
            <p className="text-3xl font-black text-fuchsia-400 mb-2">€{deal.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            
            <div className="mt-4 pt-4 border-t border-white/10 w-full text-left space-y-1">
              <p className="text-xs text-slate-500">Deal ID: <span className="text-slate-300 font-mono">{deal.id}</span></p>
              <p className="text-xs text-slate-500">Buyer: <span className="text-cyan-400 font-bold">{deal.buyer.username}</span> {isBuyer && '(You)'}</p>
              <p className="text-xs text-slate-500">Seller: <span className="text-fuchsia-400 font-bold">{deal.seller.username}</span> {isSeller && '(You)'}</p>
            </div>
          </div>

          {/* Deal Actions & Revealed Info */}
          <div className="w-full md:w-2/3 space-y-6">
            
            {/* Status Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                {deal.status === 'COMPLETED' ? <CheckCircle size={100} /> : <Package size={100} />}
              </div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Current Status</h2>
              <p className="text-4xl font-black text-white mb-6 flex items-center gap-4">
                {deal.status === 'PENDING_PAYMENT' && <span className="text-yellow-400 flex items-center gap-2"><CreditCard /> Awaiting Payment</span>}
                {deal.status === 'PAID' && <span className="text-cyan-400 flex items-center gap-2"><Package /> Preparing Shipment</span>}
                {deal.status === 'SHIPPED' && <span className="text-fuchsia-400 flex items-center gap-2"><Package /> Shipped</span>}
                {deal.status === 'COMPLETED' && <span className="text-emerald-400 flex items-center gap-2"><CheckCircle /> Completed</span>}
                {deal.status === 'CANCELLED' && <span className="text-red-400 flex items-center gap-2"><XCircle /> Cancelled</span>}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 relative z-10">
                {isBuyer && deal.status === 'PENDING_PAYMENT' && (
                  <button onClick={() => updateStatus('PAID')} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg">
                    Mark as Paid
                  </button>
                )}
                {isSeller && deal.status === 'PAID' && (
                  <div className="bg-slate-900 border border-white/10 rounded-xl p-4 w-full">
                    <p className="text-sm font-bold text-white mb-3">Provide Shipping Details</p>
                    <div className="flex gap-4 mb-3">
                      <select value={shippingProvider} onChange={e => setShippingProvider(e.target.value)} className="bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option>DHL</option>
                        <option>FedEx</option>
                        <option>UPS</option>
                        <option>USPS</option>
                        <option>Royal Mail</option>
                      </select>
                      <input type="text" placeholder="Tracking Number" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-fuchsia-500" />
                    </div>
                    <button onClick={() => updateStatus('SHIPPED', { trackingNumber, shippingProvider })} disabled={!trackingNumber} className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg">
                      Confirm & Mark as Shipped
                    </button>
                  </div>
                )}
                {isBuyer && deal.status === 'SHIPPED' && (
                  <button onClick={() => updateStatus('COMPLETED')} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg">
                    Confirm Delivery (Complete Deal)
                  </button>
                )}
                {(deal.status === 'PENDING_PAYMENT' || deal.status === 'PAID') && (
                  <button onClick={() => updateStatus('CANCELLED')} className="px-6 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold rounded-xl transition-all">
                    Cancel Deal
                  </button>
                )}
              </div>
            </div>

            {/* Revealed Information Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Buyer Shipping Info - Visible to both after creation */}
              <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-cyan-400 mb-4 border-b border-white/10 pb-2">Shipping Details</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <p className="font-bold text-white">{deal.buyer.shippingName || deal.buyer.username}</p>
                  <p>{deal.buyer.addressLine1 || 'No address provided'}</p>
                  {deal.buyer.addressLine2 && <p>{deal.buyer.addressLine2}</p>}
                  <p>{deal.buyer.city}, {deal.buyer.state} {deal.buyer.postalCode}</p>
                  <p>{deal.buyer.country}</p>
                </div>
              </div>

              {/* Seller Payment Info - Visible to Buyer */}
              <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-fuchsia-400 mb-4 border-b border-white/10 pb-2">Payment Details</h3>
                {isBuyer ? (
                  <div className="space-y-4 text-sm text-slate-300">
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">PayPal Email</p>
                      <p className="font-mono bg-slate-950 border border-white/10 rounded-lg p-2 break-all">{deal.seller.paypalEmail || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Bank IBAN</p>
                      <p className="font-mono bg-slate-950 border border-white/10 rounded-lg p-2 break-all">{deal.seller.bankIban || 'Not provided'}</p>
                    </div>
                    <p className="text-xs text-yellow-400/80 italic mt-4">Please transfer the exact amount of €{deal.price.toLocaleString()} to one of the methods above, then click &quot;Mark as Paid&quot;.</p>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic py-8 text-center">
                    Payment details are only revealed to the buyer. Ensure your settings are up to date.
                  </div>
                )}
              </div>

            </div>

            {/* Tracking Info (Visible when Shipped) */}
            {(deal.status === 'SHIPPED' || deal.status === 'COMPLETED') && deal.trackingNumber && (
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-3xl p-6 shadow-xl mt-6">
                <h3 className="text-lg font-bold text-emerald-400 mb-2 flex items-center gap-2"><Package size={20} /> Package Tracking</h3>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-bold uppercase mb-1">Provider: {deal.shippingProvider}</p>
                    <p className="text-2xl font-mono text-white font-bold tracking-widest">{deal.trackingNumber}</p>
                  </div>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-white/10 font-bold shadow-lg">
                    Track Package
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
