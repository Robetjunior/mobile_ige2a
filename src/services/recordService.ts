import { SessionsResponse, SessionSummary, PeriodMode } from '../types';
import { LOGGER } from '../lib/logger';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || 'minha_chave_super_secreta';

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
};

export class RecordService {
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

  static async retry<T>(fn: () => Promise<T>, retries = 3, baseDelayMs = 500): Promise<T> {
    let lastErr: any;
    for (let i = 0; i < retries; i++) {
      try {
        if (i > 0) {
          const delay = baseDelayMs * Math.pow(2, i - 1);
          await new Promise((r) => setTimeout(r, delay));
        }
        return await fn();
      } catch (err) {
        lastErr = err;
        LOGGER.API.warn('Retry attempt failed', { attempt: i + 1, err: String(err) });
      }
    }
    throw lastErr;
  }
  static async getUserSessions(
    userId: string,
    from: string,
    to: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<SessionsResponse> {
    try {
      const url = `${API_BASE_URL}/v1/users/${userId}/sessions`;
      const params = new URLSearchParams({
        from,
        to,
        page: page.toString(),
        pageSize: pageSize.toString(),
        sort: 'startedAt:desc',
      });

      const response = await this.fetchWithTimeout(`${url}?${params}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      LOGGER.API.error('Error fetching user sessions:', error);
      throw error;
    }
  }

  static async getSessionSummary(
    userId: string,
    granularity: 'day' | 'month',
    ref: string
  ): Promise<SessionSummary> {
    try {
      const url = `${API_BASE_URL}/v1/users/${userId}/sessions/summary`;
      const params = new URLSearchParams({
        granularity,
        ref,
      });

      const response = await this.fetchWithTimeout(`${url}?${params}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      LOGGER.API.error('Error fetching session summary:', error);
      throw error;
    }
  }

  static async getSessionDetail(sessionId: string) {
    try {
      const url = `${API_BASE_URL}/v1/sessions/${sessionId}`;
      
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      LOGGER.API.error('Error fetching session detail:', error);
      throw error;
    }
  }

  // Helper methods for date formatting
  static getDateRange(periodMode: PeriodMode, ref: string): { from: string; to: string } {
    if (periodMode === 'month') {
      // ref format: 'YYYY-MM'
      const [year, month] = ref.split('-');
      const from = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const to = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
      return { from, to };
    } else {
      // ref format: 'YYYY'
      const from = `${ref}-01-01`;
      const to = `${ref}-12-31`;
      return { from, to };
    }
  }

  static getGranularity(periodMode: PeriodMode): 'day' | 'month' {
    return periodMode === 'month' ? 'day' : 'month';
  }

  static getCurrentRef(periodMode: PeriodMode): string {
    const now = new Date();
    if (periodMode === 'month') {
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      return `${year}-${month}`;
    } else {
      return now.getFullYear().toString();
    }
  }
}