import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Station, DistanceFilter } from '../types';
import { STORAGE_KEYS, DISTANCE_FILTERS } from '../constants';

interface StationStore {
  stations: Station[];
  filteredStations: Station[];
  favorites: string[];
  searchQuery: string;
  distanceFilter: DistanceFilter;
  // Wow Charger filter toggles
  favoritesOnly: boolean;
  freeParkingOnly: boolean;
  idleOnly: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setStations: (stations: Station[]) => void;
  setSearchQuery: (query: string) => void;
  setDistanceFilter: (filter: DistanceFilter) => Promise<void>;
  setFavoritesOnly: (value: boolean) => Promise<void>;
  setFreeParkingOnly: (value: boolean) => Promise<void>;
  setIdleOnly: (value: boolean) => Promise<void>;
  loadHomeFilters: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleFavorite: (stationId: string) => Promise<void>;
  loadFavorites: () => Promise<void>;
  filterStations: () => void;
  getStationById: (id: string) => Station | undefined;
}

export const useStationStore = create<StationStore>((set, get) => ({
  stations: [],
  filteredStations: [],
  favorites: [],
  searchQuery: '',
  distanceFilter: DISTANCE_FILTERS[1],
  favoritesOnly: false,
  freeParkingOnly: false,
  idleOnly: false,
  isLoading: false,
  error: null,

  setStations: (stations: Station[]) => {
    const { favorites } = get();
    const stationsWithFavorites = stations.map(station => ({
      ...station,
      isFavorite: favorites.includes(station.id),
    }));
    
    set({ stations: stationsWithFavorites });
    get().filterStations();
  },

  setSearchQuery: (searchQuery: string) => {
    set({ searchQuery });
    get().filterStations();
  },

  setDistanceFilter: async (distanceFilter: DistanceFilter) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HOME_RADIUS, String(distanceFilter));
    } catch {}
    set({ distanceFilter });
    get().filterStations();
  },

  setFavoritesOnly: async (value: boolean) => {
    const current = await get()._readFilters();
    const next = { ...current, favoritesOnly: value };
    await get()._writeFilters(next);
    set({ favoritesOnly: value });
    get().filterStations();
  },

  setFreeParkingOnly: async (value: boolean) => {
    const current = await get()._readFilters();
    const next = { ...current, freeParkingOnly: value };
    await get()._writeFilters(next);
    set({ freeParkingOnly: value });
    get().filterStations();
  },

  setIdleOnly: async (value: boolean) => {
    const current = await get()._readFilters();
    const next = { ...current, idleOnly: value };
    await get()._writeFilters(next);
    set({ idleOnly: value });
    get().filterStations();
  },

  loadHomeFilters: async () => {
    try {
      const [filtersJson, radiusStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HOME_FILTERS),
        AsyncStorage.getItem(STORAGE_KEYS.HOME_RADIUS),
      ]);
      const saved = filtersJson ? JSON.parse(filtersJson) : {};
      const favoritesOnly = !!saved.favoritesOnly;
      const freeParkingOnly = !!saved.freeParkingOnly;
      const idleOnly = !!saved.idleOnly;
      const radiusNum = Number(radiusStr || DISTANCE_FILTERS[1]);
      const radius: DistanceFilter = (DISTANCE_FILTERS as number[]).includes(radiusNum) ? (radiusNum as DistanceFilter) : DISTANCE_FILTERS[1];
      set({ favoritesOnly, freeParkingOnly, idleOnly, distanceFilter: radius });
      get().filterStations();
    } catch (e) {
      set({ favoritesOnly: false, freeParkingOnly: false, idleOnly: false, distanceFilter: DISTANCE_FILTERS[1] });
    }
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  toggleFavorite: async (stationId: string) => {
    const { favorites, stations } = get();
    let newFavorites: string[];
    
    if (favorites.includes(stationId)) {
      newFavorites = favorites.filter(id => id !== stationId);
    } else {
      newFavorites = [...favorites, stationId];
    }
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavorites));
      
      const updatedStations = stations.map(station => ({
        ...station,
        isFavorite: newFavorites.includes(station.id),
      }));
      
      set({ 
        favorites: newFavorites, 
        stations: updatedStations 
      });
      get().filterStations();
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  },

  loadFavorites: async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      const favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
      set({ favorites });
    } catch (error) {
      console.error('Error loading favorites:', error);
      set({ favorites: [] });
    }
  },

  filterStations: () => {
    const { stations, searchQuery, distanceFilter, favoritesOnly, freeParkingOnly, idleOnly } = get();
    
    let filtered = stations.filter(station => {
      // Distance filter
      if (station.distance && station.distance > distanceFilter) {
        return false;
      }
      // Favorites-only filter
      if (favoritesOnly && !station.isFavorite) {
        return false;
      }
      // Free Parking-only filter
      if (freeParkingOnly && !station.freeParking) {
        return false;
      }
      // Idle-only filter: at least one connector available
      if (idleOnly) {
        const hasIdle = (station.connectors || []).some(c => (c.status || '').toLowerCase() === 'available');
        if (!hasIdle) return false;
      }
      
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          station.name.toLowerCase().includes(query) ||
          station.address.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
    
    // Sort by distance, then by favorites
    filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      
      const distanceA = a.distance || 0;
      const distanceB = b.distance || 0;
      return distanceA - distanceB;
    });
    
    set({ filteredStations: filtered });
  },

  getStationById: (id: string) => {
    const { stations } = get();
    return stations.find(station => station.id === id);
  },

  // Internal helpers to persist filters
  _readFilters: async (): Promise<{ favoritesOnly?: boolean; freeParkingOnly?: boolean; idleOnly?: boolean; }> => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.HOME_FILTERS);
      return json ? JSON.parse(json) : {};
    } catch {
      return {};
    }
  },
  _writeFilters: async (obj: { favoritesOnly?: boolean; freeParkingOnly?: boolean; idleOnly?: boolean; }) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HOME_FILTERS, JSON.stringify(obj));
    } catch {}
  },
}));