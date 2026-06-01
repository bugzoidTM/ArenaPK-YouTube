/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, Laptop, Radio, Monitor, Sparkles, Cpu, Disc, ShieldCheck, 
  ArrowRight, ExternalLink, HelpCircle 
} from 'lucide-react';

export default function DownloadStudioView() {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);

  const startSimulatedDownload = () => {
    if (downloadComplete || downloading) return;
    setDownloading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        setDownloadComplete(true);
        setDownloading(false);
        clearInterval(interval);
      }
      setDownloadProgress(progress);
    }, 150);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 font-sans animate-fade-in relative z-10 text-white">
      {/* Decorative BG Accents */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/10 blur-3xl rounded-full" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full" />

      {/* Main Container Card */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl p-6 sm:p-10 space-y-8">
        
        {/* Banner Title */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Futura Fase do ArenaPK: Transmissão Integrada</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tight font-sans">
            ArenaPK Studio <span className="text-rose-500">Windows</span>
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Para transmitir pelo ArenaPK sem complicar-se no OBS Studio e sem precisar abrir abas adicionais na conta do YouTube, o criador usará no futuro o nosso aplicativo dedicado para Windows.
          </p>
        </div>

        {/* Conceptual Architecture Explanation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-inner">
              <Laptop className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm uppercase text-zinc-200 tracking-wide font-sans">1. Público na Web, Criador no Windows</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Os espectadores assistem à sala PK, mandam presentes e participam do bate-papo diretamente no nosso portal da web (MVP). O criador foca no game jogando e monitorando pelo app nativo do Windows.
            </p>
          </div>

          <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm uppercase text-zinc-200 tracking-wide font-sans">2. Sincronismo de Mimos em Tempo Real</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Cada rosa, boné ou presente virtual enviado pelo seu espectador na web chega ao ArenaPK Studio Windows instantaneamente através de nossa rede WebSocket de baixa latência.
            </p>
          </div>

          <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm uppercase text-zinc-200 tracking-wide font-sans">3. Renderização de Vídeo Direta (Sem OBS)</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              O Studio para Windows renderiza as barras de placar vivo, animações de presentes recebidos, fumaça 3D e efeitos sonoros diretamente dentro da imagem capturada antes de enviá-la para o YouTube.
            </p>
          </div>

          <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
              <Disc className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm uppercase text-zinc-200 tracking-wide font-sans">4. Próxima Fase do Projeto</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              O desenvolvimento do software nativo em C++ e Electron para Windows será concluído na próxima fase. Por enquanto, utilize o simulador do portal para experimentar a interatividade das partidas.
            </p>
          </div>
        </div>

        {/* Action Controls Card */}
        <div className="border-t border-white/5 pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Action 1: Download for Windows (Simulated) */}
            <button
              onClick={startSimulatedDownload}
              disabled={downloading || downloadComplete}
              className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-2 border shadow-lg ${
                downloadComplete 
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                  : downloading 
                    ? 'bg-zinc-800 border-white/5 text-zinc-300' 
                    : 'bg-rose-600 hover:bg-rose-500 border-white/5 text-white shadow-rose-600/10 hover:shadow-rose-600/20'
              }`}
            >
              <Download className={`w-4.5 h-4.5 ${downloading ? 'animate-bounce' : ''}`} />
              {downloadComplete 
                ? 'Concluído! (Simulação)' 
                : downloading 
                  ? `Baixando... ${downloadProgress}%` 
                  : 'Baixar para Windows (.exe)'
              }
            </button>

            {/* Action 2: Open ArenaPK Studio (Deep Link) */}
            <a
              href="arenapk://studio"
              onClick={(e) => {
                e.preventDefault();
                alert('Iniciando redirecionamento seguro para Deep Link local "arenapk://studio"... (Exige o programa instalado no sistema host para abrir)');
              }}
              className="flex-1 py-4 bg-zinc-950 hover:bg-zinc-900 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-300 cursor-pointer transition flex items-center justify-center gap-2"
            >
              <Monitor className="w-4.5 h-4.5" />
              Abrir ArenaPK Studio
            </a>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center bg-zinc-950 p-4 rounded-2xl gap-3">
            <div className="flex items-start gap-2 text-zinc-400 text-xs">
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
              <p>O ArenaPK Web permanecerá ativo para audiência mandar moedas e presentes no chat único de batalhas.</p>
            </div>
            
            <button
              onClick={() => navigate('/descobrir')}
              className="px-5 py-2.5 bg-zinc-805 hover:bg-zinc-750 text-zinc-100 hover:text-white rounded-xl text-xs font-bold uppercase transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Ir para Lives</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Security / QA Disclaimer */}
        <p className="text-center text-[10px] text-zinc-550 font-mono uppercase tracking-wider">
          Segurança certificada SHA-256 • Assinatura Oficial Windows Code Signer
        </p>

      </div>
    </div>
  );
}
