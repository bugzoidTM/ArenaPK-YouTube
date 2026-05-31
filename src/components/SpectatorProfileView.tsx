/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, Award, Trophy, Heart, History, TrendingUp, Sparkles, Share2, 
  Mail, Calendar, Flame, Zap, Tv, HeartHandshake, Users, ArrowRight, Star
} from 'lucide-react';
import { Creator } from '../types';
import { viewerService, ViewerProfile } from '../services/viewerService';
import { paymentService, GiftTransaction } from '../services/paymentService';

interface SpectatorProfileViewProps {
  onNavigate: (view: string) => void;
  allCreators: Creator[];
}

export default function SpectatorProfileView({
  onNavigate,
  allCreators,
}: SpectatorProfileViewProps) {
  const [profile, setProfile] = useState<ViewerProfile>(() => viewerService.getProfile());
  const [sentGifts, setSentGifts] = useState<GiftTransaction[]>(() => paymentService.getSentTransactions());
  const [activeSegment, setActiveSegment] = useState<'overview' | 'badges' | 'history' | 'favorites'>('overview');
  const [toastAlert, setToastAlert] = useState<string | null>(null);

  useEffect(() => {
    setProfile(viewerService.getProfile());
    setSentGifts(paymentService.getSentTransactions());
  }, []);

  const triggerToast = (msg: string) => {
    setToastAlert(msg);
    setTimeout(() => {
      setToastAlert(null);
    }, 3500);
  };

  const handleToggleFavorite = (creatorId: string) => {
    viewerService.toggleFavorite(creatorId);
    setProfile(viewerService.getProfile());
    triggerToast("Lista de criadores favoritos atualizada!");
  };

  // Get favorite creators details
  const favoriteCreators = allCreators.filter(c => profile.favorites.includes(c.id));

  // Count total coins donated to calculate support metrics
  const totalDonatedCoins = sentGifts.reduce((acc, tx) => acc + tx.coinValue, 0);

  return (
    <div className="space-y-8 py-6 pb-20 relative z-10 selection:bg-rose-500 selection:text-white">
      
      {/* Toast Alert */}
      {toastAlert && (
        <div className="fixed top-20 right-4 z-50 bg-zinc-950 border border-rose-500 p-3 rounded-lg shadow-lg text-xs max-w-xs text-rose-300">
          {toastAlert}
        </div>
      )}

      {/* Header Banner - Spectator Identity */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <HeartHandshake className="w-40 h-40" />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 text-center sm:text-left">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 rounded-3xl p-1 flex items-center justify-center shadow-xl shadow-rose-500/20 select-none">
            <div className="w-full h-full bg-zinc-950 rounded-[22px] flex items-center justify-center text-white text-3xl font-black">
              👤
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                Perfil do Espectador
              </h1>
              <span className="text-[9px] font-mono font-black bg-rose-500/15 border border-rose-500/20 text-rose-450 px-2 py-0.5 rounded uppercase">
                Apoiador Bronze
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-zinc-650" />
                eleniltonfreitas2009@gmail.com
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-650" />
                Membro desde Maio/2026
              </span>
            </div>
          </div>
        </div>

        {/* Level Indicator Big card */}
        <div className="flex gap-4 min-w-[200px] text-center bg-zinc-950/65 border border-white/5 p-4 rounded-xl relative z-10">
          <div className="flex-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Nível Atual</span>
            <span className="text-2xl font-black text-white font-mono block mt-1">{profile.level}</span>
          </div>
          <div className="border-l border-white/5" />
          <div className="flex-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">XP Acumulado</span>
            <span className="text-sm font-black text-amber-500 font-mono block mt-2">{profile.xp} XP</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 select-none overflow-x-auto gap-2">
        {[
          { id: 'overview', label: 'Painel Geral', icon: Zap },
          { id: 'badges', label: 'Meus Emblemas', icon: Award },
          { id: 'favorites', label: 'Criadores Favoritos', icon: Heart },
          { id: 'history', label: 'Histórico de Apoio', icon: History }
        ].map(tab => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSegment(tab.id as any)}
              className={`py-3 px-4 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
                activeSegment === tab.id 
                  ? 'border-rose-500 text-white bg-white/5' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <IconComp className={`w-4 h-4 ${activeSegment === tab.id ? 'text-rose-500' : 'text-zinc-600'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SECTION CONTENT: OVERVIEW DYNAMIC STATS */}
      {activeSegment === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main profile visual meters (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* XP Progression Card */}
            <div className="bg-zinc-900/40 border border-white/10 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Progresso de Nível</h3>
                  <p className="text-xs text-zinc-500">Mantenha-se engajado nas transmissões para elevar sua credibilidade visual</p>
                </div>
                <span className="text-[10px] font-mono bg-zinc-950 border border-white/10 p-1 px-2.5 rounded text-amber-400">
                  Próximo nível em: {profile.xpToNextLevel - profile.xp} XP
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Nível {profile.level}</span>
                  <span className="text-zinc-400">Nível {profile.level + 1}</span>
                </div>
                <div className="w-full h-3 bg-zinc-950 rounded-full p-0.5 overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 via-orange-500 to-yellow-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (profile.xp / profile.xpToNextLevel) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Key Accomplishments Metric grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="bg-zinc-900/45 border border-white/10 p-5 rounded-2xl space-y-2 text-center sm:text-left">
                <Award className="w-5 h-5 text-amber-400 mx-auto sm:mx-0" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Badges Conquistadas</span>
                <span className="text-xl font-mono font-black text-white block">{profile.badges.length} desbloqueados</span>
                <span className="text-[10px] text-zinc-500 block">Emblemas de conquistas</span>
              </div>

              <div className="bg-zinc-900/45 border border-white/10 p-5 rounded-2xl space-y-2 text-center sm:text-left">
                <HeartHandshake className="w-5 h-5 text-rose-500 mx-auto sm:mx-0" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Canal Fortalecido</span>
                <span className="text-xl font-mono font-black text-white block">{favoriteCreators.length} favoritos</span>
                <span className="text-[10px] text-zinc-500 block">Configuração de favoritos</span>
              </div>

              <div className="bg-zinc-900/45 border border-white/10 p-5 rounded-2xl space-y-2 text-center sm:text-left">
                <Trophy className="w-5 h-5 text-yellow-500 mx-auto sm:mx-0" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Doação de Moedas</span>
                <span className="text-xl font-mono font-black text-white block">🪙 {totalDonatedCoins.toLocaleString()}</span>
                <span className="text-[10px] text-zinc-500 block">Soma de moedas em testes</span>
              </div>

            </div>

            {/* Gamification Sandbox Principles explanation */}
            <div className="bg-zinc-900/20 p-5 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center gap-1 text-sm font-extrabold text-white">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Diretriz de Gamificação de Espectadores
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Para prevenir problemas relacionados a lavagem de dinheiro, saques fictícios e apostas ilegais, o ArenaPK <b>não implementa</b> nenhum tipo de aposta, retorno financeiro para apoiadores ou cupons de dinheiro. Toda vitória, XP, níveis e emblemas se traduzem em <b>destaque conceitual</b> dentro das transmissões, chats e rankings.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('discover')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 transition-colors text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer select-none"
                >
                  Ir para Missões de Descoberta
                </button>
              </div>
            </div>

          </div>

          {/* Side panel: Weekly leaderboards index (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-widest border-b border-white/10 pb-3 flex items-center justify-between">
                <span>🏆 Pódio de Destaque</span>
                <span className="text-[9px] font-mono text-zinc-550">Semanal</span>
              </h3>

              <div className="space-y-3">
                {[
                  { name: 'Elenilton Barreto', spent: 75200, rank: 1, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
                  { name: 'Gamer_Pro_SP', spent: 51000, rank: 2, avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100' },
                  { name: 'Alice_Silveira', spent: 39500, rank: 3, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
                  { name: 'Você (Torcedor)', spent: profile.weeklyPoints, rank: profile.weeklyRank, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }
                ].sort((a,b) => b.spent - a.spent).map((usr, i) => (
                  <div key={i} className={`p-2 rounded-xl flex items-center justify-between ${
                    usr.name.includes('Você') ? 'bg-rose-500/10 border border-rose-500/15' : 'bg-zinc-950/40'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-zinc-500">#{i + 1}</span>
                      <div>
                        <span className="text-[10px] font-extrabold text-white block">{usr.name}</span>
                        <span className="text-[8px] text-zinc-550 block">Ranking Semanal</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-500 font-bold">🪙 {usr.spent.toLocaleString()} pt</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SECTION CONTENT: UNLOCKED BADGES GRID */}
      {activeSegment === 'badges' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/40 p-5 border border-white/10 rounded-2xl">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider block">Emblemas de Status Desbloqueados ({profile.badges.length})</h3>
            <p className="text-xs text-zinc-500">Cada emblema representa marcos logrados ao explorar transmissões novas e enviar presentes em partidas PK.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {profile.badges.map((b) => (
              <div key={b.id} className="bg-zinc-900/30 border border-white/10 hover:border-amber-400/20 p-5 rounded-3xl text-center space-y-2 relative group transition">
                <span className="text-3xl filter drop-shadow block select-none transform group-hover:scale-110 transition">{b.icon}</span>
                <span className="text-xs font-extrabold text-white block leading-tight">{b.name}</span>
                <p className="text-[10px] text-zinc-500 line-clamp-2 leading-normal">{b.description}</p>
                <span className="text-[9px] text-zinc-600 block font-mono">Desbloqueado em: {b.dateUnlocked}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION CONTENT: FAVORITE CREATORS */}
      {activeSegment === 'favorites' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-zinc-900/40 p-5 border border-white/10 rounded-2xl">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Favoritos de Audiência ({favoriteCreators.length})</h3>
            <p className="text-xs text-zinc-500">Mapeamento rápido dos canais de sua preferência para acompanhar dulos e transmissões ativas em tempo real.</p>
          </div>

          {favoriteCreators.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 bg-zinc-900/20 rounded-3xl space-y-2">
              <span className="text-3xl">❤️</span>
              <p className="text-xs text-zinc-400">Você não favoritou nenhum criador ainda.</p>
              <p className="text-[10px] text-zinc-650 max-w-xs mx-auto">Vá para a página "Descobrir Lives" para ler o catálogo e marcar canais como favoritos!</p>
              <button
                onClick={() => onNavigate('discover')}
                className="mt-3 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold rounded-lg text-white"
              >
                Explorar Criadores
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteCreators.map((creator) => (
                <div key={creator.id} className="bg-zinc-900/45 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={creator.avatar} 
                      alt={creator.name} 
                      className="w-12 h-12 rounded-full object-cover border border-white/5"
                    />
                    <div>
                      <span className="text-xs font-black text-white block">{creator.name}</span>
                      <span className="text-[10px] text-zinc-550 block">@{creator.channelName}</span>
                      {creator.isLive && (
                        <span className="text-[8px] font-bold bg-rose-500/10 text-rose-400 p-0.5 px-1.5 rounded mt-1 inline-block animate-pulse">AO VIVO</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5">
                    <button
                      onClick={() => handleToggleFavorite(creator.id)}
                      className="text-[10px] text-rose-500 hover:text-rose-400 underline font-semibold"
                    >
                      Remover
                    </button>
                    {creator.isLive && (
                      <button
                        onClick={() => onNavigate('spectator-pk-room')}
                        className="bg-zinc-850 hover:bg-zinc-805 text-white p-1 px-2.5 rounded text-[9px] uppercase font-bold tracking-wider cursor-pointer"
                      >
                        Assistir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION CONTENT: SUPPORT HISTORY LEDGER */}
      {activeSegment === 'history' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/40 p-5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Histórico de Apoio Financeiro (Moedas)</h3>
              <p className="text-xs text-zinc-500">Transações de presentes enviadas por você no ambiente simulado da plataforma.</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Gasto Total</span>
              <span className="text-md font-mono font-black text-amber-500">🪙 {totalDonatedCoins.toLocaleString()}</span>
            </div>
          </div>

          {sentGifts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 bg-zinc-900/20 rounded-3xl space-y-2">
              <span className="text-3xl">🎁</span>
              <p className="text-xs text-zinc-400">Nenhum registro de doações feitas.</p>
              <p className="text-[10px] text-zinc-600">Participe de batalhas na Sala Pública e envie presentes para que conste em seu extrato.</p>
            </div>
          ) : (
            <div className="bg-zinc-900/30 p-4 border border-white/10 rounded-2xl space-y-3">
              {sentGifts.map((tx) => (
                <div key={tx.id} className="p-3 bg-zinc-950/60 border border-white/5 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl filter drop-shadow select-none">{tx.giftIcon}</span>
                    <div>
                      <span className="text-xs font-bold text-white block">Apoio a {tx.creatorName}</span>
                      <span className="text-[10px] text-zinc-500 block">Presente enviado: {tx.giftName} (Apoiador Premium)</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-rose-500 block">- 🪙 {tx.coinValue.toLocaleString()}</span>
                    <span className="text-[9px] text-zinc-600 block mt-0.5">{tx.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
