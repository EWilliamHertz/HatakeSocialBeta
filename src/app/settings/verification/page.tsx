'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Mail, Smartphone, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function VerificationSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        setUser(d?.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleResend = async () => {
    setResending(true);
    setResendStatus('IDLE');
    try {
      const res = await fetch('/api/auth/verify/resend', { method: 'POST' });
      if (res.ok) {
        setResendStatus('SUCCESS');
      } else {
        setResendStatus('ERROR');
      }
    } catch {
      setResendStatus('ERROR');
    }
    setResending(false);
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-cyan-500" size={48} /></div>;
  }

  if (!user) {
    return <div className="text-center p-20 text-slate-400">Please log in to view this page.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <ShieldCheck className="text-cyan-400" size={32} /> Verification Status
        </h1>
        <p className="text-slate-400 mt-2">Secure your account to unlock all features on Hatake Social.</p>
      </div>

      <div className="space-y-6">
        {/* Mail Verification */}
        <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className={`p-4 rounded-full ${user.emailVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            <Mail size={32} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Mail Verification
              {user.emailVerified ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-red-500" />}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {user.emailVerified 
                ? 'Your email address has been successfully verified.' 
                : 'Your email is not verified. Please check your inbox for the verification link.'}
            </p>
            {!user.emailVerified && (
              <div className="mt-4 flex items-center gap-4">
                <button 
                  onClick={handleResend}
                  disabled={resending}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-sm transition-colors flex items-center gap-2"
                >
                  {resending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Resend Verification Email
                </button>
                {resendStatus === 'SUCCESS' && <span className="text-emerald-400 text-sm font-bold">Email sent!</span>}
                {resendStatus === 'ERROR' && <span className="text-red-400 text-sm font-bold">Failed to send.</span>}
              </div>
            )}
          </div>
        </div>

        {/* 2FA Upcoming */}
        <div className="bg-slate-900/50 border border-white/5 border-dashed p-6 rounded-2xl flex flex-col sm:flex-row gap-6 items-start sm:items-center opacity-70">
          <div className="p-4 rounded-full bg-slate-800 text-slate-500">
            <Smartphone size={32} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">2-Way Authentication (SMS)</h2>
              <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-black px-2 py-0.5 rounded uppercase">Upcoming</span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Add an extra layer of security to your Hatake Social account using SMS code verification. Coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
