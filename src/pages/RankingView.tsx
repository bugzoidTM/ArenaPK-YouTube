/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trophy, Star, Sparkles, Heart, Users, Flame, UserCheck } from 'lucide-react';
import { Creator } from '../types';
import { paymentService } from '../services/paymentService';

interface RankingViewProps {
  allCreators: Creator[];
}

export default function RankingView({ allCreators }: RankingViewProps) {
  const [rankingPeriod, setRankingPeriod] = useState<'weekly' | 'alltime'>('weekly');

  // Sorted Creators list mock (Top winners)
  const sortedCreators = [...allCreators].sort((a, b) => b.subscribers - a.subscribers);

  // Top sponsors / Contributors list dynamically pulled and sorted from paymentService
  const MOCK_TOP_SPONSORS = [...paymentService.getTopSponsors()].sort((a: any, b: any) => b.spentCoins - a.spentCoins);

  return (
    <div className="space-y-8 py-6 pb-20 relative z-10">
      
      {/* Banner */}
      <div className="relative text-center p-8 bg-zinc-900/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="absolute inset-x-0 -top-40 h-80 bg-radial from-rose-500/10 via-transparent to-transparent opacity-50 pointer-events-none animate-pulse" />
        
        <div className="relative z-10 max-w-xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 text-[10px] font-bold uppercase tracking-widest font-mono">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Arena Hall of Fame
          </div>
          
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">RANKING DA TEMPORADA</h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-2">
            Consulte a pontuação acumulada de criadores em batalhas PK vencidas e os maiores doadores que agitaram os chats no YouTube pela ArenaPK!
          </p>

          {/* Toggle buttons */}
          <div className="inline-flex gap-1.5 bg-zinc-950 p-1 border border-white/10 rounded-xl select-none">
            <button
              onClick={() => setRankingPeriod('weekly')}
              className={`px-4 py-1.5 rounded-lg text-[10px]/snug font-black uppercase tracking-wider transition-all duration-155 cursor-pointer ${
                rankingPeriod === 'weekly' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semanal ⚡
            </button>
            <button
              onClick={() => setRankingPeriod('alltime')}
              className={`px-4 py-1.5 rounded-lg text-[10px]/snug font-black uppercase tracking-wider transition-all duration-155 cursor-pointer ${
                rankingPeriod === 'alltime' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Histórico Geral
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard layout (Dual display) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Creator Leaderboard Section */}
        <div className="bg-zinc-900/60 border border-white/10 p-6 rounded-2xl space-y-4 backdrop-blur-md shadow-2xl">
          <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-3 flex items-center gap-2 select-none">
            <Flame className="w-5 h-5 text-rose-500" />
            Top Criadores PK
          </h3>

          <div className="space-y-3">
            {sortedCreators.map((creator, index) => {
              // Trophy icons / Colors logic
              let rankBadge = `${index + 1}º`;
              let borderClass = 'border-white/5 bg-zinc-950/40';
              let pointsLabel = rankingPeriod === 'weekly' 
                ? `${Math.round(creator.subscribers / 45).toLocaleString()} pts PK` 
                : `${Math.round(creator.subscribers / 5).toLocaleString()} pts PK`;

              if (index === 0) {
                rankBadge = '🥇';
                borderClass = 'border-amber-500/30 bg-amber-500/5';
              } else if (index === 1) {
                rankBadge = '🥈';
                borderClass = 'border-zinc-300/20 bg-zinc-300/5';
              } else if (index === 2) {
                rankBadge = '🥉';
                borderClass = 'border-amber-700/30 bg-amber-800/5';
              }

              return (
                <div 
                  key={creator.id} 
                  className={`p-3 border rounded-xl flex items-center justify-between gap-4 transition hover:border-white/15 ${borderClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black w-6 text-center select-none">{rankBadge}</span>
                    <img src={creator.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    <div>
                      <span className="font-bold text-zinc-100 text-xs block">{creator.name}</span>
                      <span className="text-[10px] text-zinc-500 block font-mono">Canal: {creator.channelName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-amber-450 font-bold block text-xs font-mono">{pointsLabel}</span>
                    <span className="text-[9px] text-zinc-500 block font-mono mt-0.5">
                      {(creator.subscribers / 1000).toFixed(0)}K inscritos
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sponsor/Gifter Leaderboard Section */}
        <div className="bg-zinc-900/60 border border-white/10 p-6 rounded-2xl space-y-4 backdrop-blur-md shadow-2xl">
          <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/10 pb-3 flex items-center gap-2 select-none">
            <Heart className="w-5 h-5 text-rose-500 animate-pulse" />
            Top Apoiadores (Sponsors)
          </h3>

          <div className="space-y-3">
            {MOCK_TOP_SPONSORS.map((sponsor, index) => {
              let rankBadge = `${index + 1}º`;
              let borderClass = 'border-white/5 bg-zinc-950/40';
              let giftCoinsTotal = rankingPeriod === 'weekly' 
                ? sponsor.spentCoins 
                : Math.round(sponsor.spentCoins * 4.2);

              if (index === 0) {
                rankBadge = '🏆';
                borderClass = 'border-amber-500/30 bg-amber-500/5';
              } else if (index === 1) {
                rankBadge = '🥈';
                borderClass = 'border-zinc-300/20 bg-zinc-300/5';
              } else if (index === 2) {
                rankBadge = '🥉';
                borderClass = 'border-amber-700/30 bg-amber-800/5';
              }

              return (
                <div 
                  key={sponsor.name} 
                  className={`p-3 border rounded-xl flex items-center justify-between gap-4 transition-all hover:border-white/15 ${borderClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black w-6 text-center select-none">{rankBadge}</span>
                    <img src={sponsor.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    <div>
                      <span className="font-bold text-zinc-150 text-xs block">{sponsor.name}</span>
                      <span className="text-[9px] text-rose-455 font-semibold block">{sponsor.badge}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-amber-550 font-bold block text-xs font-mono">
                      🪙 {giftCoinsTotal.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5 font-sans">Doador Mensal</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
