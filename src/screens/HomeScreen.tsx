import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Platform,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type MapView from 'react-native-maps';

// Types for map region
interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

import { FilterModal } from '../components/FilterModal';
import { StationCard } from '../components/StationCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { MapComponent } from '../components/MapComponent';
import { useLocation } from '../hooks/useLocation';
import { useStationStore } from '../stores/stationStore';
import { useSessionStore } from '../stores/sessionStore';
import { Station, DistanceFilter, OnlineChargerItem } from '../types';
import { COLORS, SIZES, MAP_DEFAULTS } from '../constants';
import { SkeletonList } from '../components/record/SkeletonList';
import ChargerService from '../services/chargerService';
import { Telemetry } from '../lib/telemetry';
import OnlineChargerCard from '../components/OnlineChargerCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, TextInput } from 'react-native';

type RootStackParamList = {
  StationDetail: { stationId: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.6;
const LIST_HEIGHT = SCREEN_HEIGHT * 0.4;

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);
  const listAnimatedValue = useRef(new Animated.Value(0)).current;
  
  const { location, hasPermission, requestPermission, getCurrentLocation } = useLocation();
  const {
    filteredStations,
    searchQuery,
    distanceFilter,
    isLoading,
    setStations,
    setSearchQuery,
    setDistanceFilter,
    setLoading,
    toggleFavorite,
    loadFavorites,
  } = useStationStore();
  const { currentSession } = useSessionStore();

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [mapRegion, setMapRegion] = useState<MapRegion>(MAP_DEFAULTS.region);
  const [error, setError] = useState<string | null>(null);
  // Estado da lista online
  const [onlineItems, setOnlineItems] = useState<OnlineChargerItem[]>([]);
  const [onlineTotal, setOnlineTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  // (Search e filtros rápidos removidos)

  // Favoritos locais por chargeBoxId
  const [favIds, setFavIds] = useState<string[]>([]);
  const FAV_KEY = 'ONLINE_FAVORITES';

  // Modal de início de sessão
  const [startVisible, setStartVisible] = useState(false);
  const [startChargeBoxId, setStartChargeBoxId] = useState<string | null>(null);
  const [startConnectorId, setStartConnectorId] = useState('');
  const [startIdTag, setStartIdTag] = useState('');
  const [isSubmittingStart, setIsSubmittingStart] = useState(false);
  

  useEffect(() => {
    initializeScreen();
    Telemetry.track('home.view');
  }, []);

  const initializeScreen = async () => {
    try {
      await loadFavorites();
      // Carrega favoritos da lista online e status dos CPs
      await loadOnlineFavs();
      await loadOnlineStatusList();
      
      // Update map region
      const newRegion = {
        ...mapRegion,
        latitude: location.latitude,
        longitude: location.longitude,
      };
      setMapRegion(newRegion);
      
      // Request location permission in background
      if (!hasPermission) {
        const granted = await requestPermission();
        if (granted) {
          // Atualiza localização (mapa) e recarrega lista
          await getCurrentLocation();
          await loadOnlineStatusList();
        }
      }
    } catch (error) {
      console.error('Error initializing screen:', error);
      setError('Erro ao carregar dados. Tente novamente.');
    }
  };

  const loadNearbyStations = async (lat?: number, lng?: number, radiusKm?: number) => {
    setLoading(true);
    setError(null);
    try {
      let stations: Station[] = [];
      try {
        stations = await ChargerService.getChargers(lat, lng, radiusKm);
      } catch (e) {
        // fallback: only online list if general fails
        stations = await ChargerService.getOnlineChargers();
      }
      setStations(stations);
    } catch (error) {
      console.error('Error loading stations:', error);
      setError('Erro ao carregar estações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadOnlineNowStations = async () => {
    setLoading(true);
    setError(null);
    try {
      const stations = await ChargerService.getOnlineStationsNow();
      setStations(stations);
    } catch (error) {
      console.error('Error loading online-now stations:', error);
      setError('Erro ao carregar estações online agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Nova lista: status online (WS + HB + status/conn)
  const loadOnlineStatusList = async () => {
    setLoading(true);
    setError(null);
    try {
      const { items, count } = await ChargerService.getOnlineStatusList(15, 50);
      setOnlineItems(items);
      setOnlineTotal(count);
      setPage(1);
    } catch (error) {
      console.error('Error loading online status list:', error);
      setError('Erro ao carregar lista online. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadOnlineFavs = async () => {
    try {
      const raw = await AsyncStorage.getItem(FAV_KEY);
      setFavIds(raw ? JSON.parse(raw) : []);
    } catch {}
  };

  const toggleOnlineFavorite = async (id: string) => {
    try {
      const next = favIds.includes(id) ? favIds.filter((x) => x !== id) : [...favIds, id];
      setFavIds(next);
      await AsyncStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch {}
  };

  const openStartSheet = (item: OnlineChargerItem) => {
    setStartChargeBoxId(item.chargeBoxId);
    const first = item.connectors?.[0]?.connectorId;
    setStartConnectorId(first ? String(first) : '');
    setStartIdTag('');
    setStartVisible(true);
  };

  const submitStart = async () => {
    if (!startChargeBoxId || !startConnectorId || !startIdTag) {
      Alert.alert('Dados incompletos', 'Informe connectorId e idTag.');
      return;
    }
    try {
      setIsSubmittingStart(true);
      await ChargerService.startBilling({
        chargeBoxId: startChargeBoxId,
        connectorId: startConnectorId,
        idTag: startIdTag,
      });
      setStartVisible(false);
      setStartIdTag('');
      setStartConnectorId('');
      // Após iniciar, navegar para /charge (aba Charge)
      // @ts-ignore
      navigation.navigate('Charge');
    } catch (e: any) {
      Alert.alert('Falha ao iniciar', String(e?.message || e));
    } finally {
      setIsSubmittingStart(false);
    }
  };

  const stopBilling = async (item: OnlineChargerItem) => {
    try {
      if (!item.lastTransactionId) {
        Alert.alert('Sem sessão ativa', 'Não há transação para encerrar.');
        return;
      }
      await ChargerService.closeBilling({
        chargeBoxId: item.chargeBoxId,
        transactionId: String(item.lastTransactionId),
      });
      Alert.alert('Sessão encerrada', 'A cobrança foi encerrada.');
      await loadOnlineStatusList();
    } catch (e: any) {
      Alert.alert('Falha ao parar', String(e?.message || e));
    }
  };

  function sortOnlineItems(a: OnlineChargerItem, b: OnlineChargerItem) {
    if (a.wsOnline !== b.wsOnline) return a.wsOnline ? -1 : 1;
    if (a.onlineRecently !== b.onlineRecently) return a.onlineRecently ? -1 : 1;
    const pref = (s?: string) => {
      const v = (s || '').toLowerCase();
      if (v === 'available') return 0;
      if (v === 'charging') return 1;
      return 2;
    };
    const pv = pref(a.lastStatus) - pref(b.lastStatus);
    if (pv !== 0) return pv;
    const ta = (a.name || a.chargeBoxId).toLowerCase();
    const tb = (b.name || b.chargeBoxId).toLowerCase();
    return ta.localeCompare(tb);
  }

  const handleStationPress = (station: Station) => {
    navigation.navigate('StationDetail', { stationId: station.id });
  };

  const handleMarkerPress = (station: Station) => {
    if (typeof station.latitude === 'number' && typeof station.longitude === 'number') {
      mapRef.current?.animateToRegion({
        latitude: station.latitude,
        longitude: station.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
    Telemetry.track('home.open_station', { stationId: station.id, source: 'marker' });
    navigation.navigate('StationDetail', { stationId: station.id });
  };

  const handleRegionChange = (region: MapRegion) => {
    setMapRegion(region);
    const bbox = {
      north: region.latitude + region.latitudeDelta / 2,
      south: region.latitude - region.latitudeDelta / 2,
      east: region.longitude + region.longitudeDelta / 2,
      west: region.longitude - region.longitudeDelta / 2,
    };
    Telemetry.track('home.map_move', { bbox });
  };

  const handleRecenterPress = () => {
    if (location) {
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      mapRef.current?.animateToRegion(newRegion);
      setMapRegion(newRegion);
    }
  };

  const toggleListExpansion = () => {
    const toValue = isListExpanded ? 0 : 1;
    Animated.spring(listAnimatedValue, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
    setIsListExpanded(!isListExpanded);
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'available':
        return COLORS.success;
      case 'occupied':
        return COLORS.warning;
      case 'offline':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  const displayedStations = filteredStations;

  // Lista online ordenada (sem busca/filtros)
  const sortedOnline = [...onlineItems].sort(sortOnlineItems);
  const visibleOnline = sortedOnline.slice(0, page * pageSize);

  const listHeight = listAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [LIST_HEIGHT * 0.3, LIST_HEIGHT],
  });

  return (
    <View style={styles.container}>
      {/* SearchBar removida */}
      {!hasPermission && (
        <View style={styles.permissionBanner}>
          <Ionicons name="location-outline" size={16} color={COLORS.gray} />
          <Text style={styles.permissionText}>
            Para precisão, permita a localização. Usando São Paulo por enquanto.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Permitir</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={[styles.map, styles.webMapPlaceholder]}>
            <Text style={styles.webMapText}>
              Mapa não disponível na versão web
            </Text>
            <Text style={styles.webMapSubtext}>
              Use o aplicativo móvel para visualizar o mapa
            </Text>
          </View>
        ) : (
          <MapComponent
            mapRef={mapRef}
            mapRegion={mapRegion}
            onRegionChangeComplete={handleRegionChange}
            hasPermission={hasPermission}
            stations={displayedStations}
            onMarkerPress={handleMarkerPress}
            getMarkerColor={getMarkerColor}
          />
        )}

        <TouchableOpacity
          style={styles.recenterButton}
          onPress={handleRecenterPress}
        >
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.listContainer, { height: listHeight }]}>
        <TouchableOpacity
          style={styles.listHeader}
          onPress={toggleListExpansion}
        >
          <View style={styles.dragHandle} />
          <Ionicons
            name={isListExpanded ? 'chevron-down' : 'chevron-up'}
            size={20}
            color={COLORS.gray}
          />
        </TouchableOpacity>

        {isLoading ? (
          <View style={{ paddingHorizontal: SIZES.padding }}>
            <SkeletonList count={6} />
          </View>
        ) : (
          <FlatList
            data={visibleOnline}
            keyExtractor={(item) => item.chargeBoxId}
            renderItem={({ item }) => (
              <OnlineChargerCard
                item={item}
                isFavorite={favIds.includes(item.chargeBoxId)}
                onToggleFavorite={() => toggleOnlineFavorite(item.chargeBoxId)}
                onDetails={() => navigation.navigate('StationDetail', { stationId: item.chargeBoxId })}
                onStart={() => openStartSheet(item)}
                onStop={() => stopBilling(item)}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.webMapSubtext}>Nenhum carregador encontrado</Text>
            }
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (visibleOnline.length < sortedOnline.length) setPage((p) => p + 1);
            }}
            contentContainerStyle={styles.listContent}
          />
        )}
      </Animated.View>
      {/* FilterModal removido */}

      {/* Bottom sheet iniciar sessão */}
      <Modal
        visible={startVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setStartVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Iniciar sessão</Text>
            <Text style={{ color: COLORS.gray, marginBottom: 8 }}>chargeBoxId: {startChargeBoxId}</Text>
            <TextInput
              placeholder="ConnectorId"
              keyboardType="number-pad"
              value={startConnectorId}
              onChangeText={setStartConnectorId}
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 8 }}
            />
            <TextInput
              placeholder="idTag"
              autoCapitalize="none"
              value={startIdTag}
              onChangeText={setStartIdTag}
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 16 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => setStartVisible(false)} style={{ padding: 12 }}>
                <Text style={{ color: COLORS.gray, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitStart}
                disabled={isSubmittingStart}
                style={{ backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, opacity: isSubmittingStart ? 0.6 : 1 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>{isSubmittingStart ? 'Enviando...' : 'Iniciar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  quickFilters: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.base,
    backgroundColor: COLORS.white,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray + '40',
    marginRight: 8,
    backgroundColor: COLORS.white,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.gray,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listContainer: {
    backgroundColor: COLORS.lightGray,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
  },
  listHeader: {
    alignItems: 'center',
    paddingVertical: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray + '20',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray,
    borderRadius: 2,
    marginBottom: SIZES.base / 2,
  },
  listContent: {
    paddingBottom: SIZES.padding * 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: SIZES.padding,
    marginTop: 6,
    marginBottom: SIZES.base,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  startButton: {
    backgroundColor: COLORS.primary,
  },
  stopButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonText: {
    color: COLORS.white,
    marginLeft: 6,
    fontWeight: '600',
  },
  webMapPlaceholder: {
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapText: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: SIZES.base,
  },
  webMapSubtext: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    textAlign: 'center',
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 as any,
    marginHorizontal: SIZES.padding,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  permissionText: {
    flex: 1,
    color: COLORS.gray,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default HomeScreen;