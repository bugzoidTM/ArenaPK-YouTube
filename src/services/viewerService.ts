/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ViewerMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  badgeReward?: string;
  status: 'pending' | 'completed' | 'in_progress';
  progress: number; // e.g. 0 to 100
  targetCount: number;
  currentCount: number;
  triggerAction: string;
}

export interface ViewerProfile {
  level: number;
  xp: number;
  xpToNextLevel: number;
  badges: Array<{ id: string; name: string; icon: string; description: string; dateUnlocked: string }>;
  weeklyRank: number;
  weeklyPoints: number;
  favorites: string[]; // Creator IDs
}

class ViewerService {
  private STORAGE_KEY_PROFILE = 'arenapk_viewer_profile';
  private STORAGE_KEY_MISSIONS = 'arenapk_viewer_missions';

  constructor() {
    this.initializeIfNeeded();
  }

  private initializeIfNeeded() {
    if (localStorage.getItem(this.STORAGE_KEY_PROFILE) === null) {
      const defaultProfile: ViewerProfile = {
        level: 3,
        xp: 450,
        xpToNextLevel: 1000,
        badges: [
          { id: 'badge-welcome', name: 'Primeiro Duelo', icon: '🐣', description: 'Entrou na plataforma Arenas PK', dateUnlocked: '28/05/2026' },
          { id: 'badge-copper', name: 'Bronze Gamer', icon: '🥉', description: 'Acumulou 1.000 pontos PK em doações', dateUnlocked: '30/05/2026' }
        ],
        weeklyRank: 12,
        weeklyPoints: 1450,
        favorites: ['creator-1', 'creator-4'] // Casimiro and Alanzoka
      };
      localStorage.setItem(this.STORAGE_KEY_PROFILE, JSON.stringify(defaultProfile));
    }

    if (localStorage.getItem(this.STORAGE_KEY_MISSIONS) === null) {
      const defaultMissions: ViewerMission[] = [
        {
          id: 'mission-watch',
          title: 'Explorador de Novidades',
          description: 'Assistir 3 minutos de uma live nova na aba de descoberta',
          xpReward: 300,
          badgeReward: '👀 Explorador VIP',
          status: 'pending',
          progress: 0,
          targetCount: 3,
          currentCount: 0,
          triggerAction: 'watch_minute'
        },
        {
          id: 'mission-comment',
          title: 'Engajamento no Ringue',
          description: 'Comentar em uma sala PK ativa via socket',
          xpReward: 150,
          badgeReward: '💬 Tagarela',
          status: 'pending',
          progress: 0,
          targetCount: 1,
          currentCount: 0,
          triggerAction: 'comment_pk'
        },
        {
          id: 'mission-gift',
          title: 'Primeiro Apoio do Dia',
          description: 'Enviar o primeiro presente do dia para qualquer criador',
          xpReward: 500,
          badgeReward: '🎁 Doador Generoso',
          status: 'pending',
          progress: 0,
          targetCount: 1,
          currentCount: 0,
          triggerAction: 'send_gift'
        },
        {
          id: 'mission-share',
          title: 'Divulgador Oficial',
          description: 'Compartilhar o link de uma sala com amigos',
          xpReward: 200,
          badgeReward: '🔥 Promotor PK',
          status: 'pending',
          progress: 0,
          targetCount: 1,
          currentCount: 0,
          triggerAction: 'share_room'
        },
        {
          id: 'mission-vote',
          title: 'Juiz de Confronto',
          description: 'Participar de uma votação de prenda ativa',
          xpReward: 250,
          badgeReward: '⚖️ Juiz da Arena',
          status: 'pending',
          progress: 0,
          targetCount: 1,
          currentCount: 0,
          triggerAction: 'vote_stake'
        },
        {
          id: 'mission-underdog',
          title: 'Apoio aos Pequenos',
          description: 'Entrar e apoiar uma live com menos de 10 espectadores',
          xpReward: 400,
          badgeReward: '🌟 Descobridor de Talentos',
          status: 'pending',
          progress: 0,
          targetCount: 1,
          currentCount: 0,
          triggerAction: 'underdog_view'
        }
      ];
      localStorage.setItem(this.STORAGE_KEY_MISSIONS, JSON.stringify(defaultMissions));
    }
  }

  public getProfile(): ViewerProfile {
    this.initializeIfNeeded();
    const raw = localStorage.getItem(this.STORAGE_KEY_PROFILE);
    return raw ? JSON.parse(raw) : { level: 1, xp: 0, xpToNextLevel: 500, badges: [], weeklyRank: 99, weeklyPoints: 0, favorites: [] };
  }

  public saveProfile(profile: ViewerProfile) {
    localStorage.setItem(this.STORAGE_KEY_PROFILE, JSON.stringify(profile));
  }

  public getMissions(): ViewerMission[] {
    this.initializeIfNeeded();
    const raw = localStorage.getItem(this.STORAGE_KEY_MISSIONS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveMissions(missions: ViewerMission[]) {
    localStorage.setItem(this.STORAGE_KEY_MISSIONS, JSON.stringify(missions));
  }

  /**
   * Action trigger core to progress or complete a mission
   */
  public triggerMissionAction(actionName: string, amount: number = 1): { CompletedMission: ViewerMission | null; XPAdded: number; LeveledUp: boolean } {
    const missions = this.getMissions();
    const profile = this.getProfile();
    let completedMission: ViewerMission | null = null;
    let xpAdded = 0;
    let leveledUp = false;

    const updatedMissions = missions.map(m => {
      if (m.triggerAction === actionName && m.status !== 'completed') {
        const nextCount = Math.min(m.currentCount + amount, m.targetCount);
        const progressPercent = Math.round((nextCount / m.targetCount) * 100);
        
        const isNowCompleted = nextCount >= m.targetCount;
        
        if (isNowCompleted) {
          completedMission = { ...m, currentCount: nextCount, progress: 100, status: 'completed' as const };
          xpAdded += m.xpReward;
          return completedMission;
        }

        return {
          ...m,
          currentCount: nextCount,
          progress: progressPercent,
          status: 'in_progress' as const
        };
      }
      return m;
    });

    if (xpAdded > 0) {
      profile.xp += xpAdded;
      profile.weeklyPoints += xpAdded;
      
      // Level up processing loop
      while (profile.xp >= profile.xpToNextLevel) {
        profile.xp -= profile.xpToNextLevel;
        profile.level += 1;
        profile.xpToNextLevel = Math.round(profile.xpToNextLevel * 1.2);
        leveledUp = true;
      }

      // Add badge reward if available inside the completed mission
      if (completedMission && (completedMission as ViewerMission).badgeReward) {
        const badgeName = (completedMission as ViewerMission).badgeReward!;
        const duplicate = profile.badges.some(b => b.name === badgeName);
        if (!duplicate) {
          profile.badges.push({
            id: `badge-${Date.now()}`,
            name: badgeName,
            icon: '🏆',
            description: (completedMission as ViewerMission).description,
            dateUnlocked: new Date().toLocaleDateString('pt-BR')
          });
        }
      }

      // Re-calculate mock weekly position to show dynamic feedback
      if (profile.weeklyRank > 1) {
        const rankImprovement = Math.floor(xpAdded / 100);
        profile.weeklyRank = Math.max(1, profile.weeklyRank - rankImprovement);
      }

      this.saveProfile(profile);
      this.saveMissions(updatedMissions);
    } else {
      this.saveMissions(updatedMissions);
    }

    return {
      CompletedMission: completedMission,
      XPAdded: xpAdded,
      LeveledUp: leveledUp
    };
  }

  /**
   * Toggle Creator validation as Favorite
   */
  public toggleFavorite(creatorId: string): boolean {
    const profile = this.getProfile();
    const isFav = profile.favorites.includes(creatorId);
    if (isFav) {
      profile.favorites = profile.favorites.filter(id => id !== creatorId);
    } else {
      profile.favorites.push(creatorId);
    }
    this.saveProfile(profile);
    return !isFav; // returns the new state
  }
}

export const viewerService = new ViewerService();
