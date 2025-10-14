import { Platform } from 'react-native';
import ChargerService from './chargerService';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || 'minha_chave_super_secreta';

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Cache-Control': 'no-cache',
};

export type StartResult = { status: 'sent' | 'idempotentDuplicate' | 'pending'; [k: string]: any };
export type StopResult = { status: 'sent' | 'idempotentDuplicate' | 'pending'; [k: string]: any };

const ChargingService = {
  // Verifica se CP está online via OCPP status
  async isOnline(chargeBoxId: string): Promise<boolean> {
    const st = await ChargerService.getOcppStatus(chargeBoxId).catch(() => null);
    // Aceita qualquer campo indicador de conexão
    const ws = !!(st?.wsOnline ?? st?.online ?? st?.connected);
    const hb = st?.lastHeartbeatAt ? new Date(st.lastHeartbeatAt) : null;
    const recentHb = hb ? (Date.now() - hb.getTime() < 7 * 60 * 1000) : false;
    return ws || recentHb;
  },

  // Sessão ativa: tenta banco e aplica fallbacks (last-tx, lista de sessões)
  async getActiveSessionTx(chargeBoxId: string): Promise<number | null> {
    // Preferir método agregador com múltiplos fallbacks
    const tx = await ChargerService.discoverActiveTransactionId(chargeBoxId).catch(() => null);
    if (tx == null) return null;
    return Number(tx);
  },

  // Fallback debug: último tx conhecido
  async getLastTxDebug(chargeBoxId: string): Promise<number | null> {
    const tx = await ChargerService.getLastTransactionId(chargeBoxId).catch(() => null);
    if (tx == null) return null;
    return Number(tx);
  },

  // Comando de start com mapeamento de status
  async remoteStart(chargeBoxId: string, idTag: string, connectorId?: number | string, opts?: { force?: boolean }): Promise<StartResult> {
    const n = connectorId != null ? Number(connectorId) : undefined;
    const payload: any = {
      chargeBoxId,
      idTag: String(idTag ?? ''),
    };
    if (Number.isFinite(n as number) && (n as number) > 0) payload.connectorId = Number(n);

    const url = `${API_BASE}/v1/commands/remoteStart${opts?.force ? '?force=1' : ''}`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => null);
    if (res.status === 409) return { status: 'pending', pending: true, ...data };
    if (res.status === 200) return { status: 'idempotentDuplicate', idempotentDuplicate: true, ...data };
    if (res.status === 202) return { status: 'sent', sent: true, ...data };
    if (!res.ok) throw new Error((data?.message || data?.error || `HTTP ${res.status}`));
    return { status: 'sent', ...data };
  },

  // Comando de stop com mapeamento de status
  async remoteStop(transactionId: number | string): Promise<StopResult> {
    const url = `${API_BASE}/v1/commands/remoteStop`;
    const tx = transactionId != null ? Number(transactionId) : undefined;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ transactionId: tx }) });
    const data = await res.json().catch(() => null);
    if (res.status === 409) return { status: 'pending', pending: true, ...data };
    if (res.status === 200) return { status: 'idempotentDuplicate', idempotentDuplicate: true, ...data };
    if (res.status === 202) return { status: 'sent', sent: true, ...data };
    if (!res.ok) throw new Error((data?.message || data?.error || `HTTP ${res.status}`));
    return { status: 'sent', ...data };
  },

  // Assinar SSE para session-end
  subscribeSessionEndSse(chargeBoxId: string, onEvent: (ev: any) => void, opts?: { timeoutMs?: number }) {
    return ChargerService.subscribeSessionEndSse(chargeBoxId, onEvent, opts);
  },
};

export default ChargingService;