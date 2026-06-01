/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SimulatedLiveBroadcast {
  broadcastId: string;
  streamId: string;
  videoId: string;
  embedUrl: string;
  liveStatus: 'ready' | 'testing' | 'live';
  watchUrl: string;
}

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  customUrl: string;
  thumbnailsUrl: string;
  subscriberCount: number;
}

export interface YouTubeConnectionStatus {
  isConnected: boolean;
  status: 'idle' | 'authorizing' | 'connected' | 'error' | 'missing_permissions';
  channelInfo?: YouTubeChannelInfo;
  errorMessage?: string;
}

/**
 * DOCUMENTAÇÃO DOS ENDPOINTS BACKEND NECESSÁRIOS:
 * 
 * 1. GET /auth/youtube/start
 *    - Inicia o fluxo de consentimento OAuth do Google.
 *    - Redireciona o usuário para a URL de Autorização do Google contendo os seguintes escopos:
 *      - https://www.googleapis.com/auth/youtube.readonly
 *      - https://www.googleapis.com/auth/youtube.force-ssl
 *    - Deve usar os parâmetros: response_type=code, access_type=offline (para Refresh Token), prompt=consent.
 * 
 * 2. GET /auth/youtube/callback
 *    - Ponto de retorno definido no Google Cloud Console.
 *    - Recebe o parâmetro ?code= na query da URL.
 *    - Troca o código temporário por Access Token e Refresh Token no backend.
 *    - Salva o Refresh Token de forma segura e injeta um Cookie HttpOnly cifrado no navegador do cliente de forma que chaves sensíveis e segredos nunca fiquem expostos no frontend.
 * 
 * 3. POST /auth/youtube/disconnect
 *    - Limpa os Cookies/Sessão do usuário.
 *    - Revoga o token de acesso acessando as APIs do Google OAuth Revocation.
 * 
 * 4. GET /youtube/status
 *    - Retorna as informações do canal conectado no formato `YouTubeConnectionStatus`.
 *    - Executa consulta na API 'youtube.channels.list' utilizando o Access Token armazenado na sessão.
 * 
 * 5. POST /youtube/live/create
 *    - Valida se o usuário tem o escopo 'youtube.force-ssl'.
 *    - Agenda e cria via YouTube API 'liveBroadcasts.insert' e 'liveStreams.insert'.
 * 
 * 6. POST /youtube/live/end
 *    - Executa a finalização da transmissão ativa definindo o status de transmissão para 'complete' via 'liveBroadcasts.transition'.
 * 
 * CRITICAL SECURITY NOTE:
 * O client_id, client_secret e refresh_token NUNCA devem ser trafegados ou gravados no client-side/Vite bundle, operando puramente por trás de proxies HTTP-Only seguros.
 */

export interface IYouTubeService {
  startYouTubeOAuth(simulateScopeIssue?: boolean, simulateErrorIssue?: boolean): Promise<void>;
  getYouTubeConnectionStatus(): Promise<YouTubeConnectionStatus>;
  disconnectYouTube(): Promise<void>;
  createLiveBroadcast(payload: {
    title: string;
    description: string;
    category: string;
    privacyStatus: 'public' | 'unlisted' | 'private';
    enablePK: boolean;
    allowGifts: boolean;
    allowChat: boolean;
  }): Promise<SimulatedLiveBroadcast>;
  endLiveBroadcast(broadcastId: string): Promise<boolean>;
}

class YouTubeService implements IYouTubeService {
  private STORAGE_KEY = 'arenapk_youtube_connection_ref';

  /**
   * Dispara o fluxo OAuth. Como estamos no ambiente sandbox frontend,
   * simulamos cenários de sucesso, erro de autorização ou escopo/permissão pendente.
   */
  public async startYouTubeOAuth(simulateScopeIssue = false, simulateErrorIssue = false): Promise<void> {
    console.log('[YouTubeService] startYouTubeOAuth disparado. Encaminhando para simulação de consentimento...');
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (simulateErrorIssue) {
      const state: YouTubeConnectionStatus = {
        isConnected: false,
        status: 'error',
        errorMessage: 'Acesso negado: O usuário revogou o consentimento ou credenciais expiraram (G-403 OAuth Error).'
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      return;
    }

    if (simulateScopeIssue) {
      const state: YouTubeConnectionStatus = {
        isConnected: false,
        status: 'missing_permissions',
        errorMessage: 'Faltando escopo "youtube.force-ssl": ArenaPK precisa de permissões de transmissão para agendar eventos ao vivo em seu nome.'
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      return;
    }

    // Sucesso por padrão
    const state: YouTubeConnectionStatus = {
      isConnected: true,
      status: 'connected',
      channelInfo: {
        id: 'UC_youtube_channel_pk_101',
        title: 'Arena Streamer Oficial',
        customUrl: '@arenastreamer',
        thumbnailsUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120',
        subscriberCount: 245000
      }
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  /**
   * Retorna os dados síncronos do canal conectado armazenados localmente
   */
  public async getYouTubeConnectionStatus(): Promise<YouTubeConnectionStatus> {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      return {
        isConnected: false,
        status: 'idle'
      };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { isConnected: false, status: 'idle' };
    }
  }

  /**
   * Remove a conexão e limpa cache/storage síncrono
   */
  public async disconnectYouTube(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    localStorage.removeItem(this.STORAGE_KEY);
  }

  public async createLiveBroadcast(payload: {
    title: string;
    description: string;
    category: string;
    privacyStatus: 'public' | 'unlisted' | 'private';
    enablePK: boolean;
    allowGifts: boolean;
    allowChat: boolean;
  }): Promise<SimulatedLiveBroadcast> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const presetVideoIds = [
      'ScMzIvxBSi4', // Cazá React
      'U8C6EsuM_Gg', // CS2 Major
      'S_C4h7zN-7g', // FreeFire Highlights
      'm79Hh_f0R7o'  // Coringa GTA
    ];
    const randomIndex = Math.floor(Math.random() * presetVideoIds.length);
    const selectedVideoId = presetVideoIds[randomIndex];

    const generatedId = `yt-live-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      broadcastId: generatedId,
      streamId: `stream-key-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      videoId: selectedVideoId,
      embedUrl: `https://www.youtube.com/embed/${selectedVideoId}?autoplay=1&mute=1`,
      liveStatus: 'live',
      watchUrl: `https://www.youtube.com/watch?v=${selectedVideoId}`
    };
  }

  public async endLiveBroadcast(broadcastId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`[YouTubeService] Live ID ${broadcastId} encerrada.`);
    return true;
  }
}

export const youtubeService = new YouTubeService();
