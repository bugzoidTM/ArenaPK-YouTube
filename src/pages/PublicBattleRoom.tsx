/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef } from 'react';
import { Swords, Send, Trophy, Sparkles, Gift as GiftIcon, Heart, Users, Star, MessageSquare, Flame } from 'lucide-react';
import { Creator, PKBattle, Gift, ChatMessage } from '../types';
import { GLOBAL_GIFTS, MOCK_CHATS, RANDOM_CHAT_PHRASES, RANDOM_NAMES } from '../mocks/pkService';
import { paymentService } from '../services/paymentService';
import { viewerService } from '../services/viewerService';
import { moderationService } from '../services/moderationService';

interface PublicBattleRoomProps {
  battle: PKBattle;
  onSendGift: (giftId: string, isForRed: boolean) => void;
  userCoins: number;
  onCoinsChange: (newCoinsVal: number) => void;
  onNavigate: (view: string) => void;
  onTickBattle: (battleId: string) => void;
}

interface FloatingGiftAnimation {
  id: string;
  sender: string;
  giftName: string;
  giftIcon: string;
  isForRed: boolean;
  x: number; // percentage left
  y: number; // percentage top
}

export default function PublicBattleRoom({
  battle,
  onSendGift,
  userCoins,
  onCoinsChange,
  onNavigate,
  onTickBattle,
}: PublicBattleRoomProps) {
  const [chatText, setChatText] = useState('');
  const [chatFeed, setChatFeed] = useState<ChatMessage[]>(MOCK_CHATS);
  const [floatingAnimations, setFloatingAnimations] = useState<FloatingGiftAnimation[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Countdown timer and simulated viewers interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (battle.status === 'active' && battle.timeLeftSeconds > 0) {
        onTickBattle(battle.id);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [battle.id, battle.status, battle.timeLeftSeconds]);

  // Simulate incoming audience interactions (chats and periodic minor gifts)
  useEffect(() => {
    if (battle.status !== 'active') return;

    const interval = setInterval(() => {
      // 1. Generate random message
      const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
      const randomText = RANDOM_CHAT_PHRASES[Math.floor(Math.random() * RANDOM_CHAT_PHRASES.length)];
      const roles: ('viewer' | 'sponsor')[] = ['viewer', 'viewer', 'sponsor'];
      const randomRole = roles[Math.floor(Math.random() * roles.length)];
      const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // 2. Sometimes generate a gift simulation
      const sendMockGift = Math.random() > 0.6;
      let mockGiftObj = undefined;
      
      if (sendMockGift) {
        const randomGift = GLOBAL_GIFTS[Math.floor(Math.random() * Math.min(GLOBAL_GIFTS.length, 3))]; // heart, fire, crown
        const count = Math.random() > 0.8 ? 5 : 1;
        mockGiftObj = {
          giftName: randomGift.name,
          giftIcon: randomGift.icon,
          count,
        };

        // Update score
        const totalBonus = randomGift.pkPointsBonus * count;
        const isRed = Math.random() > 0.5;
        
        // Add point values directly to state
        if (isRed) {
          battle.pointsRed += totalBonus;
        } else {
          battle.pointsBlue += totalBonus;
        }

        // Trigger floating icon
        triggerFloatingAnimation(randomName, randomGift.name, randomGift.icon, isRed);
      }

      const newMsg: ChatMessage = {
        id: `mock-chat-${Date.now()}-${Math.random()}`,
        senderName: randomName,
        role: randomRole,
        text: mockGiftObj ? `Enviou ${mockGiftObj.count}x ${mockGiftObj.giftName} ${mockGiftObj.giftIcon}!` : randomText,
        timestamp: timeStr,
        giftAttached: mockGiftObj,
      };

      setChatFeed(prev => [...prev.slice(-40), newMsg]); // keep last 40 lines
    }, 3500);

    return () => clearInterval(interval);
  }, [battle]);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatFeed]);

  // Handle local user manual chat submission
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    // Call moderationService to sanitize and validate
    const check = moderationService.checkAndSanitizeMessage('Você (Torcedor)', chatText);
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

    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `chat-user-${Date.now()}`,
      senderName: 'Você (Torcedor)',
      role: 'sponsor',
      text: finalChatText,
      timestamp: timeStr
    };

    setChatFeed(prev => [...prev, userMsg]);
    setChatText('');
  };

  // Helper function to launch animated graphics when a gift arrives
  const triggerFloatingAnimation = (sender: string, giftName: string, icon: string, isForRed: boolean) => {
    const animId = `anim-${Date.now()}-${Math.random()}`;
    const newAnim: FloatingGiftAnimation = {
      id: animId,
      sender,
      giftName,
      giftIcon: icon,
      isForRed,
      x: 10 + Math.random() * 80, // percentage left
      y: 60 + Math.random() * 20, // percentage height start
    };

    setFloatingAnimations(prev => [...prev, newAnim]);

    // Remove after 3 seconds
    setTimeout(() => {
      setFloatingAnimations(prev => prev.filter(a => a.id !== animId));
    }, 2500);
  };

  // Click handler to buy/send gifts to specific player side
  const handleSendGiftClick = (gift: Gift, isForRed: boolean) => {
    if (moderationService.isGiftsPaused()) {
      alert('O envio de presentes está temporariamente suspenso pelos administradores.');
      return;
    }

    if (battle.status !== 'active') {
      alert('Esta batalha já terminou ou ainda não iniciou.');
      return;
    }

    if (userCoins < gift.coinValue) {
      if (confirm('Moedas insuficientes! Deseja ir para a carteira recarregar instantaneamente?')) {
        onNavigate('wallet');
      }
      return;
    }

    // Deduct coins & register transaction ledger via paymentService
    const recipientName = isForRed ? battle.creatorRed.name : battle.creatorBlue.name;
    const debitRes = paymentService.debitCoins(gift.coinValue, {
      creatorName: recipientName,
      gift: gift
    });

    if (debitRes.success) {
      onCoinsChange(debitRes.currentCoins);
      viewerService.triggerMissionAction('send_gift', 1);
    } else {
      alert('Moedas insuficientes ou erro ao debitar.');
      return;
    }
    
    // Register PK POINTS and call back
    onSendGift(gift.id, isForRed);

    // Register floating graphic visual effect
    triggerFloatingAnimation('Você', gift.name, gift.icon, isForRed);

    // Register message in local chat
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const giftMsg: ChatMessage = {
      id: `chat-local-user-gift-${Date.now()}`,
      senderName: 'Você (Apoiador)',
      role: 'admin',
      text: `Enviou ${gift.name} ${gift.icon}! (+${gift.pkPointsBonus.toLocaleString()} pts de PK)`,
      timestamp: timeStr,
      giftAttached: {
        giftName: gift.name,
        giftIcon: gift.icon,
        count: 1
      }
    };
    setChatFeed(prev => [...prev, giftMsg]);
  };

  const totalPoints = battle.pointsRed + battle.pointsBlue || 1;
  const redPercentage = Math.round((battle.pointsRed / totalPoints) * 100);
  const bluePercentage = 100 - redPercentage;

  return (
    <div className="space-y-6 py-4 pb-20 relative z-10">
      
      {/* Upper Status Banner with Tug-Of-War Bar and Countdown */}
      <div className="bg-zinc-900/60 border border-white/10 p-5 md:p-6 rounded-2xl shadow-2xl backdrop-blur-md space-y-4">
        
        {/* Match Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400 shadow-inner">
              <Swords className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-amber-500 font-mono font-bold uppercase block tracking-wider">
                Desafio PK em Andamento
              </span>
              <h2 className="text-zinc-105 font-black text-sm md:text-base leading-tight uppercase tracking-tight">
                Punição estipulada: <span className="text-rose-400 font-bold italic">{battle.selectedStake}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-6 font-mono">
            <div className="text-right">
              <span className="text-[9px] text-zinc-500 uppercase font-mono block">Tempo Restante:</span>
              <span className="text-lg font-bold bg-zinc-950 px-3 py-1 border border-white/10 rounded-lg font-mono text-rose-550 animate-pulse block">
                {battle.timeLeftSeconds > 0 
                  ? `${Math.floor(battle.timeLeftSeconds / 60)}:${(battle.timeLeftSeconds % 60).toString().padStart(2, '0')}`
                  : 'TEMPO ESGOTADO'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-zinc-500 uppercase font-mono block">Espectadores:</span>
              <span className="text-xs bg-zinc-950 px-3 py-2 border border-white/10 rounded-lg block font-bold text-zinc-300">
                8.9K 👥
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic points progress meter */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono font-bold leading-none">
            <span className="text-rose-500 flex items-center gap-1.5 uppercase font-black bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10">
              🟥 {battle.creatorRed.name} ({battle.pointsRed.toLocaleString()} pts)
            </span>
            <span className="text-blue-400 flex items-center justify-end gap-1.5 uppercase font-black bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10">
              ({battle.pointsBlue.toLocaleString()} pts) {battle.creatorBlue.name} 🟦
            </span>
          </div>

          <div className="relative h-7 bg-zinc-955 rounded-full overflow-hidden border border-white/10 flex p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-450 transition-all duration-300 flex items-center pl-4 font-black tracking-wider text-[10px] text-white select-none whitespace-nowrap shadow-[inset_0_1px_4px_rgba(255,255,255,0.15)] rounded-l-full" 
              style={{ width: `${Math.max(15, Math.min(85, redPercentage))}%` }}
            >
              ❤️ TEAM RED • {redPercentage}%
            </div>
            <div 
              className="h-full bg-gradient-to-r from-blue-450 via-sky-500 to-blue-600 transition-all duration-300 flex items-center justify-end pr-4 text-right font-black tracking-wider text-[10px] text-white select-none whitespace-nowrap rounded-r-full" 
              style={{ width: `${Math.max(15, Math.min(85, bluePercentage))}%` }}
            >
              {bluePercentage}% • TEAM BLUE 💙
            </div>

            {/* Dynamic Center Needle */}
            <div className="absolute top-0 bottom-0 left-1/2 -ml-[2px] w-1 bg-yellow-405 shadow-[0_0_8px_rgba(250,204,21,0.8)] z-10" />
          </div>
        </div>
      </div>

      {/* Main Panel: Video Screens and Social Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
        
        {/* Left Side: Side-by-Side YouTube Embedded Match players (8 columns) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/30 p-4 border border-white/10 rounded-2xl relative overflow-hidden flex-1 backdrop-blur-md shadow-2xl">
            
            {/* Visual floating gift overlay on the battle arena screen */}
            {floatingAnimations.map((anim) => (
              <div
                key={anim.id}
                className="absolute pointer-events-none z-50 text-center animate-bounce transition duration-150"
                style={{
                  left: anim.isForRed ? `calc(${anim.x}% / 2)` : `calc(50% + ${anim.x}% / 2)`,
                  top: `${anim.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="bg-zinc-950/95 border border-amber-500/30 text-white rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.8)] truncate max-w-[150px] backdrop-blur-md">
                  <span className="text-base">{anim.giftIcon}</span>
                  <div className="text-[10px] text-left">
                    <span className="font-extrabold text-amber-400 block">{anim.sender}</span>
                    <span className="text-zinc-400 block truncate">{anim.giftName}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* TEAM RED STREAM UNIT */}
            <div className="flex flex-col rounded-xl overflow-hidden bg-zinc-900/50 border border-rose-500/30 flex-1 relative shadow-lg">
              <div className="bg-rose-950/20 px-3 py-2 flex items-center justify-between border-b border-rose-500/20 backdrop-blur-xs">
                <span className="text-xs font-bold text-rose-500 flex items-center gap-1 select-none">
                  🔴 TIME RED • {battle.creatorRed.name}
                </span>
                <span className="text-[9px] bg-rose-500/25 text-rose-300 font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Canal: {battle.creatorRed.channelName}
                </span>
              </div>

              {/* YouTube embedded interactive iFrame */}
              <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                <iframe
                  title="ArenaPK YouTube - Red Stream Player"
                  src={`https://www.youtube.com/embed/${battle.creatorRed.youtubeVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0 absolute inset-0"
                />
                
                {/* Winner overlay state */}
                {battle.status === 'completed' && battle.winnerId === battle.creatorRed.id && (
                  <div className="absolute inset-0 bg-yellow-500/25 flex flex-col items-center justify-center z-20 backdrop-blur-md text-center p-3 animate-fade-in border border-yellow-500/40">
                    <Trophy className="w-12 h-12 text-yellow-300 fill-yellow-300 animate-bounce" />
                    <h3 className="font-black text-2xl text-white uppercase tracking-wider mt-2 drop-shadow-md italic">VENCEDOR</h3>
                    <p className="text-xs text-white font-medium drop-shadow">{battle.creatorRed.name} levou o Duelo PK!</p>
                  </div>
                )}
                {battle.status === 'completed' && battle.winnerId !== battle.creatorRed.id && (
                  <div className="absolute inset-0 bg-zinc-950/85 flex flex-col items-center justify-center z-20 backdrop-blur-md text-center p-3">
                    <span className="text-2xl">👎</span>
                    <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-widest mt-1">Derrotado</h3>
                    <p className="text-[10px] text-zinc-550">Deverá pagar a prenda: {battle.selectedStake}</p>
                  </div>
                )}
              </div>

              {/* Red stream scoreboard display */}
              <div className="p-3 bg-zinc-950/80 border-t border-white/5 flex items-center justify-between text-xs mt-auto">
                <div className="flex items-center gap-2">
                  <img src={battle.creatorRed.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-white/10" />
                  <span className="text-zinc-200 font-semibold">{battle.creatorRed.name}</span>
                </div>
                <span className="text-rose-455 font-mono font-bold text-right">
                  🏆 {battle.pointsRed.toLocaleString()} pts
                </span>
              </div>
            </div>

            {/* TEAM BLUE STREAM UNIT */}
            <div className="flex flex-col rounded-xl overflow-hidden bg-zinc-900/50 border border-blue-500/30 flex-1 relative shadow-lg">
              <div className="bg-blue-950/20 px-3 py-2 flex items-center justify-between border-b border-blue-500/20 backdrop-blur-xs">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1 select-none">
                  🔵 TIME BLUE • {battle.creatorBlue.name}
                </span>
                <span className="text-[9px] bg-blue-500/25 text-blue-300 font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Canal: {battle.creatorBlue.channelName}
                </span>
              </div>

              {/* YouTube embedded interactive iFrame */}
              <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                <iframe
                  title="ArenaPK YouTube - Blue Stream Player"
                  src={`https://www.youtube.com/embed/${battle.creatorBlue.youtubeVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0 absolute inset-0"
                />

                {/* Winner overlay state */}
                {battle.status === 'completed' && battle.winnerId === battle.creatorBlue.id && (
                  <div className="absolute inset-0 bg-yellow-500/25 flex flex-col items-center justify-center z-20 backdrop-blur-md text-center p-3 animate-fade-in border border-yellow-500/40">
                    <Trophy className="w-12 h-12 text-yellow-300 fill-yellow-300 animate-bounce" />
                    <h3 className="font-black text-2xl text-white uppercase tracking-wider mt-2 drop-shadow-md italic">VENCEDOR</h3>
                    <p className="text-xs text-white font-medium drop-shadow">{battle.creatorBlue.name} levou o Duelo PK!</p>
                  </div>
                )}
                {battle.status === 'completed' && battle.winnerId !== battle.creatorBlue.id && (
                  <div className="absolute inset-0 bg-zinc-950/85 flex flex-col items-center justify-center z-20 backdrop-blur-md text-center p-3">
                    <span className="text-2xl">👎</span>
                    <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-widest mt-1">Derrotado</h3>
                    <p className="text-[10px] text-zinc-550">Deverá pagar a prenda: {battle.selectedStake}</p>
                  </div>
                )}
              </div>

              {/* Blue stream scoreboard display */}
              <div className="p-3 bg-zinc-950/80 border-t border-white/5 flex items-center justify-between text-xs mt-auto">
                <div className="flex items-center gap-2">
                  <img src={battle.creatorBlue.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-white/10" />
                  <span className="text-zinc-200 font-semibold">{battle.creatorBlue.name}</span>
                </div>
                <span className="text-blue-400 font-mono font-bold text-right">
                  🏆 {battle.pointsBlue.toLocaleString()} pts
                </span>
              </div>
            </div>

          </div>

          {/* Interactive Gift Store / Trigger list */}
          <div className="bg-zinc-900/60 border border-white/10 p-4 md:p-5 rounded-2xl space-y-4 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-100 uppercase tracking-wider">
                <GiftIcon className="w-4 h-4 text-rose-550" />
                <span>Escolha um presente para turbinar a pontuação PK:</span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                <span>Saldo:</span>
                <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">💎 {userCoins.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {GLOBAL_GIFTS.map((gift) => (
                <div 
                  key={gift.id} 
                  className="bg-zinc-950/85 border border-white/10 rounded-xl p-2.5 flex flex-col items-center text-center justify-between space-y-2 hover:border-white/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.03)] transition-all"
                >
                  <span className="text-2xl filter drop-shadow">{gift.icon}</span>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-200 block leading-tight">{gift.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">+{gift.pkPointsBonus.toLocaleString()} PK</span>
                  </div>
                  
                  {/* Send Left / Send Right Buttons */}
                  <div className="w-full flex gap-1 pt-1.5 border-t border-white/5">
                    <button
                      onClick={() => handleSendGiftClick(gift, true)}
                      title={`Enviar para ${battle.creatorRed.name}`}
                      disabled={battle.status !== 'active'}
                      className="flex-1 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white text-[9px] font-bold transition cursor-pointer"
                    >
                      RED
                    </button>
                    <button
                      onClick={() => handleSendGiftClick(gift, false)}
                      title={`Enviar para ${battle.creatorBlue.name}`}
                      disabled={battle.status !== 'active'}
                      className="flex-1 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-[9px] font-bold transition cursor-pointer"
                    >
                      BLUE
                    </button>
                  </div>
                  
                  <div className="text-[9px] font-mono text-amber-500 font-bold">
                    💎 {gift.coinValue}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Shared custom Chat Feed (4 columns) */}
        <div className="lg:col-span-4 flex flex-col bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden min-h-[450px] backdrop-blur-md shadow-2xl relative z-20">
          <div className="bg-zinc-950/60 px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-extrabold text-zinc-150 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-rose-500" />
              Chat da Arena PK
            </h3>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest font-black">
              Nativo
            </span>
          </div>

          {/* Interactive message container scrolling list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[380px] text-left">
            {chatFeed.map((msg) => {
              // Color based on role
              let roleClass = 'text-zinc-400';
              if (msg.role === 'sponsor') roleClass = 'text-blue-400 font-semibold';
              if (msg.role === 'moderator') roleClass = 'text-emerald-400 font-bold';
              if (msg.role === 'admin') roleClass = 'text-rose-500 font-bold';

              return (
                <div key={msg.id} className="text-xs leading-relaxed space-y-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className={`font-bold ${roleClass}`}>
                      {msg.senderName}
                    </span>
                    <span className="text-[9px] text-zinc-650 font-mono">{msg.timestamp}</span>
                  </div>
                  
                  <div className="px-3 py-1.5 bg-zinc-950/70 rounded-lg text-zinc-300 relative border border-white/5 shadow-inner">
                    <p>{msg.text}</p>
                    
                    {/* Visual gift mini-badge attached */}
                    {msg.giftAttached && (
                      <div className="mt-1 flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1.5 py-0.5 text-[9px] font-bold inline-block">
                        🎁 Enviado {msg.giftAttached.count}x {msg.giftAttached.giftName} {msg.giftAttached.giftIcon}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Spectator manual chat entry box */}
          <form onSubmit={handleChatSubmit} className="p-3 bg-zinc-950/60 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Envie uma mensagem..."
              className="flex-1 bg-zinc-950 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500 transition-colors"
            />
            <button
              type="submit"
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shrink-0 cursor-pointer border border-white/5"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
