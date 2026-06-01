/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Laptop, Radio, Monitor, Sparkles, Cpu, ShieldCheck, 
  ArrowRight, Play, Download
} from 'lucide-react';

export default function DownloadStudioView() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 font-sans animate-fade-in relative z-10 text-white">
      {/* Decorative BG Accents */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/10 blur-3xl rounded-full" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full" />

      {/* Main Container Card */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl p-6 sm:p-10 space-y-8">
        
        {/* Banner Title */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Ferramenta Avançada de Transmissão PK</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tight font-sans">
            ArenaPK Studio para Criadores
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Para transmitir pelo ArenaPK sem abrir OBS ou configurar encoder manualmente, o criador usará o ArenaPK Studio para Windows.
          </p>
        </div>

        {/* Conceptual Architecture Explanation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4">
          <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-inner">
              <span className="font-mono font-black text-sm">01</span>
            </div>
            <div>
              <h4 className="font-extrabold text-xs uppercase text-zinc-200 tracking-wide font-sans mb-1.5">1. Público na Web</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                O público entra na sala PK pela web para assistir, enviar presentes próprios e enviar mensagens chat.
              </p>
            </div>
          </div>

          <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
              <span className="font-mono font-black text-sm">02</span>
            </div>
            <div>
              <h4 className="font-extrabold text-xs uppercase text-zinc-200 tracking-wide font-sans mb-1.5">2. Transmissão Windows</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                O criador comanda as câmeras e inicia a transmissão diretamente do seu ArenaPK Windows Studio.
              </p>
            </div>
          </div>

          <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
              <span className="font-mono font-black text-sm">03</span>
            </div>
            <div>
              <h4 className="font-extrabold text-xs uppercase text-zinc-200 tracking-wide font-sans mb-1.5">3. Eventos em Tempo Real</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Presentes enviados na web geram dados imediatos e chegam ao Studio do criador em tempo real.
              </p>
            </div>
          </div>

          <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
              <span className="font-mono font-black text-sm">04</span>
            </div>
            <div>
              <h4 className="font-extrabold text-xs uppercase text-zinc-200 tracking-wide font-sans mb-1.5">4. Renderização nativa</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                O Studio renderiza as pontuações e animações exuberantes dentro do vídeo instantaneamente.
              </p>
            </div>
          </div>

          <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <span className="font-mono font-black text-sm">05</span>
            </div>
            <div>
              <h4 className="font-extrabold text-xs uppercase text-zinc-200 tracking-wide font-sans mb-1.5">5. Saída para YouTube</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                O Studio envia o feed final com todas as animações incorporadas no vídeo diretamente ao YouTube.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls Card */}
        <div className="border-t border-white/5 pt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Action 1: Download for Windows (DISABLED / SOON) */}
            <button
              disabled
              className="py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-400 bg-zinc-800/40 border border-white/5 cursor-not-allowed flex items-center justify-center gap-2"
              title="A aplicação para Windows será disponibilizada na próxima etapa."
            >
              <Download className="w-4 h-4 text-zinc-500" />
              Baixar para Windows (Em breve)
            </button>

            {/* Action 2: Open ArenaPK Studio (Deep link arenapk://studio) */}
            <button
              onClick={() => {
                window.location.href = "arenapk://studio";
                alert('Iniciando redirecionamento seguro para Deep Link local "arenapk://studio"... (Exige o programa instalado no sistema host para abrir)');
              }}
              className="py-4 bg-zinc-950 hover:bg-zinc-900 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-200 cursor-pointer transition flex items-center justify-center gap-2"
            >
              <Monitor className="w-4 h-4 text-rose-500 animate-pulse" />
              Abrir ArenaPK Studio
            </button>
          </div>

          {/* Spectator Quick Links Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-2xl">
            <button
              onClick={() => navigate('/descobrir')}
              className="py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 hover:text-white rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="text-sm">🧭</span>
              Continuar como espectador
            </button>

            <button
              onClick={() => navigate('/demo')}
              className="py-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-455 border border-rose-500/15 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-rose-500" />
              Ver demonstração
            </button>
          </div>

          <div className="flex items-start gap-2 text-zinc-500 text-xs px-2 justify-center select-none">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" />
            <p className="max-w-xl text-[11px] leading-relaxed">
              O feed de transmissão do YouTube incorporado é padrão. O ArenaPK cuida de capturar presentes da web para dar bônus na partida antes do vídeo final subir à sua conta de Criador do YouTube.
            </p>
          </div>
        </div>

        {/* Security / QA Disclaimer */}
        <p className="text-center text-[10px] text-zinc-600 font-mono uppercase tracking-wider">
          Segurança certificada SHA-256 • Assinatura de Software ArenaPK
        </p>

      </div>
    </div>
  );
}
