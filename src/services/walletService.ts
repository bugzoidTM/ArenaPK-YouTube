/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Wallet, Transaction } from '../types';
import { auth } from './firebase';
import { firebaseService } from './firebaseService';

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
 * Serviço financeiro com integração no Firebase Firestore.
 */
class WalletService implements IWalletService {
  public async getWalletState(): Promise<Wallet> {
    const userId = auth.currentUser?.uid || 'usr-default';
    return firebaseService.getWallet(userId);
  }

  public async createCheckout(packId: string, paymentMethod: 'pix' | 'cc'): Promise<{ checkoutId: string; amountBRL: number; qrcode?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    // Simulate buying coins and adding a transaction in Firestore
    const userId = auth.currentUser?.uid || 'usr-default';
    const txId = `tx-chk-${Date.now()}`;
    await firebaseService.addTransaction({
      id: txId,
      userId,
      type: 'purchase_coins',
      coinsAmount: 1000,
      brlAmount: 19.90,
      description: 'Compra de Pacote de 1000 Moedas via checkout de simulação'
    });
    
    // Increment wallet balance
    await firebaseService.updateWalletBalance(userId, 1000, 0);

    return {
      checkoutId: `check-${Date.now()}`,
      amountBRL: 19.90,
      qrcode: '00020101021226830014br.gov.bcb.pix520400005303986540519.905802BR5917ArenaPK_Pagamentos6009Sao_Paulo62070503***6304CA12'
    };
  }

  public async getTransactionHistory(): Promise<Transaction[]> {
    const userId = auth.currentUser?.uid || 'usr-default';
    return firebaseService.getTransactions(userId);
  }
}

export const walletService = new WalletService();

