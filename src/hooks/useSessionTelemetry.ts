import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import type { ActiveSessionResponse, SessionTelemetryProgress, SessionTelemetryState } from '../types';

interface UseSessionTelemetryOptions {
  chargeBoxId: string | null;
  pollingInterval?: number; // milliseconds, default 3000 (3 seconds)
  enabled?: boolean; // default true
}

export function useSessionTelemetry({
  chargeBoxId,
  pollingInterval = 3000,
  enabled = true
}: UseSessionTelemetryOptions) {
  const [state, setState] = useState<SessionTelemetryState>({
    activeSession: null,
    progress: null,
    isPolling: false,
    error: null
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Fetch active session for the chargeBoxId
  const fetchActiveSession = useCallback(async (cbId: string): Promise<ActiveSessionResponse | null> => {
    try {
      const response = await api.get(`/v1/sessions/active/${cbId}`);
      return response.data || null;
    } catch (error: any) {
      // If no active session, API might return 404 - this is normal
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }, []);

  // Fetch telemetry progress for a transaction
  const fetchProgress = useCallback(async (transactionId: string): Promise<SessionTelemetryProgress | null> => {
    try {
      const response = await api.get(`/v1/sessions/${transactionId}/progress`);
      return response.data || null;
    } catch (error: any) {
      // If session not found, API might return 404
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }, []);

  // Main polling function
  const poll = useCallback(async () => {
    if (!chargeBoxId || !enabled || !mountedRef.current) return;

    try {
      setState(prev => ({ ...prev, error: null }));

      // Step 1: Get active session
      const activeSession = await fetchActiveSession(chargeBoxId);
      
      if (!mountedRef.current) return;

      if (!activeSession) {
        // No active session
        setState(prev => ({
          ...prev,
          activeSession: null,
          progress: null,
          isPolling: false
        }));
        return;
      }

      // Step 2: Get progress for the active session
      const progress = await fetchProgress(activeSession.transactionId);
      
      if (!mountedRef.current) return;

      setState(prev => ({
        ...prev,
        activeSession,
        progress,
        isPolling: true
      }));

    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error('Session telemetry polling error:', error);
      setState(prev => ({
        ...prev,
        error: error?.message || 'Failed to fetch session telemetry',
        isPolling: false
      }));
    }
  }, [chargeBoxId, enabled, fetchActiveSession, fetchProgress]);

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
    intervalRef.current = setInterval(poll, pollingInterval);
    
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