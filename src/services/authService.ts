/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from '../types';

/**
 * Interface que define o contrato do serviço de Autenticação.
 */
export interface IAuthService {
  /**
   * Obtém o usuário atualmente autenticado na sessão.
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Redireciona o criador para carregar seu login e consentimento do YouTube via OAuth2.
   * Chaves e segredos de clientes ficam armazenados com exclusividade no backend.
   */
  startYouTubeOAuth(creatorId: string): Promise<string>;

  /**
   * Limpa a sessão ativa revogando os cookies HttpOnly locais.
   */
  logout(): Promise<boolean>;
}

/**
 * Serviço de Autenticação com implementação Mock de alta fidelidade respaldada pelo LocalStorage.
 * 
 * COMUTADOR FUTURO DE PRODUÇÃO:
 * - Chamadas locais direcionadas para os endpoints HTTP definidos em `API_CONTRACT.md`:
 *   - `getCurrentUser` chamará `GET /api/auth/me`
 *   - `startYouTubeOAuth` chamará `POST /api/auth/youtube/start`
 *   - `logout` chamará `POST /api/auth/logout`
 */
class AuthService implements IAuthService {
  private STORAGE_KEY_AUTH_USER = 'arenapk_auth_user';

  public async getCurrentUser(): Promise<User | null> {
    // FUTURO ENDPOINT REAL: GET /api/auth/me
    // Recupera informações da sessão ativa através de cookies segurosHttpOnly.
    const raw = localStorage.getItem(this.STORAGE_KEY_AUTH_USER);
    if (!raw) {
      // Retorna espectador padrão na primeira execução
      const defaultUser: User = {
        id: 'usr-default',
        name: 'Elenilton Barreto',
        email: 'eleniltonfreitas2009@gmail.com',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
      };
      localStorage.setItem(this.STORAGE_KEY_AUTH_USER, JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(raw);
  }

  public async startYouTubeOAuth(creatorId: string): Promise<string> {
    // FUTURO ENDPOINT REAL: POST /api/auth/youtube/start
    // O backend cria o redirecionamento com escopos "youtube.readonly" e solicitações de streaming
    // sem expor o Client Secret no frontend.
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log(`[AuthService] Iniciando fluxo OAuth do YouTube para Criador ID: ${creatorId}`);
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=MOCK_CLIENT_ID&redirect_uri=https://arenapk.com/oauth/callback&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly`;
  }

  public async logout(): Promise<boolean> {
    // FUTURO ENDPOINT REAL: POST /api/auth/logout
    // Destrói cookies do servidor e revoga tokens ativos.
    localStorage.removeItem(this.STORAGE_KEY_AUTH_USER);
    await new Promise((resolve) => setTimeout(resolve, 400));
    return true;
  }
}

export const authService = new AuthService();
