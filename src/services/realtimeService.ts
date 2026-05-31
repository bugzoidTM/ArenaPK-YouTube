/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, Creator } from '../types';

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
  /**
   * Conecta o cliente ao canal WebSocket do servidor.
   */
  connect(): Promise<boolean>;

  /**
   * Encerra a conexão WebSocket.
   */
  disconnect(): void;

  /**
   * Verifica se o WebSocket se encontra ativo.
   */
  isConnected(): boolean;

  /**
   * Inscreve o usuário em uma sala/arena PK específica.
   */
  joinRoom(roomId: string): void;

  /**
   * Abandona a sala de transmissão conectada.
   */
  leaveRoom(): void;

  /**
   * Registra um receptor de novos eventos em tempo real vindos do servidor.
   */
  on<T extends PKEvent>(event: T, callback: EventCallback<T>): void;

  /**
   * Desinscreve o receptor para evitar vazamento de memória.
   */
  off<T extends PKEvent>(event: T, callback: EventCallback<T>): void;

  /**
   * Transmite um evento local que será retransmitido pelo gateway a outros clientes.
   */
  sendEvent<T extends PKEvent>(event: T, payload: RealtimeEventPayloads[T]): void;

  /**
   * Verifica se um usuário está localmente com moderação ativa de silenciamento.
   */
  isUserMuted(username: string): boolean;

  /**
   * Silencia temporariamente um usuário na sessão.
   */
  muteUserInCache(username: string, mute: boolean): void;
}

/**
 * Serviço WebSocket Mockado para simulação de interações e pontuações do duelo PK.
 * 
 * COMUTADOR FUTURO DE PRODUÇÃO:
 * - O frontend conectará de forma real via protocolo seguro do WebSocket (`wss://`):
 *   - `connect` -> instancia do objeto `new WebSocket('wss://api.arenapk.com/rooms/' + roomId + '?token=' + token)`
 *   - `sendEvent` -> chamará `socket.send(JSON.stringify({ event, payload }))`
 *   - `on` e `off` -> mapeia ouvintes de mensagens nativos `socket.onmessage`.
 */
class RealtimeService implements IRealtimeService {
  private socketConnected: boolean = false;
  private currentRoomId: string | null = null;
  private listeners: { [key in PKEvent]?: Array<(payload: any) => void> } = {};
  private activeRoomSimulationInterval: any = null;

  // Track muted users list in local memory to simulate moderation block list
  private mutedUsers: Set<string> = new Set();

  constructor() {
    this.socketConnected = false;
  }

  public async connect(): Promise<boolean> {
    if (this.socketConnected) return true;
    
    // Simulate real networking handshake latency
    return new Promise((resolve) => {
      setTimeout(() => {
        this.socketConnected = true;
        console.log('[RealtimeService] WebSocket Connection Established. Protocol: secure-ws://arenapk.api/realtime');
        resolve(true);
      }, 400);
    });
  }

  public disconnect() {
    this.socketConnected = false;
    this.stopRoomSimulation();
    this.listeners = {};
    console.log('[RealtimeService] WebSocket Connection Terminated.');
  }

  public isConnected(): boolean {
    return this.socketConnected;
  }

  public joinRoom(roomId: string) {
    if (!this.socketConnected) {
      console.warn('[RealtimeService] Cannot join room while socket is offline. Connecting automatically...');
      this.connect();
    }
    
    this.currentRoomId = roomId;
    console.log(`[RealtimeService] Joined room: ${roomId}`);

    // Trigger initial simulation cycle to show realistic multi-user interactivity
    this.startRoomSimulation(roomId);
  }

  public leaveRoom() {
    console.log(`[RealtimeService] Left room: ${this.currentRoomId}`);
    this.currentRoomId = null;
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

  public sendEvent<T extends PKEvent>(event: T, payload: RealtimeEventPayloads[T]) {
    if (!this.socketConnected) {
      console.error('[RealtimeService] Cannot send payload. Socket state: offline.');
      return;
    }

    console.log(`[RealtimeService] OUTGOING [${event}]:`, payload);

    // Forward immediately to local listeners (simulating our own echo broadcast from server)
    this.triggerLocalEvent(event, payload);

    // If it's a message, sometimes let simulated opponent or background user react
    if (event === PKEvent.CHAT_MESSAGE) {
      const chatPayload = payload as RealtimeEventPayloads[PKEvent.CHAT_MESSAGE];
      if (!chatPayload.isSystem) {
        this.simulateQuickInteractions(chatPayload.message);
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
          console.error(`[RealtimeService] Error executing listener for event [${event}]:`, err);
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

    // Trigger USER_JOINED immediately for realism
    setTimeout(() => {
      this.triggerLocalEvent(PKEvent.USER_JOINED, {
        userId: 'sim-user-100',
        username: 'VinySponsor_SP',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        role: 'sponsor'
      });
    }, 1500);

    const simulationIntervalTime = 5500; // Generate events every 5.5s
    this.activeRoomSimulationInterval = setInterval(() => {
      const dice = Math.random();

      if (dice < 0.4) {
        // Option A: Simulated chat message
        const userPool: { name: string; avatar: string; role: 'viewer' | 'sponsor' | 'moderator' }[] = [
          { name: 'KratosGamer_9', avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100', role: 'viewer' },
          { name: 'Alice_Sponsor2026', avatar: 'https://images.unsplash.com/photo-1511253819057-040294e07e66?w=100', role: 'sponsor' },
          { name: 'Bia_Moderadora', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', role: 'moderator' },
          { name: 'PedroCS2', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', role: 'viewer' }
        ];

        const selectedUser = userPool[Math.floor(Math.random() * userPool.length)];

        // Skip chat if user is muted
        if (this.isUserMuted(selectedUser.name)) return;

        const phrases = [
          'Vamo nessa galera, os presentes dão bônus x2 agora!',
          'Que delay bizarro nas câmeras de vocês, muta aí!',
          'Caramba, esse PK é o maior do mês com certeza kkkk',
          'Enviando um mimo para balancear o placar! 🔥',
          'Como funciona essa regra da punição do perdedor?',
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

      } else if (dice < 0.7) {
        // Option B: Simulated Gift sent from a sponsor view
        const sponsorNames = ['ArthurGold', 'Carol_Patrocínio', 'GaulesArmy_1', 'CasimiroFãN1'];
        const gifts = [
          { name: 'Fogo Sagrado', icon: '🔥', coin: 50, points: 550 },
          { name: 'Coroa Imperial', icon: '👑', coin: 200, points: 2400 },
          { name: 'Super Foguete Arena', icon: '🚀', coin: 500, points: 6500 }
        ];

        const randomSponsor = sponsorNames[Math.floor(Math.random() * sponsorNames.length)];
        const randomGift = gifts[Math.floor(Math.random() * gifts.length)];
        const isForA = Math.random() > 0.45; // favor RED slightly for visual joy

        // Simulate Gift Sent Packet
        this.triggerLocalEvent(PKEvent.GIFT_SENT, {
          senderName: randomSponsor,
          senderAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
          giftName: randomGift.name,
          giftIcon: randomGift.icon,
          coinValue: randomGift.coin,
          pkPointsBonus: randomGift.points,
          isForCreatorA: isForA
        });

      } else if (dice < 0.8) {
        // Option C: User join/leave
        const namesJoin = ['GamerPro_Rio', 'FernandaStreamer', 'CrisFutebol', 'Toby_CSGO'];
        const randomName = namesJoin[Math.floor(Math.random() * namesJoin.length)];
        
        if (Math.random() > 0.4) {
          this.triggerLocalEvent(PKEvent.USER_JOINED, {
            userId: `usr-${Date.now()}`,
            username: randomName,
            avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=100',
            role: 'viewer'
          });
        } else {
          this.triggerLocalEvent(PKEvent.USER_LEFT, {
            userId: `usr-${Date.now() - 50000}`,
            username: randomName
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
      if (Math.random() > 0.6) {
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
    }, 1800);
  }
}

export const realtimeService = new RealtimeService();
