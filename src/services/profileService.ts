import { LOGGER } from '../lib/logger';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || 'minha_chave_super_secreta';

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
};

export interface Me {
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  language?: 'pt-BR' | 'en-US' | 'es-ES';
  avatarUrl?: string | null;
  favoritesCount?: number;
  defaultIdTag?: string;
}

export class ProfileService {
  static async fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(t);
    }
  }

  static async getMe(): Promise<Me> {
    const url = `${API_BASE_URL}/v1/me`;
    const res = await this.fetchWithTimeout(url, { method: 'GET', headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static async logout(): Promise<void> {
    const url = `${API_BASE_URL}/v1/auth/logout`;
    try {
      await this.fetchWithTimeout(url, { method: 'POST', headers });
    } catch (e) {
      // If API not available, just log and continue
      LOGGER.API?.warn?.('Logout fallback used', { err: String(e) });
    }
  }

  static async updateLanguage(language: Me['language']): Promise<Me> {
    const url = `${API_BASE_URL}/v1/me`;
    const res = await this.fetchWithTimeout(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ language }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static async updatePhone(phone: string): Promise<Me> {
    const url = `${API_BASE_URL}/v1/me/phone`;
    const res = await this.fetchWithTimeout(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    const url = `${API_BASE_URL}/v1/me/password`;
    const res = await this.fetchWithTimeout(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
}

export default ProfileService;