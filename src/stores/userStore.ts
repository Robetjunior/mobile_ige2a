import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { STORAGE_KEYS } from '../constants';

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'pt-BR' | 'en';
}

interface UserStore {
  user: User | null;
  preferences: UserPreferences;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  signOut: () => Promise<void>;
  loadUserData: () => Promise<void>;
  savePreferences: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  preferences: {
    theme: 'auto',
    language: 'pt-BR',
  },
  isAuthenticated: false,
  isLoading: false,

  setUser: (user: User | null) => {
    set({ 
      user, 
      isAuthenticated: !!user 
    });
  },

  setPreferences: async (newPreferences: Partial<UserPreferences>) => {
    const { preferences } = get();
    const updatedPreferences = { ...preferences, ...newPreferences };
    
    set({ preferences: updatedPreferences });
    await get().savePreferences();
  },

  signOut: async () => {
    try {
      // Clear user data from storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_PREFERENCES,
        // Add other user-related keys here
      ]);
      
      set({ 
        user: null, 
        isAuthenticated: false,
        preferences: {
          theme: 'auto',
          language: 'pt-BR',
        }
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  loadUserData: async () => {
    try {
      set({ isLoading: true });
      
      // Load user preferences
      const preferencesJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (preferencesJson) {
        const preferences = JSON.parse(preferencesJson);
        set({ preferences });
      }
      
      // Mock user data - in real app, this would check for stored auth token
      const mockUser: User = {
        id: 'Go250922150835958',
        name: 'Jose Roberto',
        email: 'jose.roberto@example.com',
      };
      
      set({ 
        user: mockUser, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      set({ isLoading: false });
    }
  },

  savePreferences: async () => {
    try {
      const { preferences } = get();
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES, 
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  },
}));