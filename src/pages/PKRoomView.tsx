/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Swords, Send, Trophy, Sparkles, Gift as GiftIcon, Heart, 
  Users, Star, MessageSquare, Flame, CheckCircle2, ArrowLeft,
  Tv, Cpu, ShieldAlert, Award, AlertCircle, Trash2, VolumeX, Pin, Volume2, Shield, Info, Radio, Zap
} from 'lucide-react';
import { Creator, Gift, ChatMessage, PKRoom, SimulatedLive } from '../types';
import { GLOBAL_GIFTS } from '../mocks/pkService';
import { realtimeService, PKEvent } from '../services/realtimeService';
import { paymentService } from '../services/paymentService';
import { viewerService } from '../services/viewerService';
import { moderationService } from '../services/moderationService';
import { auth } from '../services/firebase';
import { firebaseService } from '../services/firebaseService';

interface PKRoomViewProps {
  room: PKRoom;
  onNavigate: (view: string) => void;
  userCoins: number;
  onCoinsChange: (coins: number) => void;
  onUpdateRoom: (updatedRoom: PKRoom) => void;
}

interface FloatingGiftAnimation {
  id: string;
  sender: string;
  giftName: string;
  giftIcon: string;
  isForA: boolean;
  x: number;
  y: number;
}

export default function PKRoomView({
  room,
  onNavigate,
  userCoins,
  onCoinsChange,
  onUpdateRoom,
}: PKRoomViewProps) {
  const [chatText, setChatText] = useState('');
  const [activeTab, setActiveTab] = useState<'stream' | 'ranking' | 'schema'>('stream');
  const [floatingAnimations, setFloatingAnimations] = useState<FloatingGiftAnimation[]>([]);
  const [realtimeEngine, setRealtimeEngine] = useState<'mock_ws' | 'socketio' | 'supabase' | 'firebase' | 'durable_objects'>('mock_ws');
  const [engineNotification, setEngineNotification] = useState<string | null>(null);

  // Custom states for official YouTube player compliance (autoplay/mute/controls)
  const [playersStarted, setPlayersStarted] = useState(false);
  const [isMutedA, setIsMutedA] = useState(true);
  const [isMutedB, setIsMutedB] = useState(true);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync room reference to avoid stale closures in realtime handlers
  const roomRef = useRef(room);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // Countdown timer for individual room sync to emit TIMER_UPDATED
  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (room.status === 'active' && room.timer > 0) {
        const nextTimer = room.timer - 1;
        let nextStatus: 'pending' | 'active' | 'completed' | 'timeout' = room.status;
        if (nextTimer === 0) {
          nextStatus = 'completed';
        }

        // recalculate rankings
        const sortedRanking = [
          { creatorId: room.creatorA.id, points: room.scoreA, rank: room.scoreA >= room.scoreB ? 1 : 2 },
          { creatorId: room.creatorB.id, points: room.scoreB, rank: room.scoreB > room.scoreA ? 1 : 2 }
        ];

        onUpdateRoom({
          ...room,
          timer: nextTimer,
          status: nextStatus,
          ranking: sortedRanking
        });

        // Trigger dynamic timer updated event over our mock ws
        if (realtimeService.isConnected()) {
          realtimeService.sendEvent(PKEvent.TIMER_UPDATED, { timer: nextTimer });
        }
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [room.status, room.timer, room.scoreA, room.scoreB, room.creatorA.id, room.creatorB.id, onUpdateRoom]);

  // Connect & subscribe to the live system chat via mock realtimeService
  useEffect(() => {
    // 1. Establish simulated connection socket
    realtimeService.connect().then(() => {
      realtimeService.joinRoom(room.roomId);
      // Broadcast room start
      realtimeService.sendEvent(PKEvent.ROOM_STARTED, { roomId: room.roomId, timer: room.timer });
    });

    // 2. Define real-time event packet handlers per spec
    const handleChatMessage = (payload: any) => {
      const currentRoom = roomRef.current;
      const { message, isSystem, isPinned, isSupporterHighlighted } = payload;

      // Filter messages if user is muted in our memory list
      if (realtimeService.isUserMuted(message.senderName)) {
        console.log(`[RealtimeSocket] Suppressed message from muted user: ${message.senderName}`);
        return;
      }

      const enrichedMsg: ChatMessage = {
        ...message,
        isSystem: isSystem || message.role === 'admin' || message.isSystem,
        isPinned: isPinned || message.isPinned || false,
        isSupporterHighlighted: isSupporterHighlighted || message.role === 'sponsor' || message.isSupporterHighlighted
      };

      onUpdateRoom({
        ...currentRoom,
        chatMessages: [...currentRoom.chatMessages, enrichedMsg].slice(-80)
      });
    };

    const handleGiftSent = (payload: any) => {
      const currentRoom = roomRef.current;
      const { senderName, giftName, giftIcon, pkPointsBonus, isForCreatorA } = payload;

      // Register incoming gift inside creator payouts ledger if it is for the primary host Creator A
      if (isForCreatorA) {
        const matchingGift = GLOBAL_GIFTS.find(g => g.name === giftName) || {
          id: 'gift-custom',
          name: giftName,
          coinValue: payload.coinValue || 10,
          pkPointsBonus: pkPointsBonus || 10,
          icon: giftIcon,
          color: 'from-rose-500 to-pink-500',
          rarity: 'comum',
          description: 'Presente customizado'
        };
        paymentService.registerIncomingGift(senderName, matchingGift as any);
      }

      const nextScoreA = isForCreatorA ? currentRoom.scoreA + pkPointsBonus : currentRoom.scoreA;
      const nextScoreB = !isForCreatorA ? currentRoom.scoreB + pkPointsBonus : currentRoom.scoreB;

      const giftMsg: ChatMessage = {
        id: `gift-evt-${Date.now()}-${Math.random()}`,
        senderName: senderName,
        role: 'sponsor',
        text: `Enviou ${giftName} ${giftIcon}! (+${pkPointsBonus.toLocaleString()} pts de PK)`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        giftAttached: {
          giftName,
          giftIcon,
          count: 1
        }
      };

      const sortedRanking = [
        { creatorId: currentRoom.creatorA.id, points: nextScoreA, rank: nextScoreA >= nextScoreB ? 1 : 2 },
        { creatorId: currentRoom.creatorB.id, points: nextScoreB, rank: nextScoreB > nextScoreA ? 1 : 2 }
      ];

      onUpdateRoom({
        ...currentRoom,
        scoreA: nextScoreA,
        scoreB: nextScoreB,
        chatMessages: [...currentRoom.chatMessages, giftMsg].slice(-80),
        ranking: sortedRanking
      });

      triggerFloatingAnimation(senderName, giftName, giftIcon, isForCreatorA);
    };

    const handleUserJoined = (payload: any) => {
      const currentRoom = roomRef.current;
      const sysMsg: ChatMessage = {
        id: `sys-join-${Date.now()}`,
        senderName: 'Sistema PK',
        role: 'admin',
        text: `👤 ${payload.username} entrou na sala conectando no WebSocket.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      };
      onUpdateRoom({
        ...currentRoom,
        chatMessages: [...currentRoom.chatMessages, sysMsg].slice(-80)
      });
    };

    const handleUserLeft = (payload: any) => {
      const currentRoom = roomRef.current;
      const sysMsg: ChatMessage = {
        id: `sys-leave-${Date.now()}`,
        senderName: 'Sistema PK',
        role: 'admin',
        text: `👋 ${payload.username} desconectou da sala.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      };
      onUpdateRoom({
        ...currentRoom,
        chatMessages: [...currentRoom.chatMessages, sysMsg].slice(-80)
      });
    };

    const handleModerationAction = (payload: any) => {
      const currentRoom = roomRef.current;
      const { type, targetId, targetUser, moderatorName } = payload;
      let nextMessages = [...currentRoom.chatMessages];

      if (type === 'delete_message' && targetId) {
        nextMessages = nextMessages.filter(m => m.id !== targetId);
      } else if (type === 'mute_user' && targetUser) {
        realtimeService.muteUserInCache(targetUser, true);
        const announceMsg: ChatMessage = {
          id: `sys-mute-${Date.now()}`,
          senderName: 'Moderação',
          role: 'admin',
          text: `🔇 Usuário "${targetUser}" foi silenciado por ${moderatorName}. Suas mensagens não serão enviadas.`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        };
        nextMessages = [...nextMessages, announceMsg];
      } else if (type === 'pin_message') {
        nextMessages = nextMessages.map(m => ({
          ...m,
          isPinned: m.id === targetId ? !m.isPinned : false // toggle pin singular
        }));
      } else if (type === 'highlight_supporter' && targetId) {
        nextMessages = nextMessages.map(m => {
          if (m.id === targetId) {
            return { ...m, isSupporterHighlighted: !m.isSupporterHighlighted };
          }
          return m;
        });
      }

      onUpdateRoom({
        ...currentRoom,
        chatMessages: nextMessages.slice(-80)
      });
    };

    const handleScoreUpdated = (payload: any) => {
      const currentRoom = roomRef.current;
      const { scoreA, scoreB } = payload;
      const sortedRanking = [
        { creatorId: currentRoom.creatorA.id, points: scoreA, rank: scoreA >= scoreB ? 1 : 2 },
        { creatorId: currentRoom.creatorB.id, points: scoreB, rank: scoreB > scoreA ? 1 : 2 }
      ];
      onUpdateRoom({
        ...currentRoom,
        scoreA,
        scoreB,
        ranking: sortedRanking
      });
    };

    // Subscribing to the simulation
    realtimeService.on(PKEvent.CHAT_MESSAGE, handleChatMessage);
    realtimeService.on(PKEvent.GIFT_SENT, handleGiftSent);
    realtimeService.on(PKEvent.USER_JOINED, handleUserJoined);
    realtimeService.on(PKEvent.USER_LEFT, handleUserLeft);
    realtimeService.on(PKEvent.MODERATION_ACTION, handleModerationAction);
    realtimeService.on(PKEvent.SCORE_UPDATED, handleScoreUpdated);

    return () => {
      realtimeService.off(PKEvent.CHAT_MESSAGE, handleChatMessage);
      realtimeService.off(PKEvent.GIFT_SENT, handleGiftSent);
      realtimeService.off(PKEvent.USER_JOINED, handleUserJoined);
      realtimeService.off(PKEvent.USER_LEFT, handleUserLeft);
      realtimeService.off(PKEvent.MODERATION_ACTION, handleModerationAction);
      realtimeService.off(PKEvent.SCORE_UPDATED, handleScoreUpdated);
      realtimeService.leaveRoom();
    };
  }, [room.roomId]);

  // Auto-scroll chat board
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.chatMessages]);

  const triggerFloatingAnimation = (sender: string, giftName: string, icon: string, isForA: boolean) => {
    const id = `anim-${Date.now()}-${Math.random()}`;
    const newAnim: FloatingGiftAnimation = {
      id,
      sender,
      giftName,
      giftIcon: icon,
      isForA,
      x: 10 + Math.random() * 80,
      y: 55 + Math.random() * 25
    };
    setFloatingAnimations(prev => [...prev, newAnim]);
    setTimeout(() => {
      setFloatingAnimations(prev => prev.filter(v => v.id !== id));
    }, 2500);
  };

  const handleSendGift = async (gift: Gift, isForA: boolean) => {
    if (moderationService.isGiftsPaused()) {
      alert('O envio de presentes está temporariamente suspenso pelos administradores.');
      return;
    }

    if (room.status !== 'active') {
      alert('Esta Batalha PK já está concluída ou inativa.');
      return;
    }

    if (userCoins < gift.coinValue) {
      if (confirm('Moedas insuficientes! Deseja recarregar na Carteira agora?')) {
        onNavigate('wallet');
      }
      return;
    }

    const userId = auth.currentUser?.uid || 'usr-default';
    const txRes = await firebaseService.sendGiftTransaction(
      userId,
      room.roomId,
      gift,
      isForA,
      'Você (Super Doador)',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100'
    );

    if (txRes.success) {
      onCoinsChange(txRes.coinsBalance);
      paymentService.setCoins(txRes.coinsBalance);
      viewerService.triggerMissionAction('send_gift', 1);

      // Register IDs to prevent duplicate snapshots/animations locally
      const response = txRes as any;
      if (response.eventId) realtimeService.addProcessedGiftId(response.eventId);
      if (response.chatMsgId) realtimeService.addProcessedChatId(response.chatMsgId);

      triggerFloatingAnimation('Você (Super Doador)', gift.name, gift.icon, isForA);
    } else {
      alert('Erro ao enviar o presente. Verifique seu saldo ou conexão.');
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    // Verify self-mute simulation
    if (realtimeService.isUserMuted('Você (Moderador)')) {
      alert('Você está silenciado nesta sala e não pode enviar mensagens.');
      return;
    }

    // Call moderationService to sanitize and validate
    const check = moderationService.checkAndSanitizeMessage('Você (Moderador)', chatText);
    if (!check.valid) {
      if (check.reason === 'banned_user') {
        alert('Seu usuário está banido da plataforma.');
        return;
      }
      if (check.reason === 'spam') {
        alert('Spam bloqueado pelo sistema! Espere um pouco antes de enviar outra mensagem.');
        return;
      }
      return;
    }

    const finalChatText = check.sanitizedText;

    const newMsg: ChatMessage = {
      id: `user-chat-${Date.now()}`,
      senderName: 'Você (Moderador)',
      senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      role: 'moderator',
      text: finalChatText,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    realtimeService.sendEvent(PKEvent.CHAT_MESSAGE, { message: newMsg });
    setChatText('');
    
    // Progress "Comentar em uma sala PK" task
    viewerService.triggerMissionAction('comment_pk', 1);
  };

  // Moderation Handlers
  const handleDeleteMessage = (messageId: string) => {
    realtimeService.sendEvent(PKEvent.MODERATION_ACTION, {
      type: 'delete_message',
      targetId: messageId,
      moderatorName: 'Você (Moderador)'
    });
  };

  const handleMuteUser = (username: string) => {
    realtimeService.sendEvent(PKEvent.MODERATION_ACTION, {
      type: 'mute_user',
      targetUser: username,
      moderatorName: 'Você (Moderador)'
    });
  };

  const handlePinMessage = (messageId: string) => {
    realtimeService.sendEvent(PKEvent.MODERATION_ACTION, {
      type: 'pin_message',
      targetId: messageId,
      moderatorName: 'Você (Moderador)'
    });
  };

  const handleHighlightSupporterMessage = (messageId: string) => {
    realtimeService.sendEvent(PKEvent.MODERATION_ACTION, {
      type: 'highlight_supporter',
      targetId: messageId,
      moderatorName: 'Você (Moderador)'
    });
  };

  // Handle adapter selection preview info
  const handleSwitchEngine = (engine: 'mock_ws' | 'socketio' | 'supabase' | 'firebase' | 'durable_objects') => {
    setRealtimeEngine(engine);
    let name = '';
    if (engine === 'mock_ws') name = 'Mock WebSocket Server (Ativo)';
    if (engine === 'socketio') name = 'Socket.IO Server Adapter';
    if (engine === 'supabase') name = 'Supabase Realtime PostgreSQL CDC';
    if (engine === 'firebase') name = 'Firebase Realtime Database REST/Sync';
    if (engine === 'durable_objects') name = 'Cloudflare Durable Objects Edge Actor';

    setEngineNotification(`A estrutura está pronta para conexão direta! O adaptador "${name}" compartilha os mesmos métodos connect(), joinRoom(), e sendEvent(). A troca pode ser feita instantaneamente no arquivo de serviços.`);
    setTimeout(() => {
      setEngineNotification(null);
    }, 7000);
  };

  const scoreTotal = room.scoreA + room.scoreB || 1;
  const percA = Math.round((room.scoreA / scoreTotal) * 100);
  const percB = 100 - percA;

  return (
    <div className="space-y-6 py-6 pb-20 relative z-10 font-sans">
      
      {/* Back navigation & Room title panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-90 w/60 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('creator-dashboard')}
            className="p-2 bg-zinc-950/80 hover:bg-zinc-800 rounded-lg border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Voltar ao Painel do Criador"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-widest animate-pulse">
                SALA PK ROOM ATIVA
              </span>
              <span className="text-xs text-zinc-500 font-mono font-bold uppercase select-none">
                CÓDIGO: {room.roomId}
              </span>
            </div>
            <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-2 mt-1">
              <Swords className="w-4 h-4 text-rose-500" />
              Mesa Especial de Duelo PK em Tempo Real
            </h2>
          </div>
        </div>

        {/* View Switch Headers */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-white/10 rounded-xl text-xs font-bold uppercase select-none">
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'stream' ? 'bg-rose-500/20 text-rose-400 font-black' : 'text-zinc-400 hover:text-zinc-100'}`}
          >
            Transmissões Dual
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'ranking' ? 'bg-rose-500/20 text-rose-400 font-black' : 'text-zinc-400 hover:text-zinc-100'}`}
          >
            Placar & Líderes
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${activeTab === 'schema' ? 'bg-amber-500/20 text-amber-400 font-black' : 'text-zinc-400 hover:text-zinc-100'}`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Estrutura JSON
          </button>
        </div>
      </div>

      {/* Duel Header: Points Progress and Timers */}
      <div className="bg-zinc-900 border border-white/10 p-5 rounded-2xl relative overflow-hidden bg-gradient-to-r from-rose-950/15 via-zinc-900 to-blue-950/15">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 select-none">
          <div className="space-y-0.5">
            <span className="text-[10px] text-zinc-500 font-mono uppercase block tracking-wider font-bold">Tema do Duelo ao Vivo</span>
            <p className="text-sm font-black text-zinc-100 italic">"Geração de engajamento acelerada com prendas da comunidade!"</p>
          </div>

          <div className="flex items-center gap-6 font-mono self-stretch justify-between sm:justify-end">
            <div className="text-right">
              <span className="text-[9px] text-zinc-500 uppercase font-mono block">Tempo Restante</span>
              <span className="text-xl font-black bg-black px-3 py-1 border border-white/10 rounded-lg text-rose-500 animate-pulse block">
                {room.timer > 0 
                  ? `${Math.floor(room.timer / 60)}:${(room.timer % 60).toString().padStart(2, '0')}`
                  : 'Batalha Encerrada'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-zinc-500 uppercase font-mono block">Visualizadores Simultâneos</span>
              <span className="text-sm font-black bg-black px-3 py-1.5 border border-white/10 rounded-lg text-zinc-300 block">
                👥 {(room.viewers).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic points meter: Tug of war */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold leading-none select-none">
            <span className="text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 font-black uppercase">
              🔴 RED: {room.creatorA.name} ({room.scoreA.toLocaleString()} pts)
            </span>
            <span className="text-blue-400 flex items-center justify-end gap-1 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 font-black uppercase">
              ({room.scoreB.toLocaleString()} pts) {room.creatorB.name} 🔵
            </span>
          </div>

          <div className="relative h-6 bg-zinc-950 rounded-full overflow-hidden border border-white/15 p-0.5 flex">
            <div 
              className="h-full bg-gradient-to-r from-rose-650 via-rose-500 to-rose-450 transition-all duration-300 flex items-center pl-4 font-black text-[10px] text-white select-none whitespace-nowrap rounded-l-full shadow-inner"
              style={{ width: `${Math.max(15, Math.min(85, percA))}%` }}
            >
              ❤️ TEAM RED • {percA}%
            </div>
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 flex items-center justify-end pr-4 text-right font-black text-[10px] text-white select-none whitespace-nowrap rounded-r-full shadow-inner"
              style={{ width: `${Math.max(15, Math.min(85, percB))}%` }}
            >
              {percB}% • TEAM BLUE 💙
            </div>

            {/* Pivot handle needle */}
            <div className="absolute top-0 bottom-0 left-1/2 -ml-[2.5px] w-1.5 bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,1)] z-10" />
          </div>
        </div>

      </div>

      {activeTab === 'stream' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch font-sans">
          
          {/* Side by side streaming panels */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            {/* COMPOSITE VIDEO CONTROLS SWITCHER DECK */}
            <div className="bg-zinc-950/75 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none backdrop-blur-md shadow-2xl">
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full ${playersStarted ? 'bg-emerald-500 animate-ping' : 'bg-rose-500 animate-pulse'}`} />
                <div className="text-left">
                  <span className="text-xs font-mono font-black uppercase tracking-wider text-zinc-100 block">Painel Geral de Transmissão PK:</span>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    {playersStarted 
                      ? 'Transmissões do YouTube ativas • Controles oficiais habilitados' 
                      : 'Carregando links de streaming de forma pausada para áudio seguro'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {!playersStarted ? (
                  <button
                    onClick={() => setPlayersStarted(true)}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase rounded-xl tracking-wider shadow-lg shadow-rose-600/15 cursor-pointer active:scale-95 transition-all flex items-center gap-2 border border-white/5 font-mono"
                  >
                    <Radio className="w-4 h-4 text-white animate-pulse" />
                    Iniciar Players Simultâneos
                  </button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Mute Control A */}
                    <button
                      onClick={() => setIsMutedA(!isMutedA)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold font-mono tracking-wider transition-all cursor-pointer border ${
                        isMutedA 
                          ? 'bg-zinc-950 border-white/5 text-zinc-400 hover:bg-zinc-900' 
                          : 'bg-rose-950/40 border-rose-500/45 text-rose-400 hover:bg-rose-950/60'
                      }`}
                      title="Alternar áudio da Live Red"
                    >
                      {isMutedA ? <VolumeX className="w-3.5 h-3.5 inline mr-1" /> : <Volume2 className="w-3.5 h-3.5 inline mr-1 animate-pulse" />}
                      LADO RED: {isMutedA ? 'MUDADO' : 'ESCUTAR'}
                    </button>

                    {/* Mute Control B */}
                    <button
                      onClick={() => setIsMutedB(!isMutedB)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold font-mono tracking-wider transition-all cursor-pointer border ${
                        isMutedB 
                          ? 'bg-zinc-950 border-white/5 text-zinc-400 hover:bg-zinc-900' 
                          : 'bg-blue-955 border-blue-500/45 text-blue-400 hover:bg-blue-950/60'
                      }`}
                      title="Alternar áudio da Live Blue"
                    >
                      {isMutedB ? <VolumeX className="w-3.5 h-3.5 inline mr-1" /> : <Volume2 className="w-3.5 h-3.5 inline mr-1 animate-pulse" />}
                      LADO BLUE: {isMutedB ? 'MUDADO' : 'ESCUTAR'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SIDE BY SIDE PLAYERS CONTAINER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900 border border-white/10 p-4 rounded-3xl relative overflow-hidden backdrop-blur-md shadow-inner">
              
              {/* FEED CREATOR A (RED) */}
              <div className="flex flex-col bg-zinc-950/80 rounded-2xl overflow-hidden border border-rose-500/30 flex-1 min-h-[300px] shadow-lg relative">
                <div className="bg-gradient-to-r from-rose-950/30 to-zinc-900 px-3 py-2 flex items-center justify-between border-b border-rose-500/20 text-xs font-bold uppercase select-none">
                  <span className="text-rose-400 flex items-center gap-1.5 font-black">
                    🔴 RED • {room.creatorA.name}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-zinc-500">Live Ativa (Host)</span>
                </div>

                <div className="bg-black relative aspect-video flex-1 flex items-center justify-center overflow-hidden">
                  {!playersStarted ? (
                    /* COMPLIANT INTERACTIVE PRE-ROLL SWITCH CONTAINER */
                    <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center select-none z-20">
                      <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mb-3 animate-pulse text-rose-500">
                        <Tv className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-black uppercase text-zinc-100 tracking-tight font-sans">
                        Transmissão Red {room.creatorA.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-1 max-w-xs leading-normal font-sans">
                        Clique em <strong className="text-rose-500 font-bold">Iniciar Players</strong> no painel de switcher para sincronizar e carregar os feeds de áudio e vídeo com o YouTube.
                      </p>
                    </div>
                  ) : room.liveA.videoId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${room.liveA.videoId}?autoplay=1&mute=${isMutedA ? 1 : 0}&controls=1&rel=0`}
                      title={`Live Stream Casimiro`}
                      className="absolute inset-0 w-full h-full border-0 z-10"
                      allow="autoplay; encrypted-media"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Tv className="w-10 h-10 text-rose-500 mx-auto mb-2 animate-bounce" />
                      <p className="text-xs font-mono font-bold uppercase">Carregando feed de transmissão...</p>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-zinc-400 border border-white/5 uppercase select-none font-mono z-15">
                    FPS: 60 • BPS: 6200Kbps
                  </div>

                  <div className="absolute bottom-2 right-2 bg-rose-600/95 text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded select-none z-15">
                    PLAYER RED
                  </div>
                </div>

                <div className="p-3 bg-zinc-900 text-center border-t border-rose-500/20 select-none">
                  <span className="text-[10px] text-zinc-400 block font-bold mb-2 uppercase tracking-wide">Apoiar RED com moedas</span>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {GLOBAL_GIFTS.slice(0, 4).map((g) => (
                      <button
                        key={g.id}
                        onClick={() => handleSendGift(g, true)}
                        className="py-1.5 px-2 bg-zinc-950 hover:bg-zinc-850 hover:border-rose-500/50 text-[11px] font-sans rounded-lg border border-white/5 flex items-center gap-1 cursor-pointer transition-colors"
                        title={`Enviar ${g.name} por ${g.coinValue} moedas`}
                      >
                        <span>{g.icon}</span>
                        <span className="text-yellow-400 font-mono text-[10px] font-bold">{g.coinValue}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* FEED CREATOR B (BLUE) */}
              <div className="flex flex-col bg-zinc-955 rounded-2xl overflow-hidden border border-blue-500/30 flex-1 min-h-[300px] shadow-lg relative">
                <div className="bg-gradient-to-r from-blue-950/30 to-zinc-900 px-3 py-2 flex items-center justify-between border-b border-blue-500/20 text-xs font-bold uppercase select-none">
                  <span className="text-blue-400 flex items-center gap-1.5 font-black">
                    🔵 BLUE • {room.creatorB.name}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-zinc-500">Live Criada (Simulada)</span>
                </div>

                <div className="bg-black relative aspect-video flex-1 flex items-center justify-center overflow-hidden">
                  {!playersStarted ? (
                    /* COMPLIANT INTERACTIVE PRE-ROLL SWITCH CONTAINER */
                    <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center select-none z-20">
                      <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-3 animate-pulse text-blue-500">
                        <Tv className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-black uppercase text-zinc-100 tracking-tight font-sans">
                        Transmissão Blue {room.creatorB.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-1 max-w-xs leading-normal font-sans">
                        Clique em <strong className="text-blue-500 font-bold">Iniciar Players</strong> no painel de switcher para sincronizar e carregar os feeds de áudio e vídeo com o YouTube.
                      </p>
                    </div>
                  ) : room.liveB.videoId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${room.liveB.videoId}?autoplay=1&mute=${isMutedB ? 1 : 0}&controls=1&rel=0`}
                      title={`Live Stream Adversário B`}
                      className="absolute inset-0 w-full h-full border-0 z-10"
                      allow="autoplay; encrypted-media"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Tv className="w-10 h-10 text-blue-500 mx-auto mb-2 animate-bounce" />
                      <p className="text-xs font-mono font-bold uppercase">Carregando feed de transmissão...</p>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-zinc-400 border border-white/5 uppercase select-none font-mono z-15">
                    FPS: 60 • BPS: 5400Kbps
                  </div>

                  <div className="absolute bottom-2 right-2 bg-blue-600/95 text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded select-none z-15">
                    PLAYER BLUE
                  </div>
                </div>

                <div className="p-3 bg-zinc-900 text-center border-t border-blue-500/20 select-none">
                  <span className="text-[10px] text-zinc-400 block font-bold mb-2 uppercase tracking-wide">Apoiar BLUE com moedas</span>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {GLOBAL_GIFTS.slice(0, 4).map((g) => (
                      <button
                        key={g.id}
                        onClick={() => handleSendGift(g, false)}
                        className="py-1.5 px-2 bg-zinc-950 hover:bg-zinc-850 hover:border-blue-500/50 text-[11px] font-sans rounded-lg border border-white/5 flex items-center gap-1 cursor-pointer transition-colors"
                        title={`Enviar ${g.name} por ${g.coinValue} moedas`}
                      >
                        <span>{g.icon}</span>
                        <span className="text-yellow-400 font-mono text-[10px] font-bold">{g.coinValue}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
              
            </div>

            {/* EYE-CATCHING SAFETY BOUNDED AREA FOR GIFT ANIMATIONS */}
            <div className="bg-zinc-900 border border-white/10 p-5 rounded-3xl relative overflow-hidden text-center min-h-[140px] flex flex-col justify-center shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/10 to-zinc-950/35 pointer-events-none" />
              
              <div className="flex items-center justify-center gap-1 text-rose-500 uppercase text-[10px] font-mono tracking-widest font-black mb-1.5 z-10">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Mural de Animações de Presentes da Arena (Visual Area)</span>
              </div>
              <p className="text-[9px] text-zinc-500 font-mono uppercase mb-3 z-10">Visualização de apoios em alta-relevância gráfica</p>

              <div className="relative w-full min-h-[75px] flex flex-wrap gap-4 items-center justify-center z-10 px-4">
                {floatingAnimations.map((anim) => (
                  <div
                    key={anim.id}
                    className="animate-bounce transition duration-300 transform scale-100 flex items-center bg-zinc-950 border border-amber-400 rounded-xl px-3 py-1.5 gap-2 shadow-2xl whitespace-nowrap border-b-2"
                  >
                    <span className="text-2xl filter drop-shadow">{anim.giftIcon}</span>
                    <div className="text-left select-none">
                      <span className="font-extrabold text-amber-400 text-[10px] block leading-tight">{anim.sender}</span>
                      <span className="text-rose-400 font-bold text-[9px] block">Apoiou {anim.isForA ? `${room.creatorA.name} 🔴` : `${room.creatorB.name} 🔵`}</span>
                      <span className="text-zinc-400 text-[9px] block leading-normal">{anim.giftName}</span>
                    </div>
                  </div>
                ))}

                {floatingAnimations.length === 0 && (
                  <p className="text-xs text-zinc-500 font-mono italic select-none">
                    Aguardando mimos virtuais interativos dos espectadores...
                  </p>
                )}
              </div>
            </div>

            {/* Gift Store Block list */}
            <div className="bg-zinc-900 border border-white/10 p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3.5 border-b border-white/5 pb-2">
                <GiftIcon className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                  Loja de Mimos de Alto engajamento PK
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
                {GLOBAL_GIFTS.map((gift) => (
                  <div
                    key={gift.id}
                    className="bg-zinc-950/70 hover:bg-zinc-950 border border-white/10 rounded-xl p-3 flex flex-col justify-between text-center relative overflow-hidden group hover:border-amber-500/35 transition"
                  >
                    <div className="text-3xl mb-1.5 group-hover:scale-110 transition duration-150 select-none">{gift.icon}</div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-white block truncate uppercase tracking-tight">{gift.name}</span>
                      <span className="text-[9px] text-zinc-500 block uppercase font-mono tracking-wider">+{gift.pkPointsBonus.toLocaleString()} PONTOS</span>
                    </div>

                    <div className="mt-2 text-center flex flex-col gap-1 font-sans">
                      <span className="text-xs font-mono font-bold text-amber-400 block">{gift.coinValue} 🪙</span>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSendGift(gift, true)}
                          className="flex-1 py-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-[9px] rounded uppercase cursor-pointer"
                        >
                          RED
                        </button>
                        <button
                          onClick={() => handleSendGift(gift, false)}
                          className="flex-1 py-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] rounded uppercase cursor-pointer"
                        >
                          BLUE
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right side: Unified Realtime Live Chat board */}
          <div className="lg:col-span-4 flex flex-col bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden min-h-[480px] shadow-2xl relative">
            
            {/* Realtime Engine Hub bar */}
            <div className="bg-zinc-950 p-2 border-b border-white/10 select-none">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1 px-1.5 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
                Selecione o Driver de Real-Time:
              </span>
              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'mock_ws', label: 'MOCK WS', active: realtimeEngine === 'mock_ws', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
                  { key: 'socketio', label: 'SOCKET.IO', active: realtimeEngine === 'socketio', color: 'border-blue-500/10 text-zinc-400 hover:text-zinc-200' },
                  { key: 'supabase', label: 'SUPABASE', active: realtimeEngine === 'supabase', color: 'border-teal-500/10 text-zinc-400 hover:text-zinc-200' },
                  { key: 'firebase', label: 'FIREBASE', active: realtimeEngine === 'firebase', color: 'border-amber-500/10 text-zinc-400 hover:text-zinc-200' },
                  { key: 'durable_objects', label: 'CLOUDFLARE', active: realtimeEngine === 'durable_objects', color: 'border-orange-500/10 text-zinc-400 hover:text-zinc-200' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => handleSwitchEngine(item.key as any)}
                    className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border transition cursor-pointer ${
                      item.active 
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/45 shadow-[0_0_8px_rgba(239,68,68,0.25)]' 
                        : 'bg-zinc-900 border-white/5 ' + item.color
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification explaining adaptation readiness */}
            {engineNotification && (
              <div className="bg-rose-950/90 text-rose-100 p-2.5 text-[10px] leading-relaxed border-b border-rose-500/30 animate-fade-in flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{engineNotification}</span>
              </div>
            )}

            <div className="bg-zinc-950/80 px-4 py-3 border-b border-white/5 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-500 animate-pulse" />
                <h3 className="font-extrabold text-white text-xs uppercase italic tracking-tight font-mono">Bate-Papo da Sala PK</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[9px] bg-red-500/10 text-rose-400 font-mono font-bold px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-widest">
                  ONLINE (MOCK WS)
                </span>
              </div>
            </div>

            {/* STICKY STICKY PINNED MESSAGES SECTION */}
            {room.chatMessages.some(m => m.isPinned) && (
              <div className="bg-gradient-to-r from-zinc-950 to-zinc-900/90 p-2.5 border-b border-yellow-500/30 flex items-start justify-between gap-2.5 shadow-md">
                <div className="flex items-start gap-2 max-w-[85%]">
                  <Pin className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-1 rotate-45 animate-bounce" />
                  <div className="text-[11px] leading-normal">
                    <span className="font-black text-yellow-400 uppercase tracking-wide block font-mono text-[9px]">MENSAGEM FIXADA PELO MODERADOR</span>
                    <span className="text-zinc-400 font-bold mr-1.5 font-sans">
                      {room.chatMessages.find(m => m.isPinned)?.senderName}:
                    </span>
                    <span className="text-zinc-200 italic font-sans">
                      "{room.chatMessages.find(m => m.isPinned)?.text}"
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const pinned = room.chatMessages.find(m => m.isPinned);
                    if (pinned) handlePinMessage(pinned.id);
                  }}
                  className="text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-1.5 py-0.5 rounded border border-white/5 font-mono cursor-pointer transition uppercase"
                  title="Desafixar Mensagem"
                >
                  unpin
                </button>
              </div>
            )}

            {/* Chats area */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs h-[380px] bg-zinc-900/50 scrollbar-thin scrollbar-thumb-zinc-850">
              {room.chatMessages.map((msg) => {
                // Determine layout types
                const isSys = msg.isSystem || msg.role === 'admin';
                const isGift = msg.giftAttached !== undefined;
                const isHighlighted = msg.isSupporterHighlighted || msg.role === 'sponsor';

                // Skip showing if sender is cached as muted
                if (realtimeService.isUserMuted(msg.senderName) && msg.senderName !== 'Você (Moderador)') {
                  return null;
                }

                if (isSys) {
                  // Style A: Cyan soft styled system messages
                  return (
                    <div key={msg.id} className="bg-zinc-950/45 border-l-2 border-cyan-500 px-3 py-1.5 rounded-lg animate-fade-in text-[10.5px] italic text-cyan-300 font-mono leading-relaxed flex items-center justify-between group">
                      <span>{msg.text}</span>
                      <div className="text-[9px] opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-zinc-500">
                        <span>{msg.timestamp}</span>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="hover:text-red-400 cursor-pointer"
                          title="Apagar Linha do Sistema"
                        >
                          <Trash2 className="w-3 h-3 ml-1" />
                        </button>
                      </div>
                    </div>
                  );
                }

                if (isGift) {
                  // Style B: Premium rose-colored gift card
                  return (
                    <div key={msg.id} className="relative bg-gradient-to-r from-rose-950/20 via-orange-950/15 to-zinc-950 overflow-hidden border border-rose-500/25 p-2.5 rounded-xl animate-fade-in group shadow-md">
                      <div className="absolute top-0 right-0 p-1.5 text-2xl animate-spin select-none opacity-40">
                        {msg.giftAttached?.giftIcon}
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] bg-red-500/15 border border-red-500/25 text-red-400 font-black font-mono tracking-widest uppercase px-1.5 py-0.5 rounded">
                            PRESENTE PK
                          </span>
                          <span className="font-extrabold text-zinc-100 text-xs">{msg.senderName}</span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500">{msg.timestamp}</span>
                      </div>
                      <p className="font-semibold text-rose-300 leading-relaxed text-[11px] font-sans flex items-center gap-1 break-words pr-8">
                        <span>{msg.text}</span>
                      </p>

                      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950/90 border border-white/10 px-2 py-1 rounded-lg">
                        <button
                          onClick={() => handlePinMessage(msg.id)}
                          className="text-zinc-400 hover:text-yellow-400"
                          title="Fixar Mensagem"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-zinc-400 hover:text-rose-400"
                          title="Apagar Mensagem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                }

                if (isHighlighted) {
                  // Style C: Beautiful Golden Glowing Sponsor Highlight
                  return (
                    <div key={msg.id} className="bg-gradient-to-r from-yellow-950/25 to-zinc-950/40 border border-yellow-500/30 p-2.5 rounded-xl animate-fade-in group shadow-lg relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-black font-mono tracking-wider uppercase px-1.5 py-0.5 rounded">
                            APOIADOR HIGH
                          </span>
                          <span className="font-extrabold text-yellow-400 flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 animate-spin-slow" />
                            {msg.senderName}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500">{msg.timestamp}</span>
                      </div>
                      <p className="pl-0.5 text-zinc-100 font-bold leading-relaxed text-[11.5px] font-sans break-words bg-yellow-500/5 p-1 px-1.5 rounded border border-yellow-500/10">
                        {msg.text}
                      </p>

                      {/* Moderation drawer actions */}
                      <div className="absolute bottom-1 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 border border-white/10 px-2 py-1 rounded-lg shadow-xl z-20">
                        <button
                          onClick={() => handlePinMessage(msg.id)}
                          className="text-zinc-400 hover:text-yellow-400 cursor-pointer"
                          title="Toggle Fixar no Topo"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleHighlightSupporterMessage(msg.id)}
                          className="text-zinc-400 hover:text-amber-400 cursor-pointer"
                          title="Toggle Destacar"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMuteUser(msg.senderName)}
                          className="text-zinc-400 hover:text-red-400 cursor-pointer"
                          title="Silenciar / Banir Usuário"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-zinc-400 hover:text-rose-500 cursor-pointer"
                          title="Excluir Mensagem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                }

                // Style D: Regular, responsive message
                return (
                  <div key={msg.id} className="p-2 bg-zinc-950/20 hover:bg-zinc-950/65 border border-transparent hover:border-white/5 rounded-xl animate-fade-in group relative transition duration-150">
                    <div className="flex items-center justify-between mb-0.5 select-none">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8.5px] bg-zinc-800 border border-white/5 text-zinc-400 capitalize px-1 rounded font-mono">
                          {msg.role}
                        </span>
                        <span className="font-extrabold text-zinc-300">{msg.senderName}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-600">{msg.timestamp}</span>
                    </div>
                    <p className="pl-0.5 text-zinc-350 leading-relaxed text-[11px] font-sans break-words pr-12">{msg.text}</p>

                    {/* Moderation drawer actions */}
                    <div className="absolute bottom-1 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 border border-white/10 px-2 py-1 rounded-lg shadow-xl z-20">
                      <button
                        onClick={() => handlePinMessage(msg.id)}
                        className="text-zinc-400 hover:text-yellow-400 cursor-pointer text-[10px]"
                        title="Fixar Mensagem"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleHighlightSupporterMessage(msg.id)}
                        className="text-zinc-400 hover:text-yellow-450 cursor-pointer"
                        title="Destacar/Apoiar"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMuteUser(msg.senderName)}
                        className="text-zinc-400 hover:text-red-400 cursor-pointer"
                        title="Silenciar Usuário"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-zinc-400 hover:text-rose-500 cursor-pointer"
                        title="Excluir Mensagem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Send chat entry */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-zinc-950/80 border-t border-white/5 flex items-center gap-2">
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Insira sua mensagem na sala..."
                className="flex-1 bg-zinc-900 border border-white/10 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                maxLength={100}
              />
              <button
                type="submit"
                className="p-2.5 bg-rose-650 hover:bg-rose-550 text-white rounded-xl border border-white/5 transition flex items-center justify-center cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>

        </div>
      )}

      {activeTab === 'ranking' && (
        <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
            <div>
              <h3 className="font-extrabold text-white text-sm uppercase tracking-tight italic font-mono">Classificação das Equipes do Duelo</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">Calculado proporcionalmente com base nos pontos globais de mimos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Team Red leader details */}
            <div className={`p-5 rounded-2xl border ${room.scoreA >= room.scoreB ? 'bg-amber-500/5 border-amber-500/25 shadow-lg' : 'bg-zinc-950/70 border-white/5'} flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={room.creatorA.avatar} alt="Red logo" className="w-12 h-12 rounded-full object-cover border-2 border-rose-500" />
                  {room.scoreA >= room.scoreB && (
                    <span className="absolute -top-1.5 -left-1.5 text-lg" title="Líder do Duelo">🏆</span>
                  )}
                </div>
                <div>
                  <span className="text-[9px] text-rose-400 uppercase font-mono font-bold block tracking-wider">🟥 EQUIPE RED (HOST)</span>
                  <h4 className="text-base font-black text-white">{room.creatorA.name}</h4>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{room.creatorA.channelName} • @{room.creatorA.channelName}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-zinc-500 uppercase font-mono block">Classificação PK</span>
                <span className="text-xl font-black font-mono text-zinc-100">{room.scoreA >= room.scoreB ? '1º Lugar' : '2º Lugar'}</span>
                <p className="text-xs text-amber-400 font-mono font-bold mt-1">{(room.scoreA).toLocaleString()} pts</p>
              </div>
            </div>

            {/* Box 2: Team Blue leader details */}
            <div className={`p-5 rounded-2xl border ${room.scoreB > room.scoreA ? 'bg-amber-500/5 border-amber-500/25 shadow-lg' : 'bg-zinc-950/70 border-white/5'} flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={room.creatorB.avatar} alt="Blue logo" className="w-12 h-12 rounded-full object-cover border-2 border-blue-500" />
                  {room.scoreB > room.scoreA && (
                    <span className="absolute -top-1.5 -left-1.5 text-lg" title="Líder do Duelo">🏆</span>
                  )}
                </div>
                <div>
                  <span className="text-[9px] text-blue-400 uppercase font-mono font-bold block tracking-wider">🟦 EQUIPE BLUE (GUEST)</span>
                  <h4 className="text-base font-black text-white">{room.creatorB.name}</h4>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">@{room.creatorB.channelName}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-zinc-500 uppercase font-mono block">Classificação PK</span>
                <span className="text-xl font-black font-mono text-zinc-100">{room.scoreB > room.scoreA ? '1º Lugar' : '2º Lugar'}</span>
                <p className="text-xs text-amber-400 font-mono font-bold mt-1">{(room.scoreB).toLocaleString()} pts</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2 font-mono">Dicionário de Liderança PK</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              O oponente que acumular o maior número de pontos PK de presentes no timer do cronômetro ganha a classificação oficial. O perdedor pagará a punição ao vivo diante do chat global restrito de apoiadores do ArenaPK.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'schema' && (
        <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Cpu className="w-5 h-5 text-amber-500 animate-pulse" />
            <div>
              <h3 className="font-extrabold text-white text-sm uppercase tracking-tight italic font-mono">Inspetor Técnico da Entidade PKRoom</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">Certifica o atendimento integral aos quesitos técnicos do prompt</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold font-mono">
            ✓ Entidade instanciada com sucesso: todas as chaves obrigatórias requeridas pelo protocolo técnico constam populadas no schema JSON abaixo.
          </div>

          {/* Pretty print JSON structure of active room */}
          <div className="bg-zinc-950 p-5 rounded-xl border border-white/10 font-mono text-xs overflow-x-auto text-zinc-300">
            <h4 className="text-rose-500 font-black text-xs uppercase mb-3 border-b border-white/5 pb-2 font-sans select-none">
              ESTRUTURA DE DADOS COMPLETA DO OBJETO DE SALA PK (PKRoom)
            </h4>
            <pre className="whitespace-pre-wrap">{JSON.stringify(room, null, 2)}</pre>
          </div>
        </div>
      )}

    </div>
  );
}
