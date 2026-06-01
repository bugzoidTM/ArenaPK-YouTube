/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Swords, Video, Trophy, Sparkles, Flame, Play, HelpCircle, Check, ShieldCheck, Tv, MessageSquare } from 'lucide-react';
import { Creator, PKBattle } from '../types';

interface LandingViewProps {
  onNavigate: (view: string) => void;
  activeCreatorCount: number;
  activeBattles: PKBattle[];
  onSelectBattle: (battle: PKBattle) => void;
}

export default function LandingView({ onNavigate, activeCreatorCount, activeBattles, onSelectBattle }: LandingViewProps) {
  
  // Custom scroll target helper or click handler for live rooms
  const handleScrollToLive = () => {
    const el = document.getElementById('batalhas-ao-vivo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate('spectator-pk-room');
    }
  };

  const handleDemoPlay = () => {
    // Select the first demo battle if available, or just go to spectator room
    if (activeBattles && activeBattles.length > 0) {
      onSelectBattle(activeBattles[0]);
    } else {
      onNavigate('spectator-pk-room');
    }
  };

  return (
    <div className="space-y-16 py-6 pb-20 relative z-10 font-sans">
      
      {/* Hero Section */}
      <section className="relative px-6 py-16 md:py-24 text-center rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900/80 via-zinc-900/40 to-black/60 border border-white/10 backdrop-blur-md shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
        
        {/* Modern animated subtle ambient badge */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono font-bold uppercase tracking-wider mb-8 select-none">
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>PORTAL ARENAPK • INDEPENDENTE</span>
          </div>
          <span className="hidden sm:inline text-zinc-650">|</span>
          <span className="text-[10px] text-zinc-300">Suporte a Lives integradas via Jogos e Presentes Virtuais</span>
        </div>

        {/* requested head title */}
        <h1 className="text-4xl md:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-tight text-white uppercase italic">
          ArenaPK <span className="bg-gradient-to-r from-rose-500 via-rose-450 to-amber-500 bg-clip-text text-transparent">YouTube</span>
        </h1>
        
        {/* requested exact subtitle */}
        <p className="mt-6 text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-sans">
          Acompanhe duelos e gerencie salas PK do seu canal com chat unificado, placar e ranking de presentes virtuais em tempo real.
        </p>

        {/* requested buttons: Entrar como criador. Assistir salas ao vivo. Ver demonstração. */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 max-w-2xl mx-auto">
          <button
            onClick={() => onNavigate('baixar-studio')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5 shadow-lg shadow-rose-600/20 border border-white/5 cursor-pointer"
          >
            <Video className="w-4 h-4 fill-current" />
            Entrar como Criador
          </button>
          
          <button
            onClick={() => onNavigate('discover')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-150 font-black text-xs uppercase tracking-widest border border-white/5 transition-all hover:-translate-y-0.5 cursor-pointer shadow-md"
          >
            <Tv className="w-4 h-4 text-zinc-400" />
            Assistir salas ao vivo
          </button>

          <button
            onClick={() => onNavigate('demo')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-700/80 to-indigo-700/80 hover:from-blue-600 hover:to-indigo-600 text-white font-black text-xs uppercase tracking-widest border border-white/5 transition-all hover:-translate-y-0.5 cursor-pointer shadow-lg shadow-blue-500/10"
          >
            <Play className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
            Ver demonstração
          </button>
        </div>

        {/* App stats panel */}
        <div className="mt-14 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center font-mono">
          <div>
            <p className="text-3xl font-black text-zinc-100 italic">R$ 1.5M+</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Somas Convertidas</p>
          </div>
          <div>
            <p className="text-3xl font-black text-rose-500 italic">{activeCreatorCount} Livres</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Streamers Simulando</p>
          </div>
          <div>
            <p className="text-3xl font-black text-blue-400 italic">100% WEB</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Dispensa Plugins Ext.</p>
          </div>
          <div>
            <p className="text-3xl font-black text-amber-500 italic">0.2s</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Precisão da API</p>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section className="bg-zinc-900/60 backdrop-blur-md border border-white/10 p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-[9px] font-mono font-black tracking-widest text-rose-455 uppercase bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">FÁCIL E RÁPIDO</span>
          <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight mt-3">COMO FUNCIONA</h3>
          <p className="text-zinc-400 text-xs mt-1.5 font-sans">Acompanhe e torça em menos de 2 minutos diretamente no seu navegador favorito</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 p-4 bg-zinc-950/40 rounded-2xl border border-white/5 relative">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-mono font-black italic text-sm">
              01
            </div>
            <h4 className="font-extrabold text-white uppercase tracking-wider text-xs">Crie a Sala PK pela Web</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Gerencie batalhas PK, configure punições e ative alertas enquanto o público interage diretamente no portal Web de forma integrada.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-zinc-950/40 rounded-2xl border border-white/5 relative">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center font-mono font-black italic text-sm">
              02
            </div>
            <h4 className="font-extrabold text-white uppercase tracking-wider text-xs">Convide outro criador</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Selecione qualquer streamer disponível na plataforma para enviar o desafio de duelo com uma punição divertida estipulada em jogo.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-zinc-950/40 rounded-2xl border border-white/5 relative">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center justify-center font-mono font-black italic text-sm">
              03
            </div>
            <h4 className="font-extrabold text-white uppercase tracking-wider text-xs">O público entra na sala PK</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Seus espectadores assistem aos dois canais na mesma tela lado a lado com sincronismo total de áudio e visualização.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-zinc-950/40 rounded-2xl border border-white/5 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-black italic text-sm">
              04
            </div>
            <h4 className="font-extrabold text-white uppercase tracking-wider text-xs">Público envia presentes</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Os espectadores enviam presentes do app, conversam no chat único e influenciam instantaneamente o placar da batalha!
            </p>
          </div>
        </div>
      </section>

      {/* Diferenciais Section */}
      <section className="bg-zinc-900/60 backdrop-blur-md border border-white/10 p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-[9px] font-mono font-black tracking-widest text-blue-400 uppercase bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">TECNOLOGIA EXCLUSIVA</span>
          <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight mt-3">DIFERENCIAIS</h3>
          <p className="text-zinc-400 text-xs mt-1.5 font-sans">O que torna o ArenaPK a ferramenta mais poderosa para sua live do YouTube.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex gap-4 p-5 bg-zinc-950/80 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-455 border border-rose-500/25 flex items-center justify-center font-bold text-sm shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">ArenaPK Studio Windows</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-1">No futuro, os criadores transmitirão vídeo usando um software Windows dedicado, mantendo a web para salas e interações.</p>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-zinc-950/80 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/25 flex items-center justify-center font-bold text-sm shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Chat único do app</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-1">Conecta a torcida dos dois oponentes em uma única caixa interativa de mensagens com moderação inteligente.</p>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-zinc-950/80 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/25 flex items-center justify-center font-bold text-sm shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Presentes Exclusivos</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-1">Presentes e mimos virtuais interativos criados exclusivamente pela ArenaPK (não vinculados ao YouTube Oficial).</p>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-zinc-950/80 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center font-bold text-sm shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Placar em tempo real</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-1">Barômetro calibrado milimetricamente que indica quem está na frente segundo as doações instantâneas.</p>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-zinc-950/80 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/25 flex items-center justify-center font-bold text-sm shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Ranking de apoiadores</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-1">Vitrine dedicada aos maiores doadores que geram destaque para os patrocinadores das lives.</p>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-zinc-950/80 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/25 flex items-center justify-center font-bold text-sm shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Players Incorporados</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-1">Incorporação de players do YouTube padrão via API de Iframe, mantendo visualizações diretamente na fonte.</p>
            </div>
          </div>

          {/* New row item to reach exact 7th diferencial: Criadores veem o painel da batalha em um só lugar. */}
          <div className="flex gap-4 p-5 bg-zinc-950/80 rounded-2xl border border-white/5 sm:col-span-2 lg:col-span-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 border border-pink-500/25 flex items-center justify-center font-bold text-sm shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Criadores veem o painel da batalha em um só lugar</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-1">Controle tudo (convites, saldo acumulado, moderação, faturamento e multiplicadores da rodada) em um painel do backstage unificado e responsivo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Active Battles Currently Happening */}
      <section id="batalhas-ao-vivo" className="space-y-6 relative z-10 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2.5xl font-black text-white flex items-center gap-2 uppercase italic tracking-tight">
              <Swords className="w-6 h-6 text-rose-550" />
              Batalhas Ativas no Momento
            </h2>
            <p className="text-zinc-400 text-sm mt-1">Clique para entrar na sala pública como espectador, torcer e enviar presentes!</p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-350 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
            <span>{activeBattles.length} Transmissões Ativas</span>
          </div>
        </div>

        {activeBattles.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/30 border border-white/10 rounded-2xl backdrop-blur-md">
            <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg uppercase italic tracking-tight">Nenhuma batalha PK ocorrendo neste instante</h3>
            <p className="text-zinc-500 text-xs max-w-sm mx-auto mt-1 leading-relaxed">
              Vá para o “Painel do Criador” para conectar o canal e iniciar sua transmissão demonstrativa em segundos.
            </p>
            <button
              onClick={() => onNavigate('creator-dashboard')}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-black uppercase tracking-wider rounded-lg border border-rose-500/20 transition cursor-pointer"
            >
              Iniciar Live Demonstrativa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeBattles.map((battle) => {
              const totalPoints = battle.pointsRed + battle.pointsBlue || 1;
              const redPercentage = Math.round((battle.pointsRed / totalPoints) * 100);
              const bluePercentage = 100 - redPercentage;
              
              return (
                <div 
                  key={battle.id}
                  className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col group shadow-lg"
                >
                  {/* Status & Stake bar */}
                  <div className="bg-zinc-950 px-4 py-2 text-xs flex items-center justify-between border-b border-white/10">
                    <span className="font-semibold text-amber-500 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Desafio: {battle.selectedStake}
                    </span>
                    <span className="font-mono text-rose-455 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-bold">
                      {battle.timeLeftSeconds > 0 
                        ? `T- ${Math.floor(battle.timeLeftSeconds / 60)}:${(battle.timeLeftSeconds % 60).toString().padStart(2, '0')}`
                        : 'COMPLETO'}
                    </span>
                  </div>

                  {/* HIGH VOLTAGE MATCH DISPLAY */}
                  <div className="p-5 flex items-center gap-4 justify-between bg-gradient-to-b from-zinc-900 via-zinc-950/60 to-zinc-950">
                    {/* RED */}
                    <div className="flex flex-col items-center text-center flex-1">
                      <div className="relative">
                        <img 
                          src={battle.creatorRed.avatar} 
                          alt={battle.creatorRed.name} 
                          className="w-14 h-14 rounded-full border-2 border-rose-500 object-cover shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-rose-600 text-white font-extrabold text-[9px] px-1 py-0.2 rounded-full">RED</div>
                      </div>
                      <h4 className="font-bold text-white text-sm mt-3 line-clamp-1">{battle.creatorRed.name}</h4>
                      <p className="text-sans text-xs text-rose-400 mt-1 font-bold font-mono">{battle.pointsRed.toLocaleString()} pts</p>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-zinc-805 border border-white/10 flex items-center justify-center text-rose-500 font-black text-sm italic shadow-lg">
                        VS
                      </div>
                    </div>

                    {/* BLUE */}
                    <div className="flex flex-col items-center text-center flex-1">
                      <div className="relative">
                        <img 
                          src={battle.creatorBlue.avatar} 
                          alt={battle.creatorBlue.name} 
                          className="w-14 h-14 rounded-full border-2 border-blue-500 object-cover shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white font-extrabold text-[9px] px-1 py-0.2 rounded-full font-bold">BLUE</div>
                      </div>
                      <h4 className="font-bold text-zinc-200 text-sm mt-3 line-clamp-1">{battle.creatorBlue.name}</h4>
                      <p className="text-sans text-xs text-blue-400 mt-1 font-bold font-mono">{battle.pointsBlue.toLocaleString()} pts</p>
                    </div>
                  </div>

                  {/* Realtime Tug-Of-War progressive tracker */}
                  <div className="px-5 py-2.5 bg-zinc-950/80 border-t border-white/5">
                    <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden flex p-0.5 border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-500 rounded-l-full" 
                        style={{ width: `${redPercentage}%` }}
                      />
                      <div 
                        className="h-full bg-gradient-to-l from-blue-600 to-blue-400 transition-all duration-500 rounded-r-full" 
                        style={{ width: `${bluePercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5 font-mono font-bold uppercase tracking-wider">
                      <span>{redPercentage}% RED</span>
                      <span>{bluePercentage}% BLUE</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="p-3.5 bg-black/40 border-t border-white/10 flex items-center justify-between">
                    <p className="text-xs text-zinc-400 truncate max-w-[60%]">
                      📺 Streamer: <span className="text-white font-medium">@{battle.creatorRed.channelName}</span>
                    </p>
                    <button
                      onClick={() => onSelectBattle(battle)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md border border-white/5 flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-white" />
                      Assistir Arena
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      
    </div>
  );
}
