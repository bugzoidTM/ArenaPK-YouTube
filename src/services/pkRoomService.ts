/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Creator, PKRoom, PKInvite, PKBattle } from '../types';
import { INITIAL_CREATORS, INITIAL_INVITES } from './pkService';

/**
 * Interface que define o contrato do serviço de Salas e Desafios PK.
 */
export interface IPKRoomService {
  /**
   * Obtém os dados detalhados de uma sala de embate ativa pelo ID.
   */
  getRoomById(roomId: string): Promise<PKRoom | null>;

  /**
   * Registra a abertura de uma nova sala de transmissão principal.
   */
  createRoom(creatorId: string): Promise<PKRoom>;

  /**
   * Envia um convite de desafio PK para outro produtor de conteúdo.
   */
  sendInvite(roomId: string, targetCreatorId: string, stake: string, minutes: number): Promise<PKInvite>;

  /**
   * Aceita um convite pendente, alterando o status da sala de transmissão para PK_BATTLE.
   */
  acceptInvite(inviteId: string): Promise<PKRoom>;

  /**
   * Força a finalização antecipada de uma sala de desafio ativo.
   */
  endRoom(roomId: string): Promise<boolean>;

  /**
   * Carrega os criadores ativos cadastrados na ArenaPK.
   */
  listCreators(): Promise<Creator[]>;
}

/**
 * Serviço de salas PK com simulador de banco de dados baseado em LocalStorage.
 * 
 * COMUTADOR FUTURO DE PRODUÇÃO:
 * - Substituir operações mock por chamadas aos endpoints REST e WebSockets do backend:
 *   - `getRoomById` -> `GET /api/pk/rooms/:roomId`
 *   - `createRoom` -> `POST /api/pk/rooms`
 *   - `sendInvite` -> `POST /api/pk/rooms/:roomId/invite`
 *   - `acceptInvite` -> `POST /api/pk/rooms/:roomId/accept`
 *   - `endRoom` -> `POST /api/pk/rooms/:roomId/end`
 */
class PKRoomService implements IPKRoomService {
  private STORAGE_KEY_CREATORS = 'arenapk_creators_list';
  private STORAGE_KEY_ROOMS = 'arenapk_active_rooms';

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage() {
    if (localStorage.getItem(this.STORAGE_KEY_CREATORS) === null) {
      localStorage.setItem(this.STORAGE_KEY_CREATORS, JSON.stringify(INITIAL_CREATORS));
    }
  }

  public async listCreators(): Promise<Creator[]> {
    this.initializeStorage();
    const raw = localStorage.getItem(this.STORAGE_KEY_CREATORS);
    return raw ? JSON.parse(raw) : INITIAL_CREATORS;
  }

  public async getRoomById(roomId: string): Promise<PKRoom | null> {
    // FUTURO ENDPOINT REAL: GET /api/pk/rooms/:roomId
    // O backend lerá o estado consolidado em cache Redis do placar do duelo.
    const rooms = this.getActiveRooms();
    const room = rooms.find((r) => r.roomId === roomId);
    return room || null;
  }

  public async createRoom(creatorId: string): Promise<PKRoom> {
    // FUTURO ENDPOINT REAL: POST /api/pk/rooms
    // Cria um registro de transmissão e associa a stream key ao criador de forma isolada.
    const creators = await this.listCreators();
    const creatorA = creators.find((c) => c.id === creatorId) || creators[0];
    const creatorB = creators.find((c) => c.id !== creatorId) || creators[1];

    const newRoom: PKRoom = {
      roomId: `room-${Date.now()}`,
      creatorA: {
        ...creatorA,
        youtubeVideoId: creatorA.youtubeVideoId || 'ScMzIvxBSi4'
      },
      creatorB: {
        ...creatorB,
        youtubeVideoId: creatorB.youtubeVideoId || 'U8C6EsuM_Gg'
      },
      liveA: {
        videoId: creatorA.youtubeVideoId || 'ScMzIvxBSi4',
        title: creatorA.liveTitle || 'Live Casimiro',
        embedUrl: `https://www.youtube.com/embed/${creatorA.youtubeVideoId || 'ScMzIvxBSi4'}?autoplay=1&mute=1`,
        watchUrl: `https://www.youtube.com/watch?v=${creatorA.youtubeVideoId || 'ScMzIvxBSi4'}`,
        status: 'live'
      },
      liveB: {
        videoId: creatorB.youtubeVideoId || 'U8C6EsuM_Gg',
        title: creatorB.liveTitle || 'Live Gaules',
        embedUrl: `https://www.youtube.com/embed/${creatorB.youtubeVideoId || 'U8C6EsuM_Gg'}?autoplay=1&mute=1`,
        watchUrl: `https://www.youtube.com/watch?v=${creatorB.youtubeVideoId || 'U8C6EsuM_Gg'}`,
        status: 'live'
      },
      scoreA: 1500,
      scoreB: 1200,
      timer: 300,
      status: 'active',
      viewers: 4500,
      gifts: [],
      chatMessages: [],
      ranking: [
        { creatorId: creatorA.id, points: 1500, rank: 1 },
        { creatorId: creatorB.id, points: 1200, rank: 2 }
      ]
    };

    const rooms = this.getActiveRooms();
    rooms.push(newRoom);
    this.saveActiveRooms(rooms);

    return newRoom;
  }

  public async sendInvite(roomId: string, targetCreatorId: string, stake: string, minutes: number): Promise<PKInvite> {
    // FUTURO ENDPOINT REAL: POST /api/pk/rooms/:roomId/invite
    // Dispara notificação WebSocket instantânea para a dashboard do criador-alvo.
    const creators = await this.listCreators();
    const target = creators.find((c) => c.id === targetCreatorId) || creators[2];
    const challenger = creators[0];

    const invite: PKInvite = {
      id: `invite-${Date.now()}`,
      challenger,
      target,
      durationMinutes: minutes,
      selectedStake: stake,
      status: 'pending'
    };

    console.log(`[PKRoomService] Convite de desafio enviado para @${target.channelName}. Prenda: "${stake}"`);
    return invite;
  }

  public async acceptInvite(inviteId: string): Promise<PKRoom> {
    // FUTURO ENDPOINT REAL: POST /api/pk/rooms/:roomId/accept
    // Altera o estado do circuito de batalha no servidor, abrindo as duas conexões de vídeo.
    const creators = await this.listCreators();
    return this.createRoom(creators[0].id);
  }

  public async endRoom(roomId: string): Promise<boolean> {
    // FUTURO ENDPOINT REAL: POST /api/pk/rooms/:roomId/end
    // Consolida o placar geral no banco de dados e encerra sincronização de presentes na sala.
    const rooms = this.getActiveRooms();
    const filtered = rooms.filter((r) => r.roomId !== roomId);
    this.saveActiveRooms(filtered);
    return true;
  }

  private getActiveRooms(): PKRoom[] {
    const raw = localStorage.getItem(this.STORAGE_KEY_ROOMS);
    return raw ? JSON.parse(raw) : [];
  }

  private saveActiveRooms(rooms: PKRoom[]) {
    localStorage.setItem(this.STORAGE_KEY_ROOMS, JSON.stringify(rooms));
  }
}

export const pkRoomService = new PKRoomService();
