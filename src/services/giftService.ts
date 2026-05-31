/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Gift } from '../types';
import { GLOBAL_GIFTS } from './pkService';

/**
 * Interface que define o contrato do catálogo e envio de Presentes interativos.
 */
export interface IGiftService {
  /**
   * Obtém o catálogo atualizado de presentes disponíveis na plataforma.
   */
  getGiftCatalog(): Promise<Gift[]>;

  /**
   * Envia um presente na sala ativa debitando os fundos do espectador.
   * Conecta-se à lógica financeira e de realtime no backend.
   */
  sendGift(payload: {
    giftId: string;
    roomId: string;
    recipientCreatorId: string;
  }): Promise<{ success: boolean; transactionId: string; remainingCoins: number }>;
}

/**
 * Serviço de Presentes com dados consolidados e simulações de compra/recompensa.
 * 
 * COMUTADOR FUTURO DE PRODUÇÃO:
 * - Direcionar chamadas diretamente para o backend Node.js:
 *   - `getGiftCatalog` -> `GET /api/gifts/catalog`
 *   - `sendGift` -> `POST /api/gifts/send`
 */
class GiftService implements IGiftService {
  public async getGiftCatalog(): Promise<Gift[]> {
    // FUTURO ENDPOINT REAL: GET /api/gifts/catalog
    // O backend retorna os preços (em moedas) e as regras de multiplicação de pontos PK de cada de presente.
    return GLOBAL_GIFTS;
  }

  public async sendGift(payload: {
    giftId: string;
    roomId: string;
    recipientCreatorId: string;
  }): Promise<{ success: boolean; transactionId: string; remainingCoins: number }> {
    // FUTURO ENDPOINT REAL: POST /api/gifts/send
    // O servidor processará atomicamente o débito da carteira e notificará instantaneamente
    // todos os clientes conectados na sala via WebSocket.
    await new Promise((resolve) => setTimeout(resolve, 350));
    
    const gift = GLOBAL_GIFTS.find((g) => g.id === payload.giftId) || GLOBAL_GIFTS[0];
    console.log(`[GiftService] Enviado ${gift.name} ${gift.icon} na sala ${payload.roomId} para ${payload.recipientCreatorId}`);

    return {
      success: true,
      transactionId: `gift-tx-${Date.now()}`,
      remainingCoins: 2150 // Mock de retorno de moedas
    };
  }
}

export const giftService = new GiftService();
