/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Video, Swords, Play, Plus, Clock, Users, Flame, UserCheck, 
  ShieldAlert, Zap, Globe, AlertCircle, Sparkles, Wallet, Settings, 
  Tv, Trophy, BadgeCheck, CheckCircle2, Search
} from 'lucide-react';
import { Creator, PKInvite, PKBattle, PKRoom } from '../types';

interface CreatorDashboardProps {
  connectedCreator: Creator | null;
  onNavigate: (view: string) => void;
  onStartLive: (title: string, videoId: string) => void;
  onStopLive: () => void;
  invites: PKInvite[];
  onAcceptInvite: (invite: PKInvite) => void;
  onDeclineInvite: (inviteId: string) => void;
  onSendInvite: (targetCreatorId: string, minutes: number, stake: string) => void;
  allCreators: Creator[];
  onSimulateIncomingInvite: () => void;
  creatorEarningsBRL?: number;
  onStartPKRoom?: (roomId: string, creatorA: Creator, creatorB: Creator, liveA_title: string, liveA_videoId: string) => void;
  activePKRoom?: PKRoom | null;
}

export default function CreatorDashboard({
  connectedCreator,
  onNavigate,
  onStartLive,
  onStopLive,
  invites,
  onAcceptInvite,
  onDeclineInvite,
  onSendInvite,
  allCreators,
  onSimulateIncomingInvite,
  creatorEarningsBRL = 745.20,
  onStartPKRoom,
  activePKRoom,
}: CreatorDashboardProps) {
  // Criar Live form state
  const [liveTitle, setLiveTitle] = useState('DUELO PK AO VIVO - ESCREVA SUA HISTÓRIA NO ARENAPK YOUTUBE!');
  const [youtubeVideoId, setYoutubeVideoId] = useState('ScMzIvxBSi4'); // Default video ID
  const [streamResolution, setStreamResolution] = useState('1080p60');
  
  // Convidar para PK state
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [pklDuration, setPkDuration] = useState(5);
  const [pkStake, setPkStake] = useState('Pagar 100 flexões na câmera ou pagar mico ao vivo!');
  
  // Navigation helper modals/toggles
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMyRoomsModal, setShowMyRoomsModal] = useState(false);

  // Convidar para PK custom flow state
  const [showInvitePKModal, setShowInvitePKModal] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  
  interface CustomSentInvite {
    id: string;
    challenger: Creator;
    target: Creator;
    durationMinutes: number;
    selectedStake: string;
    status: 'enviado' | 'aguardando' | 'aceito' | 'recusado';
  }
  
  const [localSentInvites, setLocalSentInvites] = useState<CustomSentInvite[]>([]);
  const [selectedInviteForB, setSelectedInviteForB] = useState<CustomSentInvite | null>(null);

  // Custom stakes preset list
  const STAKE_PRESETS = [
    'Pagar 100 flexões na câmera imediatamente ao perder!',
    'Cantar uma música romântica em público de olhos vendados',
    'Doar R$ 200,00 para uma instituição ao vivo',
    'Colocar foto de perfil escolhida pelo vencedor por 48h',
    'Contar piadas ruins toda vez que o chat mandar presente',
    'Imitar uma galinha por 1 minuto inteiro'
  ];

  if (!connectedCreator) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6 relative z-10 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20 text-rose-500 shadow-inner animate-pulse">
          <Video className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 hover:scale-[1.01] transition-transform duration-300">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Painel de Backstage do Criador</h2>
          <p className="text-zinc-400 text-xs font-sans max-w-sm mx-auto leading-relaxed">
            Para acessar o Painel do Criador e gerenciar suas lives ou desafios PK, você precisa primeiro conectar seu canal do YouTube.
          </p>
        </div>
        <div className="pt-4">
          <button
            onClick={() => onNavigate('login')}
            className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-xl border border-white/5 shadow-lg transition-all duration-150 transform hover:-translate-y-0.5 cursor-pointer"
          >
            Conectar Canal do YouTube Agora
          </button>
        </div>
      </div>
    );
  }

  const otherLiveCreators = allCreators.filter(
    (c) => c.id !== connectedCreator.id && c.isLive
  );

  const handleCreateLiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('create-live');
  };

  const handleQuickStartLive = () => {
    if (connectedCreator.isLive) {
      alert('Você já possui uma transmissão em andamento!');
      return;
    }
    onNavigate('create-live');
  };

  const handleSendInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) return;
    onSendInvite(selectedTargetId, pklDuration, pkStake);
    // clean
    setSelectedTargetId('');
    alert('Desafio PK enviado com sucesso! Aguardando aceite do criador parceiro...');
  };

  const handleSendCustomInvite = (targetCreator: Creator) => {
    const inviteId = `custom-inv-${Date.now()}`;
    const newInv: CustomSentInvite = {
      id: inviteId,
      challenger: connectedCreator,
      target: targetCreator,
      durationMinutes: pklDuration,
      selectedStake: pkStake,
      status: 'enviado'
    };

    setLocalSentInvites(prev => [...prev, newInv]);
    setSelectedInviteForB(newInv);

    // Turn 'enviado' to 'aguardando' after 1200ms
    setTimeout(() => {
      setLocalSentInvites(prev => prev.map(inv => {
        if (inv.id === inviteId && inv.status === 'enviado') {
          return { ...inv, status: 'aguardando' };
        }
        return inv;
      }));
    }, 1200);
  };

  const handleCustomDeclineByB = (inviteId: string) => {
    setLocalSentInvites(prev => prev.map(inv => {
      if (inv.id === inviteId) {
        return { ...inv, status: 'recusado' };
      }
      return inv;
    }));
    setSelectedInviteForB(null);
  };

  const handleCustomAcceptByB = (invite: CustomSentInvite) => {
    setLocalSentInvites(prev => prev.map(inv => {
      if (inv.id === invite.id) {
        return { ...inv, status: 'aceito' };
      }
      return inv;
    }));
    setSelectedInviteForB(null);

    if (onStartPKRoom) {
      const generatedRoomId = `ROOM-${Math.floor(100000 + Math.random() * 900000)}`;
      setTimeout(() => {
        onStartPKRoom(
          generatedRoomId,
          connectedCreator,
          invite.target,
          connectedCreator.liveTitle || 'DUELO PK AO VIVO NO ARENAPK YOUTUBE!',
          connectedCreator.youtubeVideoId || 'ScMzIvxBSi4'
        );
        setShowInvitePKModal(false);
      }, 1000);
    }
  };

  return (
    <div className="space-y-8 py-6 pb-20 relative z-10 animate-fade-in font-sans">
      
      {/* Header Area showing nome do canal & status: canal conectado */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-6 bg-zinc-900/60 border border-white/10 rounded-2xl relative overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={connectedCreator.avatar} 
              alt={connectedCreator.name} 
              className="w-16 h-16 rounded-full object-cover border-2 border-rose-500 shadow-md shadow-rose-500/20"
            />
            {connectedCreator.isLive && (
              <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase antialiased animate-pulse font-mono shadow-sm">
                AO VIVO
              </span>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Nome do canal */}
              <h1 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight">{connectedCreator.name}</h1>
              
              {/* Status: Canal Conectado badge requested */}
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 select-none shadow-sm h-5 animate-pulse">
                <BadgeCheck className="w-3 h-3 text-emerald-400" />
                Status: Canal Conectado
              </span>
            </div>
            
            <p className="text-xs text-zinc-400 font-sans mt-1">
              Youtube Handle: <span className="text-rose-455 font-bold font-mono">@{connectedCreator.channelName}</span> • <span className="font-mono text-zinc-300 font-bold">{connectedCreator.subscribers.toLocaleString()}</span> inscritos sincronizados
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {connectedCreator.isLive && (
            <button
              type="button"
              onClick={() => onNavigate('creator-battle-hub')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 transition duration-200 cursor-pointer shadow-lg shadow-rose-600/15 border border-white/5"
            >
              <Zap className="w-4 h-4 fill-current text-white animate-bounce" />
              Controle de Combate PK
            </button>
          )}

          {connectedCreator.isLive ? (
            <button
              type="button"
              onClick={onStopLive}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-black uppercase tracking-wider text-zinc-300 border border-white/5 transition duration-150 cursor-pointer shadow-inner"
            >
              Desligar Estúdio
            </button>
          ) : (
            <span className="text-[10px] font-mono font-black uppercase text-amber-400 bg-amber-500/10 px-3 py-2.5 rounded-xl border border-amber-500/20 flex items-center gap-1.5 animate-pulse select-none">
              <AlertCircle className="w-4 h-4" />
              Estúdio de Transmissão Offline
            </span>
          )}
        </div>
      </div>

      {/* Button controls requested: Iniciar nova live, Minhas salas, Carteira, Configurações */}
      <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono mb-3">Atalhos do Backstage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Botão Iniciar nova live */}
          <button
            type="button"
            onClick={handleQuickStartLive}
            className={`px-4 py-3 rounded-xl border text-left flex items-center justify-between transition group cursor-pointer ${
              connectedCreator.isLive 
                ? 'bg-zinc-950/40 border-white/5 opacity-50 cursor-not-allowed' 
                : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60 shadow-lg shadow-rose-900/10'
            }`}
          >
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-455 block font-mono">Backstage</span>
              <span className="text-xs font-bold text-white block mt-0.5 group-hover:text-rose-400 transition-colors">Iniciar nova live</span>
            </div>
            <Play className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </button>

          {/* Botão Minhas salas */}
          <button
            type="button"
            onClick={() => setShowMyRoomsModal(!showMyRoomsModal)}
            className="px-4 py-3 rounded-xl bg-zinc-950/80 border border-white/10 hover:border-zinc-700 text-left flex items-center justify-between transition group cursor-pointer shadow-md"
          >
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block font-mono font-bold">Histórico</span>
              <span className="text-xs font-bold text-zinc-200 block mt-0.5 group-hover:text-white">Minhas salas</span>
            </div>
            <Tv className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </button>

          {/* Botão Carteira */}
          <button
            type="button"
            onClick={() => onNavigate('wallet')}
            className="px-4 py-3 rounded-xl bg-zinc-950/80 border border-white/10 hover:border-zinc-700 text-left flex items-center justify-between transition group cursor-pointer shadow-md"
          >
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block font-mono font-bold">Saques</span>
              <span className="text-xs font-bold text-zinc-200 block mt-0.5 group-hover:text-amber-400 text-amber-350">Carteira</span>
            </div>
            <Wallet className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </button>

          {/* Botão Configurações */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(!showSettingsModal)}
            className="px-4 py-3 rounded-xl bg-zinc-950/80 border border-white/10 hover:border-zinc-700 text-left flex items-center justify-between transition group cursor-pointer shadow-md"
          >
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block font-mono font-bold">Ajustes</span>
              <span className="text-xs font-bold text-zinc-200 block mt-0.5 group-hover:text-zinc-150">Configurações</span>
            </div>
            <Settings className="w-4 h-4 text-zinc-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Simulated settings panel if toggled */}
      {showSettingsModal && (
        <div className="p-5 bg-zinc-900 border border-amber-500/20 rounded-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Settings className="w-4 h-4 animate-spin-slow" />
              Configurações do Canal Disponíveis
            </h4>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="text-xs font-bold text-zinc-500 hover:text-white"
            >
              Fechar ×
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">
              <span className="font-bold text-zinc-300 block mb-1">Overlay de Placar PK</span>
              <p className="text-[11px] text-zinc-500">Gere um widget transparente em HTML para fixar no OBS se preferir.</p>
              <button 
                onClick={() => alert("Copied widget code to clipboard!")}
                className="mt-2 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-rose-455 hover:text-rose-400 p-1 px-3.5 rounded font-mono font-bold block"
              >
                Copiar URL Overlay OBS
              </button>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">
              <span className="font-bold text-zinc-300 block mb-1">Alertas Sonoros</span>
              <p className="text-[11px] text-zinc-500">Ative sons customizados para novos presentes de grande valor.</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-400">Ativado (Padrão)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">
              <span className="font-bold text-zinc-300 block mb-1">Parceiro de Equipe</span>
              <p className="text-[11px] text-zinc-500">Vincule sub-contas para gerenciar moderações de chat próprio.</p>
              <span className="text-[10px] font-mono text-zinc-500 block mt-2">Nenhum moderador extra</span>
            </div>
          </div>
        </div>
      )}

      {/* Simulated list of My Rooms / Minhas Salas if toggled */}
      {showMyRoomsModal && (
        <div className="p-5 bg-zinc-900 border border-blue-500/20 rounded-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Tv className="w-4 h-4" />
              Histórico de Salas Recentes do Canal
            </h4>
            <button
              onClick={() => setShowMyRoomsModal(false)}
              className="text-xs font-bold text-zinc-500 hover:text-white font-mono"
            >
              Fechar ×
            </button>
          </div>
          <div className="space-y-2 text-xs font-sans">
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-bold text-zinc-300 block">DESAFIO MULTIPLICADOR VS GAULES</span>
                <span className="text-[10px] text-zinc-500">Finalizada há 2 horas • Duração: 5 minutos</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-2.5 py-0.5 font-bold font-mono uppercase">Vencedor (+ R$ 450)</span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-bold text-zinc-300 block">ARENA DE APERFEIÇOAMENTO VERSUS</span>
                <span className="text-[10px] text-zinc-500">Finalizada há 1 dia • Duração: 3 minutos</span>
              </div>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-white/5 rounded px-2.5 py-0.5 font-bold font-mono uppercase">Segunda Posição</span>
            </div>
          </div>
        </div>
      )}

      {/* Cards de Métricas Simuladas: espectadores, presentes recebidos, saldo, batalhas vencidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card: Espectadores */}
        <div className="p-5 bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg hover:border-white/15 transition group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono block">Espectadores</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-455 border border-rose-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-white italic tracking-tight">
            {connectedCreator.isLive ? '5,240' : '0'} 
          </p>
          <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest block mt-1">
            {connectedCreator.isLive ? '● Simultâneos no Player' : 'Live Offline no YouTube'}
          </span>
        </div>

        {/* Card: Presentes Recebidos */}
        <div className="p-5 bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg hover:border-white/15 transition group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono block">Presentes Rec.</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-white italic tracking-tight">
            148
          </p>
          <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest block mt-1">
            👑 45 Coroas • 🚀 15 Foguetes
          </span>
        </div>

        {/* Card: Saldo monetário */}
        <div className="p-5 bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg hover:border-white/15 transition group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono block">Saldo Disponível</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-450 border border-emerald-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-emerald-400 font-mono tracking-tight">
            R$ {creatorEarningsBRL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest block mt-1">
            Liberado para Saque PIX
          </span>
        </div>

        {/* Card: Batalhas Vencidas */}
        <div className="p-5 bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg hover:border-white/15 transition group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono block">Batalhas Vencidas</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-white italic tracking-tight">
            12
          </p>
          <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest block mt-1">
            Taxa de Vitória: 84.5%
          </span>
        </div>

      </div>

      {/* Main Grid: Control Panels and Action Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
        
        {/* Left Hand: Create / Manage Stream */}
        <div className="lg:col-span-7 space-y-6">
          {!connectedCreator.isLive ? (
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
              <div className="bg-zinc-950 px-5 py-4 border-b border-white/5 flex items-center gap-2.5">
                <Video className="w-5 h-5 text-rose-500 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-white text-sm uppercase italic tracking-tight font-mono">Configurar Transmissão do YouTube</h3>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">Estipule os dados do player incorporado no portal</p>
                </div>
              </div>

              <form onSubmit={handleCreateLiveSubmit} className="p-6 space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono">Título da Transmissão</label>
                    <input
                      type="text"
                      required
                      value={liveTitle}
                      onChange={(e) => setLiveTitle(e.target.value)}
                      placeholder="Tema ou nome da sua live"
                      className="w-full bg-zinc-950 border border-white/10 text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono">ID do Vídeo do YouTube</label>
                      <select
                        value={youtubeVideoId}
                        onChange={(e) => setYoutubeVideoId(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 text-zinc-300 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-rose-500 transition-colors cursor-pointer"
                      >
                        <option value="ScMzIvxBSi4">Cazé React Exemplo (ScMzIvxBSi4)</option>
                        <option value="U8C6EsuM_Gg">CS2 Major Cup (U8C6EsuM_Gg)</option>
                        <option value="S_C4h7zN-7g">FreeFire Highlights (S_C4h7zN-7g)</option>
                        <option value="m79Hh_f0R7o">Coringa GTA 5 RP (m79Hh_f0R7o)</option>
                        <option value="dQw4w9WgXcQ">Rick Astley Classic (dQw4w9WgXcQ)</option>
                      </select>
                      <span className="text-[9px] text-zinc-500 mt-1.5 block">Insere o player de vídeo incorporado oficial.</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono font-bold">Qualidade Máxima de Entrada</label>
                      <select
                        value={streamResolution}
                        onChange={(e) => setStreamResolution(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 text-zinc-300 rounded-xl px-3 py-3 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="1080p60">1080p @ 60fps (Recomendado)</option>
                        <option value="720p60">720p @ 60fps</option>
                        <option value="1080p30">1080p @ 30fps</option>
                        <option value="4k">2160p (UltraHD 4K)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 bg-rose-500/5 rounded-xl border border-rose-500/10 text-[10px] text-zinc-400 flex items-start gap-2.5 leading-relaxed">
                    <span className="text-sm select-none">💡</span>
                    <p>
                      Sua live do YouTube será transmitida dentro das salas PK oficiais. Os ajudantes de suporte podem gerenciar doações de PIX e chat sincronizado global do portal de forma integrada.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 text-xs font-black uppercase tracking-wider text-white bg-rose-650 hover:bg-rose-550 border border-white/5 rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 transform active:scale-[0.98] shadow-lg shadow-rose-600/15"
                >
                  <Play className="w-4 h-4 fill-current text-white" />
                  Iniciar Transmissão ArenaPK YouTube
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
              <div className="bg-zinc-950 px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-550 animate-ping" />
                  <h3 className="font-extrabold text-white text-sm uppercase italic tracking-tight font-mono">Streamer Ativo - Backstage</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono font-bold">
                  <Users className="w-3.5 h-3.5 text-rose-500" />
                  <span>5,240 assistindo</span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="p-4 bg-zinc-950/80 rounded-xl border border-white/5 space-y-3 shadow-inner">
                  <h4 className="text-[10px] font-bold text-rose-450 uppercase tracking-widest font-mono">Layout de Live no YouTube</h4>
                  <p className="text-sm font-black text-white">{connectedCreator.liveTitle}</p>
                  <div className="text-[10px] text-zinc-500 uppercase flex flex-wrap gap-x-4 gap-y-1 font-mono tracking-wider font-bold">
                    <span>ID Vídeo: <span className="text-zinc-400">{connectedCreator.youtubeVideoId}</span></span>
                    <span>•</span>
                    <span>Qualidade: <span className="text-zinc-400">{streamResolution}</span></span>
                    <span>•</span>
                    <span>Encoder: <span className="text-zinc-200">ArenaPK API Server</span></span>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <Swords className="w-4 h-4 text-rose-550 animate-pulse" />
                      Painel Integrado de Convites PK
                    </h4>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Pesquise por streamer no portal ou handle do YouTube, configure a prenda do perdedor e envie o convite interativo. O oponente receberá a chamada em tempo real.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setShowInvitePKModal(true);
                      setInviteSearchQuery('');
                      setPkStake('Pagar 100 flexões na câmera imediatamente ao perder!');
                    }}
                    className="w-full py-4 text-xs font-black uppercase tracking-wider text-white bg-rose-650 hover:bg-rose-550 border border-white/5 rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 transform active:scale-[0.98] shadow-lg shadow-rose-600/15"
                  >
                    <Plus className="w-4.5 h-4.5" />
                    Convidar para PK (Nova Tela)
                  </button>

                  {/* HIGH FIDELITY PK INVITATION MODAL */}
                  {showInvitePKModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                      <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        
                        {/* Header */}
                        <div className="px-6 py-4.5 bg-zinc-950 border-b border-white/5 flex items-center justify-between col-span-12">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-600/10 rounded-xl border border-rose-500/20 text-rose-500">
                              <Swords className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">Pesquisar e Convidar Canais para Duelo</h3>
                              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Batalha com feeds sincrônicos e chat do YouTube</p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setShowInvitePKModal(false)}
                            className="text-zinc-500 hover:text-white transition duration-150 text-xs px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 rounded-lg cursor-pointer"
                          >
                            Fechar Painel
                          </button>
                        </div>

                        {/* Split Content */}
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 bg-zinc-900">
                          
                          {/* Left Panel: Search & Online Creators (Col span 7) */}
                          <div className="md:col-span-7 flex flex-col space-y-4">
                            
                            {/* Invite Parameters & Stake config */}
                            <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/5 space-y-3.5">
                              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">1. Configurar Regras do Duelo</h4>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">Duração</label>
                                  <select
                                    value={pklDuration}
                                    onChange={(e) => setPkDuration(Number(e.target.value))}
                                    className="w-full bg-zinc-900 border border-white/5 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-rose-500"
                                  >
                                    <option value={3}>3 Minutos (Fast)</option>
                                    <option value={5}>5 Minutos (Oficial)</option>
                                    <option value={10}>10 Minutos (Épica)</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">Prenda em Jogo</label>
                                  <input
                                    type="text"
                                    value={pkStake}
                                    onChange={(e) => setPkStake(e.target.value)}
                                    placeholder="Ex: Pagar 50 flexões"
                                    className="w-full bg-zinc-900 border border-white/5 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-rose-500 font-sans"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {STAKE_PRESETS.slice(0, 4).map((st, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setPkStake(st)}
                                    className="text-[8px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 px-2 py-1 rounded text-zinc-400 transition"
                                  >
                                    {st.substring(0, 30)}...
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Search channel */}
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">2. Buscar Criador por Nome ou @Canal</label>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                  type="text"
                                  value={inviteSearchQuery}
                                  onChange={(e) => setInviteSearchQuery(e.target.value)}
                                  placeholder="Digite para buscar (Ex: Casimiro, Gaules, Nobru...)"
                                  className="w-full bg-zinc-950 border border-white/10 text-white pl-9.5 pr-4 py-3 rounded-xl text-xs focus:outline-none focus:border-rose-500 transition-all font-sans"
                                />
                              </div>
                            </div>

                            {/* Online Creators Matching */}
                            <div className="flex-1 space-y-2">
                              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Streamers Disponíveis ({allCreators.length - 1})</h4>
                              
                              <div className="bg-zinc-950/60 rounded-2xl border border-white/5 p-2 overflow-y-auto max-h-[220px] space-y-1.5">
                                {allCreators
                                  .filter(c => c.id !== connectedCreator.id)
                                  .filter(c => {
                                    if (!inviteSearchQuery) return true;
                                    const search = inviteSearchQuery.toLowerCase();
                                    return c.name.toLowerCase().includes(search) || c.channelName.toLowerCase().includes(search);
                                  })
                                  .map(creator => (
                                    <div 
                                      key={creator.id}
                                      className="p-2.5 bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 rounded-xl hover:border-white/10 transition flex items-center justify-between"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="relative">
                                          <img src={creator.avatar} alt={creator.name} className="w-9 h-9 rounded-full object-cover border border-white/10 animate-fade-in" />
                                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-zinc-900 animate-pulse" />
                                        </div>
                                        <div>
                                          <span className="font-bold text-white text-xs block">{creator.name}</span>
                                          <span className="text-[10px] text-zinc-400 block font-mono">@{creator.channelName} • {creator.subscribers.toLocaleString()} subs</span>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleSendCustomInvite(creator)}
                                        className="py-1.5 px-3 bg-rose-650 hover:bg-rose-550 text-white font-black text-[10px] uppercase tracking-wider rounded-lg cursor-pointer transition border border-white/5"
                                      >
                                        Convidar
                                      </button>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          </div>

                          {/* Right Panel: Sent progress & Device simulation (Col span 5) */}
                          <div className="md:col-span-5 flex flex-col space-y-4">
                            
                            {/* Sent status trackers */}
                            <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/5 space-y-3">
                              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Status dos Convites Enviados</h4>
                              
                              {localSentInvites.length === 0 ? (
                                <div className="text-center py-6 text-zinc-500 text-xs font-sans">
                                  Nenhum convite disparado nesta sessão.
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                                  {localSentInvites.map((inv) => (
                                    <div 
                                      key={inv.id} 
                                      className="p-2.5 bg-zinc-900/60 border border-white/5 rounded-lg flex items-center justify-between text-xs"
                                    >
                                      <div>
                                        <span className="font-bold text-white block">{inv.target.name}</span>
                                        <span className="text-[8px] text-zinc-500 block font-mono">Stake: {inv.selectedStake.substring(0, 20)}...</span>
                                      </div>
                                      
                                      <div>
                                        {inv.status === 'enviado' && (
                                          <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono uppercase tracking-wider animate-pulse">
                                            Enviado
                                          </span>
                                        )}
                                        {inv.status === 'aguardando' && (
                                          <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-mono uppercase tracking-wider animate-pulse">
                                            Aguardando
                                          </span>
                                        )}
                                        {inv.status === 'aceito' && (
                                          <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono uppercase tracking-wider">
                                            Aceito
                                          </span>
                                        )}
                                        {inv.status === 'recusado' && (
                                          <span className="text-[9px] font-bold bg-rose-500/10 text-rose-455 px-2 py-0.5 rounded border border-rose-500/20 font-mono uppercase tracking-wider">
                                            Recusado
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Device mockup preview for Creator B receiving invitation */}
                            <div className="flex-1 bg-zinc-950 rounded-2xl border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden shadow-inner">
                              
                              {/* Screen Notch simulation */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-zinc-900 w-24 h-4 rounded-b-xl border-x border-b border-white/5 flex items-center justify-center">
                                <span className="w-2.5 h-2.5 bg-black rounded-full" />
                              </div>

                              <div className="space-y-3.5 pr-2 pt-2.5">
                                <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest block text-center">
                                  Celular do Criador B (Mockup)
                                </span>
                                
                                {selectedInviteForB ? (
                                  <div className="space-y-4 pt-1 animate-fade-in text-center">
                                    
                                    {/* Call Layout simulation */}
                                    <div className="text-center space-y-2">
                                      <div className="inline-block relative">
                                        <img src={selectedInviteForB.challenger.avatar} alt="Avatar" className="w-12 h-12 rounded-full mx-auto border-2 border-rose-500 animate-pulse object-cover" />
                                        <span className="absolute bottom-0 right-0 bg-rose-500 text-white rounded-full p-1 border border-zinc-950">
                                          <Swords className="w-3 h-3" />
                                        </span>
                                      </div>
                                      
                                      <div>
                                        <h5 className="font-sans font-black text-white text-xs block">
                                          {selectedInviteForB.challenger.name}
                                        </h5>
                                        <p className="text-[9px] text-rose-455 font-mono uppercase tracking-wider font-extrabold animate-pulse">
                                          Convite Recebido!
                                        </p>
                                      </div>
                                    </div>

                                    {/* Invite details */}
                                    <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 space-y-2 text-[10px] text-left">
                                      <div>
                                        <strong className="text-zinc-500 uppercase font-mono tracking-widest text-[8px] block">Título da Live Oponente:</strong>
                                        <span className="text-zinc-300 font-sans block leading-relaxed font-bold">
                                          {selectedInviteForB.challenger.liveTitle || 'Batalha Suprema de Duelos'}
                                        </span>
                                      </div>
                                      
                                      <div>
                                        <strong className="text-zinc-500 uppercase font-mono tracking-widest text-[8px] block">Punição em jogo:</strong>
                                        <span className="text-amber-400 font-bold block bg-black/60 p-1.5 rounded border border-white/5 font-sans leading-relaxed">
                                          {selectedInviteForB.selectedStake}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Buttons to Accept or Reject on behalf of Creator B */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <button
                                        type="button"
                                        onClick={() => handleCustomDeclineByB(selectedInviteForB.id)}
                                        className="py-2 bg-zinc-850 hover:bg-zinc-850 text-zinc-400 hover:text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition text-center"
                                      >
                                        Recusar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCustomAcceptByB(selectedInviteForB)}
                                        className="py-2 bg-emerald-650 hover:bg-emerald-550 text-white font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition text-center border border-white/5 shadow-md shadow-emerald-600/5"
                                      >
                                        Aceitar PK
                                      </button>
                                    </div>

                                  </div>
                                ) : (
                                  <div className="py-20 text-center space-y-3">
                                    <Clock className="w-8 h-8 text-zinc-650 mx-auto animate-pulse" />
                                    <div>
                                      <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                                        Nenhum convite recebido no celular do Criador B no momento.
                                      </p>
                                      <p className="text-[9px] text-zinc-600 font-mono mt-1">
                                        Selecione um criador ao lado e clique em convidar para receber a chamada ao vivo!
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Hand: Invites Log, Simulated Invites trigger */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Invitations Tracker */}
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden p-5 space-y-4 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5 font-mono">
                  <Clock className="w-4 h-4 text-rose-550 animate-pulse" />
                  Convites PK ({invites.length})
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-0.5">Clique para aceitar o duelo</p>
              </div>

              {/* Dev Simulation Assist */}
              <button
                type="button"
                onClick={onSimulateIncomingInvite}
                className="text-[9px] font-black uppercase tracking-wider border border-rose-500/30 text-rose-455 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg transition duration-150 cursor-pointer font-mono"
              >
                Simular Convite
              </button>
            </div>

            {invites.length === 0 ? (
              <div className="text-center py-10 bg-zinc-950/40 rounded-xl border border-white/5 text-zinc-500 text-xs font-sans">
                Nenhum convite pendente.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {invites.map((invite) => (
                  <div 
                    key={invite.id} 
                    className="p-3.5 bg-zinc-950/80 rounded-xl border border-white/5 hover:border-white/10 transition-colors space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <img src={invite.challenger.avatar} alt={invite.challenger.name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                      <div>
                        <span className="font-bold text-white text-xs block">{invite.challenger.name}</span>
                        <span className="text-[9px] text-zinc-400 block uppercase font-mono">Duração: {invite.durationMinutes} minutos</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-zinc-900 border border-white/5 rounded text-xs text-amber-400 font-sans leading-relaxed">
                      <span className="font-bold block text-[9px] text-zinc-500 uppercase font-mono tracking-wider mb-0.5">Prenda em jogo:</span>
                      {invite.selectedStake}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => onAcceptInvite(invite)}
                        className="flex-1 py-1.5 bg-rose-650 hover:bg-rose-550 font-black text-white text-[10px] uppercase tracking-wider rounded-lg cursor-pointer transition-colors border border-white/5"
                      >
                        Aceitar Duelo
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeclineInvite(invite.id)}
                        className="flex-1 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-350 font-extrabold text-[10px] uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guidelines Tips */}
          <div className="p-5 bg-zinc-900/60 border border-white/10 rounded-2xl space-y-3 backdrop-blur-md shadow-2xl">
            <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5 uppercase italic tracking-tight font-mono">
              <Sparkles className="w-4 h-4 text-rose-550 animate-pulse" />
              Diretrizes do Canal Sincronizado
            </h4>
            <div className="space-y-2.5 text-[11px] text-zinc-400 font-sans leading-relaxed">
              <p>
                <strong>1. Defina prendas engraçadas:</strong> O volume de presentes enviados pelo público cresce drasticamente quando as prenda do perdedor estimulam a interatividade física ao vivo.
              </p>
              <p>
                <strong>2. Compartilhe o link:</strong> Sempre envie o link público da Sala PK para os chats tradicionais do YouTube, direcionando o público para usar suas vantagens no placar.
              </p>
              <p>
                <strong>3. Moderação unificada:</strong> Cadastre palavras sensíveis ou proibidas na aba "Moderação" para garantir o controle absoluto e a segurança contra infrações de marca.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
