/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Creator, PKBattle, Gift, MarketCoinPack, ChatMessage, PKInvite, SystemAuditLog } from '../types';

// Lista de criadores padrão da ArenaPK YouTube
export const INITIAL_CREATORS: Creator[] = [
  {
    id: 'creator-1',
    name: 'Casimiro Play',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    channelName: 'CasimiroStream',
    subscribers: 3450000,
    isLive: true,
    liveTitle: 'REAGINDO AOS MELHORES VÍDEOS DE COMIDA DA NET! 🍔 PK MAIS TARDE',
    youtubeVideoId: 'ScMzIvxBSi4', // Exemplo de vídeo incorporado do YouTube (vídeo público comum)
    currentPkPoints: 0,
  },
  {
    id: 'creator-2',
    name: 'Gaules Arena',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    channelName: 'GaulesLive',
    subscribers: 1200000,
    isLive: true,
    liveTitle: 'MUNDIAL DE CS2 AO VIVO! - COPA PK ATIVADA 🔥',
    youtubeVideoId: 'U8C6EsuM_Gg',
    currentPkPoints: 0,
  },
  {
    id: 'creator-3',
    name: 'Nobru PK',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    channelName: 'NobruFF',
    subscribers: 5800000,
    isLive: false,
    liveTitle: 'X1 DOS CRIAS COM PRENDA DE R$ 500! VEM ASSISTIR',
    youtubeVideoId: 'S_C4h7zN-7g',
    currentPkPoints: 0,
  },
  {
    id: 'creator-4',
    name: 'Alanzoka Live',
    avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150',
    channelName: 'AlanzokaGamer',
    subscribers: 2800000,
    isLive: true,
    liveTitle: 'GAMEPLAY DE TERROR PS5 + DESAFIO PK DA NOITE 👻',
    youtubeVideoId: 'm79Hh_f0R7o',
    currentPkPoints: 0,
  },
  {
    id: 'creator-5',
    name: 'Loud Coringa',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    channelName: 'CoringaLoud',
    subscribers: 4100000,
    isLive: false,
    currentPkPoints: 0,
  }
];

// Catálogo oficial de presentes PK cadastrados no Backend
export const GLOBAL_GIFTS: Gift[] = [
  {
    id: 'gift-heart',
    name: 'Coração',
    coinValue: 10,
    icon: '❤️',
    color: 'from-pink-500 to-rose-550',
    pkPointsBonus: 10,
    animationType: 'pop',
    rarity: 'comum',
    description: 'Coração simples para apoiar seu criador!'
  },
  {
    id: 'gift-rocket',
    name: 'Foguete',
    coinValue: 50,
    icon: '🚀',
    color: 'from-indigo-600 to-blue-500',
    pkPointsBonus: 50,
    animationType: 'rocket',
    rarity: 'raro',
    description: 'Foguete potente para turbinar os pontos!'
  },
  {
    id: 'gift-dragon',
    name: 'Dragão',
    coinValue: 200,
    icon: '🐉',
    color: 'from-red-600 to-amber-600',
    pkPointsBonus: 200,
    animationType: 'fireworks',
    rarity: 'épico',
    description: 'O místico dragão da vitória!'
  },
  {
    id: 'gift-crown',
    name: 'Coroa',
    coinValue: 500,
    icon: '👑',
    color: 'from-yellow-400 to-amber-500',
    pkPointsBonus: 500,
    animationType: 'sparkle',
    rarity: 'lendário',
    description: 'A Coroa Suprema de Rei do Combate!'
  },
  {
    id: 'gift-meteor',
    name: 'Meteoro',
    coinValue: 1000,
    icon: '☄️',
    color: 'from-purple-605 to-fuchsia-600',
    pkPointsBonus: 1000,
    animationType: 'meteor',
    rarity: 'mítico',
    description: 'Impacto meteórico fulminante no placar!'
  }
];

// Pacotes de moedas para compra na carteira do espectador
export const COIN_PACKS: MarketCoinPack[] = [
  { id: 'coins-pack-1', coins: 150, bonus: 0, priceBRL: 4.90 },
  { id: 'coins-pack-2', coins: 700, bonus: 50, priceBRL: 19.90, popular: true },
  { id: 'coins-pack-3', coins: 1500, bonus: 150, priceBRL: 39.90 },
  { id: 'coins-pack-4', coins: 4000, bonus: 500, priceBRL: 99.90 },
  { id: 'coins-pack-5', coins: 9000, bonus: 1200, priceBRL: 219.00 }
];

// Mensagens iniciais para simulação do chat próprio
export const MOCK_CHATS: ChatMessage[] = [
  { id: 'chat-1', senderName: 'GamerExcl', role: 'viewer', text: 'Boa noite rapazeada! Bora de PK hoje!', timestamp: '22:10' },
  { id: 'chat-2', senderName: 'Alice_S2', role: 'sponsor', text: 'Gau vai amassar o Casi nessa batalha kkkk', timestamp: '22:11' },
  { id: 'chat-3', senderName: 'FelipeModerador', role: 'moderator', text: 'Sejam bem-vindos! Respeito mútuo galera no chat!', timestamp: '22:11' },
  { id: 'chat-4', senderName: 'Drazen_Bot', role: 'viewer', text: 'Estou torcendo pelo Cazé, enviei um Fogo Sagrado!', timestamp: '22:12' }
];

// Convites iniciais pendentes de simulação
export const INITIAL_INVITES: PKInvite[] = [
  {
    id: 'invite-1',
    challenger: INITIAL_CREATORS[1], // Gaules
    target: INITIAL_CREATORS[0], // Casimiro
    durationMinutes: 5,
    selectedStake: 'Pagar 100 flexões ao vivo na câmera',
    status: 'pending'
  }
];

// Logs iniciais do painel de administração e moderação
export const INITIAL_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: 'log-1',
    type: 'setting_change',
    user: 'Sistema ArenaPK',
    details: 'Valor mínimo da taxa de saque atualizado para R$ 50,00.',
    timestamp: '2026-05-31 18:20:01',
    resolved: true
  },
  {
    id: 'log-2',
    type: 'report',
    user: 'UserDenun_89',
    details: 'Denúncia de chat ofensivo: Contas com palavras chulas na Arena #102.',
    timestamp: '2026-05-31 20:10:44',
    resolved: false
  },
  {
    id: 'log-3',
    type: 'warning',
    user: 'Suporte Moderador',
    details: 'Notificação de alerta enviada ao criador Loud Coringa por falta de imagem na câmera.',
    timestamp: '2026-05-31 21:05:00',
    resolved: true
  }
];

// Exemplos de frases aleatórias para simular o chat interativo
export const RANDOM_CHAT_PHRASES = [
  'Nossa cara, inacreditável essa batalha!',
  'BORA TIME RED!!!! METE COROA!',
  'FALTA POUCO PRO TIME AZUL LEVAR, SÓ 2 MINUTOS',
  'Acabei de carregar moedas aqui, vou mandar um presente gordo!',
  'Qual é a prenda do perdedor mesmo?',
  'Bora subir esse placar galera! Não vamos deixar eles passarem!',
  'Mandei super foguete 🚀🚀🚀🚀',
  'Gaules tá sem limites hoje kkkkk',
  'Cazé vai ter que pagar as flexões com certeza 😂',
  'ArenaPK facilitou demais, os dois players ficam perfeitos lado a lado!',
  'Rumo ao topo do ranking semanal!',
  'Cuidado com o tempo, o multiplicador de pontos PK vai ativar!'
];

export const RANDOM_NAMES = [
  'Renato_Play', 'BiaGamer', 'ThiagoSilva', 'PedroC_99', 'MarianaLive',
  'Kratos_BR', 'Sasa_Stream', 'Lucas_FF', 'Leandro_X', 'CrisGold',
  'Carol_D', 'Viny_NoLobby', 'Guilherme_PK', 'RafaSponsor'
];
