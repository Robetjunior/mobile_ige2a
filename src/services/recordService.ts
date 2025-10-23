import { SessionsResponse, SessionSummary, PeriodMode, ChargingSessionItem, BillingInvoice, SessionTelemetryProgress, ProgressBatchItem } from '../types';
import { AmountSeriesData } from '../mocks/record';
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

  // ===== UTC helpers (avoid local TZ drift) =====
  static startOfMonthUTC(year: number, month: number): string {
    return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  static startOfNextMonthUTC(year: number, month: number): string {
    return new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  static daysInMonthUTC(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  // ===== Billing endpoints =====
  static async fetchMonthInvoices(year: number, month: number): Promise<BillingInvoice[]> {
    const from = this.startOfMonthUTC(year, month);
    const to = this.startOfNextMonthUTC(year, month);
    const url = `${API_BASE_URL}/v1/billing/invoices?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    const res = await this.retry(() => this.fetchWithTimeout(url, { method: 'GET', headers }));
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} while fetching invoices`);
    }
    const json = await res.json();
    return Array.isArray(json) ? json as BillingInvoice[] : (json.items ?? []) as BillingInvoice[];
  }

  static computeSummaryFromInvoices(items: BillingInvoice[]) {
    let totalBr = 0;
    let totalKwh = 0;
    let totalMinutes = 0;
    for (const it of items) {
      const isOngoing = !it.stopped_at || it.stopped_at === null;
      if (isOngoing) continue;
      totalBr += Number(it.total_br) || 0;
      totalKwh += Number(it.energy_kwh) || 0;
      const start = Date.parse(it.started_at);
      const stop = Date.parse(it.stopped_at!);
      if (!Number.isNaN(start) && !Number.isNaN(stop) && stop > start) {
        totalMinutes += Math.round((stop - start) / 60000);
      }
    }
    return { totalBr, totalKwh, totalMinutes };
  }

  static buildMonthChart(items: BillingInvoice[], year: number, month: number): AmountSeriesData[] {
    const days = this.daysInMonthUTC(year, month);
    const buckets = new Array(days).fill(0);

    for (const it of items) {
      const d = new Date(it.started_at);
      const day = d.getUTCDate();
      const amount = Number(it.total_br) || 0;
      buckets[day - 1] += amount;
    }

    const labelMonth = String(month).padStart(2, '0');
    const series: AmountSeriesData[] = buckets.map((y, idx) => ({
      x: `${labelMonth}-${String(idx + 1).padStart(2, '0')}`,
      y: Number(y.toFixed(2)),
    }));
    return series;
  }

  static async fetchYearBuckets(year: number): Promise<AmountSeriesData[]> {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const lastMonth = year === currentYear ? now.getUTCMonth() + 1 : 12;

    const monthlyTotals: number[] = new Array(12).fill(0);
    for (let m = 1; m <= lastMonth; m++) {
      try {
        const invoices = await this.fetchMonthInvoices(year, m);
        const sum = invoices.reduce((acc, it) => acc + (Number(it.total_br) || 0), 0);
        monthlyTotals[m - 1] = Number(sum.toFixed(2));
      } catch (err) {
        LOGGER.API.warn('Year bucket month failed', { year, month: m, err: String(err) });
        monthlyTotals[m - 1] = 0;
      }
    }
    const series: AmountSeriesData[] = monthlyTotals.map((y, idx) => ({
      x: String(idx + 1).padStart(2, '0'),
      y,
    }));
    return series;
  }

  static buildYearChart(monthlySeries: AmountSeriesData[], year: number): AmountSeriesData[] {
    const filled = new Array(12).fill(0);
    for (const s of monthlySeries) {
      const idx = Math.max(0, Math.min(11, parseInt(s.x) - 1));
      filled[idx] = s.y;
    }
    return filled.map((y, idx) => ({ x: String(idx + 1).padStart(2, '0'), y }));
  }

  static mapInvoiceToSessionItem(it: BillingInvoice): ChargingSessionItem {
    const energyKWh = Number(it.energy_kwh) || 0;
    const totalAmount = Number(it.total_br) || 0;
    const unitPrice = it.unit_price_br_per_kwh && it.unit_price_br_per_kwh > 0 && energyKWh > 0
      ? Number(it.unit_price_br_per_kwh)
      : (energyKWh > 0 ? Number((totalAmount / energyKWh).toFixed(2)) : 0);

    return {
      id: String(it.transaction_id),
      stationName: it.station_name ?? it.charge_box_id,
      chargeBoxId: it.charge_box_id,
      connectorId: Number(it.connector_id),
      connectorType: it.connector_type,
      status: it.status,
      startedAt: it.started_at,
      endedAt: it.stopped_at ?? undefined,
      energyKWh,
      unitPrice,
      totalAmount,
    };
  }

  // ===== Progress endpoints =====
  static async fetchProgressByTxId(txId: string): Promise<SessionTelemetryProgress | null> {
    const url = `${API_BASE_URL}/v1/sessions/${encodeURIComponent(txId)}/progress`;
    const res = await this.retry(() => this.fetchWithTimeout(url, { method: 'GET', headers }));
    if (!res.ok) {
      LOGGER.API.warn('Progress fetch failed', { txId, status: res.status });
      return null;
    }
    return await res.json();
  }

  static async fetchProgressBatch(txIds: string[]): Promise<ProgressBatchItem[]> {
    const url = `${API_BASE_URL}/v1/sessions/progress:batch`;
    const body = JSON.stringify({ transaction_ids: txIds });
    const res = await this.retry(() => this.fetchWithTimeout(url, { method: 'POST', headers, body }));
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} on progress batch`);
    }
    const json = await res.json();
    if (Array.isArray(json)) return json as ProgressBatchItem[];
    if (Array.isArray(json.items)) return json.items as ProgressBatchItem[];
    return [];
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

  // ===== New chart data API (last12 / last5) =====
  static startOfYearUTC(year: number): string {
    return new Date(Date.UTC(year, 0, 1, 0, 0, 0)).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
  static startOfNextYearUTC(year: number): string {
    return new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0)).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
  static addMonthsUTC(base: Date, n: number): Date {
    return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + n, 1, 0, 0, 0));
  }
  static async fetchInvoicesRange(fromIso: string, toIso: string): Promise<BillingInvoice[]> {
    const url = `${API_BASE_URL}/v1/billing/invoices?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`;
    const res = await this.retry(() => this.fetchWithTimeout(url, { method: 'GET', headers }));
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} while fetching invoices`);
    }
    const json = await res.json();
    return Array.isArray(json) ? (json as BillingInvoice[]) : ((json.items ?? []) as BillingInvoice[]);
  }

  static readonly monthAbbrPtBR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  static async fetchMonthlyTotalsLast12(now: Date): Promise<{ label: string; value: number }[]> {
    const points: { label: string; value: number }[] = [];
    const current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
    for (let i = 11; i >= 0; i--) {
      const d = this.addMonthsUTC(current, -i);
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + 1;
      const from = this.startOfMonthUTC(y, m);
      const to = this.startOfNextMonthUTC(y, m);
      try {
        const invoices = await this.fetchInvoicesRange(from, to);
        const sum = invoices.reduce((acc, it) => acc + (Number(it.total_br) || 0), 0);
        points.push({ label: this.monthAbbrPtBR[m - 1], value: Number(sum.toFixed(2)) });
      } catch (err) {
        LOGGER.API.warn('fetchMonthlyTotalsLast12 bucket failed', { y, m, err: String(err) });
        points.push({ label: this.monthAbbrPtBR[m - 1], value: 0 });
      }
    }
    return points;
  }

  static async fetchYearlyTotalsLast5(now: Date): Promise<{ label: string; value: number }[]> {
    const points: { label: string; value: number }[] = [];
    const currentYear = now.getUTCFullYear();
    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      const from = this.startOfYearUTC(year);
      const to = this.startOfNextYearUTC(year);
      try {
        const invoices = await this.fetchInvoicesRange(from, to);
        const sum = invoices.reduce((acc, it) => acc + (Number(it.total_br) || 0), 0);
        points.push({ label: String(year), value: Number(sum.toFixed(2)) });
      } catch (err) {
        LOGGER.API.warn('fetchYearlyTotalsLast5 bucket failed', { year, err: String(err) });
        points.push({ label: String(year), value: 0 });
      }
    }
    return points;
  }

  static async fetchTotalsForCurrentPeriod(now: Date, mode: 'month'|'year') {
    if (mode === 'month') {
      const from = this.startOfMonthUTC(now.getUTCFullYear(), now.getUTCMonth() + 1);
      const to = this.startOfNextMonthUTC(now.getUTCFullYear(), now.getUTCMonth() + 1);
      const invoices = await this.fetchInvoicesRange(from, to);
      return this.computeSummaryFromInvoices(invoices);
    } else {
      const from = this.startOfYearUTC(now.getUTCFullYear());
      const to = this.startOfNextYearUTC(now.getUTCFullYear());
      const invoices = await this.fetchInvoicesRange(from, to);
      return this.computeSummaryFromInvoices(invoices);
    }
  }

  static async fetchMonthlyTotals12UsingTotalsEndpoint(months: number = 12, filters?: { charge_box_id?: string; id_tag?: string }): Promise<{ labels: string[]; datasets: { data: number[]; color?: (opacity: number) => string }[] }> {
    try {
      const params = new URLSearchParams({ months: String(months) });
      if (filters?.charge_box_id) params.set('charge_box_id', filters.charge_box_id);
      if (filters?.id_tag) params.set('id_tag', filters.id_tag);
      const url = `${API_BASE_URL}/v1/billing/invoices/totals?${params.toString()}`;
      const res = await this.fetchWithTimeout(url, { method: 'GET', headers });
      if (!res.ok) {
        console.warn('[billing/totals] resposta não OK:', res.status);
        // Fallback seguro: gerar últimos N meses com zero-fill
        const now = new Date();
        const labels: string[] = [];
        for (let i = months - 1; i >= 0; i--) {
          const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, '0');
          labels.push(`${y}-${m}`);
        }
        const zeros = new Array(labels.length).fill(0);
        return { labels, datasets: [{ data: zeros }, { data: zeros }] };
      }
      const json = await res.json();
      const items: any[] = Array.isArray(json?.items) ? json.items : [];
      const labels = items.map((it) => String(it.month));
      const energy = items.map((it) => Number(it.energy_kwh) || 0);
      const total = items.map((it) => Number(it.total_br) || 0);
      return {
        labels,
        datasets: [
          { data: energy, color: (o: number) => `rgba(31,119,180,${o})` },
          { data: total, color: (o: number) => `rgba(255,127,14,${o})` },
        ],
      };
    } catch (err: any) {
      console.warn('[billing/totals] erro ou timeout:', String(err?.message ?? err));
      // Fallback seguro: manter gráfico com zeros (últimos N meses)
      const now = new Date();
      const labels: string[] = [];
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        labels.push(`${y}-${m}`);
      }
      const zeros = new Array(labels.length).fill(0);
      return { labels, datasets: [{ data: zeros }, { data: zeros }] };
    }
  }

  // Agrupador de itens por ano a partir de /totals
  static groupTotalsItemsByYear(items: any[]) {
    const byYear: Record<string, { energy: number; total: number }> = {};
    for (const it of items) {
      const monthStr = String(it.month);
      const yearStr = monthStr.split('-')[0];
      const energy = Number(it.energy_kwh) || 0;
      const total = Number(it.total_br) || 0;
      if (!byYear[yearStr]) byYear[yearStr] = { energy: 0, total: 0 };
      byYear[yearStr].energy += energy;
      byYear[yearStr].total += total;
    }
    const years = Object.keys(byYear).map((y) => parseInt(y, 10)).sort((a, b) => a - b);
    const last5 = years.slice(-5);
    const labels = last5.map(String);
    const energy = last5.map((y) => Number((byYear[String(y)].energy).toFixed(2)));
    const total = last5.map((y) => Number((byYear[String(y)].total).toFixed(2)));
    return { labels, energy, total };
  }

  // Preferir usar months=60 no endpoint /totals e agrupar em 5 anos
  static async fetchYearlyTotalsLast5UsingTotalsEndpoint(filters?: { charge_box_id?: string; id_tag?: string }): Promise<{ labels: string[]; datasets: { data: number[]; color?: (opacity: number) => string }[] }> {
    try {
      const params = new URLSearchParams({ months: '60' });
      if (filters?.charge_box_id) params.set('charge_box_id', filters.charge_box_id);
      if (filters?.id_tag) params.set('id_tag', filters.id_tag);
      const url = `${API_BASE_URL}/v1/billing/invoices/totals?${params.toString()}`;
      const res = await this.fetchWithTimeout(url, { method: 'GET', headers });
      if (!res.ok) {
        console.warn('[billing/totals] (ano) resposta não OK:', res.status);
        // Fallback para agregação anual via faixa existente
        const now = new Date();
        const points = await this.fetchYearlyTotalsLast5(now);
        return {
          labels: points.map((p) => p.label),
          datasets: [
            { data: points.map((p) => 0), color: (o: number) => `rgba(31,119,180,${o})` },
            { data: points.map((p) => p.value), color: (o: number) => `rgba(255,127,14,${o})` },
          ],
        };
      }
      const json = await res.json();
      const items: any[] = Array.isArray(json?.items) ? json.items : [];
      const grouped = this.groupTotalsItemsByYear(items);
      return {
        labels: grouped.labels,
        datasets: [
          { data: grouped.energy, color: (o: number) => `rgba(31,119,180,${o})` },
          { data: grouped.total, color: (o: number) => `rgba(255,127,14,${o})` },
        ],
      };
    } catch (err: any) {
      console.warn('[billing/totals] (ano) erro/timeout:', String(err?.message ?? err));
      const now = new Date();
      const points = await this.fetchYearlyTotalsLast5(now);
      return {
        labels: points.map((p) => p.label),
        datasets: [
          { data: points.map((p) => 0), color: (o: number) => `rgba(31,119,180,${o})` },
          { data: points.map((p) => p.value), color: (o: number) => `rgba(255,127,14,${o})` },
        ],
      };
    }
  }

  // New helper: totals for a given reference (YYYY-MM or YYYY)
  static async fetchTotalsForRef(ref: string, mode: 'month'|'year') {
    try {
      if (mode === 'month') {
        const [yStr, mStr] = ref.split('-');
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10);
        const from = this.startOfMonthUTC(y, m);
        const to = this.startOfNextMonthUTC(y, m);
        const invoices = await this.fetchInvoicesRange(from, to);
        return this.computeSummaryFromInvoices(invoices);
      } else {
        const y = parseInt(ref, 10);
        const from = this.startOfYearUTC(y);
        const to = this.startOfNextYearUTC(y);
        const invoices = await this.fetchInvoicesRange(from, to);
        return this.computeSummaryFromInvoices(invoices);
      }
    } catch (err) {
      LOGGER.API.warn('fetchTotalsForRef failed', { ref, mode, err: String(err) });
      return { totalBr: 0, totalKwh: 0, totalMinutes: 0 };
    }
  }
}