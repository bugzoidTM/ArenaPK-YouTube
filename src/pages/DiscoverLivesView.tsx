/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Tv, Flame, Trophy, Sparkles, TrendingUp, Compass, Clock, Share2, 
  HelpCircle, Users, CheckCircle2, Zap, ChevronRight, Star, Award, 
  Search, Heart, Target, ArrowRight, Bell, Ban, Eye, RefreshCw
} from 'lucide-react';
import { Creator, PKBattle, PKRoom } from '../types';
import { viewerService, ViewerMission, ViewerProfile } from '../services/viewerService';
import { INITIAL_CREATORS } from '../mocks/pkService';

interface DiscoverLivesViewProps {
  onNavigate: (view: string) => void;
  allCreators: Creator[];
  activeBattles: PKBattle[];
  onSelectBattle: (battle: PKBattle) => void;
}

export default function DiscoverLivesView({
  onNavigate,
  allCreators,
  activeBattles,
  onSelectBattle,
}: DiscoverLivesViewProps) {
  // Viewer state
  const [profile, setProfile] = useState<ViewerProfile>(() => viewerService.getProfile());
  const [missions, setMissions] = useState<ViewerMission[]>(() => viewerService.getMissions());
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'tight' | 'goals' | 'iniciante' | 'pk'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simulation timers & loading
  const [isSimulatingWatch, setIsSimulatingWatch] = useState(false);
  const [watchProgressVal, setWatchProgressVal] = useState(0);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Sync profile & missions periodically
  const refreshViewerState = () => {
    setProfile(viewerService.getProfile());
    setMissions(viewerService.getMissions());
  };

  useEffect(() => {
    refreshViewerState();
  }, []);

  // Simple toast trigger
  const showToast = (message: string) => {
    setToastNotification(message);
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  // Helper to trigger specific mission actions
  const handleTriggerAction = (actionKey: string, amount: number = 1) => {
    const res = viewerService.triggerMissionAction(actionKey, amount);
    refreshViewerState();
    if (res.CompletedMission) {
      showToast(`🎉 Missão Concluída: "${res.CompletedMission.title}"! +${res.CompletedMission.xpReward} XP e Badge Desbloqueada!`);
    } else if (res.XPAdded > 0) {
      showToast(`✨ Progresso salvo: +${res.XPAdded} XP acumulados!`);
    } else {
      showToast(`⚡ Ação registrada no simulador de missões.`);
    }

    if (res.LeveledUp) {
      setTimeout(() => {
        showToast(`🆙 PARABÉNS! Você subiu de nível! Agora você é Nível ${viewerService.getProfile().level}! 🚀`);
      }, 1500);
    }
  };

  // Simulate 3 minutes watch time increments
  const startSimulateWatchTime = () => {
    if (isSimulatingWatch) return;
    setIsSimulatingWatch(true);
    setWatchProgressVal(0);

    const interval = setInterval(() => {
      setWatchProgressVal(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulatingWatch(false);
          handleTriggerAction('watch_minute', 1);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const toggleFavoriteCreator = (creatorId: string) => {
    viewerService.toggleFavorite(creatorId);
    refreshViewerState();
  };

  // Advanced Filters for Discover Page
  const getFilteredLives = () => {
    let list = [...allCreators];

    // Filter by query if inputted
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.channelName.toLowerCase().includes(q));
    }

    switch (activeTab) {
      case 'new':
        // New creators: lower sub count or custom criteria
        return list.filter(c => c.subscribers < 1000000);
      
      case 'tight':
        // Tight battles: active battles where point diff is less than 3000
        const tightBattlesCreators = activeBattles
          .filter(b => Math.abs(b.pointsRed - b.pointsBlue) < 5000)
          .flatMap(b => [b.creatorRed.id, b.creatorBlue.id]);
        return list.filter(c => tightBattlesCreators.includes(c.id) || c.isLive);

      case 'goals':
        // Goal near completion: simulated using high subscribers or live streamers
        return list.filter(c => c.isLive && c.subscribers > 2000000);

      case 'iniciante':
        // Beginner streamers index
        return list.filter(c => c.subscribers < 300000);

      case 'pk':
        // Filter those active in PK battles
        const pkActiveIds = activeBattles.flatMap(b => [b.creatorRed.id, b.creatorBlue.id]);
        return list.filter(c => pkActiveIds.includes(c.id) || c.isLive);

      default:
        return list;
    }
  };

  const filteredCreators = getFilteredLives();

  return (
    <div className="space-y-8 py-6 pb-20 relative z-10 selection:bg-rose-500 selection:text-white">
      
      {/* Toast Alert notification popup */}
      {toastNotification && (
        <div className="fixed top-20 right-4 z-50 bg-zinc-950 border-2 border-amber-500/80 p-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] text-xs max-w-sm animate-bounce text-amber-200 flex items-start gap-2 backdrop-blur-xl">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <span className="font-extrabold block">Conquista ArenaPK!</span>
            <p className="leading-relaxed text-zinc-350">{toastNotification}</p>
          </div>
        </div>
      )}

      {/* Header Banner - Discover Title & Search */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Compass className="w-40 h-40 text-white animate-spin-slow" />
        </div>
        
        <div className="max-w-xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-400 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border border-rose-500/20">
            <Compass className="w-3.5 h-3.5" />
            Central de Descoberta e Gamificação
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white italic tracking-tight leading-none">
            DESCOBRIR LIVES <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">& DUELOS PK</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
            Acabe com a ociosidade de canais vazios! Participe das missões semanais, ganhe badges de lealdade, suba no ranking de apoiadores e recomende seus criadores favoritos!
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar canais ao vivo, novidades ou categorias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50"
              />
            </div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="px-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-350 rounded-xl"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Discover Lives Board (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-rose-500" />
              <h2 className="text-md font-bold uppercase tracking-wide text-white font-mono">Canais Recomendados</h2>
            </div>
            
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'pk', label: '⚔️ Em PK' },
                { key: 'new', label: '🌱 Criadores Novos' },
                { key: 'tight', label: '⚡ Placar Apertado' },
                { key: 'goals', label: '🎯 Quase Metas' },
                { key: 'iniciante', label: '👤 Iniciantes' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg border transition cursor-pointer select-none ${
                    activeTab === tab.key 
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/35' 
                      : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredCreators.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 bg-zinc-900/20 rounded-3xl space-y-3">
              <span className="text-3xl">🏜️</span>
              <p className="text-sm text-zinc-400 font-bold">Nenhum canal corresponde a este filtro neste momento.</p>
              <p className="text-xs text-zinc-550 max-w-sm mx-auto">Tente redefinir o filtro para ver todos os criadores registrados na sandbox.</p>
              <button 
                onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold rounded-lg text-white"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCreators.map((creator) => {
                const isFavorite = profile.favorites.includes(creator.id);
                // Check if currently active on battle
                const activeBattle = activeBattles.find(
                  b => b.status === 'active' && (b.creatorRed.id === creator.id || b.creatorBlue.id === creator.id)
                );
                
                // Determine mock specific tag descriptors
                const isTight = activeBattle ? Math.abs(activeBattle.pointsRed - activeBattle.pointsBlue) < 4000 : false;
                const matchesGoal = creator.subscribers > 2000000;
                const isVerySmall = creator.subscribers < 300000;

                return (
                  <div 
                    key={creator.id}
                    className="bg-zinc-900/45 hover:bg-zinc-900 border border-white/10 hover:border-rose-500/25 p-4 rounded-2xl space-y-4 transition duration-300 relative group flex flex-col justify-between"
                  >
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <button
                        onClick={() => toggleFavoriteCreator(creator.id)}
                        className={`p-1.5 rounded-lg border transition ${
                          isFavorite 
                            ? 'bg-rose-500/20 border-rose-500/25 text-rose-400' 
                            : 'bg-zinc-950/40 border-white/5 text-zinc-500 hover:text-white'
                        }`}
                        title={isFavorite ? "Remover dos Favoritos" : "Favoritar Criador"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Avatar header layout */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img 
                            src={creator.avatar} 
                            alt={creator.name} 
                            className="w-11 h-11 rounded-full object-cover border-2 border-zinc-800"
                          />
                          {creator.isLive && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-rose-500 border-2 border-zinc-900 rounded-full animate-pulse" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-white text-xs block truncate max-w-[120px]">{creator.name}</span>
                            {isVerySmall && (
                              <span className="text-[8px] font-mono tracking-wide bg-amber-500/15 text-amber-400 p-0.5 px-1 rounded border border-amber-500/25">INICIANTE</span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-550 block">@{creator.channelName}</span>
                        </div>
                      </div>

                      {/* Title information of livestream */}
                      <div className="text-[11px] leading-relaxed text-zinc-350 font-sans min-h-[34px] line-clamp-2">
                        {creator.isLive && creator.liveTitle ? (
                          <span className="text-zinc-200">{creator.liveTitle}</span>
                        ) : (
                          <span className="text-zinc-500 italic block">Transmissão em stand-by. Pronta para agendar dulos.</span>
                        )}
                      </div>

                      {/* Display metric Badges */}
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[9px] bg-zinc-950 font-mono text-zinc-450 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
                          <Users className="w-2.5 h-2.5 text-zinc-500" />
                          {(creator.subscribers / 1000).toLocaleString()}k seguidores
                        </span>

                        {creator.isLive && (
                          <span className="text-[9px] bg-rose-500/10 font-mono text-rose-400 px-2 py-0.5 rounded border border-rose-500/15 flex items-center gap-1 animate-pulse">
                            🔴 AO VIVO
                          </span>
                        )}

                        {activeBattle && (
                          <span className="text-[9px] bg-blue-500/10 font-mono text-blue-400 px-2 py-0.5 rounded border border-blue-500/15 flex items-center gap-1">
                            ⚔️ BATALHA PK
                          </span>
                        )}

                        {isTight && (
                          <span className="text-[9px] bg-amber-500/10 font-mono text-amber-400 px-2 py-0.5 rounded border border-amber-500/15 flex items-center gap-1">
                            ⚡ PLACAR APERTADO
                          </span>
                        )}

                        {matchesGoal && (
                          <span className="text-[9px] bg-indigo-500/10 font-mono text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/15 flex items-center gap-1">
                            🎯 MAIS TOCADOS
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer call to action */}
                    <div className="pt-3 border-t border-white/5 mt-3 flex items-center justify-between">
                      {isVerySmall ? (
                        <div className="text-[9px] text-zinc-450 flex items-center gap-1">
                          👤 <b>&lt; 10</b> espectadores
                        </div>
                      ) : (
                        <div className="text-[9px] text-zinc-500">
                          🌟 Sandbox Recomendados
                        </div>
                      )}

                      {activeBattle ? (
                        <button
                          onClick={() => onSelectBattle(activeBattle)}
                          className="bg-blue-600 hover:bg-blue-500 hover:translate-x-0.5 transition-all text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1 select-none cursor-pointer"
                        >
                          Apoiar na Arena
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : creator.isLive ? (
                        <button
                          onClick={() => {
                            // Trigger join room
                            showToast(`👤 Entrando na live recomendada de ${creator.name}!`);
                            // simulate trigger of underdog view if subscriber count is low
                            if (isVerySmall) {
                              handleTriggerAction('underdog_view', 1);
                            }
                            onNavigate('spectator-pk-room');
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1 select-none cursor-pointer"
                        >
                          Entrar na Live
                          <Tv className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[9px] text-zinc-650 italic font-medium">Off-line</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sponsoring Sandbox explanation card */}
          <div className="bg-zinc-900/30 p-4 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-rose-400 font-extrabold block">Fomento à audiência ativa</span>
              <p className="text-[11px] text-zinc-450 leading-relaxed font-sans max-w-lg">
                Selecione salas com baixa audiência para acumular bônus multiplicadores de XP ao comentar. A gamificação estimula a distribuição homogênea do público da plataforma.
              </p>
            </div>
            <button
              onClick={() => handleTriggerAction('share_room', 1)}
              className="text-[10px] font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white p-2.5 rounded-xl border border-white/5 cursor-pointer select-none transition flex-shrink-0 flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              Compartilhar Sala
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Viewer Profile & Missions (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Spectator profile metadata banner */}
          <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 p-5 rounded-3xl space-y-4 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Award className="w-20 h-20 text-yellow-500" />
            </div>

            <span className="text-[9px] font-mono bg-amber-500/15 text-amber-400 font-black tracking-widest uppercase px-2 py-0.5 rounded border border-amber-500/20 select-none">
              Nível & XP do Espectador
            </span>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-amber-400 to-yellow-600 rounded-2xl flex items-center justify-center text-white font-black text-xl italic shadow-md shadow-yellow-500/20 select-none">
                {profile.level}
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Nível do Perfil</span>
                <span className="text-sm font-extrabold text-white block">Apoiador Lendário</span>
              </div>
            </div>

            {/* XP progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-550">Progresso de XP</span>
                <span className="text-zinc-300 font-bold">{profile.xp} / {profile.xpToNextLevel} XP</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (profile.xp / profile.xpToNextLevel) * 100)}%` }}
                />
              </div>
            </div>

            {/* Weekly rank counter info */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-zinc-950/45 border border-white/5 p-2 rounded-xl text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Pódio Semanal</span>
                <span className="text-xs font-mono font-extrabold text-white block mt-1"># {profile.weeklyRank}º Lugar</span>
              </div>
              <div className="bg-zinc-950/45 border border-white/5 p-2 rounded-xl text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">Pontos Globais</span>
                <span className="text-xs font-mono font-extrabold text-amber-400 block mt-1">🪙 {profile.weeklyPoints.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* VIEWER MISSIONS INTERACTIVE PANEL */}
          <div className="bg-zinc-900/60 border border-white/10 p-5 rounded-3xl space-y-4 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Target className="w-4 h-4 text-rose-500" />
                Mapeamento de Missões
              </h3>
              <span className="text-[8px] font-mono text-zinc-500 block uppercase">Sandbox ativa</span>
            </div>

            <p className="text-[11px] text-zinc-500 font-sans italic leading-normal">
              Participe do ecossistema das lives e complete as tarefas. O sandbox computará os progressos nas salas PK reais ou clique em "Simular" abaixo para fins de revisão direta.
            </p>

            {/* List the missions */}
            <div className="space-y-3">
              {missions.map((m) => (
                <div 
                  key={m.id} 
                  className={`p-3 rounded-xl border space-y-2.5 transition duration-150 ${
                    m.status === 'completed' 
                      ? 'bg-zinc-950/40 border-emerald-500/25' 
                      : 'bg-zinc-950 border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block leading-tight">{m.title}</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">{m.description}</p>
                    </div>

                    <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 font-extrabold px-1.5 py-0.5 rounded flex-shrink-0 select-none">
                      +{m.xpReward} XP
                    </span>
                  </div>

                  {/* Progress display */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-650">
                      <span>Progresso</span>
                      <span>{m.currentCount} / {m.targetCount}</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          m.status === 'completed' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[9px] text-zinc-500 font-extrabold flex items-center gap-1">
                      {m.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-400 uppercase tracking-wide">Concluído! Unlocked badge: {m.badgeReward?.split(' ')[0]}</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-amber-500/80">Disponível</span>
                        </>
                      )}
                    </span>

                    {m.status !== 'completed' && (
                      <div className="flex gap-1.5">
                        {m.triggerAction === 'watch_minute' ? (
                          <button
                            onClick={startSimulateWatchTime}
                            disabled={isSimulatingWatch}
                            className={`text-[9px] font-mono select-none px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 transition cursor-pointer font-bold ${
                              isSimulatingWatch ? 'opacity-60 animate-pulse' : ''
                            }`}
                          >
                            {isSimulatingWatch ? `Assistindo (${watchProgressVal}%)` : 'Assistir 3m'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTriggerAction(m.triggerAction, 1)}
                            className="text-[9px] font-mono select-none px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-750 hover:text-white text-zinc-300 transition cursor-pointer"
                          >
                            Simular
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* DYNAMIC VIEWER UNLOCKED BADGES LIST */}
          <div className="bg-zinc-900/60 border border-white/10 p-5 rounded-3xl space-y-4 backdrop-blur-md shadow-2xl">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 select-none pb-2 border-b border-white/5">
              <Award className="w-4 h-4 text-amber-500" />
              Badges Importadas ({profile.badges.length})
            </h3>

            {profile.badges.length === 0 ? (
              <p className="text-[10px] text-zinc-500 py-4 text-center">Nenhum emblema desbloqueado. Complete missões para habilitar.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {profile.badges.map((b) => (
                  <div key={b.id} className="p-2.5 bg-zinc-950/80 border border-white/5 rounded-xl text-center space-y-1 hover:border-amber-400/30 transition">
                    <span className="text-2xl filter drop-shadow block select-none">{b.icon}</span>
                    <span className="text-[10px] text-zinc-100 font-extrabold block truncate leading-tight">{b.name}</span>
                    <span className="text-[8px] text-zinc-500 block leading-tight truncate">{b.description}</span>
                    <span className="text-[8px] text-zinc-650 block font-mono">{b.dateUnlocked}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WEAK LEADERBOARD OF SANDBOX SPONSORS */}
          <div className="bg-zinc-900/60 border border-white/10 p-5 rounded-3xl space-y-4 shadow-2xl">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 select-none pb-2 border-b border-white/5">
              <Trophy className="w-4 h-4 text-yellow-500 animate-pulse" />
              Ranking Semanal de Apoiadores
            </h3>
            
            <p className="text-[10px] text-zinc-550 leading-relaxed font-sans">
              Base de dados consolidando moedas gastas e missões concluídas na central. Sem prêmios em dinheiro, recompensa baseia-se exclusivamente em destaque visual no feed.
            </p>

            <div className="space-y-2.5">
              {[
                { name: 'Elenilton Barreto', rank: 1, spentCups: 75200, emoji: '🥇', color: 'text-yellow-400' },
                { name: 'Gamer_Pro_SP', rank: 2, spentCups: 51000, emoji: '🥈', color: 'text-zinc-300' },
                { name: 'Alice_Silveira', rank: 3, spentCups: 39500, emoji: '🥉', color: 'text-amber-650' },
                { name: 'Você (Torcedor)', rank: profile.weeklyRank, spentCups: profile.weeklyPoints, emoji: '🌟', color: 'text-amber-500' }
              ].sort((a,b) => b.spentCups - a.spentCups).map((member, idx) => (
                <div 
                  key={idx} 
                  className={`p-2 rounded-xl flex items-center justify-between transition-colors ${
                    member.name.includes('Você') ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-zinc-950/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <span className="text-xs select-none">{member.emoji}</span>
                    <div>
                      <span className="text-[10px] font-extrabold text-white block truncate">{member.name}</span>
                      <span className="text-[8px] font-mono text-zinc-550 block">Ranking #{idx + 1}º geral</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-500">🪙 {member.spentCups.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
