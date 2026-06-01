/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, Creator } from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  doc, onSnapshot, setDoc, updateDoc, collection, query, where, 
  orderBy, limit, increment, runTransaction 
} from 'firebase/firestore';

// Standard TypeScript enum for Realtime PK Studio events as required by guidelines
export enum PKEvent {
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  GIFT_SENT = 'GIFT_SENT',
  SCORE_UPDATED = 'SCORE_UPDATED',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  ROOM_STARTED = 'ROOM_STARTED',
  ROOM_ENDED = 'ROOM_ENDED',
  TIMER_UPDATED = 'TIMER_UPDATED',
  MODERATION_ACTION = 'MODERATION_ACTION'
}

export interface RealtimeEventPayloads {
  [PKEvent.CHAT_MESSAGE]: {
    message: ChatMessage;
    isSystem?: boolean;
    isPinned?: boolean;
    isSupporterHighlighted?: boolean;
  };
  [PKEvent.GIFT_SENT]: {
    senderName: string;
    senderAvatar: string;
    giftName: string;
    giftIcon: string;
    coinValue: number;
    pkPointsBonus: number;
    isForCreatorA: boolean;
  };
  [PKEvent.SCORE_UPDATED]: {
    scoreA: number;
    scoreB: number;
  };
  [PKEvent.USER_JOINED]: {
    userId: string;
    username: string;
    avatar: string;
    role: 'viewer' | 'sponsor' | 'moderator';
  };
  [PKEvent.USER_LEFT]: {
    userId: string;
    username: string;
  };
  [PKEvent.ROOM_STARTED]: {
    roomId: string;
    timer: number;
  };
  [PKEvent.ROOM_ENDED]: {
    roomId: string;
    winnerId?: string;
  };
  [PKEvent.TIMER_UPDATED]: {
    timer: number;
  };
  [PKEvent.MODERATION_ACTION]: {
    type: 'delete_message' | 'mute_user' | 'pin_message' | 'highlight_supporter';
    targetId?: string; // message id or user id/name
    targetUser?: string;
    moderatorName: string;
    reason?: string;
    additionalData?: any;
  };
}

type EventCallback<T extends PKEvent> = (payload: RealtimeEventPayloads[T]) => void;

/**
 * Interface que define o contrato do serviço robusto de Comunicação em Tempo Real.
 */
export interface IRealtimeService {
  connect(): Promise<boolean>;
  disconnect(): void;
  isConnected(): boolean;
  joinRoom(roomId: string, enableSimulation?: boolean): void;
  leaveRoom(): void;
  on<T extends PKEvent>(event: T, callback: EventCallback<T>): void;
  off<T extends PKEvent>(event: T, callback: EventCallback<T>): void;
  sendEvent<T extends PKEvent>(event: T, payload: RealtimeEventPayloads[T]): void;
  isUserMuted(username: string): boolean;
  muteUserInCache(username: string, mute: boolean): void;
  addProcessedChatId(id: string): void;
  addProcessedGiftId(id: string): void;
}

/**
 * Serviço de Comunicação em Tempo Real sincronizado nativamente com o Firebase Firestore,
 * contendo redundância automática e simuladores para garantir máxima fidelidade.
 */
class RealtimeService implements IRealtimeService {
  private socketConnected: boolean = false;
  private currentRoomId: string | null = null;
  private listeners: { [key in PKEvent]?: Array<(payload: any) => void> } = {};
  private activeRoomSimulationInterval: any = null;
  private simulationEnabled: boolean = false;
  
  // Observadores ativos do Firestore
  private roomUnsubscribe: (() => void) | null = null;
  private chatUnsubscribe: (() => void) | null = null;
  private giftsUnsubscribe: (() => void) | null = null;

  // Track processed message and gift IDs to prevent duplication in production with local triggerEvent
  private processedChatIds: Set<string> = new Set();
  private processedGiftIds: Set<string> = new Set();

  // Track muted users list in local memory to simulate moderation block list
  private mutedUsers: Set<string> = new Set();

  constructor() {
    this.socketConnected = false;
  }

  public async connect(): Promise<boolean> {
    if (this.socketConnected) return true;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        this.socketConnected = true;
        console.log('[RealtimeService] Conectado ao Firebase Realtime Influx.');
        resolve(true);
      }, 300);
    });
  }

  public disconnect() {
    this.socketConnected = false;
    this.stopRoomSimulation();
    this.unsubscribeAll();
    this.listeners = {};
    this.processedChatIds.clear();
    this.processedGiftIds.clear();
    console.log('[RealtimeService] Desconectado da transmissão global.');
  }

  public isConnected(): boolean {
    return this.socketConnected;
  }

  public addProcessedChatId(id: string) {
    this.processedChatIds.add(id);
  }

  public addProcessedGiftId(id: string) {
    this.processedGiftIds.add(id);
  }

  private unsubscribeAll() {
    if (this.roomUnsubscribe) {
      this.roomUnsubscribe();
      this.roomUnsubscribe = null;
    }
    if (this.chatUnsubscribe) {
      this.chatUnsubscribe();
      this.chatUnsubscribe = null;
    }
    if (this.giftsUnsubscribe) {
      this.giftsUnsubscribe();
      this.giftsUnsubscribe = null;
    }
  }

  public joinRoom(roomId: string, enableSimulation: boolean = false) {
    if (!this.socketConnected) {
      this.connect();
    }
    
    this.currentRoomId = roomId;
    this.unsubscribeAll();
    this.processedChatIds.clear();
    this.processedGiftIds.clear();

    console.log(`[RealtimeService] Conectando sala do Firestore: ${roomId} (Simulação: ${enableSimulation})`);

    // --- 1. Sincronismo do Placar, Status e Cronômetro via Firestore ---
    try {
      const roomRef = doc(db, 'pkRooms', roomId);
      this.roomUnsubscribe = onSnapshot(roomRef, (snapshot) => {
        if (snapshot.exists()) {
          const roomData = snapshot.data();
          
          // Dispara alteração do Placar
          this.triggerLocalEvent(PKEvent.SCORE_UPDATED, {
            scoreA: roomData.scoreA !== undefined ? roomData.scoreA : 0,
            scoreB: roomData.scoreB !== undefined ? roomData.scoreB : 0,
          });

          // Dispara Cronômetro
          this.triggerLocalEvent(PKEvent.TIMER_UPDATED, {
            timer: roomData.timer !== undefined ? roomData.timer : 300
          });

          // Dispara Fim de Sala se findado
          if (roomData.status === 'finished' || roomData.status === 'closed') {
            const winnerId = roomData.scoreA >= roomData.scoreB ? roomData.creatorA?.id : roomData.creatorB?.id;
            this.triggerLocalEvent(PKEvent.ROOM_ENDED, {
              roomId: roomId,
              winnerId: winnerId
            });
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `pkRooms/${roomId}`);
      });
    } catch (err) {
      console.warn('[RealtimeService] Firestore room sync indisponível, operando offline:', err);
    }

    // --- 2. Sincronismo do Chat Próprio via Firestore ---
    try {
      const chatQuery = query(
          collection(db, 'pkRooms', roomId, 'chatMessages'),
          orderBy('timestamp', 'asc'),
          limit(50)
      );

      this.chatUnsubscribe = onSnapshot(chatQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            
            // Deduplicate! (Avoid duplicating because user typed and triggered local event + Firestore syncd it back)
            if (this.processedChatIds.has(data.id)) return;
            this.processedChatIds.add(data.id);

            const message: ChatMessage = {
              id: data.id,
              senderName: data.senderName,
              senderAvatar: data.senderAvatar,
              role: data.role,
              text: data.text,
              timestamp: data.timestamp
            };
            this.triggerLocalEvent(PKEvent.CHAT_MESSAGE, { message });
          }
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'chatMessages');
      });
    } catch (err) {
      console.warn('[RealtimeService] Firestore chat sync indisponível, operando offline:', err);
    }

    // --- 3. Sincronismo do Feed de Presentes via Firestore ---
    try {
      const giftQuery = query(
          collection(db, 'pkRooms', roomId, 'giftEvents'),
          orderBy('timestamp', 'asc')
      );

      this.giftsUnsubscribe = onSnapshot(giftQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            
            // Deduplicate!
            if (this.processedGiftIds.has(data.id)) return;
            this.processedGiftIds.add(data.id);

            this.triggerLocalEvent(PKEvent.GIFT_SENT, {
              senderName: data.senderName,
              senderAvatar: data.senderAvatar || '',
              giftName: data.giftName,
              giftIcon: data.giftIcon,
              coinValue: data.coinValue,
              pkPointsBonus: data.pkPointsBonus,
              isForCreatorA: data.targetSide === 'A' || data.isForCreatorA || false
            });
          }
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'giftEvents');
      });
    } catch (err) {
      console.warn('[RealtimeService] Firestore giftEvents sync indisponível, operando offline:', err);
    }

    // Ativa simulação incremental em background apenas em demo ou com env habilitador
    const runSimulation = enableSimulation || ((import.meta as any).env && (import.meta as any).env.VITE_ENABLE_DEMO_SIMULATION === 'true');
    this.simulationEnabled = !!runSimulation;
    if (runSimulation) {
      this.startRoomSimulation(roomId);
    }
  }

  public leaveRoom() {
    console.log(`[RealtimeService] Deixando a sala: ${this.currentRoomId}`);
    this.currentRoomId = null;
    this.simulationEnabled = false;
    this.unsubscribeAll();
    this.stopRoomSimulation();
  }

  public on<T extends PKEvent>(event: T, callback: EventCallback<T>) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(callback);
  }

  public off<T extends PKEvent>(event: T, callback: EventCallback<T>) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]?.filter(cb => cb !== callback);
  }

  public async sendEvent<T extends PKEvent>(event: T, payload: RealtimeEventPayloads[T]) {
    if (!this.socketConnected) {
      console.error('[RealtimeService] Sem conexão de soquete activa.');
      return;
    }

    // Adiciona o id enviado aos rastreadores para evitar duplicidade com o evento disparado localmente
    if (event === PKEvent.CHAT_MESSAGE) {
      const chatPayload = payload as RealtimeEventPayloads[PKEvent.CHAT_MESSAGE];
      this.processedChatIds.add(chatPayload.message.id);
    }

    // Primeiro repassa localmente para resposta de latência instantânea
    this.triggerLocalEvent(event, payload);

    // Se houver sala ativa, sincroniza de forma real no Firestore
    if (this.currentRoomId) {
      const currentRoomId = this.currentRoomId;
      if (event === PKEvent.CHAT_MESSAGE) {
        const chatPayload = payload as RealtimeEventPayloads[PKEvent.CHAT_MESSAGE];
        try {
          const msgRef = doc(db, 'pkRooms', currentRoomId, 'chatMessages', chatPayload.message.id);
          await setDoc(msgRef, {
            id: chatPayload.message.id,
            roomId: currentRoomId,
            senderId: 'usr-self',
            senderName: chatPayload.message.senderName,
            senderAvatar: chatPayload.message.senderAvatar || '',
            role: chatPayload.message.role || 'viewer',
            text: chatPayload.message.text,
            timestamp: chatPayload.message.timestamp || new Date().toISOString(),
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('[RealtimeService] Falha ao sincronizar chat no Firestore:', dbErr);
        }

        if (!chatPayload.isSystem && this.simulationEnabled) {
          this.simulateQuickInteractions(chatPayload.message);
        }

      } else if (event === PKEvent.GIFT_SENT) {
        const giftPayload = payload as RealtimeEventPayloads[PKEvent.GIFT_SENT];
        const eventId = `gift-event-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        this.processedGiftIds.add(eventId);

        try {
          // 1. Registra evento de mimo recebido no sub-collection
          await setDoc(doc(db, 'pkRooms', currentRoomId, 'giftEvents', eventId), {
            id: eventId,
            roomId: currentRoomId,
            senderId: 'usr-self',
            senderName: giftPayload.senderName,
            senderAvatar: giftPayload.senderAvatar,
            giftName: giftPayload.giftName,
            giftIcon: giftPayload.giftIcon,
            coinValue: giftPayload.coinValue,
            pkPointsBonus: giftPayload.pkPointsBonus,
            targetSide: giftPayload.isForCreatorA ? 'A' : 'B',
            isForCreatorA: giftPayload.isForCreatorA,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });

          // 2. Transação atômica ou incremento do placar na arena
          const roomRef = doc(db, 'pkRooms', currentRoomId);
          await updateDoc(roomRef, {
            scoreA: giftPayload.isForCreatorA ? increment(giftPayload.pkPointsBonus) : increment(0),
            scoreB: !giftPayload.isForCreatorA ? increment(giftPayload.pkPointsBonus) : increment(0)
          });
        } catch (dbErr) {
          console.warn('[RealtimeService] Falha ao sincronizar presente no Firestore:', dbErr);
        }
      }
    }
  }

  private triggerLocalEvent<T extends PKEvent>(event: T, payload: RealtimeEventPayloads[T]) {
    const list = this.listeners[event];
    if (list) {
      list.forEach(callback => {
        try {
          callback(payload);
        } catch (err) {
          console.error(`[RealtimeService] Erro ao disparar ouvinte [${event}]:`, err);
        }
      });
    }
  }

  public isUserMuted(username: string): boolean {
    return this.mutedUsers.has(username.toLowerCase());
  }

  public muteUserInCache(username: string, mute: boolean) {
    if (mute) {
      this.mutedUsers.add(username.toLowerCase());
    } else {
      this.mutedUsers.delete(username.toLowerCase());
    }
  }

  private startRoomSimulation(roomId: string) {
    this.stopRoomSimulation();

    setTimeout(() => {
      this.triggerLocalEvent(PKEvent.USER_JOINED, {
        userId: 'sim-user-100',
        username: 'VinySponsor_SP',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        role: 'sponsor'
      });
    }, 1500);

    const simulationIntervalTime = 7000; // Gera mimos/msges adicionais a cada 7s
    this.activeRoomSimulationInterval = setInterval(() => {
      const dice = Math.random();

      if (dice < 0.4) {
        const userPool: { name: string; avatar: string; role: 'viewer' | 'sponsor' | 'moderator' }[] = [
          { name: 'KratosGamer_9', avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100', role: 'viewer' },
          { name: 'Alice_Sponsor2026', avatar: 'https://images.unsplash.com/photo-1511253819057-040294e07e66?w=100', role: 'sponsor' },
          { name: 'Bia_Moderadora', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', role: 'moderator' },
          { name: 'PedroCS2', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', role: 'viewer' }
        ];

        const selectedUser = userPool[Math.floor(Math.random() * userPool.length)];
        if (this.isUserMuted(selectedUser.name)) return;

        const phrases = [
          'Vamo nessa galera, os presentes dão bônus x2 agora!',
          'Que delay bizarro nas câmeras de vocês, muta aí!',
          'Caramba, esse PK é o maior do ano com certeza!',
          'Enviando um mimo para balancear o placar! 🔥',
          'Vamo virar esse placar, time RED!',
          'O time BLUE tá mandando muito Foguete 🚀🚀',
          'Alguém me dá moderação por favor!'
        ];

        const chatMsg: ChatMessage = {
          id: `realtime-sim-msg-${Date.now()}`,
          senderName: selectedUser.name,
          senderAvatar: selectedUser.avatar,
          role: selectedUser.role,
          text: phrases[Math.floor(Math.random() * phrases.length)],
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };

        this.triggerLocalEvent(PKEvent.CHAT_MESSAGE, { message: chatMsg });

      } else if (dice < 0.65) {
        const sponsorNames = ['ArthurGold', 'Carol_Patrocínio', 'GaulesArmy_1', 'CasimiroFãN1'];
        const gifts = [
          { name: 'Fogo Sagrado', icon: '🔥', coin: 50, points: 550 },
          { name: 'Coroa Imperial', icon: '👑', coin: 200, points: 2400 },
          { name: 'Super Foguete Arena', icon: '🚀', coin: 500, points: 6500 }
        ];

        const randomSponsor = sponsorNames[Math.floor(Math.random() * sponsorNames.length)];
        const randomGift = gifts[Math.floor(Math.random() * gifts.length)];
        const isForA = Math.random() > 0.45;

        this.triggerLocalEvent(PKEvent.GIFT_SENT, {
          senderName: randomSponsor,
          senderAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
          giftName: randomGift.name,
          giftIcon: randomGift.icon,
          coinValue: randomGift.coin,
          pkPointsBonus: randomGift.points,
          isForCreatorA: isForA
        });

      } else if (dice < 0.75) {
        const namesJoin = ['GamerPro_Rio', 'FernandaStreamer', 'CrisFutebol', 'Toby_CSGO'];
        const randomName = namesJoin[Math.floor(Math.random() * namesJoin.length)];
        
        if (Math.random() > 0.4) {
          this.triggerLocalEvent(PKEvent.USER_JOINED, {
            userId: `usr-${Date.now()}`,
            username: randomName,
            avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=100',
            role: 'viewer'
          });
        }
      }
    }, simulationIntervalTime);
  }

  private stopRoomSimulation() {
    if (this.activeRoomSimulationInterval) {
      clearInterval(this.activeRoomSimulationInterval);
      this.activeRoomSimulationInterval = null;
    }
  }

  private simulateQuickInteractions(userMsg: ChatMessage) {
    setTimeout(() => {
      if (Math.random() > 0.65) {
        const reactions = [
          'Brabo demais o host falando!',
          'Concordo 100%!',
          'O time RED tá unido mermo kkkkk',
          'Vamos com tudo Casi!',
          'Que top, vou mandar mais mimos para ajudar.'
        ];
        
        const chatReact: ChatMessage = {
          id: `react-sim-${Date.now()}`,
          senderName: 'Reator_Live_12',
          role: 'viewer',
          text: reactions[Math.floor(Math.random() * reactions.length)],
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };

        this.triggerLocalEvent(PKEvent.CHAT_MESSAGE, { message: chatReact });
      }
    }, 2000);
  }
}

export const realtimeService = new RealtimeService();
