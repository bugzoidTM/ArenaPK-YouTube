/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Wallet, Transaction, MarketCoinPack } from '../types';
import { paymentService } from './paymentService';

/**
 * Interface que define o contrato de gerenciamento financeiro de Carteiras e Transações.
 */
export interface IWalletService {
  /**
   * Obtém a carteira consolidada do usuário atual contendo moedas e recebimentos de criador.
   */
  getWalletState(): Promise<Wallet>;

  /**
   * Inicia o fluxo de pagamento para aquisição de moedas (geração de Pix, boleto ou cartão).
   */
  createCheckout(packId: string, paymentMethod: 'pix' | 'cc'): Promise<{ checkoutId: string; amountBRL: number; qrcode?: string }>;

  /**
   * Retorna o histórico consolidado de transações monetárias ou de envio de presentes.
   */
  getTransactionHistory(): Promise<Transaction[]>;
}

/**
 * Serviço financeiro com mocks baseados no paymentService local e persistência local segura.
 * 
 * COMUTADOR FUTURO DE PRODUÇÃO:
 * - Operações delegadas a um gateway financeiro parceiro (ex: Asaas, Stripe, PagSeguro) através do backend:
 *   - `getWalletState` -> `GET /api/wallet`
 *   - `createCheckout` -> `POST /api/wallet/checkout`
 *   - `getTransactionHistory` -> `GET /api/wallet/transactions`
 */
class WalletService implements IWalletService {
  public async getWalletState(): Promise<Wallet> {
    // FUTURO ENDPOINT REAL: GET /api/wallet
    // Retorna saldo sincronizado diretamente da tabela SQL de carteiras.
    const coins = paymentService.getCoins();
    const earnings = paymentService.getEarnings();
    return {
      id: 'wallet-default',
      userId: 'usr-default',
      coinsBalance: coins,
      earningsBRL: earnings
    };
  }

  public async createCheckout(packId: string, paymentMethod: 'pix' | 'cc'): Promise<{ checkoutId: string; amountBRL: number; qrcode?: string }> {
    // FUTURO ENDPOINT REAL: POST /api/wallet/checkout
    // Geração dinâmica de Chave Copia e Cola Pix ou link de processamento transparente de cartão.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      checkoutId: `check-${Date.now()}`,
      amountBRL: 19.90,
      qrcode: '00020101021226830014br.gov.bcb.pix520400005303986540519.905802BR5917ArenaPK_Pagamentos6009Sao_Paulo62070503***6304CA12'
    };
  }

  public async getTransactionHistory(): Promise<Transaction[]> {
    // FUTURO ENDPOINT REAL: GET /api/wallet/transactions
    // Recupera toda o livro-caixa/ledger histórico do banco de dados relacional.
    const sent = paymentService.getSentTransactions();
    return sent.map((s, index) => ({
      id: s.id,
      userId: 'usr-default',
      type: 'debit_gift',
      coinsAmount: s.coinValue,
      description: `Presente "${s.giftName} ${s.giftIcon}" enviado para @${s.creatorName}`,
      timestamp: s.timestamp
    }));
  }
}

export const walletService = new WalletService();
