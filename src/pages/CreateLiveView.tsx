/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Youtube, Video, HelpCircle, Lock, Globe, EyeOff, Radio, Tv, Sparkles, 
  Play, Swords, Shield, ArrowLeft, Loader2, ExternalLink, Flame, CheckCircle2 
} from 'lucide-react';
import { youtubeService, SimulatedLiveBroadcast } from '../services/youtubeService';
import { Creator } from '../types';

interface CreateLiveViewProps {
  connectedCreator: Creator | null;
  onNavigate: (view: string) => void;
  onLiveCreated: (title: string, videoId: string) => void;
}

export default function CreateLiveView({ connectedCreator, onNavigate, onLiveCreated }: CreateLiveViewProps) {
  // Input states
  const [title, setTitle] = useState('DESAFIO SUPREMO PK - DUELO EM TEMPO REAL COM CONVIDADOS!');
  const [description, setDescription] = useState(
    'Participe da ArenaPK! Envie presentes, torça no chat único e apoie o seu streamer favorito com placar sincronizado em tempo real.'
  );
  const [category, setCategory] = useState('Gaming');
  const [privacyStatus, setPrivacyStatus] = useState<'public' | 'unlisted' | 'private'>('public');
  const [enablePK, setEnablePK] = useState(true);
  const [allowGifts, setAllowGifts] = useState(true);
  const [allowChat, setAllowChat] = useState(true);

  // Flow states
  const [isLoading, setIsLoading] = useState(false);
  const [broadcast, setBroadcast] = useState<SimulatedLiveBroadcast | null>(null);

  if (!connectedCreator) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6 relative z-10 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20 text-rose-500 animate-pulse">
          <Youtube className="w-8 h-8 fill-current" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Criar Live no YouTube</h2>
          <p className="text-zinc-400 text-xs font-sans max-w-sm mx-auto leading-relaxed">
            É necessário conectar seu canal do YouTube antes de simular a criação de uma transmissão integrada.
          </p>
        </div>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
        >
          Conectar Canal Agora
        </button>
      </div>
    );
  }

  const handleCreateLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      const result = await youtubeService.createLiveBroadcast({
        title,
        description,
        category,
        privacyStatus,
        enablePK,
        allowGifts,
        allowChat
      });
      setBroadcast(result);
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao simular a criação da live no YouTube.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDashboard = () => {
    if (broadcast) {
      onLiveCreated(title, broadcast.videoId);
      onNavigate('creator-dashboard');
    }
  };

  const handleInviteToPK = () => {
    if (broadcast) {
      // Set live status in App level first
      onLiveCreated(title, broadcast.videoId);
      // Immediately navigate to dashboard where the user can trigger PK
      onNavigate('creator-dashboard');
      // Dispatch alert for user experience guidance
      setTimeout(() => {
        alert('Sua live foi criada com sucesso! Selecione um criador parceiro abaixo e clique em "Enviar Desafio PK"');
      }, 300);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 pb-20 relative z-10 font-sans">
      
      {/* Back navigation */}
      <button
        onClick={() => onNavigate('creator-dashboard')}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-mono uppercase tracking-widest cursor-pointer mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Painel
      </button>

      {!broadcast ? (
        <div className="bg-zinc-900/60 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
          
          {/* Header */}
          <div className="p-6 bg-zinc-950/80 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Video className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white uppercase italic tracking-tight">Criar Live no YouTube</h2>
                <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">Simulador de Transmissão Direta do App</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Sincronizado</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateLive} className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Form Info */}
              <div className="space-y-4">
                
                {/* título da live */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Título da Live *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: DUELO PK AO VIVO CONTRA CASIMIRO"
                    className="w-full bg-zinc-950 border border-white/10 text-white rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                {/* descrição */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Descrição *</label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição oficial da sua livestream no canal..."
                    className="w-full bg-zinc-950 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-rose-500 transition-colors resize-none"
                  />
                </div>

                {/* categoria & visibilidade */}
                <div className="grid grid-cols-2 gap-4">
                  {/* categoria */}
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 text-zinc-300 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="Gaming">Gaming / Jogos</option>
                      <option value="Entertainment">Entretenimento</option>
                      <option value="TalkShows">Talk Shows & Podcasts</option>
                      <option value="Music">Música & Shows</option>
                    </select>
                  </div>

                  {/* visibilidade */}
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Visibilidade</label>
                    <select
                      value={privacyStatus}
                      onChange={(e) => setPrivacyStatus(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-white/10 text-zinc-300 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="public">🌐 Pública</option>
                      <option value="unlisted">🔗 Não Listada</option>
                      <option value="private">🔒 Privada</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Right Column: Custom Toggles */}
              <div className="space-y-4 bg-zinc-950/40 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                
                <div>
                  <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest font-mono mb-4">Parâmetros de Gamificação</h4>
                  
                  <div className="space-y-4">
                    {/* opção Ativar modo PK */}
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enablePK}
                        onChange={(e) => setEnablePK(e.target.checked)}
                        className="mt-1 accent-rose-500 rounded text-rose-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-zinc-200 block uppercase">Ativar modo PK</span>
                        <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">Permite receber desafios e enviar duelos para outros streamers online.</span>
                      </div>
                    </label>

                    {/* opção Permitir presentes */}
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allowGifts}
                        onChange={(e) => setAllowGifts(e.target.checked)}
                        className="mt-1 accent-rose-500 rounded text-rose-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-zinc-200 block uppercase">Permitir presentes</span>
                        <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">Habilita botões de doações de presentes animados para somar pontos nos combates PK.</span>
                      </div>
                    </label>

                    {/* opção Permitir chat da sala */}
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allowChat}
                        onChange={(e) => setAllowChat(e.target.checked)}
                        className="mt-1 accent-rose-500 rounded text-rose-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-zinc-200 block uppercase">Permitir chat da sala</span>
                        <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">Habilita uma caixa de chat único unificando as mensagens de ambas torcidas do PK.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-[10px] text-zinc-500 flex items-start gap-2">
                  <span className="text-zinc-400 font-bold">Nota:</span>
                  <p>Estes parâmetros se aplicam ao ArenaPK de forma exclusiva, sem interferir na integridade do feed do YouTube.</p>
                </div>

              </div>

            </div>

            {/* botão Criar live no YouTube */}
            <div className="pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950 text-white font-black text-xs uppercase tracking-widest rounded-xl transition duration-150 flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-rose-600/20 border border-white/5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                    <span>Criando Transmissão na API do YouTube...</span>
                  </>
                ) : (
                  <>
                    <Youtube className="w-4.5 h-4.5 fill-current text-white" />
                    <span>Criar live no YouTube</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      ) : (
        /* Confirmação Screen requested *
         * player preview usando embed mockado;
         * título da live;
         * link da live;
         * botão “Abrir painel da live”;
         * botão “Convidar para PK”.
         */
        <div className="space-y-6 animate-fade-in text-sans">
          
          {/* Main Success Card */}
          <div className="bg-zinc-900/60 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md p-6 sm:p-8 space-y-6 shadow-2xl">
            
            <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-450 border border-emerald-500/15 p-4 rounded-2xl shadow-inner animate-pulse">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h3 className="font-extrabold text-white text-sm uppercase italic tracking-tight font-mono">Live Criada com Sucesso no YouTube!</h3>
                <p className="text-[11px] text-emerald-400 font-sans mt-0.5">Sua transmissão está registrada na sandbox. Chave de fluxo e status sincronizados.</p>
              </div>
            </div>

            {/* Player Preview usando embed mockado */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Player Preview (Live Stream)</span>
              <div className="aspect-video w-full bg-zinc-950 rounded-2xl overflow-hidden border border-white/10 shadow-inner relative group">
                <iframe
                  src={broadcast.embedUrl}
                  title={title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Título da live */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              <div className="md:col-span-8 space-y-4">
                <div>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Título da Live Sincronizado</span>
                  <h4 className="text-base sm:text-lg font-black text-white uppercase italic mt-1 leading-tight">{title}</h4>
                </div>

                {/* Link da live */}
                <div>
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Link da Live</span>
                  <a
                    href={broadcast.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-mono font-bold mt-1 underline"
                  >
                    {broadcast.watchUrl}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Extra Stream Keys Info Box */}
              <div className="md:col-span-4 p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2.5 text-[11px] font-mono shadow-inner text-zinc-400">
                <div className="flex justify-between border-b border-white/5 pb-1.5 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                  <span>Informações de Fluxo</span>
                  <span className="text-rose-500">PRODUÇÃO</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">BROADCAST ID</span>
                  <span className="text-zinc-300 font-bold block">{broadcast.broadcastId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">CHAVE DE STREAM (REVELADA)</span>
                  <span className="text-emerald-400 font-bold block select-all">{broadcast.streamId}</span>
                </div>
              </div>

            </div>

            {/* Botões: Abrir painel da live, Convidar para PK */}
            <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-4">
              {/* Botão Abrir painel da live */}
              <button
                onClick={handleOpenDashboard}
                className="flex-1 py-4 bg-zinc-805 hover:bg-zinc-750 text-zinc-200 hover:text-white font-black text-xs uppercase tracking-widest border border-white/10 rounded-2xl transition cursor-pointer text-center flex items-center justify-center gap-2 shadow-md"
              >
                <Tv className="w-4 h-4 text-zinc-400" />
                Abrir Painel da Live
              </button>

              {/* Botão Convidar para PK */}
              <button
                onClick={handleInviteToPK}
                className="flex-1 py-4 bg-rose-650 hover:bg-rose-550 text-white font-black text-xs uppercase tracking-widest border border-white/5 rounded-2xl transition cursor-pointer text-center flex items-center justify-center gap-2 shadow-lg shadow-rose-600/15"
              >
                <Swords className="w-4 h-4 text-white fill-current animate-pulse" />
                Convidar para PK
              </button>
            </div>

          </div>

          {/* Quick instructions reminder */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 text-[11px] text-zinc-500 font-sans leading-relaxed text-center max-w-xl mx-auto">
            Ao clicar em <strong className="text-zinc-300">Convidar para PK</strong>, a live é automaticamente sinalizada como iniciada e o sistema abre o modal de seleção de oponente no backstage.
          </div>

        </div>
      )}

    </div>
  );
}
