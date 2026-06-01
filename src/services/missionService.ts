/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mission } from '../types';
import { auth } from './firebase';
import { firebaseService } from './firebaseService';

/**
 * Interface que define o contrato do serviço de Missões e Engajamento de Expectadores.
 */
export interface IMissionService {
  /**
   * Obtém a lista de missões ativas e seu respectivo progresso atual.
   */
  getMissions(): Promise<Mission[]>;

  /**
   * Promove o progresso de uma missão de forma controlada após ações do usuário.
   */
  progressMission(missionId: string, increment: number): Promise<{ success: boolean; nextProgress: number; status: 'pending' | 'completed' }>;
}

/**
 * Serviço de rastreamento de missões diárias com integração ao Firestore.
 */
class MissionService implements IMissionService {
  public async getMissions(): Promise<Mission[]> {
    const userId = auth.currentUser?.uid || 'usr-default';
    return firebaseService.getUserMissions(userId);
  }

  public async progressMission(missionId: string, increment: number): Promise<{ success: boolean; nextProgress: number; status: 'pending' | 'completed' }> {
    const userId = auth.currentUser?.uid || 'usr-default';
    const missions = await firebaseService.getUserMissions(userId);
    const target = missions.find((m) => m.id === missionId);

    if (!target) {
      return { success: false, nextProgress: 0, status: 'pending' };
    }

    const nextProgress = Math.min(100, target.progress + increment);
    const nextStatus = nextProgress >= 100 ? 'completed' : 'in_progress';

    await firebaseService.updateMissionProgress(userId, missionId, nextProgress, nextStatus);

    return {
      success: true,
      nextProgress,
      status: nextStatus === 'completed' ? 'completed' : 'pending'
    };
  }
}

export const missionService = new MissionService();

