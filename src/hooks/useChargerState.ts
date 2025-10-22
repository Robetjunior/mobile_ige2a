import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Platform } from 'react-native';
import ChargerService from '../services/chargerService';

export type ChargerDetails = {
  chargeBoxId: string;
  connectors?: Array<{ connectorId: number; status: string }>; // minimal shape
  lastStatus?: string | null;
  lastTransactionId?: number | null;
  name?: string;
  address?: string;
};

export type OcppSnapshot = { online: boolean; lastHeartbeat?: string | null } | null;

export type UseChargerStateOptions = {
  idTag?: string | null; // optional pre-filled password/PIN
  defaultConnectorId?: number | null;
};

export type ChargerMetrics = {
  powerKw: number;
  voltageV: number;
  currentA: number;
  energyKWh: number;
  temperatureC: number;
  unitPrice: number;
  totalAmount: number;
  durationMin: number;
  startTimeLocal?: string | null;
};

export type ChargerUiFlags = {
  headerLabel: string; // "No order in progress" | "Charging…" | "Finalizing…"
  ctaLabel: 'Start Charging' | 'Stop Charging';
  ctaDisabled: boolean;
  ctaLoading: boolean;
  offlineBanner: boolean;
};

export function useChargerState(chargeBoxId: string, opts?: UseChargerStateOptions) {
  const options = opts || {}; 
  const [details, setDetails] = useState<ChargerDetails | null>(null);
  const [snapshot, setSnapshot] = useState<OcppSnapshot>(null);
  const [metrics, setMetrics] = useState<ChargerMetrics>({
    powerKw: 0,
    voltageV: 0,
    currentA: 0,
    energyKWh: 0,
    temperatureC: 0,
    unitPrice: 0,
    totalAmount: 0,
    durationMin: 0,
    startTimeLocal: null,
  });
  const [progressPct, setProgressPct] = useState<number | null>(0);
  const [commandLoading, setCommandLoading] = useState(false);
  const [lastCommandId, setLastCommandId] = useState<string | null>(null);
  const [idTag, setIdTag] = useState<string | null>(options.idTag || null);
  const [active, setActive] = useState(false);

  const chargerPollRef = useRef<NodeJS.Timeout | null>(null);
  const snapshotPollRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Helpers
  const clearTimers = useCallback(() => {
    if (chargerPollRef.current) { clearInterval(chargerPollRef.current as any); chargerPollRef.current = null; }
    if (snapshotPollRef.current) { clearInterval(snapshotPollRef.current as any); snapshotPollRef.current = null; }
  }, []);

  const fetchSnapshot = useCallback(async () => {
    try {
      const snap = await ChargerService.getOcppSnapshot(chargeBoxId);
      setSnapshot(snap);
    } catch {
      setSnapshot((s) => s); // keep previous
    }
  }, [chargeBoxId]);

  const fetchDetails = useCallback(async () => {
    try {
      const det = await ChargerService.getChargerDetails(chargeBoxId);
      setDetails(det as any);
    } catch {
      // keep previous
    }
  }, [chargeBoxId]);

  // Rules: CTA and header
  const isCharging = useMemo(() => {
    const s = (details?.lastStatus || '').toLowerCase();
    return s === 'charging' || s === 'suspendedev' || s === 'suspendedevse' || (details?.lastTransactionId != null);
  }, [details?.lastStatus, details?.lastTransactionId]);

  const canStart = useMemo(() => {
    const s = (details?.lastStatus || '').toLowerCase();
    const allowed = (s === 'available' || s === 'preparing' || s === 'finishing') && !details?.lastTransactionId;
    return allowed;
  }, [details?.lastStatus, details?.lastTransactionId]);

  const canStop = useMemo(() => {
    const s = (details?.lastStatus || '').toLowerCase();
    const allowed = (details?.lastTransactionId != null) || s === 'charging' || s === 'suspendedev' || s === 'suspendedevse';
    return allowed;
  }, [details?.lastStatus, details?.lastTransactionId]);

  const offline = useMemo(() => snapshot != null && snapshot.online === false, [snapshot]);

  const ui: ChargerUiFlags = useMemo(() => {
    const headerLabel = isCharging ? 'Charging…' : ((details?.lastStatus || '').toLowerCase() === 'finishing' ? 'Finalizing…' : 'No order in progress');
    const ctaLabel = isCharging ? 'Stop Charging' as const : 'Start Charging' as const;
    const ctaDisabled = offline || commandLoading || (ctaLabel === 'Start Charging' ? !canStart : !canStop);
    const ctaLoading = commandLoading;
    const offlineBanner = offline;
    return { headerLabel, ctaLabel, ctaDisabled, ctaLoading, offlineBanner };
  }, [isCharging, details?.lastStatus, offline, canStart, canStop, commandLoading]);

  // Progress %: simple placeholder until telemetry exists
  useEffect(() => {
    if (!isCharging) {
      setProgressPct(0);
      return;
    }
    // If we had a target energy, we could compute. For now, animate toward small increase based on energyKWh.
    const pct = Math.max(0, Math.min(100, (metrics.energyKWh > 0 ? metrics.energyKWh : 0) * 10));
    setProgressPct(pct);
  }, [isCharging, metrics.energyKWh]);

  // Start/Stop flows
  const start = useCallback(async (idTagInput?: string, connectorId?: number) => {
    const finalIdTag = (idTagInput || idTag || '').trim();
    if (!finalIdTag) {
      // Caller should prompt idTag
      throw new Error('idTag necessário');
    }
    setCommandLoading(true);
    try {
      const resp = await ChargerService.remoteStart({ chargeBoxId, idTag: finalIdTag, connectorId }, { force: true });
      const cmdId = (resp as any)?.id || (resp as any)?.commandId || (resp as any)?.command_id || null;
      if (cmdId) setLastCommandId(String(cmdId));
      // Poll command until accepted/failed
      const status = await ChargerService.pollCommandStatus(String(cmdId || ''), 15000, 1500);
      if (status === 'accepted') {
        // start polling charger until lastTransactionId appears
        let found = false;
        const t0 = Date.now();
        while (!found && Date.now() - t0 < 20000) {
          const det = await ChargerService.getChargerDetails(chargeBoxId).catch(() => null as any);
          if (det?.lastTransactionId != null) {
            setDetails(det);
            found = true;
            startTimeRef.current = Date.now();
            setMetrics((m) => ({ ...m, startTimeLocal: new Date().toLocaleTimeString() }));
            break;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
      return status;
    } finally {
      setCommandLoading(false);
    }
  }, [chargeBoxId, idTag]);

  const stop = useCallback(async () => {
    setCommandLoading(true);
    try {
      // Determine transactionId
      let txId: number | null = details?.lastTransactionId ?? null;
      if (txId == null) {
        txId = await ChargerService.discoverActiveTransactionId(chargeBoxId);
      }
      if (txId == null) throw new Error('Transação não encontrada');
      const resp = await ChargerService.remoteStop({ transactionId: txId });
      const cmdId = (resp as any)?.id || (resp as any)?.commandId || (resp as any)?.command_id || null;
      if (cmdId) setLastCommandId(String(cmdId));
      const status = await ChargerService.pollCommandStatus(String(cmdId || ''), 15000, 1500);
      if (status === 'accepted') {
        // Wait until charger shows no active session and status back to Available
        const t0 = Date.now();
        while (Date.now() - t0 < 20000) {
          const det = await ChargerService.getChargerDetails(chargeBoxId).catch(() => null as any);
          const s = (det?.lastStatus || '').toLowerCase();
          if (!det?.lastTransactionId && (s === 'available' || s === 'finishing' || s === 'preparing')) {
            setDetails(det);
            setMetrics((m) => ({ ...m, durationMin: 0, energyKWh: 0, totalAmount: 0 }));
            startTimeRef.current = null;
            break;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
      return status;
    } finally {
      setCommandLoading(false);
    }
  }, [chargeBoxId, details?.lastTransactionId]);

  // Update duration every 1s while active
  useEffect(() => {
    const t = setInterval(() => {
      if (!startTimeRef.current) return;
      const mins = (Date.now() - startTimeRef.current) / 60000;
      setMetrics((m) => ({ ...m, durationMin: Math.max(0, mins) }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Polling when focused
  useFocusEffect(useCallback(() => {
    if (!chargeBoxId) return () => {};
    setActive(true);
    fetchSnapshot();
    fetchDetails();
    // Start polling snapshot every 6–8s
    const intervalSnap = setInterval(fetchSnapshot, 7000);
    snapshotPollRef.current = intervalSnap as any;

    // Start polling charger details faster while charging
    const doPollDetails = async () => {
      const pollMs = isCharging ? 2500 : 10000;
      const det = await ChargerService.getChargerDetails(chargeBoxId).catch(() => null as any);
      if (det) setDetails(det);
      // NB: metrics telemetry not yet wired; keep zeros until backend provides
    };
    const intervalDetails = setInterval(doPollDetails, 3000); // will adapt inside
    chargerPollRef.current = intervalDetails as any;

    return () => {
      setActive(false);
      clearTimers();
    };
  }, [chargeBoxId, isCharging, fetchSnapshot, fetchDetails, clearTimers]));

  const pullToRefresh = useCallback(async () => {
    await Promise.all([fetchSnapshot(), fetchDetails()]);
  }, [fetchSnapshot, fetchDetails]);

  return {
    // data
    details,
    snapshot,
    metrics,
    progressPct,

    // ui flags
    ui,

    // controls
    start,
    stop,
    pullToRefresh,
    setIdTag,

    // state
    commandLoading,
    lastCommandId,
    active,
  };
}