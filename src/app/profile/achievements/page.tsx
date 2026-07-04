'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Trophy, Medal, Star, Target, Shield, Zap } from 'lucide-react';

type Achievement = {
  id: string;
  code: string;
  name: string;
  description: string;
  points: number;
  imageUrl: string | null;
};

type UserAchievement = {
  id: string;
  earnedAt: string;
  achievement: Achievement;
};

type ProfileData = {
  earned: UserAchievement[];
  allAchievements: Achievement[];
  totalPoints: number;
};

// Maps code to a nice icon and color scheme for the UI
const getAchievementStyles = (code: string) => {
  if (code === 'FIRST_TRADE') return { icon: <ArrowRightLeft size={32} />, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' };
  if (code === 'WHALE') return { icon: <Medal size={32} />, color: 'from-amber-400 to-orange-600', shadow: 'shadow-amber-500/20' };
  if (code === 'MASTER_COLLECTOR') return { icon: <Star size={32} />, color: 'from-fuchsia-500 to-pink-600', shadow: 'shadow-fuchsia-500/20' };
  if (code === 'GUILD_FOUNDER') return { icon: <Shield size={32} />, color: 'from-emerald-400 to-teal-600', shadow: 'shadow-emerald-500/20' };
  if (code === 'BETA_TESTER') return { icon: <Zap size={32} />, color: 'from-indigo-500 to-purple-600', shadow: 'shadow-indigo-500/20' };
  return { icon: <Trophy size={32} />, color: 'from-slate-500 to-slate-700', shadow: 'shadow-slate-500/20' };
};

import { ArrowRightLeft } from 'lucide-react';

export default function AchievementsProfile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/achievements')
      .then(res => res.json())
      .then(json => {
        if (!json.error) setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500 w-12 h-12" />
      </main>
    );
  }

  const earnedIds = new Set(data?.earned.map(e => e.achievement.id));

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-20">
      
      <div className="max-w-6xl mx-auto pt-24 px-4 sm:px-6 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Header Profile Box */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="absolute -right-20 -bottom-20 opacity-5">
            <Trophy size={300} />
          </div>
          
          <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-950 shadow-[0_0_30px_rgba(217,70,239,0.3)] flex items-center justify-center z-10">
            <Target size={48} className="text-fuchsia-400" />
          </div>
          
          <div className="z-10 flex-1">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
              Your Trophy Room
            </h1>
            <p className="text-slate-400 text-lg">
              Unlock achievements by trading, building guilds, and growing your collection. Show off your status to the community.
            </p>
          </div>
          
          <div className="z-10 bg-slate-950 rounded-2xl p-6 border border-white/10 min-w-[200px]">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1 text-center">Gamerscore</p>
            <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-center">
              {data?.totalPoints || 0}
            </p>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {data?.allAchievements.map((ach, i) => {
            const isEarned = earnedIds.has(ach.id);
            const earnedRecord = data.earned.find(e => e.achievement.id === ach.id);
            const styles = getAchievementStyles(ach.code);

            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`relative rounded-3xl p-6 overflow-hidden transition-all duration-300 border 
                  ${isEarned ? 'bg-slate-900 border-white/10 shadow-xl hover:-translate-y-1 hover:shadow-2xl ' + styles.shadow : 'bg-slate-950/50 border-white/5 opacity-60 grayscale hover:grayscale-0'}`}
              >
                {/* Background flare if earned */}
                {isEarned && (
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${styles.color} opacity-20 blur-2xl rounded-full`} />
                )}

                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isEarned ? `bg-gradient-to-br ${styles.color} text-white` : 'bg-slate-800 text-slate-500'}`}>
                    {styles.icon}
                  </div>
                  <div className="bg-slate-950 border border-white/10 px-3 py-1 rounded-lg">
                    <span className={`text-sm font-black ${isEarned ? 'text-white' : 'text-slate-500'}`}>
                      {ach.points} pts
                    </span>
                  </div>
                </div>

                <h3 className={`text-xl font-black mb-2 ${isEarned ? 'text-white' : 'text-slate-400'}`}>
                  {ach.name}
                </h3>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed min-h-[40px]">
                  {ach.description}
                </p>

                {isEarned ? (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">
                      Unlocked on {new Date(earnedRecord!.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-slate-600 h-full w-0" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 ml-3">Locked</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
