/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Youtube, ShieldCheck, Lock, AlertCircle, Sparkles, 
  CheckCircle2, RefreshCw, AlertTriangle, Key, Sliders, XCircle, Info 
} from 'lucide-react';
import { Creator } from '../types';
import { youtubeService, YouTubeConnectionStatus } from '../services/youtubeService';

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
  
  // Controls current test scenario for developers/evaluators
  const [simulatedStatus, setSimulatedStatus] = useState<YouTubeConnectionStatus>({
    isConnected: false,
    status: 'idle'
  });

  // Sync state with storage on mount
  useEffect(() => {
    const fetchStatus = async () => {
      const snap = await youtubeService.getYouTubeConnectionStatus();
      setSimulatedStatus(snap);

      // If we are already connected according to parent state, but not the sync status
      if (isAlreadyConnected && connectedCreator && snap.status !== 'connected') {
        const connectedState: YouTubeConnectionStatus = {
          isConnected: true,
          status: 'connected',
          channelInfo: {
            id: 'UC_youtube_channel_pk_101',
            title: connectedCreator.name,
            customUrl: `@${connectedCreator.channelName}`,
            thumbnailsUrl: connectedCreator.avatar,
            subscriberCount: 245000
          }
        };
        localStorage.setItem('arenapk_youtube_connection_ref', JSON.stringify(connectedState));
        setSimulatedStatus(connectedState);
      }
    };
    fetchStatus();
  }, [isAlreadyConnected, connectedCreator]);

  // Handler to connect simulating a specific scenario
  const handleSimulatedConnect = async (scenario: 'success' | 'scope_missing' | 'auth_error') => {
    setSimulatedLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSimulatedLoading(false);

    if (scenario === 'success') {
      const defaultName = username || 'Nobru Gamer';
      const defaultHandle = channelName || 'nobrugamer';
      const defaultPic = avatarUrl || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150';

      await youtubeService.startYouTubeOAuth(false, false);
      const updated = await youtubeService.getYouTubeConnectionStatus();
      
      // Override with user edits if they typed something in manual screen
      if (updated.channelInfo) {
        updated.channelInfo.title = defaultName;
        updated.channelInfo.customUrl = `@${defaultHandle.replace('@', '')}`;
        updated.channelInfo.thumbnailsUrl = defaultPic;
      }
      localStorage.setItem('arenapk_youtube_connection_ref', JSON.stringify(updated));

      setSimulatedStatus(updated);
      setCongratulations(true);

      onConnect({
        username: defaultName,
        channelName: defaultHandle.replace('@', ''),
        avatarUrl: defaultPic
      });
    } 
    else if (scenario === 'scope_missing') {
      await youtubeService.startYouTubeOAuth(true, false);
      const updated = await youtubeService.getYouTubeConnectionStatus();
      setSimulatedStatus(updated);
    } 
    else if (scenario === 'auth_error') {
      await youtubeService.startYouTubeOAuth(false, true);
      const updated = await youtubeService.getYouTubeConnectionStatus();
      setSimulatedStatus(updated);
    }
  };

  const grantScopesManually = async () => {
    setSimulatedLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSimulatedLoading(false);
    await handleSimulatedConnect('success');
  };

  const resetAllSimulations = async () => {
    await youtubeService.disconnectYouTube();
    setSimulatedStatus({ isConnected: false, status: 'idle' });
    setCongratulations(false);
    onDisconnect();
  };

  const handleCustomConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSimulatedConnect('success');
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 relative z-10 animate-fade-in font-sans">
      
      {/* Simulation Scenario Switcher for QA / Evaluators */}
      <div className="mb-6 bg-zinc-950/70 border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-2 text-zinc-400">
          <Sliders className="w-4 h-4 text-rose-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Simuladores do Backstage (Ambiente Sandbox)</span>
        </div>
        <p className="text-[11px] text-zinc-500 font-sans mb-3 leading-relaxed">
          Alternadores criados para simular fluxos e telas de resposta da API do YouTube OAuth. Escolha um cenário para testar:
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleSimulatedConnect('success')}
            disabled={simulatedLoading}
            className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wide rounded-lg transition border cursor-pointer flex flex-col items-center justify-center text-center ${
              simulatedStatus.status === 'connected'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-zinc-900 border-white/5 text-zinc-450 hover:bg-zinc-800'
            }`}
          >
            <span>🟢 SUCESSO</span>
            <span className="text-[8px] font-normal text-zinc-500 mt-0.5 font-mono">Conta Autorizada</span>
          </button>

          <button
            onClick={() => handleSimulatedConnect('scope_missing')}
            disabled={simulatedLoading}
            className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wide rounded-lg transition border cursor-pointer flex flex-col items-center justify-center text-center ${
              simulatedStatus.status === 'missing_permissions'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-zinc-900 border-white/5 text-zinc-450 hover:bg-zinc-800'
            }`}
          >
            <span>🟡 SEM ESCOPO</span>
            <span className="text-[8px] font-normal text-zinc-500 mt-0.5 font-mono">Falta force-ssl</span>
          </button>

          <button
            onClick={() => handleSimulatedConnect('auth_error')}
            disabled={simulatedLoading}
            className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wide rounded-lg transition border cursor-pointer flex flex-col items-center justify-center text-center ${
              simulatedStatus.status === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-zinc-900 border-white/5 text-zinc-450 hover:bg-zinc-800'
            }`}
          >
            <span>🔴 ERRO OAUTH</span>
            <span className="text-[8px] font-normal text-zinc-500 mt-0.5 font-mono">G-403 Access Denied</span>
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
        
        {/* Header of Simulated Connection */}
        <div className="p-6 bg-zinc-950/80 border-b border-white/5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-inner select-none">
              <Youtube className="w-5 h-5 fill-current text-rose-500" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm uppercase italic tracking-tight">Vincular YouTube via OAuth2</h3>
              <p className="text-[9px] text-zinc-550 font-mono uppercase tracking-widest mt-0.5">Sincronismo de Conta Segura</p>
            </div>
          </div>
          <Lock className="w-4 h-4 text-zinc-550 select-none animate-pulse" />
        </div>

        {/* ----------------- SCREEN 1: STATUS DO CANAL CONECTADO ----------------- */}
        {simulatedStatus.status === 'connected' && (
          <div className="p-6 space-y-6 animate-fade-in">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-300">Conexão Ativa & Integrada</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-0.5">
                  Seu canal do YouTube está conectado via OAuth2. O backend obteve o Refresh Token de forma segura na base criptografada.
                </p>
              </div>
            </div>

            {simulatedStatus.channelInfo && (
              <div className="p-5 bg-zinc-950 border border-white/5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 py-1 px-2.5 bg-emerald-500/10 text-emerald-400 border-b border-l border-emerald-500/20 rounded-bl-xl text-[8px] font-bold font-mono tracking-wider">
                  ONLINE
                </div>

                <div className="flex items-center gap-4">
                  <img 
                    src={simulatedStatus.channelInfo.thumbnailsUrl} 
                    alt={simulatedStatus.channelInfo.title} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/10 group-hover:border-emerald-500/30 transition duration-350"
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h5 className="font-extrabold text-white text-base leading-tight truncate">{simulatedStatus.channelInfo.title}</h5>
                    <div className="flex items-center gap-1 text-[11px] text-rose-400 font-mono font-bold">
                      <Youtube className="w-3.5 h-3.5 fill-current" />
                      <span>youtube.com/{simulatedStatus.channelInfo.customUrl}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-sans">
                      Inscritos: <span className="font-bold text-white font-mono">{simulatedStatus.channelInfo.subscriberCount.toLocaleString()}</span> • Canal Verificado
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-xl space-y-1 text-zinc-400 text-xs font-sans">
              <div className="flex justify-between">
                <span>Método de Autenticação:</span>
                <span className="text-white font-mono font-bold">Google Client Auth Flow v2</span>
              </div>
              <div className="flex justify-between">
                <span>Segredos do Google:</span>
                <span className="text-emerald-400 font-mono font-bold text-[10px] flex items-center gap-1">
                  🔒 BACKEND-EXCLUSIVE (Oculto)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Escopos Ativos:</span>
                <span className="text-zinc-300 font-mono text-[9px]">youtube.force-ssl, youtube.readonly</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={resetAllSimulations}
                className="flex-1 py-3 bg-zinc-805 hover:bg-zinc-700 text-zinc-350 hover:text-white border border-white/5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition shadow-inner"
              >
                Desconectar Canal
              </button>
            </div>
          </div>
        )}

        {/* ----------------- SCREEN 2: ERRO DE AUTORIZAÇÃO / EXPIRADO ----------------- */}
        {simulatedStatus.status === 'error' && (
          <div className="p-6 space-y-6 animate-fade-in">
            <div className="text-center space-y-3 py-4">
              <div className="w-14 h-14 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-white uppercase italic tracking-tight">Falha na Autorização OAuth</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                As chaves de identificação de transmissão não puderam ser verificadas pelo Google OAuth Discovery.
              </p>
            </div>

            <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                <XCircle className="w-4 h-4" />
                <span>LOGS DE ERRO LOCALIZADOS</span>
              </div>
              <div className="p-3 bg-black/90 font-mono text-[10px] text-zinc-400 rounded-lg space-y-1 border border-rose-500/10">
                <div className="text-rose-400 font-bold">[OAuth Error] status_code: G-403 Access Denied</div>
                <div>detail: "The user has rejected consent or token revoked manually on google account page"</div>
                <div className="text-zinc-550">request_uri: "/auth/youtube/callback"</div>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl text-xs space-y-2 text-zinc-400 leading-relaxed font-sans">
              <h5 className="font-bold text-white text-xs">Por que isso acontece?</h5>
              <ul className="list-disc leading-relaxed list-inside space-y-1 text-zinc-400 text-[11px]">
                <li>Rejeição manual ao aceitar permissões na tela do Google.</li>
                <li>Credenciais de login temporárias do canal alteradas.</li>
                <li>Cookies de rota expostos ou revogados remotamente.</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleSimulatedConnect('success')}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 border border-white/5 rounded-xl font-black text-xs uppercase tracking-widest text-white transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4 font-black" />
                Tentar novamente
              </button>
              <button
                onClick={() => setSimulatedStatus({ isConnected: false, status: 'idle' })}
                className="flex-1 py-3.5 bg-zinc-805 hover:bg-zinc-700 text-zinc-350 hover:text-white border border-white/5 rounded-xl font-bold text-xs uppercase tracking-wider transition"
              >
                Voltar para Menu
              </button>
            </div>
          </div>
        )}

        {/* ----------------- SCREEN 3: PERMISSÕES NECESSÁRIAS / MISSING SCOPE ----------------- */}
        {simulatedStatus.status === 'missing_permissions' && (
          <div className="p-6 space-y-6 animate-fade-in">
            <div className="text-center space-y-3 py-4">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-white uppercase italic tracking-tight">Permissões Insuficientes</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Conta do Google vinculada sem as credenciais necessárias de agendamento de transmissões ao vivo.
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Status dos Escopos Solicitados</h5>
              
              {/* Scope 1: Readonly */}
              <div className="p-3.5 bg-zinc-950 border border-white/5 rounded-xl flex items-center justify-between">
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] mt-0.5 font-bold">✓</div>
                  <div>
                    <h6 className="font-extrabold text-white text-[11px] leading-tight font-mono">youtube.readonly</h6>
                    <p className="text-[9px] text-zinc-500 font-sans mt-0.5">Leitura de dados do canal e contagem de inscritos.</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">ATIVADO</span>
              </div>

              {/* Scope 2: Force SSL (Missing!) */}
              <div className="p-3.5 bg-rose-500/5 border border-rose-500/15 rounded-xl flex items-center justify-between">
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-[10px] mt-0.5 font-bold">✗</div>
                  <div>
                    <h6 className="font-extrabold text-white text-[11px] leading-tight font-mono">youtube.force-ssl *</h6>
                    <p className="text-[9px] text-zinc-400 font-sans mt-0.5">Permissão de gerenciar e fechar transmissões ao vivo pelo app.</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold text-rose-450 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/10">PENDENTE</span>
              </div>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex gap-2 text-amber-300 text-[11px] leading-relaxed font-sans mt-1">
              <Info className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-500" />
              <p>
                <strong>Por que esta permissão é exigida?</strong> Sem o escopo <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">youtube.force-ssl</code>, a plataforma ArenaPK YouTube não conseguirá enviar dados de streams temporários nem iniciar sua batalha automática.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={grantScopesManually}
                className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 border border-white/5 rounded-xl font-black text-xs uppercase tracking-widest text-zinc-950 transition flex items-center justify-center gap-1.5"
              >
                <Key className="w-4 h-4" />
                Conceder Escopos Pendentes
              </button>
              <button
                onClick={() => setSimulatedStatus({ isConnected: false, status: 'idle' })}
                className="flex-1 py-3.5 bg-zinc-805 hover:bg-zinc-700 text-zinc-350 hover:text-white border border-white/5 rounded-xl font-bold text-xs uppercase tracking-wider transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ----------------- SCREEN 4: MENU PRINCIPAL / NOT CONNECTED ----------------- */}
        {simulatedStatus.status === 'idle' && (
          <div className="p-6 space-y-6">
            
            {congratulations ? (
              <div className="text-center space-y-4 py-6 animate-fade-in">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-2xl font-bold animate-pulse">
                  ✓
                </div>
                <h4 className="text-lg font-black text-white uppercase italic tracking-tight">Canal Vinculado!</h4>
                <p className="text-xs text-zinc-450 max-w-sm mx-auto font-sans leading-relaxed">
                  Conexão simulada com sucesso pelo backend. Redirecionando seu login de criador de conteúdo automaticamente...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Product greeting */}
                <div className="text-center space-y-2">
                  <h4 className="text-sm font-bold text-zinc-200">Acesse o Backstage com segurança de chaves</h4>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                     Escolha uma conta para conectar ao sistema. O client ID e Client Secret estão protegidos no servidor, expondo apenas o formulário autenticado.
                  </p>
                </div>

                {/* Simulated YouTube Connect Button */}
                {!useCustomName ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => handleSimulatedConnect('success')}
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
                  </div>
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
                    O acesso exige autorização explícita. Nós não guardamos dados de senhas do Google e as ações de lives ocorrem de forma 100% isolada e segura pelo servidor.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
