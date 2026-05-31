/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Youtube, ShieldCheck, Lock, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Creator } from '../types';

interface LoginConnectViewProps {
  onConnect: (creatorData: { username: string; channelName: string; avatarUrl: string }) => void;
  isAlreadyConnected: boolean;
  connectedCreator: Creator | null;
  onDisconnect: () => void;
}

export default function LoginConnectView({ onConnect, isAlreadyConnected, connectedCreator, onDisconnect }: LoginConnectViewProps) {
  const [useCustomName, setUseCustomName] = useState(false);
  const [username, setUsername] = useState('Nobru Gamer');
  const [channelName, setChannelName] = useState('nobrugamer');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150');
  const [simulatedLoading, setSimulatedLoading] = useState(false);
  const [congratulations, setCongratulations] = useState(false);

  const triggerConnection = (name: string, handle: string, img: string) => {
    setSimulatedLoading(true);
    setTimeout(() => {
      setSimulatedLoading(false);
      setCongratulations(true);
      onConnect({
        username: name,
        channelName: handle,
        avatarUrl: img
      });
    }, 1200);
  };

  const handleDefaultConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default preset channels simulation
    const names = ['Nobru Gaming', 'Cerol Live', 'Alanzoka Play', 'Coringa Loud'];
    const handles = ['nobrugaming', 'cerolstream', 'alanzoka', 'loudcoringa'];
    const avatars = [
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    ];

    const idx = Math.floor(Math.random() * names.length);
    triggerConnection(names[idx], handles[idx], avatars[idx]);
  };

  const handleCustomConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !channelName) return;
    const cleanHandle = channelName.trim().replace('@', '');
    triggerConnection(username, cleanHandle, avatarUrl);
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 relative z-10 animate-fade-in font-sans">
      
      {/* If connected */}
      {isAlreadyConnected && connectedCreator ? (
        <div className="bg-zinc-900/60 border border-white/10 p-8 rounded-2xl text-center space-y-6 backdrop-blur-md shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-3xl font-black shadow-inner animate-pulse">
            ✓
          </div>
          
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Canal Conectado!</h2>
            <p className="text-zinc-400 text-xs font-sans">Seu canal do YouTube está conectado no momento.</p>
          </div>

          <div className="flex items-center gap-4 p-4 bg-zinc-950/80 rounded-xl border border-white/5 text-left shadow-lg">
            <img src={connectedCreator.avatar} alt={connectedCreator.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
            <div>
              <h4 className="font-extrabold text-white text-sm leading-tight">{connectedCreator.name}</h4>
              <p className="text-[10px] text-rose-500 font-mono font-bold flex items-center gap-1.5 mt-1 select-none">
                <Youtube className="w-3.5 h-3.5 fill-current" />
                youtube.com/@{connectedCreator.channelName}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onDisconnect}
              className="w-full py-2.5 bg-zinc-805 hover:bg-zinc-700 text-zinc-350 hover:text-white border border-white/5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition shadow-inner"
            >
              Desconectar Canal
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
          
          {/* Header of Simulated Connection */}
          <div className="p-6 bg-zinc-950/80 border-b border-white/5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-inner select-none">
                <Youtube className="w-5 h-5 fill-current text-rose-500" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm uppercase italic tracking-tight">Autenticação YouTube</h3>
                <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">Sincronismo de Conta Segura</p>
              </div>
            </div>
            <Lock className="w-4 h-4 text-zinc-550 select-none animate-pulse" />
          </div>

          {/* Body content */}
          <div className="p-6 space-y-6">
            
            {congratulations ? (
              <div className="text-center space-y-4 py-6 animate-fade-in">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-2xl font-bold animate-pulse">
                  ✓
                </div>
                <h4 className="text-lg font-black text-white uppercase italic tracking-tight">Canal Vinculado!</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto font-sans leading-relaxed">
                  Autenticação simulada aceita. Redirecionando você automaticamente para o Painel do Criador para gerenciar salas...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Product greeting */}
                <div className="text-center space-y-2">
                  <h4 className="text-sm font-bold text-zinc-200">Acesse o Backstage com um clique</h4>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                     Para testar esta demonstração, conecte uma identidade de criador de conteúdo simulado ao barramento global da ArenaPK.
                  </p>
                </div>

                {/* Simulated YouTube Connect Button as mandated by user */}
                {!useCustomName ? (
                  <form onSubmit={handleDefaultConnectSubmit} className="space-y-4">
                    <button
                      type="submit"
                      disabled={simulatedLoading}
                      className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition duration-150 flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-rose-600/20 border border-white/5"
                    >
                      {simulatedLoading ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          <span>Negociando OAuth do Google...</span>
                        </>
                      ) : (
                        <>
                          <Youtube className="w-4.5 h-4.5 fill-current text-white animate-pulse" />
                          <span>Conectar canal do YouTube</span>
                        </>
                      )}
                    </button>
                    
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setUseCustomName(true)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono uppercase tracking-widest underline cursor-pointer transition-colors"
                      >
                        Ou configurar nome customizado manual
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCustomConnectSubmit} className="space-y-4 animate-fade-in">
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Nome do Canal</label>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Ex: Cerol Gamer"
                          className="w-full bg-zinc-950 border border-white/10 text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">ID / Identificador (Handle)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono font-bold">@</span>
                          <input
                            type="text"
                            required
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            placeholder="cerol_do_fluxo"
                            className="w-full bg-zinc-950 border border-white/10 text-white rounded-xl pl-7 pr-4 py-3 text-xs focus:outline-none focus:border-rose-500 transition-colors font-mono font-bold text-rose-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Avatar URL (Foto de Perfil)</label>
                        <input
                          type="url"
                          required
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-zinc-950 border border-white/10 text-white rounded-xl px-4 py-3 text-[11px] focus:outline-none focus:border-rose-500 transition-colors font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setUseCustomName(false)}
                        className="flex-1 py-3 text-xs font-bold text-zinc-400 bg-zinc-950 hover:bg-zinc-900 border border-white/10 rounded-xl transition"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        disabled={simulatedLoading}
                        className="flex-[2] py-3 bg-rose-650 hover:bg-rose-550 border border-white/5 rounded-xl font-black text-xs uppercase tracking-widest text-white transition flex items-center justify-center gap-1.5"
                      >
                        {simulatedLoading ? (
                          <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        ) : 'Salvar e Conectar'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Privacy disclaimer standard */}
                <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-[10px] text-zinc-400 flex items-start gap-2.5 leading-relaxed font-sans">
                  <ShieldCheck className="w-4 h-4 text-rose-550 shrink-0 select-none" />
                  <p>
                    O escopo simulado concede acesso sandbox seguro para gerenciar transmissões oficiais e chat, assegurando que suas chaves privadas permaneçam ocultas do navegador do espectador.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
