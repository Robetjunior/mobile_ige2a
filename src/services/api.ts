import { Station, ChargingSession, SessionHistory, ApiResponse } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || '';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        cache: 'no-store',
        ...options,
        headers: {
          'Content-Type': 'application/json',
          // Backend espera X-API-Key ao invés de Authorization
          'X-API-Key': API_KEY,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        data,
        message: data.message || 'Success',
      };
    } catch (error) {
      console.error('API request failed:', error);
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
    return this.request<Station>(`/stations/${id}`);
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