import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActiveSessionResponse, SessionTelemetryProgress, SessionTelemetryState } from '../types';
import { fetchChargeDetail } from '../services/chargeProxy';

interface UseSessionTelemetryOptions {
  chargeBoxId: string | null;
  pollingInterval?: number; // milliseconds, default 3000 (3 seconds)
  enabled?: boolean; // default true
}

export function useSessionTelemetry({
  chargeBoxId,
  pollingInterval = 5000,
  enabled = true,
}: UseSessionTelemetryOptions) {
  const [state, setState] = useState<SessionTelemetryState>({
    activeSession: null,
    progress: null,
    isPolling: false,
    error: null
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Backoff state for 5xx errors
  const retryRef = useRef(0);
  const baseIntervalRef = useRef(pollingInterval);

  // Main polling function
  const poll = useCallback(async () => {
    if (!chargeBoxId || !enabled || !mountedRef.current) return;

    try {
      setState(prev => ({ ...prev, error: null }));
      const { activeSession, progress } = await fetchChargeDetail(chargeBoxId);
      if (!mountedRef.current) return;

      if (!activeSession || !progress) {
        // No active session: stop polling until enabled again
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setState(prev => ({
          ...prev,
          activeSession: null,
          progress: null,
          isPolling: false,
        }));
        retryRef.current = 0; // reset backoff
        return;
      }

      setState(prev => ({
        ...prev,
        activeSession,
        progress,
        isPolling: true,
      }));
      // Success: reset backoff and interval if needed
      if (retryRef.current !== 0 && baseIntervalRef.current) {
        retryRef.current = 0;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(poll, baseIntervalRef.current);
      }

    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error('Session telemetry polling error:', error);
      const msg = error?.message || 'Falha ao buscar telemetria da sessão';
      setState(prev => ({ ...prev, error: msg }));

      // Exponential backoff on 5xx by increasing interval: 5s -> 10s -> 20s
      const isServerError = /\b(5\d\d)\b/.test(msg) || /Backend error/.test(msg);
      if (isServerError) {
        retryRef.current = Math.min(2, retryRef.current + 1);
        const nextInterval = [baseIntervalRef.current, baseIntervalRef.current * 2, baseIntervalRef.current * 4][retryRef.current];
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(poll, nextInterval);
      }
    }
  }, [chargeBoxId, enabled]);

  // Start polling
  const startPolling = useCallback(() => {
    if (!chargeBoxId || !enabled) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial poll
    poll();

    // Set up interval
    baseIntervalRef.current = pollingInterval;
    intervalRef.current = setInterval(poll, baseIntervalRef.current);
    
    setState(prev => ({ ...prev, isPolling: true }));
  }, [chargeBoxId, enabled, poll, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({ ...prev, isPolling: false }));
  }, []);

  // Effect to manage polling lifecycle
  useEffect(() => {
    if (chargeBoxId && enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [chargeBoxId, enabled, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (chargeBoxId && enabled) {
      poll();
    }
  }, [chargeBoxId, enabled, poll]);

  return {
    ...state,
    startPolling,
    stopPolling,
    refresh
  };
}