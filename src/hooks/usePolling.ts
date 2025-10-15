import { useEffect, useRef } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { apiService } from '../services/api';

export const usePolling = (sessionId: string | null, enabled: boolean = true) => {
  const { 
    currentSession, 
    updateSessionMetrics, 
    startPolling, 
    stopPolling 
  } = useSessionStore();
  
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!sessionId || !enabled || !currentSession) {
      stopPolling();
      return;
    }

    const handleSessionUpdate = async (updatedSession: any) => {
      try {
        // In a real app, this would be the API response
        const response = await apiService.getSessionStatus(sessionId);
        
        if (response.success) {
          updateSessionMetrics(response.data);
          retryCountRef.current = 0; // Reset retry count on success
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error('Polling error:', error);
        retryCountRef.current += 1;
        
        if (retryCountRef.current >= maxRetries) {
          console.error('Max retries reached, stopping polling');
          stopPolling();
        }
      }
    };

    startPolling(sessionId, handleSessionUpdate);

    return () => {
      stopPolling();
    };
  }, [sessionId, enabled, currentSession, startPolling, stopPolling, updateSessionMetrics]);

  return {
    isPolling: useSessionStore(state => state.isPolling),
    retryCount: retryCountRef.current,
  };
};