/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarketCoinPack, Gift } from '../types';

export interface GiftTransaction {
  id: string;
  senderName: string;
  creatorName: string;
  giftName: string;
  giftIcon: string;
  coinValue: number;
  pkPoints: number;
  timestamp: string;
  direction: 'sent' | 'received';
}

/**
 * Interface que define o contrato do serviço financeiro de transações.
 */
export interface IPaymentService {
  getTopSponsors(): any[];
  updateSpectatorSpend(coins: number): void;
  createCheckout(pack: MarketCoinPack, method: 'pix' | 'cc'): Promise<{ success: boolean; checkoutId: string; amount: number; coins: number }>;
  confirmPayment(checkoutId: string, coinsAdded: number): Promise<{ success: boolean; coinsAdded: number }>;
  getWallet(): any;
  debitCoins(amount: number, details: { creatorName: string; gift: Gift }): { success: boolean; currentCoins: number };
  creditCreatorBalance(amountBRL: number): number;
  getCoins(): number;
  setCoins(val: number): void;
  getEarnings(): number;
  setEarnings(val: number): void;
  getSentTransactions(): GiftTransaction[];
  getReceivedTransactions(): GiftTransaction[];
  registerIncomingGift(senderName: string, gift: Gift): void;
}

/**
 * Serviço de pagamentos com simuladores robustos de recarga via gateway.
 * 
 * COMUTADOR FUTURO DE PRODUÇÃO:
 * - Integrado ao gateway financeiro Pix / Cartão no backend:
 *   - `createCheckout` -> `POST /api/wallet/checkout`
 *   - `getWallet` -> `GET /api/wallet`
 *   - `debitCoins` -> `POST /api/gifts/send`
 */
class PaymentService implements IPaymentService {
  private STORAGE_KEY_COINS = 'arenapk_user_coins';
  private STORAGE_KEY_EARNINGS = 'arenapk_creator_earnings';
  private STORAGE_KEY_TX_SENT = 'arenapk_tx_sent';
  private STORAGE_KEY_TX_RECEIVED = 'arenapk_tx_received';

  constructor() {
    if (localStorage.getItem(this.STORAGE_KEY_COINS) === null) {
      localStorage.setItem(this.STORAGE_KEY_COINS, '2500');
    }
    if (localStorage.getItem(this.STORAGE_KEY_EARNINGS) === null) {
      localStorage.setItem(this.STORAGE_KEY_EARNINGS, '745.20');
    }
    if (localStorage.getItem(this.STORAGE_KEY_TX_SENT) === null) {
      const defaultSent: GiftTransaction[] = [
        {
          id: 'tx-s-101',
          senderName: 'Você (Super Doador)',
          creatorName: 'Casimiro Play',
          giftName: 'Foguete',
          giftIcon: '🚀',
          coinValue: 50,
          pkPoints: 50,
          timestamp: '31/05/2026 21:04',
          direction: 'sent'
        },
        {
          id: 'tx-s-102',
          senderName: 'Você (Super Doador)',
          creatorName: 'Gaules Arena',
          giftName: 'Coração',
          giftIcon: '❤️',
          coinValue: 10,
          pkPoints: 10,
          timestamp: '31/05/2026 19:40',
          direction: 'sent'
        }
      ];
      localStorage.setItem(this.STORAGE_KEY_TX_SENT, JSON.stringify(defaultSent));
    }
    if (localStorage.getItem(this.STORAGE_KEY_TX_RECEIVED) === null) {
      const defaultReceived: GiftTransaction[] = [
        {
          id: 'tx-r-201',
          senderName: 'Elenilton Barreto',
          creatorName: 'Seu Canal',
          giftName: 'Coroa',
          giftIcon: '👑',
          coinValue: 500,
          pkPoints: 500,
          timestamp: '31/05/2026 21:30',
          direction: 'received'
        },
        {
          id: 'tx-r-202',
          senderName: 'Carol_Patrocínio',
          creatorName: 'Seu Canal',
          giftName: 'Dragão',
          giftIcon: '🐉',
          coinValue: 200,
          pkPoints: 200,
          timestamp: '31/05/2026 20:15',
          direction: 'received'
        }
      ];
      localStorage.setItem(this.STORAGE_KEY_TX_RECEIVED, JSON.stringify(defaultReceived));
    }
    this.getTopSponsors();
  }

  public getTopSponsors() {
    const raw = localStorage.getItem('arenapk_top_sponsors');
    if (!raw) {
      const initial = [
        { name: 'Você (Super Doador)', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', spentCoins: 70, badge: 'Apoiador Oficial' },
        { name: 'Elenilton Barreto', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', spentCoins: 75200, badge: 'Lenda PK' },
        { name: 'Gamer_Pro_SP', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100', spentCoins: 51000, badge: 'Sponsor Ouro' },
        { name: 'Alice_Silveira', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', spentCoins: 39500, badge: 'Apoiadora Estelar' },
        { name: 'Vinicios FF', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', spentCoins: 21000, badge: 'Doador Prime' },
        { name: 'Carol_Duartez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', spentCoins: 15400, badge: 'Clan Gifty' },
      ];
      localStorage.setItem('arenapk_top_sponsors', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  }

  public updateSpectatorSpend(coins: number) {
    const sponsors = this.getTopSponsors();
    const userSponsor = sponsors.find((s: any) => s.name.includes('Você'));
    if (userSponsor) {
      userSponsor.spentCoins += coins;
      if (userSponsor.spentCoins >= 10000) {
        userSponsor.badge = 'Lenda PK Mítica';
      } else if (userSponsor.spentCoins >= 5000) {
        userSponsor.badge = 'Apoiador Supremo';
      } else if (userSponsor.spentCoins >= 1000) {
        userSponsor.badge = 'Torcedor Estelar';
      } else if (userSponsor.spentCoins >= 500) {
        userSponsor.badge = 'Clã Coroa de Ouro';
      } else if (userSponsor.spentCoins >= 100) {
        userSponsor.badge = 'Doador Elite';
      }
    }
    localStorage.setItem('arenapk_top_sponsors', JSON.stringify(sponsors));
  }

  public async createCheckout(pack: MarketCoinPack, method: 'pix' | 'cc'): Promise<{ success: boolean; checkoutId: string; amount: number; coins: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          checkoutId: `check-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`,
          amount: pack.priceBRL,
          coins: pack.coins + pack.bonus
        });
      }, 300);
    });
  }

  public async confirmPayment(checkoutId: string, coinsAdded: number): Promise<{ success: boolean; coinsAdded: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentCoins = this.getCoins();
        this.setCoins(currentCoins + coinsAdded);
        resolve({
          success: true,
          coinsAdded: coinsAdded
        });
      }, 500);
    });
  }

  public getWallet() {
    return {
      coins: this.getCoins(),
      sentGifts: this.getSentTransactions(),
      receivedGifts: this.getReceivedTransactions(),
      creatorBalanceBRL: this.getEarnings()
    };
  }

  public debitCoins(amount: number, details: { creatorName: string; gift: Gift }): { success: boolean; currentCoins: number } {
    const current = this.getCoins();
    if (current < amount) {
      return { success: false, currentCoins: current };
    }

    const nextCoins = current - amount;
    this.setCoins(nextCoins);
    this.updateSpectatorSpend(amount);

    const newTx: GiftTransaction = {
      id: `tx-s-${Date.now()}`,
      senderName: 'Você (Super Doador)',
      creatorName: details.creatorName,
      giftName: details.gift.name,
      giftIcon: details.gift.icon,
      coinValue: details.gift.coinValue,
      pkPoints: details.gift.pkPointsBonus,
      timestamp: new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
      direction: 'sent'
    };

    const sentList = this.getSentTransactions();
    sentList.unshift(newTx);
    localStorage.setItem(this.STORAGE_KEY_TX_SENT, JSON.stringify(sentList.slice(0, 50)));

    const moneyShare = amount * 0.10;
    this.creditCreatorBalance(moneyShare);

    return { success: true, currentCoins: nextCoins };
  }

  public creditCreatorBalance(amountBRL: number): number {
    const current = this.getEarnings();
    const nextVal = current + amountBRL;
    this.setEarnings(nextVal);
    return nextVal;
  }

  public getCoins(): number {
    const raw = localStorage.getItem(this.STORAGE_KEY_COINS);
    return raw ? parseInt(raw, 10) : 2500;
  }

  public setCoins(val: number) {
    localStorage.setItem(this.STORAGE_KEY_COINS, val.toString());
  }

  public getEarnings(): number {
    const raw = localStorage.getItem(this.STORAGE_KEY_EARNINGS);
    return raw ? parseFloat(raw) : 745.20;
  }

  public setEarnings(val: number) {
    localStorage.setItem(this.STORAGE_KEY_EARNINGS, val.toFixed(2));
  }

  public getSentTransactions(): GiftTransaction[] {
    const raw = localStorage.getItem(this.STORAGE_KEY_TX_SENT);
    return raw ? JSON.parse(raw) : [];
  }

  public getReceivedTransactions(): GiftTransaction[] {
    const raw = localStorage.getItem(this.STORAGE_KEY_TX_RECEIVED);
    return raw ? JSON.parse(raw) : [];
  }

  public registerIncomingGift(senderName: string, gift: Gift) {
    const newTx: GiftTransaction = {
      id: `tx-r-${Date.now()}`,
      senderName,
      creatorName: 'Seu Canal',
      giftName: gift.name,
      giftIcon: gift.icon,
      coinValue: gift.coinValue,
      pkPoints: gift.pkPointsBonus,
      timestamp: new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
      direction: 'received'
    };

    const receivedList = this.getReceivedTransactions();
    receivedList.unshift(newTx);
    localStorage.setItem(this.STORAGE_KEY_TX_RECEIVED, JSON.stringify(receivedList.slice(0, 50)));
  }
}

export const paymentService = new PaymentService();
