/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Creator {
  id: string;
  name: string;
  avatar: string;
  channelName: string;
  subscribers: number;
  isLive: boolean;
  liveTitle?: string;
  youtubeVideoId?: string;
  currentPkPoints: number;
}

export interface PKBattle {
  id: string;
  creatorRed: Creator;
  creatorBlue: Creator;
  pointsRed: number;
  pointsBlue: number;
  durationSeconds: number;
  timeLeftSeconds: number;
  status: 'pending' | 'active' | 'completed' | 'timeout';
  selectedStake: string; // O que está em jogo (ex: pagar prenda, cantar música)
  winnerId?: string;
}

export interface Gift {
  id: string;
  name: string;
  coinValue: number;
  icon: string; // emoji / lucide name
  color: string; // Tailwind class
  pkPointsBonus: number; // Quantos pontos de PK rende
  animationType: 'pop' | 'sparkle' | 'rocket' | 'fireworks' | 'laser' | 'meteor';
  rarity: 'comum' | 'raro' | 'lendário' | 'épico' | 'mítico';
  description: string;
}

export interface MarketCoinPack {
  id: string;
  coins: number;
  bonus: number;
  priceBRL: number;
  popular?: boolean;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderAvatar?: string;
  role: 'viewer' | 'moderator' | 'admin' | 'creator' | 'sponsor';
  text: string;
  timestamp: string;
  giftAttached?: {
    giftName: string;
    giftIcon: string;
    count: number;
  };
  isSystem?: boolean;
  isPinned?: boolean;
  isSupporterHighlighted?: boolean;
}

export interface PKInvite {
  id: string;
  challenger: Creator;
  target: Creator;
  durationMinutes: number;
  selectedStake: string;
  status: 'pending' | 'accepted' | 'declined' | 'enviado' | 'aguardando' | 'aceito' | 'recusado';
}

export interface SystemAuditLog {
  id: string;
  type: 'report' | 'ban' | 'warning' | 'setting_change';
  user: string;
  details: string;
  timestamp: string;
  resolved: boolean;
}

export interface SimulatedLive {
  videoId: string;
  title: string;
  embedUrl: string;
  watchUrl: string;
  status: 'ready' | 'testing' | 'live';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'viewer' | 'moderator' | 'admin' | 'creator';
  isBlocked?: boolean;
}

export interface Viewer {
  id: string;
  name: string;
  level: number;
  xp: number;
  badges: string[];
  favoriteCreators: string[];
}

export interface LiveBroadcast {
  id: string;
  creatorId: string;
  title: string;
  viewerCount: number;
  liveUrl: string;
  status: 'online' | 'offline' | 'pk_battle';
}

export interface Wallet {
  id: string;
  userId: string;
  coinsBalance: number;
  earningsBRL: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'debit_gift' | 'credit_earnings' | 'purchase_coins';
  coinsAmount: number;
  brlAmount?: number;
  description: string;
  timestamp: string;
}

export interface RankingEntry {
  creatorId: string;
  creatorName: string;
  points: number;
  rank: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
}

export interface AuditLog {
  id: string;
  type: 'gift_send' | 'comment' | 'report' | 'ban_user' | 'close_room' | 'pause_gifts' | 'moderator_action';
  userId?: string;
  targetId?: string;
  details: string;
  timestamp: string;
}

export interface PKRoom {
  roomId: string;
  creatorA: Creator;
  creatorB: Creator;
  liveA: SimulatedLive;
  liveB: SimulatedLive;
  scoreA: number;
  scoreB: number;
  timer: number; // segundos restantes
  status: 'pending' | 'active' | 'completed' | 'timeout';
  gifts: Gift[];
  chatMessages: ChatMessage[];
  viewers: number;
  ranking: {
    creatorId: string;
    points: number;
    rank: number;
  }[];
}

