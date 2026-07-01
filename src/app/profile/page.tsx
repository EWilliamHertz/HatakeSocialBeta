import React from 'react';
import { PrismaClient } from '@prisma/client';
import { User, Settings, Shield, Award, Trophy, MapPin, Search } from 'lucide-react';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReputationStars from '@/components/ReputationStars';
import CollectionValueChart from '@/components/CollectionValueChart';
import MatchHistoryDisplay from '@/components/MatchHistoryDisplay';

const prisma = new PrismaClient();

export default async function ProfilePage() {
  const token = cookies().get('hatake_session')?.value;
  if (!token) {
    redirect('/login');
  }

  const session = await decrypt(token);
  if (!session || !session.id) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id as string },
    include: {
      inventory: {
        include: {
          cardReference: true
        }
      },
      ratings: true,
      matchesAsPlayer1: {
        include: {
          player2: { select: { username: true } },
          winner: { select: { id: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      },
      matchesAsPlayer2: {
        include: {
          player1: { select: { username: true } },
          winner: { select: { id: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });

  if (!dbUser) {
    redirect('/login');
  }

  const user = {
    username: dbUser.username,
    email: dbUser.email,
    role: dbUser.role || 'USER',
    hatakeCoins: 2500, // Placeholder until economy is built
    inventory: dbUser.inventory || [],
    createdAt: dbUser.createdAt,
    reputationScore: dbUser.reputationScore,
    totalReviews: dbUser.totalReviews,
    ratings: dbUser.ratings || [],
    matches: [...(dbUser.matchesAsPlayer1 || []), ...(dbUser.matchesAsPlayer2 || [])].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  };

  // Calculate stats
  const magicCards = user.inventory.filter(i => i.cardReference.game === 'MTG').length;
  const pokemonCards = user.inventory.filter(i => i.cardReference.game === 'POKEMON').length;
  const onePieceCards = user.inventory.filter(i => i.cardReference.game === 'ONE_PIECE').length;
  const narutoCards = user.inventory.filter(i => i.cardReference.game === 'NARUTO').length;

  // Mock Arena Ratings
  const arena1 = 1450;
  const arena2 = 1520;
  const arena3 = 1400;
  const arena4 = 1600;
  const averageArenaRating = Math.round((arena1 + arena2 + arena3 + arena4) / 4);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-32">
      {/* Profile Header Banner */}
      <div className="h-64 bg-gradient-to-r from-fuchsia-600/20 via-indigo-600/20 to-cyan-600/20 relative border-b border-white/5">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative -top-20">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-12">
          {/* Avatar */}
          <div className="w-40 h-40 rounded-3xl bg-slate-800 border-4 border-slate-950 shadow-2xl overflow-hidden flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-fuchsia-500 opacity-20"></div>
            <User size={64} className="text-slate-400" />
          </div>
          
          <div className="flex-1 text-center md:text-left mb-2">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-4xl font-black text-white">{user.username}</h1>
              {user.role === 'ADMIN' && (
                <span className="px-2 py-1 bg-fuchsia-500/20 text-fuchsia-400 text-xs font-bold rounded flex items-center gap-1 border border-fuchsia-500/20">
                  <Shield size={12} /> Staff
                </span>
              )}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <ReputationStars score={user.reputationScore} totalReviews={user.totalReviews} size={16} />
            </div>
            <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2">
              <MapPin size={16} /> European Server Region
            </p>
          </div>

          <div className="flex gap-4">
            <button className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-colors">
              Add Friend
            </button>
            <Link href="/collection" className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
              <Search size={18} /> View Collection
            </Link>
            <Link href="/settings" className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center justify-center">
              <Settings size={20} className="text-slate-300" />
            </Link>
          </div>
        </div>

        {/* Collection Value Tracker */}
        <div className="mb-12">
          <CollectionValueChart />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl flex items-center gap-4">
            <div className="p-4 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Shield size={32} />
            </div>
            <div className="w-full overflow-hidden">
              <p className="text-slate-400 text-sm font-semibold mb-2">Collector / Player of:</p>
              <div className="flex gap-2 flex-wrap">
                {magicCards > 0 && <span className="px-2 py-1 bg-white/5 rounded text-xs font-bold text-white border border-white/10">MTG</span>}
                {pokemonCards > 0 && <span className="px-2 py-1 bg-white/5 rounded text-xs font-bold text-white border border-white/10">Pokémon</span>}
                {onePieceCards > 0 && <span className="px-2 py-1 bg-white/5 rounded text-xs font-bold text-white border border-white/10">One Piece</span>}
                {narutoCards > 0 && <span className="px-2 py-1 bg-white/5 rounded text-xs font-bold text-white border border-white/10">Naruto</span>}
                {magicCards === 0 && pokemonCards === 0 && onePieceCards === 0 && narutoCards === 0 && (
                  <span className="text-slate-500 text-xs">No active collections</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl flex items-center gap-4">
            <div className="p-4 bg-fuchsia-500/10 rounded-xl text-fuchsia-400">
              <Trophy size={32} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold">Market Reputation</p>
              <h3 className="text-2xl font-bold text-white">100% Positive</h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-center">
            <p className="text-slate-400 text-sm font-semibold mb-1">Collection</p>
            <p className="text-white">
              <span className="font-bold text-xl">{user.inventory.length}</span> Cards Owned
            </p>
            <p className="text-emerald-400 text-xs mt-1 font-bold">
              + Verified Vault
            </p>
          </div>
        </div>

        {/* Collection Tracker Widget */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 mb-12 shadow-[0_0_40px_rgba(6,182,212,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] group-hover:bg-cyan-500/20 transition-all"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-[60px]"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-6 flex items-center gap-3">
              <span className="p-2 bg-white/5 rounded-lg border border-white/10 text-cyan-400">
                <Trophy size={24} />
              </span>
              Master Collection Tracker
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* MTG Progress */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-slate-400 text-sm font-bold tracking-wider uppercase mb-1">Magic: The Gathering</p>
                    <p className="text-3xl font-black text-white">
                      {magicCards} <span className="text-slate-500 text-lg">/ ∞</span>
                    </p>
                  </div>
                  <p className="text-cyan-400 font-bold text-lg">{magicCards > 0 ? 'Active' : '0%'}</p>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full relative shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: magicCards > 0 ? '5%' : '0%' }}></div>
                </div>
              </div>

              {/* Pokemon Progress */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-slate-400 text-sm font-bold tracking-wider uppercase mb-1">Pokémon TCG</p>
                    <p className="text-3xl font-black text-white">
                      {pokemonCards} <span className="text-slate-500 text-lg">/ ∞</span>
                    </p>
                  </div>
                  <p className="text-yellow-400 font-bold text-lg">{pokemonCards > 0 ? 'Active' : '0%'}</p>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full relative shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: pokemonCards > 0 ? '5%' : '0%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity / Match History */}
        <MatchHistoryDisplay 
          userId={session.id as string} 
          matches={user.matches} 
          ratings={user.ratings} 
        />
      </div>
    </div>
  );
}
