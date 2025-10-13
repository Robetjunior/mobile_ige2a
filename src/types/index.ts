export interface Station {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  status: 'online' | 'offline' | 'busy';
  connectors: Connector[];
  distance?: number;
  isFavorite?: boolean;
  rules?: string;
  schedule?: string;
}

export interface Connector {
  id: string;
  type: string; // e.g., 'CCS2', 'CHAdeMO', 'Type 2'
  powerKw: number;
  pricePerKwh?: number;
  pricePerMinute?: number;
  status: 'available' | 'occupied' | 'offline';
}

export interface ChargingSession {
  id: string;
  stationId: string;
  stationName: string;
  connectorId: string;
  status: 'idle' | 'preparing' | 'charging' | 'stopping' | 'finished';
  startTime?: string;
  endTime?: string;
  powerKw: number;
  voltageV: number;
  currentA: number;
  energyKWh: number;
  unitPrice: number;
  totalAmount: number;
  temperatureC: number;
  duration: number; // in minutes
}

export interface User {
  id: string;
  name: string;
  email: string;
  token?: string;
}

export interface LocationState {
  latitude: number;
  longitude: number;
  hasPermission: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface SessionHistory {
  id: string;
  date: string;
  stationName: string;
  duration: number;
  energyKWh: number;
  totalAmount: number;
}

export interface MonthlyStats {
  month: string;
  totalEnergy: number;
  totalAmount: number;
  sessionCount: number;
}

export type DistanceFilter = 100 | 300 | 500;

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Record/Session types
export interface ChargingSessionItem {
  id: string;
  stationName: string;
  chargeBoxId: string;
  connectorId: number;
  connectorType?: string;
  status: 'finished' | 'charging' | 'error';
  startedAt: string;
  endedAt?: string;
  energyKWh: number;
  unitPrice: number;
  totalAmount: number;
}

export interface SessionsResponse {
  items: ChargingSessionItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ChartDataPoint {
  bucket: string;
  amount: number;
}

export interface SessionSummary {
  totalMoney: number;
  totalKWh: number;
  totalMinutes: number;
  chart: ChartDataPoint[];
}

export type PeriodMode = 'month' | 'year';

export interface RecordState {
  periodMode: PeriodMode;
  ref: string; // 'YYYY-MM' for month, 'YYYY' for year
  summary: SessionSummary | null;
  sessions: ChargingSessionItem[];
  page: number;
  pageSize: number;
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

// Online chargers (status list) API shapes
export interface OnlineChargerConnector {
  connectorId: number;
  status: string;
  errorCode?: string | null;
  updatedAt: string;
}

export interface OnlineChargerItem {
  chargeBoxId: string;
  wsOnline: boolean;
  onlineRecently: boolean;
  lastHeartbeatAt?: string | null;
  lastStatus?: string;
  lastStatusAt?: string | null;
  connectors: OnlineChargerConnector[];
  lastTransactionId?: number | null;
  // Optional enriched fields when details are fetched
  name?: string;
  address?: string;
}

export interface OnlineChargerListResponse {
  items: OnlineChargerItem[];
  count: number;
}