import { create } from 'zustand';
import { RecordState, PeriodMode, ChargingSessionItem, SessionSummary } from '../types';
import { RecordService } from '../services/recordService';
import { mockSummaryMonth, mockSummaryYear, mockSessionItems, MockSummary } from '../mocks/record';
import { LOGGER } from '../lib/logger';

interface RecordActions {
  setPeriodMode: (mode: PeriodMode) => void;
  setRef: (ref: string) => void;
  loadSummary: (userId: string) => Promise<void>;
  loadSessions: (userId: string, page?: number) => Promise<void>;
  loadMoreSessions: (userId: string) => Promise<void>;
  refresh: (userId: string) => Promise<void>;
  reset: () => void;
  // Mock data methods
  loadMockData: () => void;
}

interface RecordStoreState extends RecordState {
  // Chart data from mocks
  chartSummary: MockSummary | null;
}

type RecordStore = RecordStoreState & RecordActions;

const initialState: RecordStoreState = {
  periodMode: 'month',
  ref: RecordService.getCurrentRef('month'),
  summary: null,
  sessions: [],
  page: 1,
  pageSize: 20,
  total: 0,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  chartSummary: mockSummaryMonth, // Initialize with month data
};

export const useRecordStore = create<RecordStore>((set, get) => ({
  ...initialState,

  setPeriodMode: (mode: PeriodMode) => {
    const newRef = RecordService.getCurrentRef(mode);
    const chartSummary = getMockSummaryForRef(mode, newRef);
    LOGGER.STORE.info('setPeriodMode', { mode, newRef });
    
    set({ 
      periodMode: mode, 
      ref: newRef,
      sessions: [],
      page: 1,
      total: 0,
      summary: null,
      chartSummary,
    });
  },

  setRef: (ref: string) => {
    const { periodMode } = get();
    set({ 
      ref,
      sessions: [],
      page: 1,
      total: 0,
      summary: null,
      chartSummary: getMockSummaryForRef(periodMode, ref),
    });
  },

  loadSummary: async (userId: string) => {
    const { periodMode, ref } = get();
    
    try {
      set({ isLoading: true, error: null });
      
      const granularity = RecordService.getGranularity(periodMode);
      const summary = await RecordService.retry(
        () => RecordService.getSessionSummary(userId, granularity, ref),
        3,
        500
      );
      
      set({ summary, isLoading: false });
    } catch (error) {
      LOGGER.STORE.error('Error loading summary:', error as any);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar resumo',
        isLoading: false 
      });
      LOGGER.STORE.warn('Using mock summary fallback');
      get().loadMockData();
    }
  },

  loadSessions: async (userId: string, page = 1) => {
    const { periodMode, ref, pageSize } = get();
    
    try {
      set({ isLoading: page === 1, error: null });
      
      const { from, to } = RecordService.getDateRange(periodMode, ref);
      const response = await RecordService.retry(
        () => RecordService.getUserSessions(userId, from, to, page, pageSize),
        3,
        500
      );
      
      set({ 
        sessions: page === 1 ? response.items : [...get().sessions, ...response.items],
        page: response.page,
        total: response.total,
        isLoading: false,
        isLoadingMore: false,
      });
    } catch (error) {
      LOGGER.STORE.error('Error loading sessions:', error as any);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar sessões',
        isLoading: false,
        isLoadingMore: false,
      });
      LOGGER.STORE.warn('Using mock sessions fallback');
      get().loadMockData();
    }
  },

  loadMoreSessions: async (userId: string) => {
    const { page, total, sessions, pageSize, isLoadingMore } = get();
    
    // Check if there are more items to load
    if (sessions.length >= total || isLoadingMore) {
      return;
    }
    
    try {
      set({ isLoadingMore: true });
      await get().loadSessions(userId, page + 1);
    } catch (error) {
      set({ isLoadingMore: false });
    }
  },

  refresh: async (userId: string) => {
    const state = get();
    
    // Reset pagination
    set({ 
      sessions: [], 
      page: 1, 
      total: 0,
      error: null,
    });
    LOGGER.STORE.info('refresh');
    
    // Load both summary and first page of sessions
    await Promise.all([
      state.loadSummary(userId),
      state.loadSessions(userId, 1),
    ]);
  },

  reset: () => {
    set(initialState);
  },

  loadMockData: () => {
    const { periodMode, ref } = get();
    const chartSummary = getMockSummaryForRef(periodMode, ref);
    
    // Simulate loading state
    set({ isLoading: true });
    
    setTimeout(() => {
      set({
        chartSummary,
        sessions: mockSessionItems,
        total: mockSessionItems.length,
        page: 1,
        isLoading: false,
        error: null,
      });
    }, 500); // Simulate network delay
  },
}));

// Adapt mock data to the selected ref so charts react to date
const getMockSummaryForRef = (mode: PeriodMode, ref: string): MockSummary => {
  if (mode === 'month') {
    // ref: YYYY-MM; remap x from 'MM-DD' to selected month
    const [, month] = ref.split('-');
    const monthLabel = month ?? '01';
    const base = mockSummaryMonth;
    return {
      ...base,
      period: ref,
      amountSeries: base.amountSeries.map(it => ({
        x: `${monthLabel}-${it.x.split('-')[1]}`,
        y: it.y,
      })),
      sessionsSeries: base.sessionsSeries.map(it => ({
        x: `${monthLabel}-${it.x.split('-')[1]}`,
        count: it.count,
        kWh: it.kWh,
      })),
    };
  }
  // Year mode: keep series x as '01'..'12', set period to year
  const base = mockSummaryYear;
  return {
    ...base,
    period: ref,
  };
};

// Helper hook for formatted data
export const useFormattedRecordData = () => {
  const store = useRecordStore();
  
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatEnergy = (kWh: number): string => {
    return `${kWh.toFixed(1)} kWh`;
  };

  const formatUnitPrice = (price: number): string => {
    return `${formatCurrency(price)}/kWh`;
  };

  const getStatusColor = (status: ChargingSessionItem['status']): string => {
    switch (status) {
      case 'finished':
        return '#27AE60'; // Green
      case 'charging':
        return '#F39C12'; // Orange
      case 'error':
        return '#E74C3C'; // Red
      default:
        return '#95A5A6'; // Gray
    }
  };

  const getStatusLabel = (status: ChargingSessionItem['status']): string => {
    switch (status) {
      case 'finished':
        return 'Finalizado';
      case 'charging':
        return 'Carregando';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  return {
    ...store,
    formatDuration,
    formatCurrency,
    formatEnergy,
    formatUnitPrice,
    getStatusColor,
    getStatusLabel,
  };
};