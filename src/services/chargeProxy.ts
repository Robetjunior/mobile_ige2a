import type { ActiveSessionResponse, SessionTelemetryProgress } from '../types';

const BASE = (process.env.EXPO_PUBLIC_CHARGE_API_BASE || 'http://localhost:8086').replace(/\/$/, '');

export interface ChargeDetailResult {
  activeSession: ActiveSessionResponse | null;
  progress: SessionTelemetryProgress | null;
}

export async function fetchChargeDetail(chargeBoxId: string): Promise<ChargeDetailResult> {
  const url = `${BASE}/charge/${encodeURIComponent(chargeBoxId)}`;
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });

  if (r.status === 404) {
    return { activeSession: null, progress: null };
  }

  if (r.status >= 500) {
    const text = await r.text().catch(() => '');
    throw new Error(`Backend error ${r.status}: ${text.slice(0, 120)}`);
  }

  const json = await r.json();
  const progress: SessionTelemetryProgress = {
    kwh: Number(json.kwh ?? 0),
    duration_seconds: Number(json.duration_seconds ?? 0),
    started_at: String(json.started_at ?? new Date().toISOString()),
    soc_percent_at: json.soc_percent_at != null ? Number(json.soc_percent_at) : undefined,
    power_kw: json.power_kw != null ? Number(json.power_kw) : undefined,
    voltage_v: json.voltage_v != null ? Number(json.voltage_v) : undefined,
    current_a: json.current_a != null ? Number(json.current_a) : undefined,
    temperature_c: json.temperature_c != null ? Number(json.temperature_c) : undefined,
  };

  const activeSession: ActiveSessionResponse = {
    transactionId: String(json.transaction_id ?? ''),
    chargeBoxId: String(json.charge_box_id ?? chargeBoxId),
    connectorId: 0,
    idTag: '',
    startedAt: String(json.started_at ?? progress.started_at),
    duration_seconds: Number(json.duration_seconds ?? progress.duration_seconds ?? 0),
    status: 'charging',
  };

  return {
    activeSession: activeSession.transactionId ? activeSession : null,
    progress: activeSession.transactionId ? progress : null,
  };
}