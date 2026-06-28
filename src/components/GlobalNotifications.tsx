'use client';

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function GlobalNotifications() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) setIsLoggedIn(true);
        }
      } catch {
        // ignore
      }
    }
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchNotifications = () => {
      fetch('/api/notifications').then(r => r.json()).then(d => {
        if (d.notifications) setNotifications(d.notifications);
      });
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleToggleNotifications = () => {
    const isOpening = !showNotifications;
    setShowNotifications(isOpening);
    if (isOpening && notifications.some(n => !n.isRead)) {
      fetch('/api/notifications/read', { method: 'POST' }).then(() => {
        setNotifications(prev => prev.map(n => ({...n, isRead: true})));
      });
    }
  };

  if (!isLoggedIn) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="fixed top-6 right-6 z-50">
      <button 
        onClick={handleToggleNotifications} 
        className="relative bg-slate-900 border border-white/10 hover:border-cyan-500 hover:text-cyan-400 p-3 rounded-full text-slate-400 transition-all shadow-xl"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border-2 border-slate-900"></span>
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute top-14 right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-4 bg-slate-950/80 border-b border-white/5 flex justify-between items-center backdrop-blur-md">
            <span className="font-bold text-sm text-white tracking-widest uppercase">Notifications</span>
            {unreadCount > 0 && <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded font-black">{unreadCount} NEW</span>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm font-bold">No new alerts.</div>
            ) : (
              notifications.map(n => (
                <Link key={n.id} href={n.link || '#'} onClick={() => setShowNotifications(false)} className={`block p-4 border-b border-white/5 hover:bg-slate-800 transition-colors ${!n.isRead ? 'bg-cyan-500/10' : ''}`}>
                  <p className="text-sm text-slate-200">{n.content}</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">{new Date(n.createdAt).toLocaleTimeString()}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
