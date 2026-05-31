/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mission } from '../types';
import { viewerService, ViewerMission } from './viewerService';

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
 * Serviço de rastreamento de missões diárias com integração ao motor modular de espectador.
 * 
 * COMUTADOR FUTURO DE PRODUÇÃO:
 * - Substituir manipulação interna por persistência de gamificação distribuível no backend:
 *   - `getMissions` -> `GET /api/missions`
 *   - `progressMission` -> `POST /api/missions/:id/progress`
 */
class MissionService implements IMissionService {
  public async getMissions(): Promise<Mission[]> {
    // FUTURO ENDPOINT REAL: GET /api/missions
    // Retorna as missões diárias e progresso salvas na tabela de conquistas do usuário.
    const viewerMissions = viewerService.getMissions();
    return viewerMissions.map((vm) => ({
      id: vm.id,
      title: vm.title,
      description: vm.description,
      xpReward: vm.xpReward,
      status: vm.status === 'completed' ? 'completed' : vm.status === 'in_progress' ? 'in_progress' : 'pending',
      progress: vm.progress
    }));
  }

  public async progressMission(missionId: string, increment: number): Promise<{ success: boolean; nextProgress: number; status: 'pending' | 'completed' }> {
    // FUTURO ENDPOINT REAL: POST /api/missions/:id/progress
    // Executado de forma isolada do client-side no backend seguro para evitar trapaças de XP.
    const missions = viewerService.getMissions();
    const targeted = missions.find((m) => m.id === missionId);
    
    if (!targeted) {
      return { success: false, nextProgress: 0, status: 'pending' };
    }

    const triggerAction = targeted.triggerAction;
    const res = viewerService.triggerMissionAction(triggerAction, increment);

    const updatedMissions = viewerService.getMissions();
    const resultMission = updatedMissions.find((m) => m.id === missionId)!;

    return {
      success: true,
      nextProgress: resultMission.progress,
      status: resultMission.status === 'completed' ? 'completed' : 'pending'
    };
  }
}

export const missionService = new MissionService();
