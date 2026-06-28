'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18nContext';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  const [formData, setFormData] = useState({
    shippingName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    paypalEmail: '',
    bankIban: ''
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/');
        } else {
          setFormData({
            shippingName: data.user.shippingName || '',
            addressLine1: data.user.addressLine1 || '',
            addressLine2: data.user.addressLine2 || '',
            city: data.user.city || '',
            state: data.user.state || '',
            postalCode: data.user.postalCode || '',
            country: data.user.country || '',
            paypalEmail: data.user.paypalEmail || '',
            bankIban: data.user.bankIban || ''
          });
          setLoading(false);
        }
      })
      .catch(console.error);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-cyan-500" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-32 pt-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-8">{t('settings.title')}</h1>
        
        <form onSubmit={handleSave} className="space-y-12">
          {/* Shipping Info */}
          <section className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6 border-b border-white/10 pb-4">{t('settings.shipping.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('settings.shipping.name')}</label>
                <input required type="text" name="shippingName" value={formData.shippingName} onChange={handleChange} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" placeholder="John Doe" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('settings.shipping.address1')}</label>
                <input required type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" placeholder="123 Main St" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('settings.shipping.address2')}</label>
                <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" placeholder="Apt 4B" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('settings.shipping.city')}</label>
                <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('settings.shipping.state')}</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('settings.shipping.zip')}</label>
                <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('settings.shipping.country')}</label>
                <input required type="text" name="country" value={formData.country} onChange={handleChange} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
              </div>
            </div>
          </section>

          {/* Payment Info */}
          <section className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-fuchsia-400 mb-6 border-b border-white/10 pb-4">{t('settings.payment.title')}</h2>
            <p className="text-slate-400 text-sm mb-6">{t('settings.payment.desc')}</p>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('settings.payment.paypal')}</label>
                <input type="email" name="paypalEmail" value={formData.paypalEmail} onChange={handleChange} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500" placeholder="seller@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('settings.payment.iban')}</label>
                <input type="text" name="bankIban" value={formData.bankIban} onChange={handleChange} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500" placeholder="XX00 0000 ..." />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white font-black px-8 py-4 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {t('settings.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
