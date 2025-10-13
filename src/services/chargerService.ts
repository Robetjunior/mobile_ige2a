import { LOGGER } from '../lib/logger';
import { Station, OnlineChargerListResponse, OnlineChargerItem } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || '';

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
    try {
      LOGGER.API.info('GET /v1/ocpp/online', { baseUrl: API_BASE });
      // Important: this endpoint is public; avoid custom headers that trigger CORS preflight on web
      const res = await this.fetchWithTimeout(url, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      const data: OcppOnlineResponse = await res.json();
      const ids = Array.isArray(data?.online) ? data.online : [];
      LOGGER.API.debug('OCPP online ids fetched', { count: ids.length });
      return ids;
    } catch (err) {
      LOGGER.API.error('getOcppOnlineIds failed', err);
      throw err;
    }
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
}

export default ChargerService;