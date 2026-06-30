'use client';

import React, { useState } from 'react';
import { Swords, Trophy, Activity, ChevronDown } from 'lucide-react';

interface MatchHistoryDisplayProps {
  userId: string;
  matches: any[];
  ratings: any[];
}

export default function MatchHistoryDisplay({ userId, matches, ratings }: MatchHistoryDisplayProps) {
  // Extract distinct games from the matches or ratings
  const games = Array.from(new Set([
    ...matches.map(m => m.game),
    ...ratings.map(r => r.game)
  ]));

  const [selectedGame, setSelectedGame] = useState<string | 'ALL'>(games.length === 1 ? games[0] : 'ALL');

  const filteredMatches = selectedGame === 'ALL' 
    ? matches 
    : matches.filter(m => m.game === selectedGame);

  const ratingForGame = ratings.find(r => r.game === selectedGame);

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity size={20} className="text-cyan-400" />
          Match History & Elo
        </h3>

        {games.length >= 2 && (
          <div className="relative">
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="appearance-none bg-slate-950 border border-white/10 rounded-xl px-4 py-2 pr-10 text-white font-bold focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Games</option>
              {games.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {selectedGame !== 'ALL' && ratingForGame && (
        <div className="flex gap-6 mb-6 p-4 bg-slate-950 rounded-xl border border-white/5">
          <div>
            <p className="text-slate-400 text-sm font-bold">Elo Rating</p>
            <p className="text-2xl font-black text-white">{Math.round(ratingForGame.elo)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-bold">Win Rate</p>
            <p className="text-2xl font-black text-emerald-400">
              {ratingForGame.matchesPlayed > 0 
                ? Math.round((ratingForGame.wins / ratingForGame.matchesPlayed) * 100) 
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-bold">Matches Played</p>
            <p className="text-2xl font-black text-fuchsia-400">{ratingForGame.matchesPlayed}</p>
          </div>
        </div>
      )}

      {filteredMatches.length === 0 ? (
        <div className="text-slate-400 text-center py-12">
          No matches found for {selectedGame === 'ALL' ? 'any game' : selectedGame}.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => {
            const isWinner = match.winnerId === userId;
            const opponentName = match.player1Id === userId 
              ? (match.player2?.username || 'Unknown')
              : (match.player1?.username || 'Unknown');
              
            const eloChange = match.player1Id === userId 
              ? match.player1EloChange 
              : match.player2EloChange;

            return (
              <div key={match.id} className="flex items-center justify-between p-4 bg-slate-950/50 hover:bg-slate-950 rounded-xl border border-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${isWinner ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isWinner ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isWinner ? 'VICTORY' : 'DEFEAT'}
                      </span>
                      <span className="text-slate-500 text-sm font-bold tracking-wider">{match.game}</span>
                    </div>
                    <p className="text-slate-300">
                      vs <span className="font-bold text-white">{opponentName}</span>
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-black text-lg ${eloChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {eloChange >= 0 ? '+' : ''}{Math.round(eloChange)} Elo
                  </p>
                  <p className="text-slate-500 text-sm">
                    {new Date(match.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
