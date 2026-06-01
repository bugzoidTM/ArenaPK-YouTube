/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Creator, PKRoom, PKInvite } from '../types';
import { INITIAL_CREATORS } from '../mocks/pkService';
import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

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
 * Serviço de salas PK integrado com persistência no Firebase Firestore e redundância local.
 */
class PKRoomService implements IPKRoomService {
  private STORAGE_KEY_CREATORS = 'arenapk_creators_list';
  private STORAGE_KEY_ROOMS = 'arenapk_active_rooms';

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    if (localStorage.getItem(this.STORAGE_KEY_CREATORS) === null) {
      localStorage.setItem(this.STORAGE_KEY_CREATORS, JSON.stringify(INITIAL_CREATORS));
    }

    // Inicializa criadores de demonstração no Firestore em background (se não existirem)
    try {
      for (const creator of INITIAL_CREATORS) {
        const creatorRef = doc(db, 'creators', creator.id);
        const snap = await getDoc(creatorRef);
        if (!snap.exists()) {
          const cAny = creator as any;
          await setDoc(creatorRef, {
            id: creator.id,
            name: creator.name,
            channelName: creator.channelName,
            avatar: creator.avatar,
            banner: cAny.banner || 'images/default-banner.jpg',
            category: cAny.category || 'Competitivo',
            viewers: cAny.viewers || 1000,
            liveTitle: creator.liveTitle || 'Transmissão Oficial',
            youtubeVideoId: creator.youtubeVideoId || 'ScMzIvxBSi4',
            isOnline: creator.isLive || false,
            points: creator.currentPkPoints || 0
          });
        }
      }
    } catch (err) {
      console.warn('[PKRoomService] Falha ao sincronizar catálogo inicial de creators no Firestore:', err);
    }
  }

  public async listCreators(): Promise<Creator[]> {
    this.initializeStorage();
    
    // Tenta carregar do Firestore primeiro
    try {
      const creatorsCol = collection(db, 'creators');
      const snap = await getDocs(creatorsCol);
      if (!snap.empty) {
        const list: Creator[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: d.id,
            name: d.name,
            avatar: d.avatar,
            channelName: d.channelName,
            subscribers: d.viewers ? d.viewers * 10 : 154000,
            isLive: d.isOnline,
            liveTitle: d.liveTitle,
            youtubeVideoId: d.youtubeVideoId,
            currentPkPoints: d.points
          });
        });
        localStorage.setItem(this.STORAGE_KEY_CREATORS, JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('[PKRoomService] Falha ao carregar creators do Firestore, usando backup...', err);
    }

    const raw = localStorage.getItem(this.STORAGE_KEY_CREATORS);
    return raw ? JSON.parse(raw) : INITIAL_CREATORS;
  }

  public async getRoomById(roomId: string): Promise<PKRoom | null> {
    // Tenta carregar do Firestore
    try {
      const roomRef = doc(db, 'pkRooms', roomId);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const d = snap.data();
        return {
          roomId: d.roomId,
          creatorA: d.creatorA,
          creatorB: d.creatorB,
          liveA: d.liveA,
          liveB: d.liveB,
          scoreA: d.scoreA,
          scoreB: d.scoreB,
          timer: d.timer,
          status: d.status,
          viewers: d.viewers,
          gifts: d.gifts || [],
          chatMessages: d.chatMessages || [],
          ranking: d.ranking || []
        } as PKRoom;
      }
    } catch (err) {
      console.warn('[PKRoomService] Falha ao carregar sala do Firestore, tentando local:', err);
    }

    const rooms = this.getActiveRooms();
    const room = rooms.find((r) => r.roomId === roomId);
    return room || null;
  }

  public async createRoom(creatorId: string): Promise<PKRoom> {
    const creators = await this.listCreators();
    const creatorA = creators.find((c) => c.id === creatorId) || creators[0];
    const creatorB = creators.find((c) => c.id !== creatorId) || creators[1];

    const roomId = `room-${Date.now()}`;

    const newRoom: PKRoom = {
      roomId: roomId,
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
        title: creatorA.liveTitle || `Live de @${creatorA.channelName}`,
        embedUrl: `https://www.youtube.com/embed/${creatorA.youtubeVideoId || 'ScMzIvxBSi4'}`,
        watchUrl: `https://www.youtube.com/watch?v=${creatorA.youtubeVideoId || 'ScMzIvxBSi4'}`,
        status: 'live'
      },
      liveB: {
        videoId: creatorB.youtubeVideoId || 'U8C6EsuM_Gg',
        title: creatorB.liveTitle || `Live de @${creatorB.channelName}`,
        embedUrl: `https://www.youtube.com/embed/${creatorB.youtubeVideoId || 'U8C6EsuM_Gg'}`,
        watchUrl: `https://www.youtube.com/watch?v=${creatorB.youtubeVideoId || 'U8C6EsuM_Gg'}`,
        status: 'live'
      },
      scoreA: 0,
      scoreB: 0,
      timer: 300,
      status: 'active',
      viewers: 1500 + Math.floor(Math.random() * 5000),
      gifts: [],
      chatMessages: [],
      ranking: [
        { creatorId: creatorA.id, points: 0, rank: 1 },
        { creatorId: creatorB.id, points: 0, rank: 2 }
      ]
    };

    // 1. Persiste no Firestore
    try {
      const roomRef = doc(db, 'pkRooms', roomId);
      await setDoc(roomRef, {
        ...newRoom,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `pkRooms/${roomId}`);
    }

    // 2. Backup LocalStorage
    const rooms = this.getActiveRooms();
    rooms.push(newRoom);
    this.saveActiveRooms(rooms);

    return newRoom;
  }

  public async sendInvite(roomId: string, targetCreatorId: string, stake: string, minutes: number): Promise<PKInvite> {
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

    console.log(`[PKRoomService] Convite enviado para @${target.channelName}. Prenda: "${stake}"`);
    return invite;
  }

  public async acceptInvite(inviteId: string): Promise<PKRoom> {
    const creators = await this.listCreators();
    return this.createRoom(creators[0].id);
  }

  public async endRoom(roomId: string): Promise<boolean> {
    // 1. Atualiza no Firestore
    try {
      const roomRef = doc(db, 'pkRooms', roomId);
      await updateDoc(roomRef, { status: 'completed' });
    } catch (err) {
      console.warn('[PKRoomService] Falha ao atualizar fim de sala no Firestore:', err);
    }

    // 2. Atualiza localmente
    const rooms = this.getActiveRooms();
    const filtered = rooms.map(r => r.roomId === roomId ? { ...r, status: 'completed' as const } : r);
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
