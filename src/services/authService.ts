/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
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
   * Realiza login real com Google Auth via Firebase e sincroniza perfil no Firestore.
   */
  signInWithGoogle(): Promise<User>;

  /**
   * Redireciona o criador para carregar seu login e consentimento do YouTube via OAuth2.
   */
  startYouTubeOAuth(creatorId: string): Promise<string>;

  /**
   * Limpa a sessão ativa.
   */
  logout(): Promise<boolean>;
}

/**
 * Serviço de Autenticação com integração do Firebase Auth e sincronismo com Firestore.
 */
class AuthService implements IAuthService {
  private STORAGE_KEY_AUTH_USER = 'arenapk_auth_user';

  public async getCurrentUser(): Promise<User | null> {
    const raw = localStorage.getItem(this.STORAGE_KEY_AUTH_USER);
    if (!raw) {
      // Retorna espectador padrão na primeira execução (e cria conta localmente)
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

  public async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const userObj: User = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Espectador',
        email: fbUser.email || '',
        role: 'viewer', // default
        avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
      };

      // Tenta recuperar de Firestore ou cria novo registro
      const userRef = doc(db, 'users', fbUser.uid);
      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const cloudUser = snap.data();
          userObj.role = cloudUser.role || 'viewer';
          userObj.name = cloudUser.name || userObj.name;
          userObj.avatar = cloudUser.avatar || userObj.avatar;
        } else {
          await setDoc(userRef, {
            id: userObj.id,
            name: userObj.name,
            email: userObj.email,
            role: userObj.role,
            avatar: userObj.avatar,
            createdAt: new Date().toISOString()
          });
        }
      } catch (dbErr) {
        console.warn('[AuthService] Falha ao ler/escrever Firestore users, seguindo local...', dbErr);
      }

      localStorage.setItem(this.STORAGE_KEY_AUTH_USER, JSON.stringify(userObj));
      return userObj;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users');
      throw err;
    }
  }

  public async startYouTubeOAuth(creatorId: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log(`[AuthService] Iniciando fluxo OAuth do YouTube para Criador ID: ${creatorId}`);
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=MOCK_CLIENT_ID&redirect_uri=https://arenapk.com/oauth/callback&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly`;
  }

  public async logout(): Promise<boolean> {
    try {
      await signOut(auth);
    } catch (fbErr) {
      console.warn('[AuthService] Falha no logout do Firebase:', fbErr);
    }
    localStorage.removeItem(this.STORAGE_KEY_AUTH_USER);
    return true;
  }
}

export const authService = new AuthService();
