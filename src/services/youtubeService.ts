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

/**
 * Interface que define o contrato do serviço da API do YouTube Live Streaming.
 */
export interface IYouTubeService {
  /**
   * Agenda e cria uma nova transmissão ao vivo e chave de stream no YouTube.
   */
  createLiveBroadcast(payload: {
    title: string;
    description: string;
    category: string;
    privacyStatus: 'public' | 'unlisted' | 'private';
    enablePK: boolean;
    allowGifts: boolean;
    allowChat: boolean;
  }): Promise<SimulatedLiveBroadcast>;

  /**
   * Envia evento para sinalizar o fim de uma transmissão na plataforma externa.
   */
  endLiveBroadcast(broadcastId: string): Promise<boolean>;
}

/**
 * Serviço de transmissão ao vivo do YouTube com simulador de atraso de rede (RTT).
 * 
 * COMUTADOR FUTURO DE PRODUÇÃO:
 * - O frontend fará requisições autenticadas seguras a um backend Node.js que
 *   processa as credenciais e tokens OAuth salvos em cookies HttpOnly de forma oculta do navegador:
 *   - `createLiveBroadcast` -> `POST /api/youtube/live/create`
 *   - `endLiveBroadcast` -> `POST /api/youtube/live/end`
 * - No MVP real web, a transmissão pode exigir um media gateway para receber WebRTC e enviar RTMP ao YouTube,
 *   ou ferramenta externa (como OBS) enviando diretamente com base nos dados obtidos pelo endpoint de criação.
 */
class YouTubeService implements IYouTubeService {
  public async createLiveBroadcast(payload: {
    title: string;
    description: string;
    category: string;
    privacyStatus: 'public' | 'unlisted' | 'private';
    enablePK: boolean;
    allowGifts: boolean;
    allowChat: boolean;
  }): Promise<SimulatedLiveBroadcast> {
    // FUTURO ENDPOINT REAL: POST /api/youtube/live/create
    // O backend utiliza a biblioteca oficial do Google API para reservar o broadcast e o stream.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Recursos de Vídeo Pré-selecionados para o Player Mockado Interativo do YouTube
    const presetVideoIds = [
      'ScMzIvxBSi4', // Cazá React
      'U8C6EsuM_Gg', // CS2 Major
      'S_C4h7zN-7g', // FreeFire Highlights
      'm79Hh_f0R7o'  // Coringa GTA
    ];
    // Escolher um ID semi-aleatório baseado no título ou simplesmente um randômico elegante
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
    // FUTURO ENDPOINT REAL: POST /api/youtube/live/end
    // Altera o status da live externa de "active" para "complete".
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`[YouTubeService] Live ID ${broadcastId} encerrada.`);
    return true;
  }
}

export const youtubeService = new YouTubeService();
