import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Station, DistanceFilter } from '../types';
import { STORAGE_KEYS } from '../constants';

interface StationStore {
  stations: Station[];
  filteredStations: Station[];
  favorites: string[];
  searchQuery: string;
  distanceFilter: DistanceFilter;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setStations: (stations: Station[]) => void;
  setSearchQuery: (query: string) => void;
  setDistanceFilter: (filter: DistanceFilter) => void;
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
  distanceFilter: 100,
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

  setDistanceFilter: (distanceFilter: DistanceFilter) => {
    set({ distanceFilter });
    get().filterStations();
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
    const { stations, searchQuery, distanceFilter } = get();
    
    let filtered = stations.filter(station => {
      // Distance filter
      if (station.distance && station.distance > distanceFilter) {
        return false;
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
}));