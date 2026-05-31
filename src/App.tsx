/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Swords, Video, Trophy, Shield, Wallet, Play, Flame, Youtube, 
  HelpCircle, Sparkles, LogOut, Check, AlertCircle, Info, Radio
} from 'lucide-react';
import { Creator, PKBattle, Gift, PKInvite, SystemAuditLog, PKRoom, SimulatedLive } from './types';
import { 
  INITIAL_CREATORS, INITIAL_INVITES, INITIAL_AUDIT_LOGS, 
  GLOBAL_GIFTS, RANDOM_NAMES, MOCK_CHATS
} from './services/pkService';
import { paymentService } from './services/paymentService';

// Import Views
import LandingView from './components/LandingView';
import LoginConnectView from './components/LoginConnectView';
import CreatorDashboard from './components/CreatorDashboard';
import PublicBattleRoom from './components/PublicBattleRoom';
import LivePKCreatorHub from './components/LivePKCreatorHub';
import ProfileWalletView from './components/ProfileWalletView';
import RankingView from './components/RankingView';
import ModerationView from './components/ModerationView';
import CreateLiveView from './components/CreateLiveView';
import PKRoomView from './components/PKRoomView';
import DiscoverLivesView from './components/DiscoverLivesView';
import SpectatorProfileView from './components/SpectatorProfileView';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  
  // Shared balances synced with paymentService local storage database
  const [userCoins, setUserCoinsState] = useState<number>(() => paymentService.getCoins());
  const [creatorEarningsBRL, setCreatorEarningsBRLState] = useState<number>(() => paymentService.getEarnings());

  const setUserCoins = (val: number | ((prev: number) => number)) => {
    setUserCoinsState((prev) => {
      const nextVal = typeof val === 'function' ? val(prev) : val;
      paymentService.setCoins(nextVal);
      return nextVal;
    });
  };

  const setCreatorEarningsBRL = (val: number | ((prev: number) => number)) => {
    setCreatorEarningsBRLState((prev) => {
      const nextVal = typeof val === 'function' ? val(prev) : val;
      paymentService.setEarnings(nextVal);
      return nextVal;
    });
  };

  // System Database state
  const [allCreators, setAllCreators] = useState<Creator[]>(() => {
    // Inicializar creators padrão
    return INITIAL_CREATORS;
  });

  const [connectedCreator, setConnectedCreator] = useState<Creator | null>(null);

  // Active / History of PK Battles
  const [battles, setBattles] = useState<PKBattle[]>(() => {
    // Adiciona batalha padrão entre Casimiro e Gaules para demonstração imediata
    return [
      {
        id: 'battle-demo',
        creatorRed: INITIAL_CREATORS[0], // Casimiro
        creatorBlue: INITIAL_CREATORS[1], // Gaules
        pointsRed: 12500,
        pointsBlue: 9800,
        durationSeconds: 300,
        timeLeftSeconds: 240,
        status: 'active',
        selectedStake: 'Pagar 100 flexões na câmera imediatamente!'
      }
    ];
  });

  const [selectedBattleId, setSelectedBattleId] = useState<string>('battle-demo');

  // PK room dynamic state
  const [activePKRoom, setActivePKRoom] = useState<PKRoom | null>(null);

  const handleStartPKRoom = (roomId: string, creatorA: Creator, creatorB: Creator, liveA_title: string, liveA_videoId: string) => {
    const liveVideoIds = ['U8C6EsuM_Gg', 'S_C4h7zN-7g', 'm79Hh_f0R7o', 'dQw4w9WgXcQ'];
    const randomVideoId = liveVideoIds[Math.floor(Math.random() * liveVideoIds.length)];
    const mockLiveTitleCreatorB = `DUELO PK INTERNACIONAL AO VIVO - @${creatorB.channelName} 🔥`;

    const liveAValue: SimulatedLive = {
      videoId: liveA_videoId,
      title: liveA_title,
      embedUrl: `https://www.youtube.com/embed/${liveA_videoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${liveA_videoId}`,
      status: 'live'
    };

    const liveBValue: SimulatedLive = {
      videoId: randomVideoId,
      title: mockLiveTitleCreatorB,
      embedUrl: `https://www.youtube.com/embed/${randomVideoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${randomVideoId}`,
      status: 'live'
    };

    const newRoom: PKRoom = {
      roomId: roomId,
      creatorA: creatorA,
      creatorB: { ...creatorB, isLive: true, liveTitle: mockLiveTitleCreatorB, youtubeVideoId: randomVideoId },
      liveA: liveAValue,
      liveB: liveBValue,
      scoreA: 0,
      scoreB: 0,
      timer: 300,
      status: 'active',
      gifts: GLOBAL_GIFTS,
      chatMessages: [
        {
          id: 'int-1',
          senderName: 'Sistema Arenas',
          role: 'admin',
          text: `Sala de batalha criada entre ${creatorA.name} e ${creatorB.name}! Que vença o melhor!`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        },
        ...MOCK_CHATS
      ],
      viewers: 9481,
      ranking: [
        { creatorId: creatorA.id, points: 0, rank: 1 },
        { creatorId: creatorB.id, points: 0, rank: 2 }
      ]
    };

    // Update list of creators
    setAllCreators(prev => prev.map(c => {
      if (c.id === creatorB.id) {
        return { ...c, isLive: true, liveTitle: mockLiveTitleCreatorB, youtubeVideoId: randomVideoId };
      }
      return c;
    }));

    setActivePKRoom(newRoom);
    setCurrentView('pk-room');
  };

  // Invitations
  const [invites, setInvites] = useState<PKInvite[]>(INITIAL_INVITES);

  // Moderation audits
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(INITIAL_AUDIT_LOGS);

  // Tick countdown of active battles
  useEffect(() => {
    const mainTimer = setInterval(() => {
      setBattles((prevBattles) => {
        return prevBattles.map((b) => {
          if (b.status === 'active' && b.timeLeftSeconds > 0) {
            const nextTime = b.timeLeftSeconds - 1;
            if (nextTime === 0) {
              const winnerId = b.pointsRed >= b.pointsBlue ? b.creatorRed.id : b.creatorBlue.id;
              
              // Se o criador conectado ganhou a batalha, premia o saldo dele de saque
              if (connectedCreator && winnerId === connectedCreator.id) {
                setCreatorEarningsBRL(prev => prev + 450); // Bônus em Reais por ganhar o duelo!
              }

              return { ...b, timeLeftSeconds: 0, status: 'completed', winnerId };
            }
            return { ...b, timeLeftSeconds: nextTime };
          }
          return b;
        });
      });
    }, 1000);

    return () => clearInterval(mainTimer);
  }, [connectedCreator]);

  // Method to handle a gift sent by a viewer
  const handleSendGift = (giftId: string, isForRed: boolean) => {
    const gift = GLOBAL_GIFTS.find(g => g.id === giftId);
    if (!gift) return;

    setBattles((prev) => {
      return prev.map((b) => {
        if (b.status === 'active') {
          return {
            ...b,
            pointsRed: isForRed ? b.pointsRed + gift.pkPointsBonus : b.pointsRed,
            pointsBlue: !isForRed ? b.pointsBlue + gift.pkPointsBonus : b.pointsBlue,
          };
        }
        return b;
      });
    });
  };

  // Method to connect YouTube
  const handleConnectCreator = (data: { username: string; channelName: string; avatarUrl: string }) => {
    const newCreator: Creator = {
      id: `custom-${Date.now()}`,
      name: data.username,
      avatar: data.avatarUrl,
      channelName: data.channelName,
      subscribers: 154000,
      isLive: false,
      currentPkPoints: 0
    };

    // Salva na lista
    setAllCreators(prev => [...prev, newCreator]);
    setConnectedCreator(newCreator);

    // Audit Log
    addAuditLog('setting_change', `O criador ${data.username} conectou seu canal @${data.channelName} via OAuth.`);
    
    // Redirect to Creator Dashboard
    setTimeout(() => {
      setCurrentView('creator-dashboard');
    }, 1500);
  };

  const handleDisconnectCreator = () => {
    if (connectedCreator) {
      addAuditLog('setting_change', `O criador ${connectedCreator.name} desconectou seu canal.`);
    }
    setConnectedCreator(null);
    setCurrentView('landing');
  };

  // Start Live broadcasting
  const handleStartLive = (title: string, videoId: string) => {
    if (!connectedCreator) return;

    // Atualiza estado do criador logado
    const updated = {
      ...connectedCreator,
      isLive: true,
      liveTitle: title,
      youtubeVideoId: videoId
    };

    setConnectedCreator(updated);
    setAllCreators(prev => prev.map(c => c.id === connectedCreator.id ? updated : c));

    addAuditLog('setting_change', `Criador ${connectedCreator.name} iniciou simulado de live no YouTube: "${title}"`);
    setCurrentView('creator-dashboard');
  };

  const handleStopLive = () => {
    if (!connectedCreator) return;

    const updated = {
      ...connectedCreator,
      isLive: false,
      liveTitle: undefined,
      youtubeVideoId: undefined
    };

    setConnectedCreator(updated);
    setAllCreators(prev => prev.map(c => c.id === connectedCreator.id ? updated : c));

    // Cancel active battles where this creator participates
    setBattles(prev => prev.map(b => {
      if (b.status === 'active' && (b.creatorRed.id === connectedCreator.id || b.creatorBlue.id === connectedCreator.id)) {
        return { ...b, status: 'timeout', timeLeftSeconds: 0 };
      }
      return b;
    }));

    addAuditLog('setting_change', `Criador ${connectedCreator.name} desligou sua live.`);
  };

  // Manage PK challenges
  const handleAcceptInvite = (invite: PKInvite) => {
    // Remove invite
    setInvites(prev => prev.filter(inv => inv.id !== invite.id));

    // Create a new Duel/Battle
    const newBattleId = `battle-${Date.now()}`;
    const newBattle: PKBattle = {
      id: newBattleId,
      creatorRed: invite.challenger,
      creatorBlue: invite.target,
      pointsRed: 0,
      pointsBlue: 0,
      durationSeconds: invite.durationMinutes * 60,
      timeLeftSeconds: invite.durationMinutes * 60,
      status: 'active',
      selectedStake: invite.selectedStake
    };

    setBattles(prev => [newBattle, ...prev]);
    setSelectedBattleId(newBattleId);

    addAuditLog('setting_change', `Batalha PK iniciada oficialmente! ${invite.challenger.name} VS ${invite.target.name}`);
    
    // Auto redirect
    if (connectedCreator && (invite.challenger.id === connectedCreator.id || invite.target.id === connectedCreator.id)) {
      setCurrentView('creator-battle-hub');
    } else {
      setCurrentView('spectator-pk-room');
    }
  };

  const handleDeclineInvite = (inviteId: string) => {
    setInvites(prev => prev.filter(inv => inv.id !== inviteId));
  };

  const handleSendInvite = (targetCreatorId: string, minutes: number, stake: string) => {
    if (!connectedCreator) return;

    const targetCreator = allCreators.find(c => c.id === targetCreatorId);
    if (!targetCreator) return;

    const newInvite: PKInvite = {
      id: `invite-${Date.now()}`,
      challenger: connectedCreator,
      target: targetCreator,
      durationMinutes: minutes,
      selectedStake: stake,
      status: 'pending'
    };

    // Adiciona aos convites gerais
    setInvites(prev => [newInvite, ...prev]);

    // Simulação do oponente aceitando o desafio após 6 segundos!
    setTimeout(() => {
      setInvites(prevInvites => {
        const found = prevInvites.find(i => i.id === newInvite.id);
        if (found) {
          handleAcceptInvite(found);
          alert(`Excelente! ${targetCreator.name} aceitou seu desafio PK! Redirecionando para central de combate...`);
        }
        return prevInvites;
      });
    }, 6000);
  };

  // Trigger simulated incoming invite
  const handleSimulateIncomingInvite = () => {
    if (!connectedCreator) {
      alert('Conecte seu canal primeiro para receber convites!');
      return;
    }

    // Pick a random creator that is live
    const otherLiveOnes = allCreators.filter(c => c.id !== connectedCreator.id);
    if (otherLiveOnes.length === 0) return;

    const randomApplicant = otherLiveOnes[Math.floor(Math.random() * otherLiveOnes.length)];
    
    const incoming: PKInvite = {
      id: `invite-inc-${Date.now()}`,
      challenger: randomApplicant,
      target: connectedCreator,
      durationMinutes: 5,
      selectedStake: 'Imitar voz de dublador de anime por 2 minutos!',
      status: 'pending'
    };

    setInvites(prev => [incoming, ...prev]);
    alert(`Novo convite de duelo recebido de ${randomApplicant.name}! Acesse "Duelos PK Pendentes" para responder.`);
  };

  // Big simulated gifts combo
  const handleSimulateBigGifts = (isForCreator: boolean) => {
    const randomGifts = GLOBAL_GIFTS.slice(3); // crown, rocket, portal, dragon
    const selectedGift = randomGifts[Math.floor(Math.random() * randomGifts.length)];
    const bonus = selectedGift.pkPointsBonus;

    setBattles(prev => prev.map(b => {
      if (b.status === 'active') {
        return {
          ...b,
          pointsRed: isForCreator ? b.pointsRed + bonus : b.pointsRed,
          pointsBlue: !isForCreator ? b.pointsBlue + bonus : b.pointsBlue,
        };
      }
      return b;
    }));

    addAuditLog('report', `COMBO EXPLOSIVO! Espectador enviou ${selectedGift.name} ${selectedGift.icon} de +${bonus} pts!`);
  };

  const handleForceEndBattle = () => {
    setBattles(prev => prev.map(b => {
      if (b.status === 'active') {
        const winnerId = b.pointsRed >= b.pointsBlue ? b.creatorRed.id : b.creatorBlue.id;
        return { ...b, status: 'completed', timeLeftSeconds: 0, winnerId };
      }
      return b;
    }));
    alert('Desafio PK finalizado precocemente.');
    setCurrentView('creator-dashboard');
  };

  // Audit Logs addition
  const addAuditLog = (type: 'report' | 'ban' | 'setting_change', details: string) => {
    const newLog: SystemAuditLog = {
      id: `log-gen-${Date.now()}`,
      type,
      user: connectedCreator ? connectedCreator.name : 'Espectador Anônimo',
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      resolved: false
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleClearLog = (id: string) => {
    setAuditLogs(prev => prev.filter(log => log.id !== id));
  };

  // Find the Battle selected
  const activeBattleObj = battles.find(b => b.id === selectedBattleId) || battles[0];

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased flex flex-col justify-between relative overflow-x-hidden selection:bg-rose-600 selection:text-white">
      
      {/* Immersive UI Background Blur Blobs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600 rounded-full blur-[120px]"></div>
      </div>

      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 h-16 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-4 sm:px-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 w-full relative z-10">
          
          {/* Logo Brand */}
          <div 
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-3 cursor-pointer grow-0 select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-rose-500 flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-all">
              ⚔️
            </div>
            <div>
              <span className="text-sm font-black text-zinc-100 tracking-widest block uppercase leading-none font-sans italic">
                ARENAPK <span className="text-rose-500 font-normal text-[10px] lowercase not-italic opacity-70 tracking-normal m-0 p-0">v1.0 mvp</span>
              </span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block leading-none font-sans mt-1">
                YOUTUBE PLATFORM
              </span>
            </div>
          </div>

          {/* Nav Tabs list */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setCurrentView('landing')}
              className={`px-3 py-1.5 rounded-lg transition border cursor-pointer ${
                currentView === 'landing' 
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              Principal
            </button>
            <button
              onClick={() => setCurrentView('discover')}
              className={`px-3 py-1.5 rounded-lg transition border cursor-pointer flex items-center gap-1 bg-gradient-to-r ${
                currentView === 'discover' 
                  ? 'from-rose-500/15 to-orange-500/15 border-rose-500/30 text-rose-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              <span>🧭</span>
              Descobrir
            </button>
            <button
              onClick={() => setCurrentView('spectator-pk-room')}
              className={`px-3 py-1.5 rounded-lg transition border cursor-pointer ${
                currentView === 'spectator-pk-room' 
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              Sala Pública
            </button>
            <button
              onClick={() => setCurrentView('creator-dashboard')}
              className={`px-3 py-1.5 rounded-lg transition border cursor-pointer flex items-center gap-1.5 ${
                currentView === 'creator-dashboard' || currentView === 'creator-battle-hub' 
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Painel Criador
            </button>
            <button
              onClick={() => setCurrentView('wallet')}
              className={`px-3 py-1.5 rounded-lg transition border cursor-pointer flex items-center gap-1 ${
                currentView === 'wallet' 
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              <span>🪙</span>
              Carteira
            </button>
            <button
              onClick={() => setCurrentView('spectator-profile')}
              className={`px-3 py-1.5 rounded-lg transition border cursor-pointer flex items-center gap-1 ${
                currentView === 'spectator-profile' 
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              <span>👤</span>
              Meu Perfil
            </button>
            <button
              onClick={() => setCurrentView('ranking')}
              className={`px-3 py-1.5 rounded-lg transition border cursor-pointer ${
                currentView === 'ranking' 
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              Ranking
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className={`px-3 py-1.5 rounded-lg transition border cursor-pointer flex items-center gap-1 ${
                currentView === 'admin' 
                  ? 'bg-zinc-800 border-white/10 text-zinc-100' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              Moderação
            </button>
          </nav>

          {/* Quick profile indicators / login connections portal */}
          <div className="flex items-center gap-3">
            
            {/* Spectator wallet display */}
            <div 
              onClick={() => setCurrentView('wallet')}
              title="Acessar sua carteira de moedas" 
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 border border-white/10 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer transition select-none"
            >
              <span className="text-sm">💎</span>
              <span className="font-mono text-xs font-bold text-amber-400">{userCoins.toLocaleString()}</span>
            </div>

            {/* Sychronized Creator profile badge */}
            {connectedCreator ? (
              <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-lg p-1.5 px-3 select-none">
                <span className="text-[10px] text-zinc-400 font-bold hidden md:inline truncate max-w-[80px]">
                  {connectedCreator.name}
                </span>
                
                <img 
                  onClick={() => setCurrentView('creator-dashboard')}
                  src={connectedCreator.avatar} 
                  alt="Avatar" 
                  className="w-7 h-7 rounded-full object-cover border border-rose-500 cursor-pointer hover:opacity-85"
                />

                <button
                  type="button"
                  onClick={handleDisconnectCreator}
                  title="Desconectar do canal"
                  className="p-1 rounded-full text-zinc-500 hover:text-rose-450 hover:bg-zinc-800 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentView('login')}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
              >
                <Youtube className="w-4 h-4 fill-current text-white" />
                Vincular Canal
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Global alert banner if in demo */}
      <div className="relative z-10 bg-gradient-to-r from-zinc-950 via-rose-950/20 to-zinc-950 border-b border-white/10 py-2.5 px-4 text-center text-[10px] md:text-xs">
        <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded mr-2 uppercase font-mono tracking-wider border border-rose-500/20">MVP SIMULADO</span>
        Ambiente de ensaios gráficos: todas as chamadas de API do YouTube, WebSockets, PIX e transações de rede estão funcionando simuladas localmente.
      </div>

      {/* Mobile responsive navigation toolbar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-zinc-950/90 [backdrop-filter:blur(8px)] border-t border-white/10 z-50 flex justify-around items-center h-16 text-[10px] font-bold py-1">
        <button 
          onClick={() => setCurrentView('landing')} 
          className={`flex flex-col items-center gap-1 transition ${currentView === 'landing' ? 'text-blue-400' : 'text-zinc-500'}`}
        >
          <span>🏠</span>
          Principal
        </button>
        <button 
          onClick={() => setCurrentView('discover')} 
          className={`flex flex-col items-center gap-1 transition ${currentView === 'discover' ? 'text-rose-450' : 'text-zinc-500'}`}
        >
          <span>🧭</span>
          Descobrir
        </button>
        <button 
          onClick={() => setCurrentView('spectator-pk-room')} 
          className={`flex flex-col items-center gap-1 transition ${currentView === 'spectator-pk-room' ? 'text-blue-400' : 'text-zinc-500'}`}
        >
          <span>⚔️</span>
          Sala PK
        </button>
        <button 
          onClick={() => setCurrentView('creator-dashboard')} 
          className={`flex flex-col items-center gap-1 transition ${currentView === 'creator-dashboard' || currentView === 'creator-battle-hub' ? 'text-rose-450' : 'text-zinc-500'}`}
        >
          <span>🎥</span>
          Painel
        </button>
        <button 
          onClick={() => setCurrentView('wallet')} 
          className={`flex flex-col items-center gap-1 transition ${currentView === 'wallet' ? 'text-amber-400' : 'text-zinc-500'}`}
        >
          <span>🪙</span>
          Carteira
        </button>
        <button 
          onClick={() => setCurrentView('spectator-profile')} 
          className={`flex flex-col items-center gap-1 transition ${currentView === 'spectator-profile' ? 'text-purple-400' : 'text-zinc-500'}`}
        >
          <span>👤</span>
          Perfil
        </button>
      </div>

      {/* Primary Routing Screen Center Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full relative">
        <div className="animate-fade-in">
          
          {currentView === 'landing' && (
            <LandingView 
              onNavigate={setCurrentView}
              activeCreatorCount={allCreators.filter(c => c.isLive).length}
              activeBattles={battles.filter(b => b.status === 'active')}
              onSelectBattle={(b) => {
                setSelectedBattleId(b.id);
                setCurrentView('spectator-pk-room');
              }}
            />
          )}

          {currentView === 'login' && (
            <LoginConnectView
              onConnect={handleConnectCreator}
              isAlreadyConnected={!!connectedCreator}
              connectedCreator={connectedCreator}
              onDisconnect={handleDisconnectCreator}
            />
          )}

          {currentView === 'create-live' && (
            <CreateLiveView
              connectedCreator={connectedCreator}
              onNavigate={setCurrentView}
              onLiveCreated={handleStartLive}
            />
          )}

          {currentView === 'creator-dashboard' && (
            <CreatorDashboard
              connectedCreator={connectedCreator}
              onNavigate={setCurrentView}
              onStartLive={handleStartLive}
              onStopLive={handleStopLive}
              invites={invites.filter(i => connectedCreator && i.target.id === connectedCreator.id)}
              onAcceptInvite={handleAcceptInvite}
              onDeclineInvite={handleDeclineInvite}
              onSendInvite={handleSendInvite}
              allCreators={allCreators}
              onSimulateIncomingInvite={handleSimulateIncomingInvite}
              creatorEarningsBRL={creatorEarningsBRL}
              onStartPKRoom={handleStartPKRoom}
              activePKRoom={activePKRoom}
            />
          )}

          {currentView === 'pk-room' && activePKRoom && (
            <PKRoomView
              room={activePKRoom}
              onNavigate={setCurrentView}
              userCoins={userCoins}
              onCoinsChange={setUserCoins}
              onUpdateRoom={setActivePKRoom}
            />
          )}

          {currentView === 'spectator-pk-room' && (
            <PublicBattleRoom
              battle={activeBattleObj}
              onSendGift={handleSendGift}
              userCoins={userCoins}
              onCoinsChange={setUserCoins}
              onNavigate={setCurrentView}
              onTickBattle={(bId) => {
                // Time counts down naturally through App.tsx timer cycle
              }}
            />
          )}

          {currentView === 'creator-battle-hub' && (
            <LivePKCreatorHub
              battle={battles.find(b => b.status === 'active' && connectedCreator && (b.creatorRed.id === connectedCreator.id || b.creatorBlue.id === connectedCreator.id)) || null}
              onNavigate={setCurrentView}
              onSimulateBigGifts={handleSimulateBigGifts}
              onForceEndBattle={handleForceEndBattle}
            />
          )}

          {currentView === 'wallet' && (
            <ProfileWalletView
              userCoins={userCoins}
              onCoinsChange={setUserCoins}
              creatorEarningsBRL={creatorEarningsBRL}
              onEarningsChange={setCreatorEarningsBRL}
            />
          )}

          {currentView === 'discover' && (
            <DiscoverLivesView 
              onNavigate={setCurrentView}
              allCreators={allCreators}
              activeBattles={battles}
              onSelectBattle={(b) => {
                setSelectedBattleId(b.id);
                setCurrentView('spectator-pk-room');
              }}
            />
          )}

          {currentView === 'spectator-profile' && (
            <SpectatorProfileView 
              onNavigate={setCurrentView}
              allCreators={allCreators}
            />
          )}

          {currentView === 'ranking' && (
            <RankingView 
              allCreators={allCreators} 
            />
          )}

          {currentView === 'admin' && (
            <ModerationView
              auditLogs={auditLogs}
              onAddAuditLog={addAuditLog}
              onClearLog={handleClearLog}
              allCreators={allCreators}
              setAllCreators={setAllCreators}
              battles={battles}
              setBattles={setBattles}
              activePKRoom={activePKRoom}
              setActivePKRoom={setActivePKRoom}
            />
          )}

        </div>
      </main>

      {/* Site Footer */}
      <footer className="relative z-10 bg-black/40 border-t border-white/10 py-8 text-center text-xs text-zinc-400 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="font-semibold text-zinc-300">
            ArenaPK YouTube MVP • Plataforma de Batalhas PK Gamificadas
          </p>
          <p className="max-w-lg mx-auto text-[11px] text-zinc-500 leading-relaxed">
            Este software é um modelo demonstrativo interativo simulando as dezenas de transações em tempo real que ocorrem em batalhas versus (PK) utilizando os feeds de players públicos oficiais do YouTube incorporados de forma assíncrona.
          </p>
          <div className="pt-2 text-[10px] text-zinc-650 font-mono flex items-center justify-center gap-4">
            <span>Desenvolvido com React + Tailwind CSS</span>
            <span>•</span>
            <span>Selo de Conformidade YouTube API Sandbox</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
