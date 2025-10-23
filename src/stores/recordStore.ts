import { create } from 'zustand';
import { RecordService } from '../services/recordService';

export type PeriodMode = 'month' | 'year';
export type ChartKitData = { labels: string[]; datasets: { data: number[]; color?: (opacity: number) => string }[] };

type CacheEntry = { data: ChartKitData; ts: number; totals?: { amountBr: number; energyKwh: number; minutes: number } };

type RecordState = {
  mode: PeriodMode;
  metric: 'money' | 'energy';
  ref: string; // 'YYYY-MM' quando mês, 'YYYY' quando ano
  chartData: ChartKitData;
  totals: { amountBr: number; energyKwh: number; minutes: number };
  loading: boolean;
  error?: string | null;
  cache: {
    month: { last5?: CacheEntry };
    year: { last5?: CacheEntry };
  };
  setMode: (mode: PeriodMode) => void;
  setMetric: (metric: 'money' | 'energy') => void;
  setRef: (ref: string) => void;
  loadChart: () => Promise<void>;
  refresh: () => Promise<void>;
};

const FIVE_MIN = 5 * 60 * 1000;
const EMPTY_DATA: ChartKitData = { labels: [], datasets: [] };
let modeDebounceTimer: any = null;

export const useRecordStore = create<RecordState>((set, get) => ({
  mode: 'month',
  metric: 'money',
  ref: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })(),
  chartData: EMPTY_DATA,
  totals: { amountBr: 0, energyKwh: 0, minutes: 0 },
  loading: true,
  error: null,
  cache: { month: {}, year: {} },

  setMode: (mode) => {
    const now = new Date();
    const ref = mode === 'month' ? `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}` : String(now.getFullYear());
    set({ mode, ref, loading: true });
    if (modeDebounceTimer) clearTimeout(modeDebounceTimer);
    modeDebounceTimer = setTimeout(() => {
      get().loadChart().catch(() => {});
    }, 300);
  },

  setMetric: (metric) => {
    set({ metric });
  },

  setRef: (ref) => {
    set({ ref, loading: true });
    get().loadChart().catch(() => {});
  },

  loadChart: async () => {
    const now = new Date();
    const { mode, cache, ref } = get();
    const cacheKey = 'last5';
    const bucket = mode === 'month' ? cache.month : cache.year;
    const cached = (bucket as any)[cacheKey] as CacheEntry | undefined;

    if (cached && now.getTime() - cached.ts < FIVE_MIN) {
      set({ chartData: cached.data, loading: false, error: null });
      if (cached.totals) {
        set({ totals: cached.totals });
      } else {
        const totalsRaw = await RecordService.fetchTotalsForRef(ref, mode);
        const totals = {
          amountBr: totalsRaw.totalBr,
          energyKwh: totalsRaw.totalKwh,
          minutes: totalsRaw.totalMinutes,
        };
        const entry: CacheEntry = { ...cached, totals };
        if (mode === 'month') {
          set((s) => ({ cache: { ...s.cache, month: { last5: entry } } }));
        } else {
          set((s) => ({ cache: { ...s.cache, year: { last5: entry } } }));
        }
        set({ totals });
      }
      return;
    }

    set({ loading: true, error: null });
    try {
      let chartData: ChartKitData;
      if (mode === 'month') {
        const raw = await RecordService.fetchMonthlyTotals12UsingTotalsEndpoint(12);
        const last5Labels = raw.labels.slice(-5);
        const labels = last5Labels.map((lm) => {
          const mStr = lm.split('-')[1];
          const mNum = parseInt(mStr, 10);
          return Number.isFinite(mNum) ? (RecordService.monthAbbrPtBR[mNum - 1] || lm) : lm;
        });
        const energy = (raw.datasets[0]?.data || []).slice(-5);
        const total = (raw.datasets[1]?.data || []).slice(-5);
        chartData = { labels, datasets: [{ data: energy }, { data: total }] };
      } else {
        chartData = await RecordService.fetchYearlyTotalsLast5UsingTotalsEndpoint();
      }
      const totalsRaw = await RecordService.fetchTotalsForRef(ref, mode);
      const totals = {
        amountBr: totalsRaw.totalBr,
        energyKwh: totalsRaw.totalKwh,
        minutes: totalsRaw.totalMinutes,
      };
      const entry: CacheEntry = { data: chartData, ts: now.getTime(), totals };
      if (mode === 'month') {
        set((s) => ({ cache: { ...s.cache, month: { last5: entry } } }));
      } else {
        set((s) => ({ cache: { ...s.cache, year: { last5: entry } } }));
      }
      set({ chartData, totals, loading: false, error: null });
    } catch (err: any) {
      set({ loading: false, error: err?.message ?? 'Erro ao carregar gráfico' });
    }
  },

  refresh: async () => {
    set((s) => ({ cache: { month: {}, year: {} }, loading: true }));
    await get().loadChart();
  },
}));