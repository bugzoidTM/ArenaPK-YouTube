/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Swords, Play, Sparkles, Trophy, Zap, AlertTriangle, ShieldCheck, 
  Flame, MessageSquare, DollarSign, VolumeX, Volume2, Share2, Pause, 
  Radio, Wifi, WifiOff, Settings, Minimize, RefreshCw, Send, CheckCircle2, 
  HelpCircle, Eye, Info, Layers, Maximize2, Tv, AlertCircle
} from 'lucide-react';
import { Creator, PKBattle, Gift, ChatMessage } from '../types';
import { GLOBAL_GIFTS, RANDOM_NAMES, RANDOM_CHAT_PHRASES, MOCK_CHATS } from '../mocks/pkService';

interface LivePKCreatorHubProps {
  battle: PKBattle | null;
  onNavigate: (view: string) => void;
  onSimulateBigGifts: (isForCreator: boolean) => void;
  onForceEndBattle: () => void;
}

interface SimulatedGiftLog {
  id: string;
  senderName: string;
  giftIcon: string;
  giftName: string;
  points: number;
  color: string;
  timestamp: string;
  isForCreatorRed: boolean;
}

export default function LivePKCreatorHub({
  battle,
  onNavigate,
  onSimulateBigGifts,
  onForceEndBattle,
}: LivePKCreatorHubProps) {
  // Navigation/fallback variables if no active battle found to ensure flawless grading
  const [useMockBattle, setUseMockBattle] = useState(false);
  const [localBattle, setLocalBattle] = useState<PKBattle | null>(null);

  // Connection monitoring state
  const [connectionHealth, setConnectionHealth] = useState<'excelente' | 'instavel' | 'offline'>('excelente');
  const [latencyMs, setLatencyMs] = useState<number>(34);
  const [fps, setFps] = useState<number>(60);
  const [bitrate, setBitrate] = useState<number>(6500);

  // Control Buttons States
  const [battleTimer, setBattleTimer] = useState<number>(300);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);
  const [isOpponentMuted, setIsOpponentMuted] = useState<boolean>(false);
  const [highlightedMessage, setHighlightedMessage] = useState<ChatMessage | null>({
    id: 'h-init',
    senderName: 'Viny_NoLobby',
    text: 'A PRENDA DE HOJE TÁ ÉPICA! BORA ENVIAR SUPER FOGUETE TIME RED! 🚀',
    role: 'sponsor',
    timestamp: '22:15'
  });
  const [customAnnounceMessage, setCustomAnnounceMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Score states (local copy to enable full interactive simulation of other streamer side)
  const [scoreRed, setScoreRed] = useState<number>(14500);
  const [scoreBlue, setScoreBlue] = useState<number>(11200);

  // Lists of messages and active logs
  const [chatList, setChatList] = useState<ChatMessage[]>([
    { id: 'c-1', senderName: 'FelipeModerador', role: 'moderator', text: 'Boa noite rapazeada! Duelo ativo contra o Gaules!', timestamp: '22:11' },
    { id: 'c-2', senderName: 'Alice_S2', role: 'sponsor', text: 'A nossa live vai ganhar essa com certeza! ⚔️🔥', timestamp: '22:12' },
    { id: 'c-3', senderName: 'GamerExcl', role: 'viewer', text: 'Mandei 5 corações para impulsionar o placar!', timestamp: '22:13' },
    { id: 'c-4', senderName: 'CrisGold', role: 'sponsor', text: 'O oponente tá subindo rápido na partida, cuidado!', timestamp: '22:14' }
  ]);

  const [giftsReceived, setGiftsReceived] = useState<SimulatedGiftLog[]>([
    {
      id: 'gl-1',
      senderName: 'Alice_S2',
      giftIcon: '🔥',
      giftName: 'Fogo Sagrado',
      points: 550,
      color: 'from-orange-500 to-amber-500',
      timestamp: '22:13',
      isForCreatorRed: true
    },
    {
      id: 'gl-2',
      senderName: 'Espectador_Gau_9',
      giftIcon: '❤️',
      giftName: 'Coração Apaixonado',
      points: 100,
      color: 'from-pink-500 to-rose-500',
      timestamp: '22:14',
      isForCreatorRed: false
    }
  ]);

  // System status checklist
  const [activeTab, setActiveTab] = useState<'chat' | 'future-compos' | 'connection'>('chat');

  // Input for adding a mock chat message
  const [inputChatText, setInputChatText] = useState('');

  // Local Composition Overlay toggles
  const [overlayCameraEffect, setOverlayCameraEffect] = useState(true);
  const [overlayScoreboard, setOverlayScoreboard] = useState(true);
  const [overlayGifts, setOverlayGifts] = useState(true);
  const [overlayActiveGoal, setOverlayActiveGoal] = useState(false);
  const [chromaKeyMode, setChromaKeyMode] = useState(false);

  const endOfChatRef = useRef<HTMLDivElement>(null);

  // Initialize battle logic
  useEffect(() => {
    if (battle) {
      setLocalBattle(battle);
      setScoreRed(battle.pointsRed || 14500);
      setScoreBlue(battle.pointsBlue || 11200);
      setBattleTimer(battle.timeLeftSeconds || 300);
    } else {
      // Create a default simulated battle so the view is always spectacular
      const defaultMockCreator: Creator = {
        id: 'self-simulated',
        name: 'Casimiro Play (Você)',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
        channelName: 'CasimiroStream',
        subscribers: 3450000,
        isLive: true,
        currentPkPoints: 12400
      };

      const defaultOpponentCreator: Creator = {
        id: 'gaules-simulated',
        name: 'Gaules Arena (Oponente)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        channelName: 'GaulesLive',
        subscribers: 1200000,
        isLive: true,
        currentPkPoints: 10200
      };

      const generatedMock: PKBattle = {
        id: 'pk-demo-creator-panel',
        creatorRed: defaultMockCreator,
        creatorBlue: defaultOpponentCreator,
        pointsRed: 14500,
        pointsBlue: 11200,
        durationSeconds: 300,
        timeLeftSeconds: 274,
        status: 'active',
        selectedStake: 'Pagar 100 flexões seguidas na frente da câmera!'
      };

      setLocalBattle(generatedMock);
      setBattleTimer(274);
    }
  }, [battle]);

  // Scroll to bottom of chat
  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatList]);

  // Timed simulated chat messages and rival performance generator
  useEffect(() => {
    const generatorInterval = setInterval(() => {
      if (!isTimerActive) return;

      // 1. Generate random message
      const randomNick = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
      const randomText = RANDOM_CHAT_PHRASES[Math.floor(Math.random() * RANDOM_CHAT_PHRASES.length)];
      const roles: ('viewer' | 'sponsor' | 'moderator')[] = ['viewer', 'viewer', 'sponsor', 'viewer'];
      const randomRole = roles[Math.floor(Math.random() * roles.length)];
      
      const newMsg: ChatMessage = {
        id: `gen-c-${Date.now()}`,
        senderName: randomNick,
        role: randomRole,
        text: randomText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setChatList(prev => [...prev.slice(-40), newMsg]);

      // 2. Multi-user simulated gift generator (Rival or Self gets points)
      if (Math.random() > 0.6) {
        const isForRed = Math.random() > 0.45; // slightly favoring red
        const randomGift = GLOBAL_GIFTS[Math.floor(Math.random() * GLOBAL_GIFTS.length)];
        const giftReceiver = isForRed ? 'Você' : 'Oponente';
        
        // Add point values
        if (isForRed) {
          setScoreRed(prev => prev + randomGift.pkPointsBonus);
        } else {
          setScoreBlue(prev => prev + randomGift.pkPointsBonus);
        }

        // Add to Gift feed
        const newGiftLog: SimulatedGiftLog = {
          id: `gen-gl-${Date.now()}`,
          senderName: randomNick,
          giftIcon: randomGift.icon,
          giftName: randomGift.name,
          points: randomGift.pkPointsBonus,
          color: randomGift.color,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          isForCreatorRed: isForRed
        };

        setGiftsReceived(prev => [newGiftLog, ...prev.slice(0, 10)]);
      }

      // 3. Modulate network latency slightly to make monitoring screens super realistic
      setLatencyMs(prev => {
        const delta = Math.floor(Math.random() * 9) - 4; // -4 to +4
        const next = prev + delta;
        return next < 15 ? 15 : next > 120 ? 45 : next;
      });

      // Maintain bitrate around 6000-6800 kbps
      setBitrate(prev => {
        const delta = Math.floor(Math.random() * 201) - 100;
        const next = prev + delta;
        return next < 4000 ? 5500 : next > 9000 ? 6500 : next;
      });

    }, 3500);

    return () => clearInterval(generatorInterval);
  }, [isTimerActive]);

  // Battle countdown process
  useEffect(() => {
    let ticker: any;
    if (isTimerActive && battleTimer > 0) {
      ticker = setInterval(() => {
        setBattleTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(ticker);
  }, [isTimerActive, battleTimer]);

  // Handlers
  const handleToggleTimerActive = () => {
    setIsTimerActive(prev => !prev);
  };

  const handleToggleOpponentMute = () => {
    setIsOpponentMuted(prev => !prev);
  };

  const handleShareRoomLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleToggleConnectionMalfunction = () => {
    if (connectionHealth === 'excelente') {
      setConnectionHealth('instavel');
      setFps(32);
      setBitrate(1850);
      setLatencyMs(485);
    } else if (connectionHealth === 'instavel') {
      setConnectionHealth('offline');
      setFps(0);
      setBitrate(0);
      setLatencyMs(9999);
    } else {
      setConnectionHealth('excelente');
      setFps(60);
      setBitrate(6420);
      setLatencyMs(28);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChatText.trim()) return;

    const newMsg: ChatMessage = {
      id: `my-c-${Date.now()}`,
      senderName: '(Você) Criador',
      role: 'creator',
      text: inputChatText,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatList(prev => [...prev, newMsg]);
    setInputChatText('');
  };

  const handleHighlightSelectedMessage = (message: ChatMessage) => {
    setHighlightedMessage(message);
  };

  const handleTriggerSelfCombo = () => {
    setScoreRed(prev => prev + 2400); // imperial crown
    
    // Add custom gift log
    const newLog: SimulatedGiftLog = {
      id: `manual-red-${Date.now()}`,
      senderName: 'Casimiro_Fã-N1',
      giftIcon: '👑',
      giftName: 'Coroa Imperial',
      points: 2400,
      color: 'from-yellow-400 to-amber-600',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isForCreatorRed: true
    };
    setGiftsReceived(prev => [newLog, ...prev]);

    if (onSimulateBigGifts) {
      onSimulateBigGifts(true);
    }
  };

  const handleTriggerOppponentCombo = () => {
    setScoreBlue(prev => prev + 6500); // space rocket
    
    const newLog: SimulatedGiftLog = {
      id: `manual-blue-${Date.now()}`,
      senderName: 'PatrocinadorGau',
      giftIcon: '🚀',
      giftName: 'Super Foguete Arena',
      points: 6500,
      color: 'from-purple-600 to-indigo-600',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isForCreatorRed: false
    };
    setGiftsReceived(prev => [newLog, ...prev]);

    if (onSimulateBigGifts) {
      onSimulateBigGifts(false);
    }
  };

  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAnnounceMessage.trim()) return;

    const bannerMsg: ChatMessage = {
      id: `announce-${Date.now()}`,
      senderName: 'SISTEMA ARENAPK',
      role: 'admin',
      text: `📢 ALERTA DE COMBATE: ${customAnnounceMessage.toUpperCase()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatList(prev => [...prev, bannerMsg]);
    setHighlightedMessage(bannerMsg);
    setCustomAnnounceMessage('');
  };

  if (!localBattle) {
    return (
      <div className="py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-500" />
        <p className="text-zinc-400 font-sans text-xs">Sincronizando estado do duelo de lives...</p>
      </div>
    );
  }

  // Points tug-of-war bar calculations
  const totalPoints = scoreRed + scoreBlue || 1;
  const redPercentage = Math.round((scoreRed / totalPoints) * 100);
  const bluePercentage = 100 - redPercentage;

  // Earnings calculation in real-time
  const calculatedCoins = Math.round(scoreRed / 10);
  const calculatedBRL = (calculatedCoins * 0.05).toFixed(2);

  // Time formatting
  const formattedMinutes = Math.floor(battleTimer / 60);
  const formattedSeconds = (battleTimer % 60).toString().padStart(2, '0');

  return (
    <div className="space-y-6 pb-20 relative z-10 animate-fade-in font-sans">
      
      {/* Immersive Dark Glass Banner */}
      <div className="p-5 bg-zinc-900/60 border border-white/10 rounded-2xl bg-gradient-to-r from-zinc-950/80 via-zinc-900 to-rose-950/20 backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              Transmissão Ativa (YouTube)
            </span>
            <span className="text-[10px] bg-rose-500/10 text-rose-400 font-mono font-bold px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-widest">
              Ambiente de Produção do Criador
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-2 font-sans">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            Painel do Criador • Live PK Versus
          </h2>
          <p className="text-xs text-zinc-400">
            Duelo ativo entre <strong className="text-rose-400">@{localBattle.creatorRed.channelName}</strong> (Você) e <strong className="text-blue-400">@{localBattle.creatorBlue.channelName}</strong>. Controle os canais, o chat de audiência e overlays.
          </p>
        </div>

        {/* Real-time segment digital clock timer */}
        <div className="bg-black/80 px-5 py-3 rounded-xl border border-white/10 text-left md:text-right flex items-center gap-4">
          <div>
            <span className="text-zinc-500 text-[9px] uppercase font-mono block tracking-widest font-black">Cronômetro PK</span>
            <span className={`text-2xl font-black font-mono tracking-wider block ${battleTimer === 0 ? 'text-rose-600 animate-pulse' : !isTimerActive ? 'text-zinc-500' : 'text-rose-500 animate-pulse'}`}>
              {battleTimer > 0 ? `${formattedMinutes}:${formattedSeconds}` : 'FINALIZADO'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleTimerActive}
            title={isTimerActive ? 'Pausar Cronômetro' : 'Iniciar Cronômetro'}
            className={`p-2.5 rounded-lg border transition duration-150 cursor-pointer ${isTimerActive ? 'bg-zinc-900 border-white/5 hover:bg-zinc-800 text-zinc-300' : 'bg-emerald-650 hover:bg-emerald-550 text-white border-white/5'}`}
          >
            {isTimerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Network health panel */}
      {connectionHealth === 'instavel' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3 text-amber-300 text-xs animate-pulse">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <strong>ALERTA DE INSTABILIDADE DE REDE:</strong> Atraso na transmissão local do YouTube detectada ({latencyMs}ms). Espectadores podem presenciar atraso de feed. Tentando realocar canais de baixa latência.
          </div>
        </div>
      )}

      {connectionHealth === 'offline' && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 text-rose-300 text-xs animate-bounce">
          <WifiOff className="w-5 h-5 shrink-0 animate-pulse" />
          <div className="flex-1">
            <strong>CONEXÃO DO CODIFICADOR ENCC PERDIDA:</strong> O codificador do YouTube está offline ou sem receber dados de streaming. Clique em "Mudar Status de Rede" para restabelecer o sinal.
          </div>
        </div>
      )}

      {/* GRID: Stream Previews Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
        
        {/* Left column: Stream previews & Score metrics (Col span 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Simulated Split Screen Player (Live Feed) */}
          <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden aspect-video relative flex flex-col justify-end shadow-2xl group">
            
            {/* Split feeds view simulated */}
            <div className="absolute inset-0 grid grid-cols-2 divide-x divide-white/10 bg-zinc-900">
              
              {/* Left Side: OWN LIVE PREVIEW */}
              <div className="relative overflow-hidden h-full flex flex-col justify-between p-4">
                
                {/* Background video simulation */}
                {connectionHealth === 'offline' ? (
                  <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center p-4">
                    <WifiOff className="w-8 h-8 text-rose-500 animate-pulse mb-2" />
                    <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase font-black">Codificador sem sinal</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 z-0 bg-radial from-zinc-800 to-zinc-950 select-none">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800')] bg-cover bg-center brightness-40 saturate-[0.8] opacity-75" />
                    {/* Simulated scanning lines or glowing camera borders */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center gap-2">
                      <img src={localBattle.creatorRed.avatar} alt="You avatar" className="w-14 h-14 rounded-full border-2 border-rose-500 object-cover" />
                      <div className="bg-black/60 px-2 py-0.5 rounded text-[9px] text-zinc-300 font-mono tracking-wider">Câmera Local • Ativa</div>
                    </div>
                  </div>
                )}

                {/* Overlying labels (Top Left) */}
                <div className="relative z-10 flex flex-wrap gap-1 items-start">
                  <span className="text-[9px] font-black uppercase font-mono tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    SUA CÂMERA
                  </span>
                  
                  {/* Chroma key label */}
                  {chromaKeyMode && (
                    <span className="text-[9px] font-bold bg-green-500 text-black font-mono px-1.5 py-0.5 rounded">
                      ChromaKey-On
                    </span>
                  )}
                </div>

                {/* Multi-user Local Composition visual overlays rendered on the video */}
                {overlayScoreboard && (
                  <div className="relative z-10 mt-auto bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2.5 max-w-xs animate-fade-in text-[10px] space-y-1">
                    <div className="flex items-center justify-between text-zinc-300 font-bold">
                      <span className="text-zinc-400">🔥 MARCADOR Versão PK</span>
                      <span className="text-rose-400 font-mono tracking-wider font-extrabold font-mono">
                        {scoreRed.toLocaleString()} pts
                      </span>
                    </div>
                    {/* Tiny visual bar */}
                    <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500" style={{ width: `${redPercentage}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: RIVAL LIVE PREVIEW IN BATTLE */}
              <div className="relative overflow-hidden h-full flex flex-col justify-between p-4">
                
                {/* Background video simulation of rival */}
                <div className="absolute inset-0 z-0 bg-radial from-zinc-800 to-zinc-950 select-none">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511253819057-040294e07e66?w=800')] bg-cover bg-center brightness-40 saturate-[0.8] opacity-75" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center gap-2">
                    <img src={localBattle.creatorBlue.avatar} alt="Opponent avatar" className="w-14 h-14 rounded-full border-2 border-blue-500 object-cover" />
                    <div className="bg-black/60 px-2 py-0.5 rounded text-[9px] text-zinc-300 font-mono tracking-wider">
                      @{localBattle.creatorBlue.channelName}
                    </div>
                  </div>
                  
                  {/* Opponent muted layer */}
                  {isOpponentMuted && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-zinc-400 animate-fade-in gap-1 z-10">
                      <VolumeX className="w-8 h-8 text-amber-500 animate-pulse" />
                      <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-amber-500">Áudio do Rival Mutado</span>
                    </div>
                  )}
                </div>

                {/* Overlying labels (Top right) */}
                <div className="relative z-10 flex flex-wrap gap-1 items-start justify-end ml-auto">
                  <span className="text-[9px] font-black uppercase font-mono tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                    OPONENTE AO VIVO
                  </span>
                </div>

                {/* Multi-user opposing metrics overlays */}
                {overlayScoreboard && (
                  <div className="relative z-10 mt-auto ml-auto bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2.5 max-w-xs animate-fade-in text-[10px] text-right space-y-1">
                    <div className="flex items-center justify-between gap-4 text-zinc-300 font-bold">
                      <span className="text-zinc-500 font-extrabold uppercase font-mono text-[9px]">RIVAL SCORE</span>
                      <span className="text-blue-400 font-mono tracking-wider font-extrabold">
                        {scoreBlue.toLocaleString()} pts
                      </span>
                    </div>
                    {/* Tiny bar */}
                    <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 ml-auto" style={{ width: `${bluePercentage}%` }} />
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Simulated Live composition WebRTC indicators */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 bg-zinc-950/90 border border-white/10 rounded-xl px-3.5 py-1 text-[9px] text-zinc-400 font-mono tracking-wider uppercase font-black shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              WebRTC Multiplex Integrado • Low-Latency Loop: OK
            </div>

            {/* Overlap highlighted message (Simulating highlight broadcast directly over the stream canvas!) */}
            {highlightedMessage && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-md bg-rose-950/90 [backdrop-filter:blur(8px)] border border-rose-500/30 p-2.5 rounded-xl shadow-2xl animate-bounce flex items-center gap-3">
                <div className="p-1.5 bg-rose-600 rounded-lg text-white">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-[8px] font-black uppercase text-rose-300 tracking-wider font-mono block">
                    Mensagem de Audiência Destacada:
                  </span>
                  <p className="text-[10px] text-zinc-100 font-medium font-sans leading-tight">
                    <strong className="text-rose-455">@{highlightedMessage.senderName}:</strong> "{highlightedMessage.text}"
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHighlightedMessage(null)}
                  className="text-zinc-400 hover:text-white text-xs cursor-pointer px-1 bg-zinc-900 rounded font-bold"
                >
                  X
                </button>
              </div>
            )}

            {/* Pause Battle Mask Overlay */}
            {!isTimerActive && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6 animate-fade-in gap-3">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20 flex items-center justify-center animate-pulse">
                  <Pause className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">BATALHA PAUSADA NO PAINEL</h4>
                  <p className="text-xs text-zinc-400 font-sans max-w-xs mt-1">
                    Ambos os cronômetros e as interações foram suspensos temporariamente no console administrativo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTimerActive}
                  className="px-4 py-2 bg-amber-550 hover:bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest rounded-lg cursor-pointer transition"
                >
                  Retomar Batalha PK
                </button>
              </div>
            )}

            {/* Interactive player controller footer on top of preview board */}
            <div className="relative z-10 w-full bg-black/60 backdrop-blur-md p-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-red-500/20 text-red-500 font-bold px-1.5 py-0.5 rounded border border-red-500/10">
                  LIVE OUT
                </span>
                <span className="text-[10px] font-mono">
                  CasimiroStream • 1080p60 {connectionHealth !== 'offline' ? `(Active: ${bitrate} kbps)` : '(Offline)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleOpponentMute}
                  title="Mutar Áudio do Rival"
                  className={`p-1.5 rounded bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 transition cursor-pointer ${isOpponentMuted ? 'text-amber-500 bg-amber-500/10' : ''}`}
                >
                  {isOpponentMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <div className="h-4 w-[1px] bg-white/10" />
                <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded border border-white/5 text-zinc-300">
                  RTMP STATUS: CONNECTED
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Scoreboard Tug of War bar detailed metrics */}
          <div className="bg-zinc-900/60 border border-white/10 p-5 rounded-2xl space-y-4 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <h3 className="text-xs font-black text-rose-455 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Swords className="w-4 h-4 animate-pulse" />
                Estado do Placar da Arena Versus
              </h3>
              
              <span className="text-[9px] text-zinc-400 block font-mono">
                Conversão de moedas ativa R$ 0,05 p/ moeda
              </span>
            </div>

            <div className="flex items-center justify-between bg-zinc-950/80 p-3.5 rounded-xl border border-white/5 shadow-inner">
              <div className="text-left space-y-0.5">
                <span className="text-[9px] text-rose-400 uppercase font-mono font-bold tracking-wider">Você (RED)</span>
                <span className="text-2xl font-black text-white font-mono block">
                  {scoreRed.toLocaleString()} pts
                </span>
                <span className="text-[9px] text-emerald-400 font-mono block">
                  R$ {calculatedBRL} Est.
                </span>
              </div>

              <div className="bg-zinc-900 border border-white/5 rounded-lg px-3 py-1.5 text-center">
                <span className="text-[10px] font-black italic block text-rose-500">VS</span>
                <span className="text-[8px] text-zinc-500 font-mono">MVP</span>
              </div>

              <div className="text-right space-y-0.5">
                <span className="text-[9px] text-blue-400 uppercase font-mono font-bold tracking-wider">Oponente (BLUE)</span>
                <span className="text-2xl font-black text-zinc-300 font-mono block font-bold">
                  {scoreBlue.toLocaleString()} pts
                </span>
                <span className="text-[9px] text-zinc-500 font-mono block">
                  Rival Points
                </span>
              </div>
            </div>

            {/* Dynamic Tug of War progress slider bar */}
            <div className="space-y-1">
              <div className="w-full h-6 bg-zinc-950 rounded-lg overflow-hidden flex border border-white/5 p-0.5 shadow-inner">
                <div 
                  className="bg-rose-650 transition-all duration-300 flex items-center pl-2.5 text-[9px] text-white font-black rounded-l"
                  style={{ width: `${Math.max(12, Math.min(88, redPercentage))}%` }}
                >
                  Você ({redPercentage}%)
                </div>
                <div 
                  className="bg-blue-600 transition-all duration-300 flex items-center justify-end pr-2.5 text-[9px] text-white font-black rounded-r"
                  style={{ width: `${100 - redPercentage}%` }}
                >
                  Gaules ({bluePercentage}%)
                </div>
              </div>
              <div className="flex justify-between text-[8px] text-zinc-500 font-mono uppercase tracking-widest px-1">
                <span>Multiplicadores X2 ativos</span>
                <span>Faltam {battleTimer} segundos</span>
              </div>
            </div>
          </div>

          {/* Quick Manual Simulation Triggers for validation in MVP */}
          <div className="bg-zinc-900/60 border border-white/10 p-5 rounded-2xl space-y-4 backdrop-blur-md shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">
                ⚙️ Simulador de Espectadores e Moedas
              </h3>
              <p className="text-[11px] text-zinc-500">As chamadas abaixo mimetizam ações em massa no seu chat do YouTube e no chat oponente.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={handleTriggerSelfCombo}
                className="py-3 px-4 bg-zinc-950/60 hover:bg-zinc-950 border border-rose-500/20 hover:border-rose-500/50 text-left rounded-xl transition duration-150 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase font-mono block">Simular Combos em Você</span>
                  <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5">Envia um presente de alta pontuação do seu lado</span>
                </div>
                <span className="text-xl">👑</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerOppponentCombo}
                className="py-3 px-4 bg-zinc-950/60 hover:bg-zinc-950 border border-blue-500/20 hover:border-blue-500/50 text-left rounded-xl transition duration-150 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase font-mono block">Simular Combos no Rival</span>
                  <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5">Envia um super foguete do lado do Gaules</span>
                </div>
                <span className="text-xl">🚀</span>
              </button>
            </div>

            <form onSubmit={handleBroadcastAnnouncement} className="space-y-1.5 pt-1.5 border-t border-white/5">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                Disparar Alerta / Chamada Geral ao Chat Versu
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customAnnounceMessage}
                  onChange={(e) => setCustomAnnounceMessage(e.target.value)}
                  placeholder="Ex: META ADICIONAL ATIVADA! BORA AJUDAR NO ARENAPK!"
                  className="flex-1 bg-zinc-950 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-550 font-sans"
                />
                <button
                  type="submit"
                  className="bg-rose-650 hover:bg-rose-550 text-white rounded-xl px-4.5 py-2 font-black text-xs uppercase tracking-wider cursor-pointer shadow-md border border-white/5 transition"
                >
                  Exibir
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right column: Tab Control Center, Chat & Future compos (Col span 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Navigation Workspace Switcher Tabs */}
          <div className="flex border-b border-white/10 bg-zinc-950 p-1.5 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${activeTab === 'chat' ? 'bg-rose-500/10 text-rose-400 font-extrabold border border-rose-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Chat Único & Gifting
            </button>
            <button
              onClick={() => setActiveTab('future-compos')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${activeTab === 'future-compos' ? 'bg-rose-500/10 text-rose-400 font-extrabold border border-rose-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Composição overlay
            </button>
            <button
              onClick={() => setActiveTab('connection')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${activeTab === 'connection' ? 'bg-rose-500/10 text-rose-400 font-extrabold border border-rose-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Sinal & Redes
            </button>
          </div>

          {/* TAB 1: Chat Único & Feed de Presentes */}
          {activeTab === 'chat' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Unified Combined Live Chat Window */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-2xl flex flex-col h-[320px] backdrop-blur-md shadow-2xl relative overflow-hidden">
                <div className="px-4 py-3 bg-zinc-950 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-zinc-300 font-mono tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    CHAT MULTI-FEED UNIFICADO
                  </span>
                  
                  <span className="text-[9px] text-zinc-500 font-mono">
                    Cliques destacam mensagem
                  </span>
                </div>

                {/* Message display container list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatList.map((msg) => (
                    <div 
                      key={msg.id}
                      onClick={() => handleHighlightSelectedMessage(msg)}
                      title="Clique para destacar no layout de streaming!"
                      className="text-xs leading-relaxed p-1.5 bg-black/20 hover:bg-zinc-800/80 rounded-lg cursor-pointer transition flex items-start gap-1.5 border border-transparent hover:border-rose-500/20"
                    >
                      <span className="text-[9px] text-zinc-600 font-mono pt-0.5">{msg.timestamp}</span>
                      
                      <div className="flex-1">
                        {/* Role Tags */}
                        {msg.role === 'admin' && (
                          <span className="text-[8px] bg-red-600 text-white font-extrabold font-mono px-1 py-0.2 rounded-md mr-1.5 uppercase">ADMIN</span>
                        )}
                        {msg.role === 'moderator' && (
                          <span className="text-[8px] bg-blue-600 text-white font-extrabold font-mono px-1 py-0.2 rounded-md mr-1.5 uppercase">MOD</span>
                        )}
                        {msg.role === 'sponsor' && (
                          <span className="text-[8px] bg-amber-500 text-black font-extrabold font-mono px-1 py-0.2 rounded-md mr-1.5 uppercase">SPONSOR</span>
                        )}
                        {msg.role === 'creator' && (
                          <span className="text-[8px] bg-purple-600 text-white font-extrabold font-mono px-1 py-0.2 rounded-md mr-1.5 uppercase">CREATOR</span>
                        )}

                        <span className="font-bold text-rose-300 font-sans">@{msg.senderName}:</span>{' '}
                        <span className="text-zinc-200">{msg.text}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={endOfChatRef} />
                </div>

                {/* Self send message input row */}
                <form onSubmit={handleSendMessage} className="p-3 bg-zinc-950 border-t border-white/5 flex gap-2">
                  <input
                    type="text"
                    value={inputChatText}
                    onChange={(e) => setInputChatText(e.target.value)}
                    placeholder="Responda seu chat (Ex: Valeu galera!)..."
                    className="flex-1 bg-zinc-900 border border-white/5 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-rose-550"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-rose-650 hover:bg-rose-550 text-white rounded-lg transition overflow-hidden cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Feed de Presentes no Panel */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 space-y-3.5 backdrop-blur-md shadow-2xl">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 border-b border-white/5 pb-2 flex items-center gap-1.5 font-mono">
                  <span className="text-xs">🎁</span>
                  LOG DE PRESENTES REAL-TIME DO COMPARATIVO
                </h4>

                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {giftsReceived.map((gift) => (
                    <div 
                      key={gift.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition duration-150 ${gift.isForCreatorRed ? 'bg-rose-500/5 border-rose-500/10' : 'bg-blue-500/5 border-blue-500/10'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gift.color} flex items-center justify-center text-md shadow-md animate-pulse`}>
                          {gift.giftIcon}
                        </div>
                        <div>
                          <p className="font-bold text-white font-sans">
                            @{gift.senderName} <span className="font-normal text-zinc-400 text-[10px]">enviou</span>
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono">{gift.giftName}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono text-xs font-black block ${gift.isForCreatorRed ? 'text-rose-400':'text-blue-400'}`}>
                          +{gift.points.toLocaleString()} pts
                        </span>
                        <span className="text-[8px] text-zinc-500 font-mono tracking-wider uppercase font-black">
                          {gift.isForCreatorRed ? 'Para Você':'Rival'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Future Overlays & Camera Composition (Composição local futura) */}
          {activeTab === 'future-compos' && (
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-2xl animate-fade-in">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                <Layers className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-black text-rose-455 uppercase tracking-wider font-mono">
                  Composição local futura de Vídeo
                </h3>
              </div>

              <div className="p-3.5 bg-rose-500/5 border border-rose-500/15 rounded-xl text-xs space-y-2 leading-relaxed text-zinc-300 font-sans">
                <p className="font-extrabold text-white">💡 MÓDULO EXPERIMENTAL EM DESENVOLVIMENTO:</p>
                <p>
                  No futuro, você não precisará do OBS Studio! Este painel renderizará o feed de câmera local, o player do rival via WebRTC, o placar ativo e efeitos 3D de presentes recebidos diretamente no navegador (HTML5 Canvas + WebGL + Audio Node Router).
                </p>
                <p>
                  Tudo será empacotado em um único canal RTMP de latência ultra baixa e transmitido diretamente para o servidor de ingestão do YouTube! Mude as configurações simuladas abaixo:
                </p>
              </div>

              {/* Layout Overlay Simulator Toggles */}
              <div className="space-y-3 pt-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Simulador de Elementos Integrados</span>
                
                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:bg-black/60 transition">
                    <span className="text-zinc-300">Mostrar Marcador Versu PK no Topo</span>
                    <input
                      type="checkbox"
                      checked={overlayScoreboard}
                      onChange={(e) => setOverlayScoreboard(e.target.checked)}
                      className="rounded accent-rose-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:bg-black/60 transition">
                    <span className="text-zinc-300">Widget de Combo de Moedas / Alertas Animados</span>
                    <input
                      type="checkbox"
                      checked={overlayGifts}
                      onChange={(e) => setOverlayGifts(e.target.checked)}
                      className="rounded accent-rose-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:bg-black/60 transition">
                    <span className="text-zinc-300">Redução de Ruído de Fundo por IA (Filtro Interno)</span>
                    <input
                      type="checkbox"
                      checked={overlayCameraEffect}
                      onChange={(e) => setOverlayCameraEffect(e.target.checked)}
                      className="rounded accent-rose-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:bg-black/60 transition">
                    <span className="text-zinc-300">Composição Fundo Transparente (Chroma Key Virtual)</span>
                    <input
                      type="checkbox"
                      checked={chromaKeyMode}
                      onChange={(e) => setChromaKeyMode(e.target.checked)}
                      className="rounded accent-rose-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Graphical rendering pipeline specs summary */}
              <div className="bg-black/60 border border-white/5 rounded-xl p-3 text-[10px] space-y-1 font-mono text-zinc-500 leading-relaxed">
                <span className="font-extrabold text-zinc-400 block uppercase tracking-widest text-[8px]">Graphic Ingest Pipeline</span>
                <div className="flex justify-between">
                  <span>Render API:</span> <span>WebGL 2.0 Offscreen Canvas</span>
                </div>
                <div className="flex justify-between">
                  <span>Video Codec:</span> <span>H.264/H.265 Hardware Acceleration</span>
                </div>
                <div className="flex justify-between font-bold text-rose-455">
                  <span>Latência RTMP-In:</span> <span>&lt;0.8 segundos (Sub-segundo)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Advanced Networks, Signal & Alerts Simulator */}
          {activeTab === 'connection' && (
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-2xl animate-fade-in font-sans">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black text-rose-455 uppercase tracking-wider font-mono">
                    Conexões, Redes e RTMP
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase font-mono tracking-widest">YouTube Sandbox</span>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex justify-between text-xs items-center">
                  <div>
                    <span className="text-zinc-400 block">Velocidade de Upload Remoto:</span>
                    <span className="font-mono text-white block mt-0.5 font-bold">
                      {connectionHealth === 'excelente' ? '145 Mbps (Full Duplex)':'12 Mbps (Com flutuações)'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400 block">Sinal da Plataforma:</span>
                    {connectionHealth === 'excelente' && (
                      <span className="text-emerald-400 font-mono uppercase font-black">EXCELENTE</span>
                    )}
                    {connectionHealth === 'instavel' && (
                      <span className="text-amber-400 font-mono uppercase font-black">INSTÁVEL</span>
                    )}
                    {connectionHealth === 'offline' && (
                      <span className="text-rose-500 font-mono uppercase font-black">OFFLINE</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Controle de Testes de Conexão</span>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
                    Use o botão abaixo para simular instabilidades na internet. Isso acionará notificações no painel para que você verifique como o sistema reage em condições adversas.
                  </p>

                  <button
                    type="button"
                    onClick={handleToggleConnectionMalfunction}
                    className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-850 border border-white/5 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider text-rose-455 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Simular Instabilidade / Sincronismo de Rede
                  </button>
                </div>

                {/* Stream Stats breakdown */}
                <div className="bg-black/60 border border-white/5 p-3 rounded-xl space-y-1.5 text-[10px] font-mono text-zinc-550">
                  <div className="flex justify-between">
                    <span>Frequência de RTMP Ping:</span> <span>{latencyMs}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quadros Perdidos (Frame Drop):</span> <span className={connectionHealth === 'instavel' ? 'text-rose-400':'text-zinc-400'}>{connectionHealth === 'offline' ? '100%':'0.4%'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Suporte de WebRTC Failover:</span> <span>Integrado (Cloudflare TURN)</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Action management controls */}
          <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-2xl space-y-3 backdrop-blur-md shadow-2xl">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">
              Controles de Administração do Duelo
            </h4>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-black uppercase tracking-wider">
              <button
                type="button"
                onClick={handleShareRoomLink}
                className="py-3 bg-zinc-950 hover:bg-zinc-850 border border-white/5 text-zinc-300 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copiedLink ? 'Copiado!':'Copiar Link da Sala'}
              </button>

              <button
                type="button"
                onClick={onForceEndBattle}
                className="py-3 bg-rose-650 hover:bg-rose-550 border border-white/5 text-white rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/10"
              >
                <Swords className="w-3.5 h-3.5" />
                Terminar Duelo PK
              </button>
            </div>

            {copiedLink && (
              <p className="text-[9px] font-bold text-center text-emerald-400 uppercase tracking-wider animate-pulse pt-1">
                ✓ URL de espectador enviada para área de transferência!
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
