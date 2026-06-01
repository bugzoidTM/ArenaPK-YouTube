/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Trash, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Hammer, 
  Pause, 
  Play, 
  Users, 
  Coins, 
  MessageSquare, 
  History, 
  Search, 
  UserMinus, 
  Ban, 
  ExternalLink 
} from 'lucide-react';
import { Creator, PKBattle, PKRoom, SystemAuditLog, Gift } from '../types';
import { moderationService, ReportedMessage } from '../services/moderationService';
import { paymentService, GiftTransaction } from '../services/paymentService';

interface ModerationViewProps {
  auditLogs: SystemAuditLog[];
  onAddAuditLog: (type: 'report' | 'ban' | 'setting_change', details: string) => void;
  onClearLog: (id: string) => void;
  allCreators: Creator[];
  setAllCreators: React.Dispatch<React.SetStateAction<Creator[]>>;
  battles: PKBattle[];
  setBattles: React.Dispatch<React.SetStateAction<PKBattle[]>>;
  activePKRoom: PKRoom | null;
  setActivePKRoom: React.Dispatch<React.SetStateAction<PKRoom | null>>;
}

export default function ModerationView({
  auditLogs,
  onAddAuditLog,
  onClearLog,
  allCreators,
  setAllCreators,
  battles,
  setBattles,
  activePKRoom,
  setActivePKRoom,
}: ModerationViewProps) {
  // Sync state with moderationService
  const [giftsPaused, setGiftsPaused] = useState(moderationService.isGiftsPaused());
  const [reportedMsgs, setReportedMsgs] = useState<ReportedMessage[]>([]);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [forbiddenWords, setForbiddenWords] = useState<string[]>([]);
  const [simulatedTxs, setSimulatedTxs] = useState<GiftTransaction[]>([]);
  const [serviceAuditLogs, setServiceAuditLogs] = useState<any[]>([]);

  // Search filter
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [banInput, setBanInput] = useState('');
  const [newWord, setNewWord] = useState('');

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'rooms' | 'reports' | 'txs' | 'rules' | 'logs'>('rooms');

  // Load and refresh settings from local persistence service
  const refreshServiceStates = () => {
    setGiftsPaused(moderationService.isGiftsPaused());
    setReportedMsgs(moderationService.getReportedMessages());
    setBannedUsers(moderationService.getBannedUsers());
    setForbiddenWords(moderationService.getForbiddenWords());
    setServiceAuditLogs(moderationService.getAuditLogs());
    
    // Fetch all simulated transactions (combine sent & received to simulate whole marketplace overhead ledger)
    const sent = paymentService.getSentTransactions();
    const received = paymentService.getReceivedTransactions();
    const combined = [...sent, ...received].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    setSimulatedTxs(combined);
  };

  useEffect(() => {
    refreshServiceStates();
  }, []);

  // PAUSE GIFTS Master control action
  const handleToggleGifts = () => {
    const nextPausedState = !giftsPaused;
    moderationService.setGiftsPaused(nextPausedState);
    setGiftsPaused(nextPausedState);
    onAddAuditLog('setting_change', `O envio de presentes foi ${nextPausedState ? 'PAUSADO' : 'RETOMADO/ATIVADO'} globalmente.`);
    refreshServiceStates();
  };

  // BAN ACTIONS
  const handleBanUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banInput.trim()) return;

    const userToBan = banInput.trim();
    const success = moderationService.banUser(userToBan);
    if (success) {
      onAddAuditLog('ban', `Usuário "${userToBan}" banido e impedido de comentar.`);
      setBanInput('');
      refreshServiceStates();
    } else {
      alert('Usuário já se encontra bloqueado.');
    }
  };

  const handleUnbanUser = (name: string) => {
    moderationService.unbanUser(name);
    onAddAuditLog('setting_change', `Usuário "${name}" foi desbloqueado da plataforma.`);
    refreshServiceStates();
  };

  // FORBIDDEN WORD ACTIONS
  const handleAddWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    const wordToBlock = newWord.trim();
    const success = moderationService.addForbiddenWord(wordToBlock);
    if (success) {
      onAddAuditLog('setting_change', `Nova palavra censurada no chat próprio da ArenaPK: "${wordToBlock}"`);
      setNewWord('');
      refreshServiceStates();
    } else {
      alert('Palavra já existe no filtro.');
    }
  };

  const handleRemoveWord = (word: string) => {
    moderationService.removeForbiddenWord(word);
    onAddAuditLog('setting_change', `Palavra "${word}" removida do filtro de chat.`);
    refreshServiceStates();
  };

  // REPORT RESOLVE ACTIONS
  const handleDismissReport = (reportId: string) => {
    moderationService.dismissReport(reportId);
    refreshServiceStates();
  };

  const handleBanReporterUser = (senderName: string, reportId: string) => {
    moderationService.banUser(senderName);
    moderationService.dismissReport(reportId);
    onAddAuditLog('ban', `Usuário infrator "${senderName}" foi banido após análise de denúncia.`);
    refreshServiceStates();
  };

  // CLOSE / SHUTDOWN LIVE ROOMS ACTIONS
  const handleCloseBattle = (battleId: string) => {
    // 1. Close globally inside moderationService
    moderationService.closeRoom(battleId);
    // 2. Shut down battle state in App.tsx
    setBattles(prev => prev.map(b => {
      if (b.id === battleId) {
        return { ...b, status: 'timeout', timeLeftSeconds: 0 };
      }
      return b;
    }));
    // 3. Post System update message
    onAddAuditLog('setting_change', `A batalha com ID ${battleId} foi abruptamente encerrada pela moderação.`);
    refreshServiceStates();
    alert('Desafio PK encerrado com sucesso pelo Administrador.');
  };

  const handleCloseActivePKRoom = () => {
    if (!activePKRoom) return;

    const id = activePKRoom.roomId;
    moderationService.closeRoom(id);
    setActivePKRoom(null);
    onAddAuditLog('setting_change', `A sala de transmissão PK ativa entre @${activePKRoom.creatorA.channelName} e @${activePKRoom.creatorB.channelName} foi sumariamente encerrada.`);
    refreshServiceStates();
    alert('Sala PK de transmissão encerrada pelo Administrador.');
  };

  // Simulated viewer list count helpers
  const getTotalViewersInBattles = () => {
    // Active battles viewer estimation
    const battlesActiveCount = battles.filter(b => b.status === 'active').length;
    const standardRoomViewers = activePKRoom ? activePKRoom.viewers : 0;
    return (battlesActiveCount * 4500) + standardRoomViewers + 1045; // arbitrary active base
  };

  // Filter service audit logs based on search
  const filteredServiceLogs = serviceAuditLogs.filter(log => 
    log.details.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    log.type.toLowerCase().includes(logSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 py-6 pb-20 relative z-10 animate-fade-in font-sans">
      
      {/* Header Panel */}
      <div className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-550/10 text-rose-400 border border-rose-500/20 rounded-xl flex items-center justify-center text-xl shrink-0">
            <ShieldAlert className="w-6 h-6 animate-pulse text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
              Painel Administrativo da ArenaPK
              <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono tracking-widest font-black uppercase px-2 py-0.5 rounded">
                Admin Mode
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-sans">
              Segurança reforçada, moderação de conversas, auditoria financeira e encerramento preventivo de salas.
            </p>
          </div>
        </div>

        {/* Global Gift Master Switch Lockout Control */}
        <div className="shrink-0 flex items-center gap-3 bg-zinc-950 border border-white/5 rounded-xl p-3 shadow-inner">
          <div className="text-right">
            <div className="text-xs font-bold text-white uppercase font-mono">Presentes Globais</div>
            <div className={`text-[10px] font-mono leading-none ${giftsPaused ? 'text-rose-500 font-bold' : 'text-emerald-400'}`}>
              {giftsPaused ? '🚫 BLOQUEADO / PAUSADO' : '● EXECUTando NORMALMENTE'}
            </div>
          </div>
          <button
            onClick={handleToggleGifts}
            className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none ${
              giftsPaused ? 'bg-rose-600' : 'bg-emerald-500'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-md transform duration-200 ease-in-out ${
                giftsPaused ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Statistics counters cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl space-y-1.5 text-left">
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-sky-400" /> Espectadores Online
          </div>
          <p className="text-xl font-black text-white font-mono">{getTotalViewersInBattles().toLocaleString()}</p>
          <div className="text-[9px] text-zinc-500">Transmissão em tempo real</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl space-y-1.5 text-left">
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Mensagens Denunciadas
          </div>
          <p className="text-xl font-black text-white font-mono">{reportedMsgs.length}</p>
          <div className="text-[9px] text-rose-455 font-semibold">Análise de denúncias pendentes</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl space-y-1.5 text-left">
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" /> Transações Simuladas
          </div>
          <p className="text-xl font-black text-white font-mono">{simulatedTxs.length}</p>
          <div className="text-[9px] text-zinc-500">Doações e pacotes transacionados</div>
        </div>

        <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl space-y-1.5 text-left">
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-purple-400" /> Log de Transações
          </div>
          <p className="text-xl font-black text-white font-mono">{serviceAuditLogs.length}</p>
          <div className="text-[9px] text-zinc-500">Eventos de auditoria geral</div>
        </div>
      </div>

      {/* Tabs Menu Navigation inside Admin panel */}
      <div className="flex border-b border-white/10 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer whitespace-nowrap transition duration-150 ${
            activeTab === 'rooms' 
              ? 'border-rose-500 text-rose-400 font-black' 
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          📺 Salas Ativas ({battles.filter(b=>b.status==='active').length + (activePKRoom ? 1 : 0)})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer whitespace-nowrap transition duration-150 flex items-center gap-1.5 ${
            activeTab === 'reports' 
              ? 'border-rose-500 text-rose-400 font-black' 
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          💬 Denúncias Chat
          {reportedMsgs.length > 0 && (
            <span className="w-4 h-4 bg-rose-600 text-white rounded-full text-[8px] flex items-center justify-center font-bold">
              {reportedMsgs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('txs')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer whitespace-nowrap transition duration-150 ${
            activeTab === 'txs' 
              ? 'border-rose-500 text-rose-400 font-black' 
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          💰 Transações Presentes
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer whitespace-nowrap transition duration-150 ${
            activeTab === 'rules' 
              ? 'border-rose-500 text-rose-400 font-black' 
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🛡️ Censura & Bloqueio
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer whitespace-nowrap transition duration-150 ${
            activeTab === 'logs' 
              ? 'border-rose-500 text-rose-400 font-black' 
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          📊 Rastro de Auditoria ({serviceAuditLogs.length})
        </button>
      </div>

      {/* Main tab content */}
      <div className="mt-4">
        
        {/* TAB 1: ACTIVE ROOMS LIST */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 text-left space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  Listagem de Salas Ativas de Batalhas PK e Lives
                </h3>
                <p className="text-xs text-zinc-400">
                  Gerencie transmissões simultâneas que estão injetando doações em tempo real. Você pode monitorar o tráfego ou forçar o desligamento preventivo de salas inadequadas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Active Dynamic PK Room from user UI */}
                {activePKRoom && (
                  <div className="p-4 bg-rose-950/15 border border-rose-500/20 rounded-xl space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded px-1.5 py-0.5 uppercase tracking-widest">
                        SALA PK PRINCIPAL ATIVA 🖥️
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-400 flex items-center gap-1 shrink-0">
                        <Users className="w-3.5 h-3.5 text-zinc-500" /> {activePKRoom.viewers.toLocaleString()} assistindo
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-zinc-300 font-bold font-mono">
                        {activePKRoom.creatorA.name} <span className="text-rose-500 italic font-black">X</span> {activePKRoom.creatorB.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 select-none">
                        Pontuação ativa: {activePKRoom.scoreA} pts vs {activePKRoom.scoreB} pts • Tempo restante: {activePKRoom.timer}s
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex gap-2">
                      <button
                        onClick={handleCloseActivePKRoom}
                        className="flex-1 bg-rose-650 hover:bg-rose-550 hover:border-rose-400/30 text-white font-bold text-xs uppercase tracking-wider py-2 border border-white/5 rounded-lg cursor-pointer transition flex items-center justify-center gap-1 shadow-md shadow-rose-900/10"
                      >
                        <Ban className="w-3.5 h-3.5" /> Encerrar Sala PK
                      </button>
                    </div>
                  </div>
                )}

                {/* Simulated default battle rooms */}
                {battles.map((b) => {
                  const isActive = b.status === 'active';
                  const viewers = isActive ? 4531 : 0;
                  
                  return (
                    <div 
                      key={b.id} 
                      className={`p-4 rounded-xl space-y-3 text-left border ${
                        isActive 
                          ? 'bg-zinc-950 border-white/10 shadow-inner' 
                          : 'bg-zinc-900/25 border-white/5 opacity-55'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wide uppercase border ${
                          isActive 
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                            : 'bg-zinc-850 border-zinc-700/30 text-zinc-450'
                        }`}>
                          {b.status}
                        </span>
                        
                        {isActive && (
                          <span className="text-xs font-mono font-bold text-zinc-455 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-zinc-550 animate-pulse" /> {viewers.toLocaleString()} espectadores
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-bold text-zinc-200">
                          {b.creatorRed.name} <span className="text-rose-500 italic">VS</span> {b.creatorBlue.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          ID: <span className="font-sans font-bold">{b.id}</span> • Aposta: "{b.selectedStake}"
                        </div>
                      </div>

                      {isActive && (
                        <div className="pt-2 border-t border-white/5 flex gap-2">
                          <button
                            onClick={() => handleCloseBattle(b.id)}
                            className="w-full bg-rose-650 hover:bg-rose-550 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 border border-white/5 rounded-lg cursor-pointer transition flex items-center justify-center gap-1 shadow"
                          >
                            <Ban className="w-3.5 h-3.5" /> Encerrar Duelo PK
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* If empty active rooms info */}
                {!activePKRoom && battles.filter(b=>b.status==='active').length === 0 && (
                  <div className="col-span-2 py-8 text-center text-zinc-550 border border-dashed border-white/10 rounded-xl font-mono text-xs">
                    ⚠️ Nenhuma sala ou duelo de Arena PK ativo no momento.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REPORTED MESSAGES */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 text-left space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  Fila de Comentários Denunciados
                </h3>
                <p className="text-xs text-zinc-400">
                  Mensagens reportadas de forma cooperativa pelos torcedores ou pegas pelo monitoramento automatizado. Analise o teor e decida pela remoção ou banimento.
                </p>
              </div>

              <div className="space-y-3">
                {reportedMsgs.map((report) => (
                  <div 
                    key={report.id} 
                    className="p-4 bg-zinc-950/90 border border-white/10 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-inner text-left"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-white font-mono bg-rose-500/10 text-rose-455 border border-rose-500/20 px-2 py-0.5 rounded leading-none">
                          DENÚNCIA
                        </span>
                        <span className="text-xs text-zinc-400 font-bold font-mono">
                          Usuário: <span className="text-rose-400">@{report.senderName}</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          • {report.timestamp} ({report.roomId})
                        </span>
                      </div>

                      <div className="p-2.5 bg-zinc-900 border border-white/5 rounded-lg text-sm text-zinc-200 font-sans italic">
                        "{report.text}"
                      </div>

                      <div className="text-[10px] font-semibold text-rose-400 font-mono">
                        Motivo indicado: <span className="text-zinc-300">{report.reason}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 md:self-end">
                      <button
                        onClick={() => handleDismissReport(report.id)}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg cursor-pointer transition border border-white/5"
                      >
                        Ignorar
                      </button>

                      <button
                        onClick={() => handleBanReporterUser(report.senderName, report.id)}
                        className="bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 hover:text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg cursor-pointer border border-rose-500/20 transition flex items-center gap-1"
                      >
                        <Ban className="w-3.5 h-3.5" /> Banir Autor
                      </button>
                    </div>
                  </div>
                ))}

                {reportedMsgs.length === 0 && (
                  <div className="py-12 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-zinc-500 space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-500/80 animate-bounce" />
                    <span className="text-xs font-mono">Maravilhoso! Nenhuma denúncia pendente para revisão no momento.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SIMULATED TRANSACTIONS */}
        {activeTab === 'txs' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 text-left space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  Gifts & Ledger: Transações Financeiras do Portal
                </h3>
                <p className="text-xs text-zinc-400">
                  Transparência de transações simuladas de recarga de moedas na Carteira e o histórico de envio de presentes caros para criadores em duelos ArenaPK.
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-950 text-zinc-400 uppercase tracking-widest font-mono border-b border-white/10 text-[9px]/tight select-none">
                      <th className="p-3">Código</th>
                      <th className="p-3">Doador / Transação</th>
                      <th className="p-3">Destinatário</th>
                      <th className="p-3 font-right text-right">Moedas (💎)</th>
                      <th className="p-3 text-right">Hora do Evento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulatedTxs.map((tx) => (
                      <tr key={tx.id} className="border-b border-sky-500/5 hover:bg-white/5 transition font-sans">
                        <td className="p-3 font-mono font-bold text-zinc-550">{tx.id}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <span className="text-sm leading-none">{tx.giftIcon}</span>
                            <span>{tx.senderName}</span>
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Presente enviado: {tx.giftName}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-rose-455">@{tx.creatorName}</span>
                        </td>
                        <td className="p-3 text-right font-mono text-amber-400 font-bold text-sm">
                          -{tx.coinValue.toLocaleString()} 💎
                        </td>
                        <td className="p-3 text-right font-mono text-zinc-500">{tx.timestamp}</td>
                      </tr>
                    ))}

                    {simulatedTxs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-550 font-mono">
                          Nenhuma transação simulada registrada ainda. Envie um presente em qualquer canal para registrar!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FILTERS & BLACKLIST RULES */}
        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Word Censorship Filter */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 text-left space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  🚫 Palavras Proibidas / Censuradas
                </h3>
                <p className="text-xs text-zinc-400">
                  Mensagens que contiverem estes termos serão censuradas com '***' automaticamente na ArenaPK.
                </p>
              </div>

              <form onSubmit={handleAddWordSubmit} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ex: safado"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-rose-650 hover:bg-rose-550 text-white font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer shadow flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2 max-h-[140px] overflow-y-auto">
                {forbiddenWords.map((word) => (
                  <span 
                    key={word} 
                    className="bg-zinc-950 border border-white/5 text-zinc-300 text-[10px] font-mono font-bold pl-3 pr-1.5 py-1 rounded-full flex items-center gap-1.5 hover:border-rose-500 hover:text-white transition duration-150"
                  >
                    {word}
                    <button
                      type="button"
                      onClick={() => handleRemoveWord(word)}
                      className="text-zinc-550 hover:text-rose-400 cursor-pointer p-0.5 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Banned Users Blacklist */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 text-left space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  🔨 Lista Negra (Usuários Bloqueados)
                </h3>
                <p className="text-xs text-zinc-400">
                  Usuários suspensos do portal chat próprio da ArenaPK por quebra repetida das diretrizes.
                </p>
              </div>

              <form onSubmit={handleBanUserSubmit} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ex: torcedor_esquentado"
                  value={banInput}
                  onChange={(e) => setBanInput(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer shadow flex items-center gap-1"
                >
                  <Ban className="w-3.5 h-3.5 text-zinc-400" /> Banir
                </button>
              </form>

              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pt-2">
                {bannedUsers.map((user) => (
                  <div 
                    key={user} 
                    className="p-2 bg-zinc-950/80 border border-white/5 rounded-xl flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-zinc-300">@{user}</span>
                    <button
                      type="button"
                      onClick={() => handleUnbanUser(user)}
                      className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      Desbanir
                    </button>
                  </div>
                ))}

                {bannedUsers.length === 0 && (
                  <div className="py-6 text-center text-zinc-650 text-xs font-mono">
                    Nenhum usuário bloqueado no momento.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: SYSTEM AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 text-left space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                    Rastro de Eventos da Plataforma
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Registros oficiais emitidos pelas conexões OAuth e ações do moderador. Pesquise por termos.
                  </p>
                </div>

                <div className="relative font-sans max-w-sm w-full">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar logs..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none text-white focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredServiceLogs.map((log) => {
                  let badgeColor = 'text-zinc-400 bg-zinc-950';
                  if (log.type === 'report') badgeColor = 'text-rose-400 bg-rose-500/10 border border-rose-500/20';
                  if (log.type === 'ban' || log.type === 'ban_user') badgeColor = 'text-amber-500 bg-amber-500/10 border border-amber-500/20';
                  if (log.type === 'setting_change' || log.type === 'pause_gifts' || log.type === 'close_room') badgeColor = 'text-sky-400 bg-sky-500/10 border border-sky-500/20';

                  return (
                    <div key={log.id} className="p-3 bg-zinc-950/80 rounded-xl space-y-2 border border-white/5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 shadow-inner">
                      <div className="space-y-1 bg-transparent border-0 p-0 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${badgeColor}`}>
                            {log.type}
                          </span>
                          <span className="text-[9px] text-zinc-550 font-mono">{log.timestamp}</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-normal">{log.details}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const list = serviceAuditLogs.filter(item => item.id !== log.id);
                          moderationService.saveAuditLogs(list);
                          refreshServiceStates();
                        }}
                        className="text-zinc-650 hover:text-rose-455 text-[10px] font-mono font-bold uppercase hover:underline leading-none sm:self-center cursor-pointer shrink-0"
                      >
                        Remover
                      </button>
                    </div>
                  );
                })}

                {filteredServiceLogs.length === 0 && (
                  <div className="py-12 text-center text-zinc-550 font-mono text-xs">
                    Nenhum registro de auditoria condizente com os filtros informados.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
