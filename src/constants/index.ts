export const COLORS = {
  primary: '#27AE60',
  primaryDark: '#1E8449',
  primaryLight: '#58D68D',
  secondary: '#3498DB',
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',
  
  // Status colors
  online: '#2ECC71',
  offline: '#95A5A6',
  busy: '#F39C12',
  
  // Text colors
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textLight: '#BDC3C7',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundDark: '#2C3E50',
  
  // Border colors
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
};

export const SIZES = {
  // Font sizes
  fontXS: 12,
  fontSM: 14,
  fontMD: 16,
  fontLG: 18,
  fontXL: 20,
  fontXXL: 24,
  
  // Spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Border radius
  radiusXS: 4,
  radiusSM: 8,
  radiusMD: 12,
  radiusLG: 16,
  radiusXL: 24,
  
  // Icon sizes
  iconXS: 16,
  iconSM: 20,
  iconMD: 24,
  iconLG: 32,
  iconXL: 48,
};

export const DISTANCE_FILTERS = [100, 300, 500] as const;

export const POLLING_INTERVAL = 3000; // 3 seconds

export const API_ENDPOINTS = {
  STATIONS_NEARBY: '/stations/nearby',
  STATION_DETAIL: '/stations',
  SESSION_START: '/sessions/start',
  SESSION_STOP: '/sessions/stop',
  SESSION_STATUS: '/sessions/status',
  USER_SESSIONS: '/users/sessions',
} as const;

export const DEEP_LINK_SCHEME = 'ev://';

export const MAP_DEFAULTS = {
  LATITUDE_DELTA: 0.0922,
  LONGITUDE_DELTA: 0.0421,
  ZOOM_LEVEL: 15,
};

export const STORAGE_KEYS = {
  FAVORITES: '@ev_charging_favorites',
  USER_PREFERENCES: '@ev_charging_preferences',
  THEME: '@ev_charging_theme',
  LANGUAGE: '@ev_charging_language',
} as const;

export const SUPPORTED_LANGUAGES = {
  'pt-BR': 'Português',
  'en': 'English',
} as const;

export const CONNECTOR_TYPES = {
  CCS2: 'CCS2',
  CHADEMO: 'CHAdeMO',
  TYPE2: 'Type 2',
  TYPE1: 'Type 1',
} as const;