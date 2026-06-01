/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, 
  onSnapshot, query, where, orderBy, limit, increment, serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Creator, PKRoom, ChatMessage, User, Wallet, Transaction, Mission, AuditLog, Gift } from '../types';

/**
 * Service to manage centralized Firebase and Firestore transactions, synchronization,
 * and subscription listeners for ArenaPK YouTube.
 */
class FirebaseService {
  // ==========================================
  // USERS COLLECTION
  // ==========================================
  public async syncUser(user: User): Promise<User> {
    try {
      const userRef = doc(db, 'users', user.id);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          ...user,
          role: data.role || user.role,
          name: data.name || user.name,
          avatar: data.avatar || user.avatar,
        };
      } else {
        const newUserObj = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || '',
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newUserObj);
        return user;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
      return user;
    }
  }

  // ==========================================
  // CREATORS COLLECTION
  // ==========================================
  public async getCreators(): Promise<Creator[]> {
    try {
      const coll = collection(db, 'creators');
      const snap = await getDocs(coll);
      const list: Creator[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id,
          name: d.name,
          avatar: d.avatar,
          channelName: d.channelName,
          subscribers: d.viewers ? d.viewers * 10 : 154000,
          isLive: d.isOnline || false,
          liveTitle: d.liveTitle || '',
          youtubeVideoId: d.youtubeVideoId || '',
          currentPkPoints: d.points || 0
        });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'creators');
      return [];
    }
  }

  public subscribeToCreators(onUpdate: (creators: Creator[]) => void): () => void {
    const collRef = collection(db, 'creators');
    return onSnapshot(collRef, (snap) => {
      const list: Creator[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id,
          name: d.name,
          avatar: d.avatar,
          channelName: d.channelName,
          subscribers: d.viewers ? d.viewers * 10 : 154000,
          isLive: d.isOnline || false,
          liveTitle: d.liveTitle || '',
          youtubeVideoId: d.youtubeVideoId || '',
          currentPkPoints: d.points || 0
        });
      });
      onUpdate(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'creators');
    });
  }

  // ==========================================
  // PK ROOMS COLLECTION (Salas PK)
  // ==========================================
  public async getRoom(roomId: string): Promise<PKRoom | null> {
    try {
      const roomRef = doc(db, 'pkRooms', roomId);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        return snap.data() as PKRoom;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `pkRooms/${roomId}`);
      return null;
    }
  }

  public subscribeToPKRoom(roomId: string, onUpdate: (room: PKRoom | null) => void): () => void {
    const roomRef = doc(db, 'pkRooms', roomId);
    return onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as PKRoom);
      } else {
        onUpdate(null);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `pkRooms/${roomId}`);
    });
  }

  public async updateRoomScore(roomId: string, scoreA: number, scoreB: number): Promise<void> {
    try {
      const roomRef = doc(db, 'pkRooms', roomId);
      await updateDoc(roomRef, {
        scoreA,
        scoreB,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pkRooms/${roomId}`);
    }
  }

  // ==========================================
  // CHAT MESSAGES COLLECTION
  // ==========================================
  public async sendChatMessage(message: ChatMessage, roomId: string): Promise<void> {
    try {
      const msgRef = doc(db, 'chatMessages', message.id);
      await setDoc(msgRef, {
        id: message.id,
        senderName: message.senderName,
        senderAvatar: message.senderAvatar || '',
        role: message.role,
        text: message.text,
        roomId: roomId,
        timestamp: message.timestamp || new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chatMessages/${message.id}`);
    }
  }

  public subscribeToChatMessages(roomId: string, onUpdate: (messages: ChatMessage[]) => void): () => void {
    const q = query(
      collection(db, 'chatMessages'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    return onSnapshot(q, (snap) => {
      const messages: ChatMessage[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        messages.push({
          id: d.id,
          senderName: d.senderName,
          senderAvatar: d.senderAvatar,
          role: d.role,
          text: d.text,
          timestamp: d.timestamp,
          giftAttached: d.giftAttached
        });
      });
      onUpdate(messages);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `chatMessages (roomId: ${roomId})`);
    });
  }

  // ==========================================
  // GIFT EVENTS COLLECTION
  // ==========================================
  public async registerGiftEvent(giftEvent: {
    id: string;
    roomId: string;
    senderName: string;
    senderAvatar: string;
    giftName: string;
    giftIcon: string;
    coinValue: number;
    pkPointsBonus: number;
    isForCreatorA: boolean;
  }): Promise<void> {
    try {
      await setDoc(doc(db, 'giftEvents', giftEvent.id), {
        ...giftEvent,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `giftEvents/${giftEvent.id}`);
    }
  }

  public subscribeToGiftEvents(roomId: string, onUpdate: (events: any[]) => void): () => void {
    const q = query(
      collection(db, 'giftEvents'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    return onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      onUpdate(list.reverse()); // Keep oldest first for feed scroll
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `giftEvents (roomId: ${roomId})`);
    });
  }

  // ==========================================
  // WALLETS & TRANSACTIONS COLLECTION
  // ==========================================
  public async getWallet(userId: string): Promise<Wallet> {
    try {
      const walletRef = doc(db, 'wallets', `wallet-${userId}`);
      const snap = await getDoc(walletRef);
      if (snap.exists()) {
        const d = snap.data();
        return {
          id: d.id,
          userId: d.userId,
          coinsBalance: d.coinsBalance,
          earningsBRL: d.earningsBRL
        };
      } else {
        const defaultWallet: Wallet = {
          id: `wallet-${userId}`,
          userId: userId,
          coinsBalance: 1200, // Starter virtual coins
          earningsBRL: 150.00
        };
        await setDoc(walletRef, defaultWallet);
        return defaultWallet;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `wallets/wallet-${userId}`);
      return { id: `wallet-${userId}`, userId, coinsBalance: 0, earningsBRL: 0 };
    }
  }

  public async updateWalletBalance(userId: string, coinDelta: number, brlDelta: number): Promise<void> {
    try {
      const walletRef = doc(db, 'wallets', `wallet-${userId}`);
      await updateDoc(walletRef, {
        coinsBalance: increment(coinDelta),
        earningsBRL: increment(brlDelta)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `wallets/wallet-${userId}`);
    }
  }

  public async addTransaction(tx: {
    id: string;
    userId: string;
    type: 'purchase_coins' | 'debit_gift' | 'withdrawal';
    coinsAmount: number;
    brlAmount?: number;
    description: string;
  }): Promise<void> {
    try {
      await setDoc(doc(db, 'transactions', tx.id), {
        ...tx,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `transactions/${tx.id}`);
    }
  }

  public async getTransactions(userId: string): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const list: Transaction[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id,
          userId: d.userId,
          type: d.type,
          coinsAmount: d.coinsAmount,
          brlAmount: d.brlAmount,
          description: d.description,
          timestamp: d.timestamp
        });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'transactions');
      return [];
    }
  }

  // ==========================================
  // MISSIONS COLLECTION
  // ==========================================
  public async getUserMissions(userId: string): Promise<Mission[]> {
    try {
      const q = query(collection(db, 'missions'), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const missions: Mission[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          missions.push({
            id: d.id,
            title: d.title,
            description: d.description,
            xpReward: d.xpReward,
            status: d.status,
            progress: d.progress
          });
        });
        return missions;
      } else {
        // Bootstrap base user missions in Firestore
        const defaultMissions = [
          { id: 'm-1', title: 'Explorador VIP', description: 'Assistir a uma transmissão ao vivo', xpReward: 150, status: 'pending', progress: 0 },
          { id: 'm-2', title: 'Apoiador Fanático', description: 'Enviar um presente qualquer para seu streamer preferido', xpReward: 300, status: 'pending', progress: 0 },
          { id: 'm-3', title: 'Doador de Opiniões', description: 'Escrever pelo menos 5 comentários no chat', xpReward: 200, status: 'pending', progress: 0 }
        ];

        const savedMissions: Mission[] = [];
        for (const dm of defaultMissions) {
          const mId = `${userId}-${dm.id}`;
          await setDoc(doc(db, 'missions', mId), {
            id: dm.id,
            userId: userId,
            title: dm.title,
            description: dm.description,
            xpReward: dm.xpReward,
            status: dm.status,
            progress: dm.progress
          });
          savedMissions.push({
            id: dm.id,
            title: dm.title,
            description: dm.description,
            xpReward: dm.xpReward,
            status: dm.status as any,
            progress: dm.progress
          });
        }
        return savedMissions;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'missions');
      return [];
    }
  }

  public async updateMissionProgress(userId: string, missionId: string, progress: number, status: 'pending' | 'in_progress' | 'completed'): Promise<void> {
    try {
      const mId = `${userId}-${missionId}`;
      await updateDoc(doc(db, 'missions', mId), {
        progress,
        status
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `missions/${userId}-${missionId}`);
    }
  }

  // ==========================================
  // AUDIT LOGS COLLECTION
  // ==========================================
  public async logAuditEvent(event: {
    type: 'moderator_action' | 'report' | 'ban_user' | 'close_room' | 'pause_gifts';
    details: string;
  }): Promise<void> {
    try {
      const logId = `audit-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      await setDoc(doc(db, 'auditLogs', logId), {
        id: logId,
        type: event.type,
        details: event.details,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'auditLogs');
    }
  }

  // ==========================================
  // ATOMIC PK GIFT TRANSACTION
  // ==========================================
  public async sendGiftTransaction(
    userId: string,
    roomId: string,
    gift: Gift,
    isForCreatorA: boolean,
    senderName: string,
    senderAvatar: string
  ): Promise<{ success: boolean; coinsBalance: number; scoreA: number; scoreB: number }> {
    const walletRef = doc(db, 'wallets', `wallet-${userId}`);
    const roomRef = doc(db, 'pkRooms', roomId);
    const rankingSubRef = doc(db, 'pkRooms', roomId, 'ranking', 'current');
    const sponsorRankingRef = doc(db, 'pkRooms', roomId, 'ranking', userId);

    const eventId = `gift-event-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const chatMsgId = `chat-msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    const giftEventRef = doc(db, 'pkRooms', roomId, 'giftEvents', eventId);
    const chatMessageRef = doc(db, 'pkRooms', roomId, 'chatMessages', chatMsgId);

    try {
      const result = await runTransaction(db, async (transaction) => {
        // 1. Read User Wallet
        const walletSnap = await transaction.get(walletRef);
        let walletData = { id: `wallet-${userId}`, userId, coinsBalance: 1200, earningsBRL: 150 };
        if (walletSnap.exists()) {
          walletData = walletSnap.data() as any;
        }

        // 2. Validate Balance
        if (walletData.coinsBalance < gift.coinValue) {
          throw new Error('Insufficient coins balance');
        }

        // 3. Read PK Room
        const roomSnap = await transaction.get(roomRef);
        if (!roomSnap.exists()) {
          throw new Error('PK Room does not exist');
        }
        const roomData = roomSnap.data() as PKRoom;

        // 3b. Read Sponsor Ranking
        const sponsorRankingSnap = await transaction.get(sponsorRankingRef);
        let existingSponsorData = {
          senderId: userId,
          senderName,
          senderAvatar,
          totalCoinsSupported: 0,
          totalPointsSupported: 0
        };
        if (sponsorRankingSnap.exists()) {
          existingSponsorData = sponsorRankingSnap.data() as any;
        }

        // 4. Calculate updated scores & rankings
        const currentScoreA = roomData.scoreA || 0;
        const currentScoreB = roomData.scoreB || 0;
        const nextScoreA = isForCreatorA ? currentScoreA + gift.pkPointsBonus : currentScoreA;
        const nextScoreB = !isForCreatorA ? currentScoreB + gift.pkPointsBonus : currentScoreB;

        const isWinnerA = nextScoreA >= nextScoreB;
        const nextRanking = [
          { creatorId: roomData.creatorA.id, points: nextScoreA, rank: isWinnerA ? 1 : 2 },
          { creatorId: roomData.creatorB.id, points: nextScoreB, rank: isWinnerA ? 2 : 1 }
        ];

        // 5. Update wallet coins balance
        const nextCoins = walletData.coinsBalance - gift.coinValue;
        transaction.set(walletRef, {
          ...walletData,
          coinsBalance: nextCoins
        }, { merge: true });

        // 6. Update general room score and ranking fields
        transaction.update(roomRef, {
          scoreA: nextScoreA,
          scoreB: nextScoreB,
          ranking: nextRanking,
          updatedAt: new Date().toISOString()
        });

        // 7. Write to ranking subcollection document
        transaction.set(rankingSubRef, {
          entries: [
            { creatorId: roomData.creatorA.id, creatorName: roomData.creatorA.name, points: nextScoreA, rank: isWinnerA ? 1 : 2 },
            { creatorId: roomData.creatorB.id, creatorName: roomData.creatorB.name, points: nextScoreB, rank: isWinnerA ? 2 : 1 }
          ],
          updatedAt: new Date().toISOString()
        });

        // 7b. Write sponsor ranking under pkRooms/{roomId}/ranking/{senderId}
        const nextSponsorCoins = (existingSponsorData.totalCoinsSupported || 0) + gift.coinValue;
        const nextSponsorPoints = (existingSponsorData.totalPointsSupported || 0) + gift.pkPointsBonus;
        transaction.set(sponsorRankingRef, {
          senderId: userId,
          senderName,
          senderAvatar,
          totalCoinsSupported: nextSponsorCoins,
          totalPointsSupported: nextSponsorPoints,
          updatedAt: new Date().toISOString()
        });

        // 8. Write the atomic giftEvent inside subcollection with strict future Studio contract fields
        transaction.set(giftEventRef, {
          id: eventId,
          roomId,
          isForCreatorA, // Keep for backward compatibility
          targetCreatorId: isForCreatorA ? roomData.creatorA.id : roomData.creatorB.id,
          targetSide: isForCreatorA ? "A" : "B",
          senderId: userId,
          senderName,
          senderAvatar,
          giftId: gift.id,
          giftName: gift.name,
          giftIcon: gift.icon,
          coinValue: gift.coinValue,
          pkPointsBonus: gift.pkPointsBonus,
          animationType: gift.animationType,
          studioDeliveryStatus: "pending",
          createdAt: new Date().toISOString(),
          timestamp: new Date().toISOString(), // Keep timestamp for backward compatibility
          deliveredAt: null,
          renderedAt: null,
          failureReason: null
        });

        // 9. Write the automatic message into chatMessages subcollection
        transaction.set(chatMessageRef, {
          id: chatMsgId,
          roomId,
          senderId: userId,
          senderName,
          senderAvatar,
          role: 'sponsor',
          type: 'gift',
          text: `Enviou ${gift.name} ${gift.icon}! (+${gift.pkPointsBonus.toLocaleString()} pts de PK)`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString(),
          giftAttached: {
            giftName: gift.name,
            giftIcon: gift.icon,
            count: 1
          }
        });

        // 10. Record ledger history transactional event for client history
        const txId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const txRef = doc(db, 'transactions', txId);
        transaction.set(txRef, {
          id: txId,
          userId,
          type: 'debit_gift',
          coinsAmount: gift.coinValue,
          description: `Presente "${gift.name} ${gift.icon}" enviado para ${isForCreatorA ? roomData.creatorA.name : roomData.creatorB.name}`,
          timestamp: new Date().toISOString()
        });

        return {
          coinsBalance: nextCoins,
          scoreA: nextScoreA,
          scoreB: nextScoreB
        };
      });

      return {
        success: true,
        ...result
      };
    } catch (err: any) {
      console.error('[FirebaseService] Transaction error:', err);
      return {
        success: false,
        coinsBalance: 0,
        scoreA: 0,
        scoreB: 0
      };
    }
  }

  // ==========================================
  // ARENAPK STUDIO CONVERSIONS & STATUS MANAGEMENT
  // ==========================================
  public async markGiftDeliveredToStudio(roomId: string, giftEventId: string): Promise<void> {
    try {
      const ref = doc(db, 'pkRooms', roomId, 'giftEvents', giftEventId);
      await updateDoc(ref, {
        studioDeliveryStatus: 'delivered_to_studio',
        deliveredAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pkRooms/${roomId}/giftEvents/${giftEventId}`);
    }
  }

  public async markGiftRenderedByStudio(roomId: string, giftEventId: string): Promise<void> {
    try {
      const ref = doc(db, 'pkRooms', roomId, 'giftEvents', giftEventId);
      await updateDoc(ref, {
        studioDeliveryStatus: 'rendered',
        renderedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pkRooms/${roomId}/giftEvents/${giftEventId}`);
    }
  }

  public async markGiftFailedForStudio(roomId: string, giftEventId: string, reason: string): Promise<void> {
    try {
      const ref = doc(db, 'pkRooms', roomId, 'giftEvents', giftEventId);
      await updateDoc(ref, {
        studioDeliveryStatus: 'failed',
        failureReason: reason,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pkRooms/${roomId}/giftEvents/${giftEventId}`);
    }
  }
}

export const firebaseService = new FirebaseService();
