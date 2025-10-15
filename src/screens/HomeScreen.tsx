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
import HomeMap from '../components/HomeMap';
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
import { Modal, TextInput, Switch } from 'react-native';

type RootStackParamList = {
  StationDetail: { stationId: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.6;
const LIST_HEIGHT = SCREEN_HEIGHT * 0.45;

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
  const [startForce, setStartForce] = useState(false);
  

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

  // Nova lista: usa exclusivamente /v1/ocpp/online (sem sinceMinutes)
  const loadOnlineStatusList = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usa exclusivamente /v1/ocpp/online sem parâmetros para obter IDs WS online
      const ids = await ChargerService.getOcppOnlineIds();
      const items = ids.map((id) => ({
        chargeBoxId: id,
        wsOnline: true,
        onlineRecently: false,
        connectors: [],
        name: id,
      } as OnlineChargerItem));
      setOnlineItems(items);
      setOnlineTotal(items.length);
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
    const firstAvail = (item.connectors || []).find((c) => {
      const s = (c.status || '').toLowerCase();
      return s === 'available' || s === 'preparing';
    })?.connectorId;
    setStartConnectorId(firstAvail ? String(firstAvail) : '');
    setStartIdTag('');
    setStartForce(false);
    setStartVisible(true);
  };

  const submitStart = async () => {
    if (!startChargeBoxId || !startIdTag) {
      Alert.alert('Dados incompletos', 'Informe idTag. O connectorId é opcional.');
      return;
    }
    try {
      setIsSubmittingStart(true);
      const resp = await ChargerService.remoteStart(
        {
          chargeBoxId: startChargeBoxId,
          connectorId: startConnectorId || undefined,
          idTag: startIdTag.trim(),
        },
        { force: !!startForce }
      );
      const isDup = !!(resp && resp.idempotentDuplicate);
      if (isDup && !startForce) {
        Alert.alert('Comando já aberto', 'Já existe um comando igual aberto. Ative "Forçar reenvio" para enviar novamente.');
      } else {
        Alert.alert('Sucesso', startForce ? 'Comando enviado com force=1.' : 'Comando enviado.');
        setStartVisible(false);
        setStartIdTag('');
        setStartConnectorId('');
        setStartForce(false);
        // Após iniciar, navegar para /charge (aba Charge)
        // @ts-ignore
        navigation.navigate('Charge', { chargeBoxId: startChargeBoxId });
      }
    } catch (e: any) {
      Alert.alert('Falha ao iniciar', String(e?.message || e));
    } finally {
      setIsSubmittingStart(false);
    }
  };

  const stopBilling = async (item: OnlineChargerItem) => {
    try {
      let tx = item.lastTransactionId ?? null;
      if (tx == null) {
        tx = await ChargerService.getLastTransactionId(item.chargeBoxId);
      }
      if (tx == null) {
        // Fallback: consulta lista de sessões
        tx = await ChargerService.getActiveTransactionIdFromList(item.chargeBoxId);
      }
      if (tx == null) {
        Alert.alert('Sem sessão ativa', 'Não foi possível identificar a transação em andamento.');
        return;
      }
      const resp = await ChargerService.remoteStop({ transactionId: tx });
      if (resp?.status === 'pending' || resp?.pending) {
        Alert.alert('Comando pendente', 'CP offline ou a sessão já terminou. Aguarde processamento.');
      } else {
        Alert.alert('Sessão encerrada', 'A cobrança foi encerrada.');
      }
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
  const placeholderOpacity = listAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
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
          <View style={styles.map}>
            <HomeMap
              stations={displayedStations}
              onMarkerPress={handleMarkerPress}
              getMarkerColor={getMarkerColor}
            />
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
        {/* Bottom sheet sobre o mapa */}
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
                onPress={() => {
                  if (Platform.OS === 'web') {
                    try {
                      // Navegação direta por URL com query
                      const href = `/charge?chargeBoxId=${encodeURIComponent(item.chargeBoxId)}`;
                      (globalThis as any)?.window?.location?.assign
                        ? (globalThis as any).window.location.assign(href)
                        : ((globalThis as any).window.location.href = href);
                    } catch {
                      // Fallback para navegação nativa caso o ambiente web não esteja disponível
                      // @ts-ignore - navegando pela tab
                      navigation.navigate('Charge' as never, { chargeBoxId: item.chargeBoxId } as never);
                    }
                  } else {
                    // @ts-ignore - navegando pela tab
                    navigation.navigate('Charge' as never, { chargeBoxId: item.chargeBoxId } as never);
                  }
                }}
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
      </View>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              <Switch value={startForce} onValueChange={setStartForce} />
              <Text style={{ marginLeft: 8 }}>Forçar reenvio (force=1)</Text>
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
    flex: 1,
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
    zIndex: 1,
  },
  listContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.lightGray,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
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
    zIndex: 0,
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