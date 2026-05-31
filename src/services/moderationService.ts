/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuditLog, ChatMessage } from '../types';

export interface ReportedMessage {
  id: string;
  senderName: string;
  text: string;
  roomId: string;
  timestamp: string;
  reason: string;
}

/**
 * Interface que define o contrato do serviço de Moderação e Auditoria de Segurança.
 */
export interface IModerationService {
  getForbiddenWords(): string[];
  saveForbiddenWords(words: string[]): void;
  getBannedUsers(): string[];
  saveBannedUsers(users: string[]): void;
  getReportedMessages(): ReportedMessage[];
  saveReportedMessages(msgs: ReportedMessage[]): void;
  getAuditLogs(): AuditLog[];
  saveAuditLogs(logs: AuditLog[]): void;
  isGiftsPaused(): boolean;
  setGiftsPaused(paused: boolean): void;
  getClosedRooms(): string[];
  closeRoom(roomId: string): void;
  addAuditLog(type: AuditLog['type'], details: string): void;
  addForbiddenWord(word: string): boolean;
  removeForbiddenWord(word: string): void;
  banUser(username: string): boolean;
  unbanUser(username: string): void;
  reportMessage(senderName: string, text: string, roomId: string, reason: string): ReportedMessage;
  dismissReport(reportId: string): void;
  checkAndSanitizeMessage(sender: string, text: string): { 
    valid: boolean; 
    reason?: 'empty' | 'banned_user' | 'spam' | 'forbidden_word'; 
    sanitizedText: string 
  };
}

/**
 * Motor autônomo de filtragem de toxicidade de chat, spam e moderação de transmissões.
 * 
 * COMUTADOR FUTURO DE PRODUÇÃO:
 * - Toda validação de spam, censura e moderação deve ser processada no servidor para fins de segurança:
 *   - `dismissReport` e `banUser` -> chamará `POST /api/moderation/users/:username/mute` ou `/delete`
 *   - `closeRoom` -> chamará `POST /api/moderation/rooms/:roomId/end`
 *   - `checkAndSanitizeMessage` -> as mensagens enviadas ao WebSocket passam por uma pipeline de validação automática.
 */
class ModerationService implements IModerationService {
  private STORAGE_KEY_AUDIT_LOGS = 'arenapk_audit_logs';
  private STORAGE_KEY_FORBIDDEN_WORDS = 'arenapk_forbidden_words';
  private STORAGE_KEY_BANNED_USERS = 'arenapk_banned_users';
  private STORAGE_KEY_REPORTED_MSGS = 'arenapk_reported_msgs';
  private STORAGE_KEY_GIFTS_PAUSED = 'arenapk_gifts_paused';
  private STORAGE_KEY_CLOSED_ROOMS = 'arenapk_closed_rooms';

  // In-memory message tracking to limit spam
  private lastMessageTimestamps: Record<string, number> = {};

  constructor() {
    this.initializeIfNeeded();
  }

  private initializeIfNeeded() {
    if (localStorage.getItem(this.STORAGE_KEY_FORBIDDEN_WORDS) === null) {
      const defaultWords = ['lixo', 'hacker', 'bot', 'vigarista', 'fraude', 'ladrão', 'fake', 'inútil', 'merda', 'bosta'];
      localStorage.setItem(this.STORAGE_KEY_FORBIDDEN_WORDS, JSON.stringify(defaultWords));
    }

    if (localStorage.getItem(this.STORAGE_KEY_BANNED_USERS) === null) {
      const defaultBanned = ['spammer_3000', 'angry_spectator'];
      localStorage.setItem(this.STORAGE_KEY_BANNED_USERS, JSON.stringify(defaultBanned));
    }

    if (localStorage.getItem(this.STORAGE_KEY_REPORTED_MSGS) === null) {
      const defaultReports: ReportedMessage[] = [
        {
          id: 'report-1',
          senderName: 'spammer_3000',
          text: 'Comprem moedas grátis no link hacker-bot.com!!',
          roomId: 'room-1',
          timestamp: '31/05/2026 21:55',
          reason: 'Spam comercial e links suspeitos'
        },
        {
          id: 'report-2',
          senderName: 'torcedor_esquentado',
          text: 'Nobru é muito ruim, mds que lixo',
          roomId: 'room-2',
          timestamp: '31/05/2026 22:04',
          reason: 'Palavra proibida'
        }
      ];
      localStorage.setItem(this.STORAGE_KEY_REPORTED_MSGS, JSON.stringify(defaultReports));
    }

    if (localStorage.getItem(this.STORAGE_KEY_AUDIT_LOGS) === null) {
      const defaultAudits: AuditLog[] = [
        {
          id: 'audit-1',
          type: 'moderator_action',
          details: 'Inicialização do motor de moderação de termos do chat própria da ArenaPK',
          timestamp: '31/05/2026 20:00'
        },
        {
          id: 'audit-2',
          type: 'report',
          details: 'Mensagem de spammer_3000 foi reportada por espectadores.',
          timestamp: '31/05/2026 21:55'
        }
      ];
      localStorage.setItem(this.STORAGE_KEY_AUDIT_LOGS, JSON.stringify(defaultAudits));
    }

    if (localStorage.getItem(this.STORAGE_KEY_GIFTS_PAUSED) === null) {
      localStorage.setItem(this.STORAGE_KEY_GIFTS_PAUSED, 'false');
    }

    if (localStorage.getItem(this.STORAGE_KEY_CLOSED_ROOMS) === null) {
      localStorage.setItem(this.STORAGE_KEY_CLOSED_ROOMS, JSON.stringify([]));
    }
  }

  public getForbiddenWords(): string[] {
    this.initializeIfNeeded();
    const raw = localStorage.getItem(this.STORAGE_KEY_FORBIDDEN_WORDS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveForbiddenWords(words: string[]) {
    localStorage.setItem(this.STORAGE_KEY_FORBIDDEN_WORDS, JSON.stringify(words));
  }

  public getBannedUsers(): string[] {
    this.initializeIfNeeded();
    const raw = localStorage.getItem(this.STORAGE_KEY_BANNED_USERS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveBannedUsers(users: string[]) {
    localStorage.setItem(this.STORAGE_KEY_BANNED_USERS, JSON.stringify(users));
  }

  public getReportedMessages(): ReportedMessage[] {
    this.initializeIfNeeded();
    const raw = localStorage.getItem(this.STORAGE_KEY_REPORTED_MSGS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveReportedMessages(msgs: ReportedMessage[]) {
    localStorage.setItem(this.STORAGE_KEY_REPORTED_MSGS, JSON.stringify(msgs));
  }

  public getAuditLogs(): AuditLog[] {
    this.initializeIfNeeded();
    const raw = localStorage.getItem(this.STORAGE_KEY_AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  }

  public saveAuditLogs(logs: AuditLog[]) {
    localStorage.setItem(this.STORAGE_KEY_AUDIT_LOGS, JSON.stringify(logs));
  }

  public isGiftsPaused(): boolean {
    this.initializeIfNeeded();
    return localStorage.getItem(this.STORAGE_KEY_GIFTS_PAUSED) === 'true';
  }

  public setGiftsPaused(paused: boolean) {
    localStorage.setItem(this.STORAGE_KEY_GIFTS_PAUSED, paused ? 'true' : 'false');
    this.addAuditLog('pause_gifts', `O envio de presentes na plataforma foi ${paused ? 'PAUSADO' : 'RETOMADO/ATIVADO'} pelo administrador.`);
  }

  public getClosedRooms(): string[] {
    this.initializeIfNeeded();
    const raw = localStorage.getItem(this.STORAGE_KEY_CLOSED_ROOMS);
    return raw ? JSON.parse(raw) : [];
  }

  public closeRoom(roomId: string) {
    const list = this.getClosedRooms();
    if (!list.includes(roomId)) {
      list.push(roomId);
      localStorage.setItem(this.STORAGE_KEY_CLOSED_ROOMS, JSON.stringify(list));
      this.addAuditLog('close_room', `A sala com ID ${roomId} foi sumariamente ENCERRADA pelo administrador.`);
    }
  }

  public addAuditLog(type: AuditLog['type'], details: string) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      type,
      details,
      timestamp: new Date().toLocaleString('pt-BR')
    };
    logs.unshift(newLog);
    this.saveAuditLogs(logs.slice(0, 500)); // Cap logs at 500
  }

  public addForbiddenWord(word: string): boolean {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return false;
    const words = this.getForbiddenWords();
    if (words.includes(trimmed)) return false;
    words.push(trimmed);
    this.saveForbiddenWords(words);
    this.addAuditLog('moderator_action', `Adicionado termo bloqueado: "${trimmed}"`);
    return true;
  }

  public removeForbiddenWord(word: string) {
    const trimmed = word.trim().toLowerCase();
    const words = this.getForbiddenWords();
    const filtered = words.filter(w => w !== trimmed);
    this.saveForbiddenWords(filtered);
    this.addAuditLog('moderator_action', `Removido termo bloqueado: "${trimmed}"`);
  }

  public banUser(username: string): boolean {
    const name = username.trim();
    if (!name) return false;
    const banned = this.getBannedUsers();
    if (banned.includes(name)) return false;
    banned.push(name);
    this.saveBannedUsers(banned);
    this.addAuditLog('ban_user', `O usuário "${name}" foi BLOQUEADO/BANIDO da plataforma pelo administrador.`);
    return true;
  }

  public unbanUser(username: string) {
    const name = username.trim();
    const banned = this.getBannedUsers();
    const filtered = banned.filter(u => u !== name);
    this.saveBannedUsers(filtered);
    this.addAuditLog('moderator_action', `O usuário "${name}" foi DESBLOQUEADO.`);
  }

  public reportMessage(senderName: string, text: string, roomId: string, reason: string): ReportedMessage {
    const reports = this.getReportedMessages();
    const newReport: ReportedMessage = {
      id: `report-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderName,
      text,
      roomId,
      timestamp: new Date().toLocaleString('pt-BR'),
      reason
    };
    reports.unshift(newReport);
    this.saveReportedMessages(reports);
    this.addAuditLog('report', `Mensagem de "${senderName}" reportada: "${text.substring(0, 40)}" (Motivo: ${reason})`);
    return newReport;
  }

  public dismissReport(reportId: string) {
    const reports = this.getReportedMessages();
    const filtered = reports.filter(r => r.id !== reportId);
    this.saveReportedMessages(filtered);
    this.addAuditLog('moderator_action', `Denúncia ID ${reportId} foi arquivada pelo administrador.`);
  }

  public checkAndSanitizeMessage(sender: string, text: string): { 
    valid: boolean; 
    reason?: 'empty' | 'banned_user' | 'spam' | 'forbidden_word'; 
    sanitizedText: string 
  } {
    const trimmed = text.trim();
    if (!trimmed) {
      return { valid: false, reason: 'empty', sanitizedText: '' };
    }

    const banned = this.getBannedUsers();
    if (banned.some(u => u.toLowerCase() === sender.toLowerCase())) {
      return { valid: false, reason: 'banned_user', sanitizedText: trimmed };
    }

    const now = Date.now();
    const lastTime = this.lastMessageTimestamps[sender] || 0;
    if (now - lastTime < 450) {
      return { valid: false, reason: 'spam', sanitizedText: trimmed };
    }
    this.lastMessageTimestamps[sender] = now;

    const words = this.getForbiddenWords();
    let hasForbidden = false;
    let censored = trimmed;

    words.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(censored)) {
        hasForbidden = true;
        censored = censored.replace(regex, '***');
      }
    });

    if (hasForbidden) {
      return { valid: true, reason: 'forbidden_word', sanitizedText: censored };
    }

    return { valid: true, sanitizedText: trimmed };
  }
}

export const moderationService = new ModerationService();
