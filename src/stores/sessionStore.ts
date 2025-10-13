import { create } from 'zustand';
import { ChargingSession } from '../types';

interface SessionStore {
  currentSession: ChargingSession | null;
  isPolling: boolean;
  pollingInterval: NodeJS.Timeout | null;
  
  // Actions
  setCurrentSession: (session: ChargingSession | null) => void;
  updateSessionMetrics: (metrics: Partial<ChargingSession>) => void;
  startPolling: (sessionId: string, onUpdate: (session: ChargingSession) => void) => void;
  stopPolling: () => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  currentSession: null,
  isPolling: false,
  pollingInterval: null,

  setCurrentSession: (currentSession: ChargingSession | null) => {
    set({ currentSession });
  },

  updateSessionMetrics: (metrics: Partial<ChargingSession>) => {
    const { currentSession } = get();
    if (currentSession) {
      set({
        currentSession: {
          ...currentSession,
          ...metrics,
        },
      });
    }
  },

  startPolling: (sessionId: string, onUpdate: (session: ChargingSession) => void) => {
    const { pollingInterval } = get();
    
    // Clear existing interval if any
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        // This would be replaced with actual API call
        // const response = await sessionApi.getStatus(sessionId);
        // onUpdate(response.data);
        
        // Mock update for now
        const { currentSession } = get();
        if (currentSession && currentSession.status === 'charging') {
          const updatedSession: ChargingSession = {
            ...currentSession,
            energyKWh: currentSession.energyKWh + 0.1,
            totalAmount: currentSession.totalAmount + (0.1 * currentSession.unitPrice),
            duration: currentSession.duration + 0.05, // 3 seconds in minutes
          };
          onUpdate(updatedSession);
        }
      } catch (error) {
        console.error('Error polling session status:', error);
      }
    }, 3000); // Poll every 3 seconds

    set({ 
      isPolling: true, 
      pollingInterval: interval 
    });
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ 
        isPolling: false, 
        pollingInterval: null 
      });
    }
  },

  clearSession: () => {
    get().stopPolling();
    set({ currentSession: null });
  },
}));