import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileService, { Me } from '../services/profileService';
import { STORAGE_KEYS } from '../constants';
import { Telemetry } from '../lib/telemetry';

interface ProfileStore extends Readonly<{
  me?: Me | null;
  loading: boolean;
  error?: string;
}>
{
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
  updateLanguage: (lang: Me['language']) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  me: null,
  loading: false,
  error: undefined,

  fetchMe: async () => {
    set({ loading: true, error: undefined });
    try {
      const me = await ProfileService.getMe();
      set({ me, loading: false });
      await AsyncStorage.setItem('@profile_me', JSON.stringify(me));
    } catch (e) {
      // Fallback: try local cache
      try {
        const cached = await AsyncStorage.getItem('@profile_me');
        if (cached) {
          set({ me: JSON.parse(cached), loading: false });
          return;
        }
      } catch {}
      // Dev fallback: populate mock profile when API is offline (web preview)
      try {
        const isDev = (process.env.NODE_ENV !== 'production');
        const allowMock = isDev || process.env.EXPO_PUBLIC_DEV_ENABLE_MOCKS === 'true';
        if (allowMock) {
          const mock: Me = {
            userId: 'Go250922150835958',
            name: 'José Roberto',
            favoritesCount: 2,
            avatarUrl: null,
            language: 'pt-BR',
          };
          set({ me: mock, loading: false, error: undefined });
          await AsyncStorage.setItem('@profile_me', JSON.stringify(mock));
          return;
        }
      } catch {}
      set({ error: e instanceof Error ? e.message : 'Falha ao carregar perfil', loading: false });
    }
  },

  logout: async () => {
    try {
      await ProfileService.logout();
    } catch {}
    try {
      await AsyncStorage.multiRemove(['@profile_me', STORAGE_KEYS.USER_PREFERENCES]);
    } catch {}
    set({ me: null });
    Telemetry.track('auth.logout');
  },

  updateLanguage: async (lang) => {
    set({ loading: true });
    try {
      const updated = await ProfileService.updateLanguage(lang);
      set({ me: updated, loading: false });
      await AsyncStorage.setItem('@profile_me', JSON.stringify(updated));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Falha ao atualizar idioma', loading: false });
    }
  },
}));

export default useProfileStore;