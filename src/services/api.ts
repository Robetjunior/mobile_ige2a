import { Station, ChargingSession, SessionHistory, ApiResponse } from '../types';
import { LOGGER } from '../lib/logger';
import ChargerService from './chargerService';

 const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
 const API_KEY = process.env.EXPO_PUBLIC_API_KEY || 'minha_chave_super_secreta';

 class ApiService {
   private async request<T>(
     endpoint: string,
     options: RequestInit = {}
   ): Promise<ApiResponse<T>> {
     try {
       const url = `${API_BASE_URL}${endpoint}`;
       LOGGER.API.info('API request', { url, method: options.method || 'GET' });
       const isWeb = typeof window !== 'undefined' && typeof (window as any).document !== 'undefined';
      const method = (options.method || 'GET').toString().toUpperCase();
      const baseHeaders: Record<string, string> = method === 'GET'
        ? { 'Cache-Control': 'no-cache', 'X-API-Key': API_KEY }
        : { 'Content-Type': 'application/json', 'X-API-Key': API_KEY };
      const response = await fetch(url, {
         cache: 'no-store',
         ...(isWeb && method === 'GET' ? ({ mode: 'cors' } as RequestInit) : {}),
         ...options,
         headers: {
           ...baseHeaders,
           ...options.headers,
         },
       });
 
       LOGGER.API.debug('API response status', { url, status: response.status });
       const data = await response.json();
 
       if (!response.ok) {
        LOGGER.API.error('API request failed (non-ok)', { url, status: response.status, data });
         throw new Error(data.message || `HTTP error! status: ${response.status}`);
       }
 
       return {
         success: true,
         data,
         message: data.message || 'Success',
       };
     } catch (error) {
       console.error('API request failed:', error);
      LOGGER.API.error('API request failed (catch)', { endpoint, error: String(error) });
       return {
         success: false,
         data: null as T,
         message: error instanceof Error ? error.message : 'Unknown error occurred',
       };
     }
   }
 
   // Station endpoints
   async getNearbyStations(
     lat: number,
     lng: number,
     radius: number = 100
   ): Promise<ApiResponse<Station[]>> {
     return this.request<Station[]>(
       `/stations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
     );
   }
 
   async getStationById(id: string): Promise<ApiResponse<Station>> {
    // Primeiro tenta o endpoint antigo
    const primary = await this.request<Station>(`/stations/${id}`);
    if (primary.success && primary.data) {
      return primary;
    }
    // Fallback para novo endpoint
    try {
      LOGGER.API.warn('getStationById fallback to /v1/chargers/:id', { id });
      const station = await ChargerService.getChargerDetails(id);
      return { success: true, data: station, message: 'Success' };
    } catch (err) {
      LOGGER.API.error('getStationById fallback failed', { id, err: String(err) });
      return { success: false, data: null as Station, message: err instanceof Error ? err.message : 'Unknown error' };
    }
   }
 
   // Session endpoints
   async startSession(
     stationId: string,
     connectorId: string
   ): Promise<ApiResponse<ChargingSession>> {
     return this.request<ChargingSession>('/sessions/start', {
       method: 'POST',
       body: JSON.stringify({
         stationId,
         connectorId,
       }),
     });
   }
 
   async stopSession(sessionId: string): Promise<ApiResponse<ChargingSession>> {
     return this.request<ChargingSession>(`/sessions/${sessionId}/stop`, {
       method: 'POST',
     });
   }
 
   async getSessionStatus(sessionId: string): Promise<ApiResponse<ChargingSession>> {
     return this.request<ChargingSession>(`/sessions/${sessionId}/status`);
   }
 
   // User endpoints
   async getUserSessions(userId: string): Promise<ApiResponse<SessionHistory[]>> {
     return this.request<SessionHistory[]>(`/users/${userId}/sessions`);
   }
 
   async getUserSessionsByMonth(
     userId: string,
     year: number,
     month: number
   ): Promise<ApiResponse<SessionHistory[]>> {
     return this.request<SessionHistory[]>(
       `/users/${userId}/sessions?year=${year}&month=${month}`
     );
   }
 }
 
 export const apiService = new ApiService();