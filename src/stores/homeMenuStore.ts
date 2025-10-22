import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../constants';
import { LOGGER } from '../lib/logger';

export type AnchorRect = { x: number; y: number; width: number; height: number } | null;

interface HomeMenuState {
  isOpen: boolean;
  lastSelection: string | null;
  anchor: AnchorRect;
  menuEnabledV2: boolean;
  open: (anchor?: AnchorRect) => void;
  close: () => void;
  toggle: (anchor?: AnchorRect) => void;
  setAnchor: (anchor: AnchorRect) => void;
  setLastSelection: (id: string) => Promise<void>;
  loadLastSelection: () => Promise<void>;
  setMenuEnabledV2: (enabled: boolean) => void;
}

const isWeb = Platform.OS === 'web';

export const useHomeMenuStore = create<HomeMenuState>((set, get) => ({
  isOpen: false,
  lastSelection: null,
  anchor: null,
  menuEnabledV2: true,

  open: (anchor?: AnchorRect) => {
    if (anchor) set({ anchor });
    set({ isOpen: true });
    LOGGER.UI.info('homeMenu.open');
  },

  close: () => {
    set({ isOpen: false });
    LOGGER.UI.info('homeMenu.close');
  },

  toggle: (anchor?: AnchorRect) => {
    const { isOpen } = get();
    if (isOpen) {
      get().close();
    } else {
      get().open(anchor);
    }
  },

  setAnchor: (anchor: AnchorRect) => set({ anchor }),

  setLastSelection: async (id: string) => {
    try {
      set({ lastSelection: id });
      await AsyncStorage.setItem(STORAGE_KEYS.HOME_MENU_LAST_SELECTION, id);
      LOGGER.UI.info('homeMenu.select', { itemId: id });
    } catch (e) {
      LOGGER.STORE.warn('homeMenu.persist_last_selection.failed', String(e));
    }
  },

  loadLastSelection: async () => {
    try {
      const id = await AsyncStorage.getItem(STORAGE_KEYS.HOME_MENU_LAST_SELECTION);
      if (id) set({ lastSelection: id });
    } catch (e) {
      LOGGER.STORE.warn('homeMenu.restore_last_selection.failed', String(e));
    }
  },

  setMenuEnabledV2: (enabled: boolean) => set({ menuEnabledV2: enabled }),
}));