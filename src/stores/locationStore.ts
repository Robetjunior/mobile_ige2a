import { create } from 'zustand';
import * as Location from 'expo-location';
import { LocationState } from '../types';

interface LocationStore extends LocationState {
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<void>;
  setLocation: (latitude: number, longitude: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  // Fallback padrão: Rua Domingos Rodrigues 547, Lapa - SP
  latitude: -23.5231248,
  longitude: -46.7073544,
  hasPermission: false,
  isLoading: false,

  requestPermission: async () => {
    try {
      set({ isLoading: true });
      const { status } = await Location.requestForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      set({ hasPermission, isLoading: false });
      return hasPermission;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      set({ hasPermission: false, isLoading: false });
      return false;
    }
  },

  getCurrentLocation: async () => {
    const { hasPermission, isLoading } = get();
    
    // Prevent multiple simultaneous calls
    if (isLoading) return;
    
    if (!hasPermission) {
      const granted = await get().requestPermission();
      if (!granted) return;
    }

    try {
      set({ isLoading: true });
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000, // 10 second timeout
      });
      
      set({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      // Keep default location (São Paulo) if location fails
      set({ isLoading: false });
    }
  },

  setLocation: (latitude: number, longitude: number) => {
    set({ latitude, longitude });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },
}));