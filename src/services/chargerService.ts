import { LOGGER } from '../lib/logger';
import { Station, OnlineChargerListResponse, OnlineChargerItem } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || 'minha_chave_super_secreta';

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
  // Ajuda a evitar 304 ao revalidar; aliado a cache: 'no-store'
  'Cache-Control': 'no-cache',
};

export interface ChargerDto {
  chargeBoxId: string;
  name?: string;
  status?: 'online' | 'offline' | 'busy';
  lat?: number;
  lon?: number;
  address?: string;
  powerKw?: number;
  ports?: number;
  pricePerKWh?: number;
}

export interface StartBillingBody {
  chargeBoxId: string;
  connectorId: number | string;
  idTag: string;
}

export interface CloseBillingBody {
  chargeBoxId: string;
  transactionId: string;
}

// Novos comandos OCPP
export interface RemoteStartBody {
  chargeBoxId: string;
  idTag: string;
  connectorId?: number | string;
}

export interface RemoteStopBody {
  transactionId: number | string;
}

interface OcppOnlineResponse {
  online: string[];
}

export class ChargerService {
  static ensureConfig() {
    if (!API_BASE) {
      LOGGER.API.warn('EXPO_PUBLIC_API_BASE_URL not set; defaulting to http://localhost:3000');
    }
    if (!API_KEY) {
      LOGGER.API.warn('EXPO_PUBLIC_API_KEY is empty; requests may be rejected by the API');
    }
  }

  static async getOcppOnlineIds(): Promise<string[]> {
    this.ensureConfig();
    const url = `${API_BASE}/v1/ocpp/online`;
    const isWeb = typeof window !== 'undefined' && typeof (window as any).document !== 'undefined';
    const headers: Record<string, string> = { 'Cache-Control': 'no-cache' };
    const attempts = 3;
    let lastErr: any = null;
    // Use only the original URL to respect CORS origin policies (no 127.0.0.1 fallback)
    const candidates: string[] = [url];

    for (const candidateUrl of candidates) {
      for (let i = 0; i < attempts; i++) {
        try {
          LOGGER.API.info('GET /v1/ocpp/online', { url: candidateUrl, attempt: i + 1 });
          // Keep request simple to avoid CORS preflight; include CORS mode for web only
          const res = await this.fetchWithTimeout(
            candidateUrl,
            {
              method: 'GET',
              headers,
              ...(isWeb ? ({ mode: 'cors' } as RequestInit) : {}),
            },
            15000
          );
          if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status} ${text}`);
          }
          const data: OcppOnlineResponse = await res.json();
          const ids = Array.isArray(data?.online) ? data.online : [];
          LOGGER.API.debug('OCPP online ids fetched', { count: ids.length, url: candidateUrl });
          return ids;
        } catch (err) {
          lastErr = err;
          // Exponential backoff per attempt: 1s, 2s, 3s
          const delayMs = 1000 * (i + 1);
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }

    LOGGER.API.error('getOcppOnlineIds failed after retries', lastErr);
    throw (lastErr instanceof Error ? lastErr : new Error(String(lastErr)));
  }

  static async getOnlineStationsNow(): Promise<Station[]> {
    const ids = await this.getOcppOnlineIds();
    if (!ids.length) return [];
    const results: Station[] = [];
    const chunkSize = 8;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const batch = await Promise.all(
        chunk.map((id) =>
          this.getChargerDetails(id).catch((e) => {
            LOGGER.API.warn('getChargerDetails failed for id', { id, err: String(e) });
            // Fallback mínimo para exibir o CP na lista
            const fallback: Station = {
              id,
              name: id,
              address: 'Informações indisponíveis',
              status: 'online',
              connectors: [],
              isFavorite: false,
            } as Station;
            return fallback as any;
          })
        )
      );
      results.push(...(batch.filter(Boolean) as Station[]));
    }
    LOGGER.API.debug('Online now stations resolved', { count: results.length });
    return results;
  }

  static async fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { cache: 'no-store', ...options, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(t);
    }
  }

  static mapDtoToStation(dto: ChargerDto): Station {
    return {
      id: dto.chargeBoxId,
      name: dto.name || dto.chargeBoxId,
      address: dto.address || 'Endereço indisponível',
      latitude: dto.lat as any, // pode estar ausente; tratado pelos consumidores
      longitude: dto.lon as any,
      status: (dto.status || 'offline') as Station['status'],
      connectors: [],
      distance: undefined,
      isFavorite: false,
      // campos extras opcionais ficam fora por ora
    };
  }

  static async getOnlineChargers(): Promise<Station[]> {
    this.ensureConfig();
    const url = `${API_BASE}/v1/chargers/online`;
    try {
      LOGGER.API.info('GET /v1/chargers/online', { baseUrl: API_BASE });
      const res = await this.fetchWithTimeout(url, { method: 'GET', headers });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      const data: ChargerDto[] = await res.json();
      LOGGER.API.debug('Online chargers fetched', { count: data?.length ?? 0 });
      return data.map(this.mapDtoToStation);
    } catch (err) {
      LOGGER.API.error('getOnlineChargers failed', err);
      throw err;
    }
  }

  static async getOnlineChargersRecent(sinceMinutes = 60, limit = 200): Promise<Station[]> {
    this.ensureConfig();
    const params = new URLSearchParams();
    params.set('sinceMinutes', String(sinceMinutes));
    params.set('limit', String(limit));
    const qs = params.toString();
    const url = `${API_BASE}/v1/chargers/online?${qs}`;
    try {
      LOGGER.API.info('GET /v1/chargers/online', { baseUrl: API_BASE, qs });
      const res = await this.fetchWithTimeout(url, { method: 'GET', headers });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      const data: ChargerDto[] = await res.json();
      LOGGER.API.debug('Online recent chargers fetched', { count: data?.length ?? 0, sinceMinutes, limit });
      return data.map(this.mapDtoToStation);
    } catch (err) {
      LOGGER.API.error('getOnlineChargersRecent failed', err);
      throw err;
    }
  }

  // New: fetch online chargers status list with required shape
  static async getOnlineStatusList(sinceMinutes = 15, limit = 50): Promise<OnlineChargerListResponse> {
    this.ensureConfig();
    const params = new URLSearchParams();
    params.set('sinceMinutes', String(sinceMinutes));
    params.set('limit', String(limit));
    const url = `${API_BASE}/v1/chargers/online?${params.toString()}`;
    try {
      LOGGER.API.info('GET /v1/chargers/online (status list)', { sinceMinutes, limit });
      const res = await this.fetchWithTimeout(url, { method: 'GET', headers });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      const data = await res.json();
      // If backend returns { items, count } as specified
      if (data && Array.isArray(data.items) && typeof data.count === 'number') {
        return data as OnlineChargerListResponse;
      }
      // Fallback: backend returned array directly
      const items: OnlineChargerItem[] = Array.isArray(data) ? data : [];
      return { items, count: items.length };
    } catch (err) {
      LOGGER.API.error('getOnlineStatusList failed', err);
      throw err;
    }
  }

  static async getChargers(lat?: number, lon?: number, radiusKm?: number): Promise<Station[]> {
    this.ensureConfig();
    const params = new URLSearchParams();
    if (typeof lat === 'number' && typeof lon === 'number') {
      params.set('lat', String(lat));
      params.set('lon', String(lon));
      if (radiusKm) params.set('radiusKm', String(radiusKm));
    }
    const qs = params.toString();
    const url = `${API_BASE}/v1/chargers${qs ? `?${qs}` : ''}`;
    try {
      LOGGER.API.info('GET /v1/chargers', { baseUrl: API_BASE, qs });
      const res = await this.fetchWithTimeout(url, { method: 'GET', headers });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      const data: ChargerDto[] = await res.json();
      LOGGER.API.debug('Chargers fetched', { count: data?.length ?? 0 });
      return data.map(this.mapDtoToStation);
    } catch (err) {
      LOGGER.API.error('getChargers failed', err);
      throw err;
    }
  }

  static async getChargerDetails(chargeBoxId: string): Promise<Station> {
    const url = `${API_BASE}/v1/chargers/${encodeURIComponent(chargeBoxId)}`;
    try {
      LOGGER.API.info('GET /v1/chargers/:id', { baseUrl: API_BASE, chargeBoxId });
      const res = await this.fetchWithTimeout(url, { method: 'GET', headers });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      const dto: ChargerDto = await res.json();
      return this.mapDtoToStation(dto);
    } catch (err) {
      LOGGER.API.error('getChargerDetails failed', err);
      throw err;
    }
  }

  static async startBilling(body: StartBillingBody) {
    const url = `${API_BASE}/v1/billing/start`;
    try {
      LOGGER.API.info('POST /v1/billing/start');
      const res = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      return await res.json();
    } catch (err) {
      LOGGER.API.error('startBilling failed', err);
      throw err;
    }
  }

  static async closeBilling(body: CloseBillingBody) {
    const url = `${API_BASE}/v1/billing/close`;
    try {
      LOGGER.API.info('POST /v1/billing/close');
      const res = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      return await res.json();
    } catch (err) {
      LOGGER.API.error('closeBilling failed', err);
      throw err;
    }
  }

  // OCPP commands
  static async remoteStart(body: RemoteStartBody, opts?: { force?: boolean }) {
    const n = body.connectorId != null ? Number(body.connectorId) : undefined;
    const payload: any = {
      chargeBoxId: body.chargeBoxId,
      idTag: String(body.idTag ?? ''),
    };
    if (Number.isFinite(n) && (n as number) > 0) payload.connectorId = Number(n);

    const url = `${API_BASE}/v1/commands/remoteStart${opts?.force ? '?force=1' : ''}`;
    try {
      LOGGER.API.info('POST /v1/commands/remoteStart', { force: !!opts?.force, payload });
      const res = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      // Mapear status HTTP para semântica de comando
      if (res.status === 409) {
        const message = data?.message || 'pending';
        LOGGER.API.info('remoteStart pending', { status: 409, message });
        return { status: 'pending', pending: true, ...data };
      }
      if (res.status === 200) {
        LOGGER.API.info('remoteStart idempotentDuplicate', { status: 200 });
        return { status: 'idempotentDuplicate', idempotentDuplicate: true, ...data };
      }
      if (res.status === 202) {
        LOGGER.API.info('remoteStart sent', { status: 202 });
        return { status: 'sent', sent: true, ...data };
      }
      if (!res.ok) {
        LOGGER.API.warn('remoteStart failed response', { status: res.status, data });
        const msg = (data && (data.error || data.message || data?.details?.[0]?.message)) || `HTTP ${res.status}`;
        throw new Error(String(msg));
      }
      return data;
    } catch (err) {
      LOGGER.API.error('remoteStart failed', err);
      throw err;
    }
  }

  static async remoteStop(body: RemoteStopBody) {
    const url = `${API_BASE}/v1/commands/remoteStop`;
    try {
      LOGGER.API.info('POST /v1/commands/remoteStop');
      const txn = body?.transactionId != null ? Number(body.transactionId) : undefined;
      const res = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ transactionId: txn }),
      });
      const data = await res.json().catch(() => null);
      // Mapear status HTTP para semântica de comando
      if (res.status === 409) {
        const message = data?.message || 'pending';
        LOGGER.API.info('remoteStop pending', { status: 409, message });
        return { status: 'pending', pending: true, ...data };
      }
      if (res.status === 200) {
        LOGGER.API.info('remoteStop idempotentDuplicate', { status: 200 });
        return { status: 'idempotentDuplicate', idempotentDuplicate: true, ...data };
      }
      if (res.status === 202) {
        LOGGER.API.info('remoteStop sent', { status: 202 });
        return { status: 'sent', sent: true, ...data };
      }
      if (!res.ok) {
        LOGGER.API.warn('remoteStop failed response', { status: res.status, data });
        const msg = (data && (data.error || data.message || data?.details?.[0]?.message)) || `HTTP ${res.status}`;
        throw new Error(String(msg));
      }
      return data;
    } catch (err) {
      LOGGER.API.error('remoteStop failed', err);
      throw err;
    }
  }

  // Assinatura SSE: fornece callback onEvent e retorna função para cancelar
  static subscribeSessionEndSse(chargeBoxId: string, onEvent: (payload: any) => void, opts?: { timeoutMs?: number }) {
    const isWeb = typeof window !== 'undefined' && typeof (window as any).document !== 'undefined';
    const timeoutMs = opts?.timeoutMs ?? 45000;
    const url = `${API_BASE}/v1/stream?apiKey=${encodeURIComponent(API_KEY)}&cbid=${encodeURIComponent(chargeBoxId)}&types=session-end`;

    let closed = false;
    let timer: any;

    // Ambiente web com EventSource
    const EventSourceImpl = (globalThis as any).EventSource;
    if (isWeb && EventSourceImpl) {
      const es = new EventSourceImpl(url);
      const handle = (ev: any) => {
        if (closed) return;
        try {
          const data = ev?.data ? JSON.parse(ev.data) : null;
          onEvent(data);
        } catch (e) {
          onEvent(null);
        }
      };
      es.addEventListener('session-end', handle);
      es.addEventListener('message', handle);
      es.onerror = (err: any) => {
        LOGGER.API.warn('SSE stream error', err);
      };
      timer = setTimeout(() => {
        if (!closed) {
          closed = true;
          es.close();
        }
      }, timeoutMs);
      return () => {
        if (closed) return;
        closed = true;
        clearTimeout(timer);
        es.close();
      };
    }

    // Fallback RN: NDJSON streaming
    let abortCtrl = new AbortController();
    (async () => {
      try {
        const ndjsonUrl = `${API_BASE}/v1/stream?apiKey=${encodeURIComponent(API_KEY)}&cbid=${encodeURIComponent(chargeBoxId)}&types=session-end&format=ndjson`;
        const res = await fetch(ndjsonUrl, { method: 'GET', headers, signal: abortCtrl.signal });
        const reader = res.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        timer = setTimeout(() => {
          try { abortCtrl.abort(); } catch {}
        }, timeoutMs);
        if (reader) {
          let buffer = '';
          while (!closed) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n');
            buffer = parts.pop() || '';
            for (const line of parts) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              try {
                const obj = JSON.parse(trimmed);
                onEvent(obj);
              } catch (e) {
                onEvent(null);
              }
            }
          }
        }
      } catch (err) {
        LOGGER.API.warn('NDJSON stream error', err);
      }
    })();
    return () => {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      try { abortCtrl.abort(); } catch {}
    };
  }

  static async getLastTransactionId(chargeBoxId: string): Promise<number | null> {
    const url = `${API_BASE}/v1/debug/ocpp/last-tx/${encodeURIComponent(chargeBoxId)}`;
    try {
      LOGGER.API.info('GET /v1/debug/ocpp/last-tx/:chargeBoxId', { chargeBoxId });
      const res = await this.fetchWithTimeout(url, { method: 'GET', headers });
      if (!res.ok) {
        return null;
      }
      const data = await res.json().catch(() => null);
      const tx = data?.transactionId ?? data?.transaction_id ?? null;
      return typeof tx === 'number' ? tx : tx != null ? Number(tx) : null;
    } catch (err) {
      LOGGER.API.warn('getLastTransactionId failed', err);
      return null;
    }
  }

  // Fallback: consulta lista de sessões e tenta identificar a sessão ativa
  static async getActiveTransactionIdFromList(chargeBoxId: string): Promise<number | null> {
    const params = new URLSearchParams();
    params.set('charge_box_id', String(chargeBoxId));
    const url = `${API_BASE}/v1/sessions?${params.toString()}`;
    try {
      LOGGER.API.info('GET /v1/sessions (by charge_box_id)', { chargeBoxId });
      const res = await this.fetchWithTimeout(url, { method: 'GET', headers });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        LOGGER.API.warn('getActiveTransactionIdFromList non-200', { status: res.status, text });
        return null;
      }
      const raw = await res.json().catch(() => null);
      const list: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []);
      // Prefer sessions not ended or in charging status
      const active = list.find((s: any) => {
        const status = (s?.status || '').toLowerCase();
        const ended = s?.ended == null ? false : Boolean(s.ended);
        return !ended || status === 'charging' || status === 'in_progress';
      }) || null;
      const tx = active?.transactionId ?? active?.transaction_id ?? null;
      return typeof tx === 'number' ? tx : tx != null ? Number(tx) : null;
    } catch (err) {
      LOGGER.API.warn('getActiveTransactionIdFromList failed', err);
      return null;
    }
  }

  // Verifica o status OCPP do CP (WS online, último heartbeat/status)
  static async getOcppStatus(chargeBoxId: string): Promise<any | null> {
    const url = `${API_BASE}/v1/debug/ocpp/status/${encodeURIComponent(chargeBoxId)}`;
    try {
      LOGGER.API.info('GET /v1/debug/ocpp/status/:chargeBoxId', { chargeBoxId });
      const res = await this.fetchWithTimeout(url, { method: 'GET', headers });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        LOGGER.API.warn('getOcppStatus non-200', { status: res.status, text });
        return null;
      }
      const data = await res.json().catch(() => null);
      return data;
    } catch (err) {
      LOGGER.API.warn('getOcppStatus failed', err);
      return null;
    }
  }

  // Primeira opção (banco): sessão ativa por chargeBoxId
  static async getActiveSessionByChargeBoxId(chargeBoxId: string): Promise<any | null> {
    const url = `${API_BASE}/v1/sessions/active/${encodeURIComponent(chargeBoxId)}`;
    try {
      LOGGER.API.info('GET /v1/sessions/active/:chargeBoxId', { chargeBoxId });
      const res = await this.fetchWithTimeout(url, { method: 'GET', headers });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        LOGGER.API.warn('getActiveSessionByChargeBoxId non-200', { status: res.status, text });
        return null;
      }
      const data = await res.json().catch(() => null);
      return data;
    } catch (err) {
      LOGGER.API.warn('getActiveSessionByChargeBoxId failed', err);
      return null;
    }
  }

  // Consulta sessão por transactionId (validação opcional pós-stop)
  static async getSessionByTransactionId(transactionId: number | string): Promise<any | null> {
    const tx = transactionId != null ? Number(transactionId) : undefined;
    if (!Number.isFinite(tx as number)) return null;
    const url = `${API_BASE}/v1/sessions/${encodeURIComponent(String(tx))}`;
    try {
      LOGGER.API.info('GET /v1/sessions/:transactionId', { transactionId: tx });
      const res = await this.fetchWithTimeout(url, { method: 'GET', headers });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        LOGGER.API.warn('getSessionByTransactionId non-200', { status: res.status, text });
        return null;
      }
      const data = await res.json().catch(() => null);
      return data;
    } catch (err) {
      LOGGER.API.warn('getSessionByTransactionId failed', err);
      return null;
    }
  }

  // Web: aguarda SSE de session-end para confirmar encerramento
  static async waitForSessionEndSSE(chargeBoxId: string, timeoutMs = 30000): Promise<any> {
    const isWeb = typeof window !== 'undefined' && typeof (window as any).document !== 'undefined';
    const EventSourceImpl = (globalThis as any).EventSource;
    if (!isWeb || !EventSourceImpl) {
      throw new Error('SSE não suportado neste ambiente');
    }
    const url = `${API_BASE}/v1/stream?apiKey=${encodeURIComponent(API_KEY)}&cbid=${encodeURIComponent(chargeBoxId)}&types=session-end`;
    return new Promise((resolve, reject) => {
      let settled = false;
      const es = new EventSourceImpl(url);
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          es.close();
          reject(new Error('timeout'));
        }
      }, timeoutMs);

      const finish = (ev: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          const data = ev?.data ? JSON.parse(ev.data) : null;
          resolve(data);
        } catch {
          resolve(null);
        }
        es.close();
      };
      // Evento específico
      es.addEventListener('session-end', finish);
      // Fallback para eventos genéricos
      es.addEventListener('message', (ev: any) => {
        try {
          const data = ev?.data ? JSON.parse(ev.data) : null;
          // Se o payload indicar tipo=session-end, resolvemos
          if (data && (data.type === 'session-end' || data.event === 'session-end')) {
            finish(ev);
          }
        } catch {}
      });
      es.onerror = (err: any) => {
        // Mantém a conexão, erros intermitentes são esperados; não rejeita imediatamente
        LOGGER.API.warn('SSE stream error', err);
      };
    });
  }

  // Fallback universal: polling da sessão por transactionId até encerrar
  static async waitForSessionEndPoll(transactionId: number | string, timeoutMs = 20000): Promise<boolean> {
    const start = Date.now();
    const delay = async (ms: number) => new Promise((r) => setTimeout(r, ms));
    let waitMs = 1000;
    while (Date.now() - start < timeoutMs) {
      const sess = await this.getSessionByTransactionId(transactionId).catch(() => null);
      const endedAt: string | null = sess?.endedAt ?? sess?.stopped_at ?? sess?.stop_time ?? null;
      const status = (sess?.status || '').toLowerCase();
      if (endedAt || status === 'finished' || status === 'completed') {
        return true;
      }
      await delay(waitMs);
      waitMs = Math.min(waitMs + 1000, 5000);
    }
    return false;
  }

  // Helper: descoberta de transactionId ativa, priorizando sessão ativa
  static async discoverActiveTransactionId(chargeBoxId: string): Promise<number | null> {
    const active = await this.getActiveSessionByChargeBoxId(chargeBoxId).catch(() => null);
    if (active) {
      const anyTx: any = active?.transactionId ?? active?.transaction_id ?? active?.id ?? null;
      if (typeof anyTx === 'number') return anyTx;
      if (anyTx != null) return Number(anyTx);
    }
    const last = await this.getLastTransactionId(chargeBoxId).catch(() => null);
    if (last != null) return Number(last);
    const listTx = await this.getActiveTransactionIdFromList(chargeBoxId).catch(() => null);
    if (listTx != null) return Number(listTx);
    return null;
  }
}

export default ChargerService;