'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function VerifyBanner() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !user || user.emailVerified) return null;

  return (
    <div className="bg-red-500/10 border-b border-red-500/30 text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 z-50 relative">
      <ShieldAlert className="text-red-400" size={20} />
      <span className="text-sm font-medium text-center">
        Please verify your email address to unlock trading, posting, and giveaway features. Check your inbox!
      </span>
      <a 
        href="/settings/verification"
        className="ml-0 sm:ml-4 px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-xs font-bold transition-colors flex items-center gap-2 shrink-0"
      >
        <RefreshCw size={12} /> Verification Status
      </a>
    </div>
  );
}
