import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, COLORS } from '../constants';
import { LOGGER } from '../lib/logger';
import { detectBrand, sanitizeDigits, formatExpToMonthYear, isExpValid, tokenize, CardBrand } from '../utils/cardValidation';

export type PaymentCard = {
  id: string;
  brand: CardBrand;
  last4: string;
  holder: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  label?: string;
};

export type NewCardInput = { number: string; holder: string; exp: string; cvc: string; cpf?: string; makeDefault?: boolean };

interface MyCardsActions {
  add: (i: NewCardInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
  rename: (id: string, label: string) => Promise<void>;
  load: () => Promise<void>;
}

interface MyCardsState {
  loading: boolean;
  items: PaymentCard[];
}

type CardsStore = MyCardsState & MyCardsActions;

const isWeb = typeof window !== 'undefined';

async function persist(items: PaymentCard[]) {
  try {
    const json = JSON.stringify(items);
    if (isWeb && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CARDS, json);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.CARDS, json);
    }
  } catch (e) {
    LOGGER.STORE.warn('cards.persist.failed', String(e));
  }
}

async function restore(): Promise<PaymentCard[]> {
  try {
    let json: string | null = null;
    if (isWeb && typeof localStorage !== 'undefined') {
      json = localStorage.getItem(STORAGE_KEYS.CARDS);
    } else {
      json = await AsyncStorage.getItem(STORAGE_KEYS.CARDS);
    }
    return json ? JSON.parse(json) : [];
  } catch (e) {
    LOGGER.STORE.warn('cards.restore.failed', String(e));
    return [];
  }
}

function delay(msMin = 300, msMax = 600) {
  const ms = Math.floor(Math.random() * (msMax - msMin + 1)) + msMin;
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export const useCardsStore = create<CardsStore>((set, get) => ({
  loading: false,
  items: [],

  load: async () => {
    set({ loading: true });
    const items = await restore();
    set({ items, loading: false });
  },

  add: async (i: NewCardInput) => {
    // Validate minimal server-side style to ensure integrity
    const pan = sanitizeDigits(i.number);
    const brand = detectBrand(pan);
    const exp = formatExpToMonthYear(i.exp);
    if (!exp || !isExpValid(exp.expMonth, exp.expYear)) {
      throw new Error('Validade inválida');
    }
    // Tokenize (mock) and derive last4
    const { last4 } = tokenize({ pan, expMonth: exp.expMonth, expYear: exp.expYear, cvv: i.cvc, name: i.holder, cpf: i.cpf });

    await delay();
    const id = `card_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    const items = get().items.slice();
    const isFirst = items.length === 0;
    const item: PaymentCard = {
      id,
      brand,
      last4,
      holder: i.holder.trim(),
      expMonth: exp.expMonth,
      expYear: exp.expYear,
      isDefault: isFirst ? true : !!i.makeDefault,
    };
    const newItems = [...items, item];
    // Ensure only one default
    if (item.isDefault) {
      for (let k = 0; k < newItems.length - 1; k++) newItems[k].isDefault = false;
    }
    await persist(newItems);
    set({ items: newItems });
    LOGGER.STORE.info('cards.add', { brand: item.brand, last4: item.last4 });
  },

  remove: async (id: string) => {
    await delay();
    const items = get().items.slice();
    const idx = items.findIndex(c => c.id === id);
    if (idx === -1) return;
    const wasDefault = items[idx].isDefault;
    items.splice(idx, 1);
    if (wasDefault && items.length) {
      // promote first as default
      items.forEach((c, i) => c.isDefault = i === 0);
    }
    await persist(items);
    set({ items });
    LOGGER.STORE.info('cards.remove', { id });
  },

  setDefault: async (id: string) => {
    await delay();
    const items = get().items.slice();
    let found = false;
    for (const c of items) {
      if (c.id === id) { c.isDefault = true; found = true; }
      else c.isDefault = false;
    }
    if (!found) return;
    await persist(items);
    set({ items });
    LOGGER.STORE.info('cards.setDefault', { id });
  },

  rename: async (id: string, label: string) => {
    await delay();
    const items = get().items.slice();
    const i = items.findIndex(c => c.id === id);
    if (i === -1) return;
    items[i].label = label.trim();
    await persist(items);
    set({ items });
    LOGGER.STORE.info('cards.rename', { id });
  },
}));