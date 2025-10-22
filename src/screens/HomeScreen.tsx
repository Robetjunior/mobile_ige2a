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
import { SearchBar } from '../components/SearchBar';
import { useLocation } from '../hooks/useLocation';
import { useStationStore } from '../stores/stationStore';
import { useSessionStore } from '../stores/sessionStore';
import { Station, DistanceFilter, OnlineChargerItem } from '../types';
import { COLORS, SIZES, MAP_DEFAULTS, STORAGE_KEYS } from '../constants';
import { SkeletonList } from '../components/record/SkeletonList';
import ChargerService from '../services/chargerService';
import { Telemetry } from '../lib/telemetry';
import OnlineChargerCard from '../components/OnlineChargerCard';
import { RecentDrawer, RecentItem } from '../components/RecentDrawer';
import RadiusChips from '../components/RadiusChips';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, TextInput, Switch } from 'react-native';
import { HomeMenuSheet } from '../components/HomeMenuSheet';
import { useHomeMenuStore } from '../stores/homeMenuStore';

type RootStackParamList = {
  StationDetail: { stationId: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.6;
// No web, a lista pode ocupar mais área para leitura
const LIST_HEIGHT = Platform.OS === 'web' ? SCREEN_HEIGHT * 0.7 : SCREEN_HEIGHT * 0.45;

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);
  // Inicia expandida no web para garantir visibilidade imediata
  const listAnimatedValue = useRef(new Animated.Value(Platform.OS === 'web' ? 1 : 0)).current;
  
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
    // new store flags
    favoritesOnly,
    freeParkingOnly,
    idleOnly,
    setFavoritesOnly,
    setFreeParkingOnly,
    setIdleOnly,
    loadHomeFilters,
  } = useStationStore();
  const { currentSession } = useSessionStore();


  const { open: openHomeMenu, menuEnabledV2 } = useHomeMenuStore();
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [recentsVisible, setRecentsVisible] = useState(false);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [isListExpanded, setIsListExpanded] = useState(Platform.OS === 'web');
  const [mapRegion, setMapRegion] = useState<MapRegion>(MAP_DEFAULTS.region);
  const [error, setError] = useState<string | null>(null);
  // Estado da lista online
  const [onlineItems, setOnlineItems] = useState<OnlineChargerItem[]>([]);
  const [onlineStations, setOnlineStations] = useState<Station[]>([]);
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
      await loadHomeFilters();
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
      // Primeiro tenta /v1/chargers/online (postos de carregamento)
      const stations = await ChargerService.getOnlineChargers();
      setOnlineStations(stations);
      setOnlineTotal(stations.length);
      setPage(1);
    } catch (error) {
      console.warn('getOnlineChargers falhou, usando fallback de OCPP online', error);
      try {
        // Fallback: usa OCPP WS online e enriquece com detalhes quando possível
        const fallback = await ChargerService.getOnlineStationsNow();
        setOnlineStations(fallback);
        setOnlineTotal(fallback.length);
        setPage(1);
      } catch (err2) {
        console.error('Error loading online status list (fallback):', err2);
        setError('Erro ao carregar lista online. Tente novamente.');
      }
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

  const loadRecents = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.RECENTS);
      const arr: RecentItem[] = raw ? JSON.parse(raw) : [];
      setRecents(arr);
    } catch {
      setRecents([]);
    }
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

  function sortStations(a: Station, b: Station) {
    const hasAvail = (s: Station) => (s.connectors || []).some((c) => (c.status || '').toLowerCase() === 'available');
    const pa = hasAvail(a) ? 0 : 1;
    const pb = hasAvail(b) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    const ta = (a.name || a.id).toLowerCase();
    const tb = (b.name || b.id).toLowerCase();
    return ta.localeCompare(tb);
  }

  const handleStationPress = (station: Station) => {
    navigation.navigate('Charge' as never, { chargeBoxId: station.id } as never);
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
    navigation.navigate('Charge' as never, { chargeBoxId: station.id } as never);
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

  // Lista online ordenada com filtros (favoritesOnly/idleOnly)
  const sortedOnline = onlineStations
    .filter((it) => !favoritesOnly || favIds.includes(it.id))
    .filter((it) => !idleOnly || (it.connectors || []).length === 0 || (it.connectors || []).some((c) => (c.status || '').toLowerCase() === 'available'))
    .sort(sortStations);
  const visibleOnline = sortedOnline.slice(0, page * pageSize);

  const listHeight = listAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      (Platform.OS === 'web' ? LIST_HEIGHT * 0.4 : LIST_HEIGHT * 0.3),
      LIST_HEIGHT,
    ],
  });
  const placeholderOpacity = listAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <View style={styles.container}>
      {/* Header overlay com Search + filtros (Wow Charger style) */}
      <View style={styles.headerOverlay}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={'Digite termos de busca'}
          onRightPress={async () => {
            await loadRecents();
            setRecentsVisible(true);
          }}
          onRightPressWithAnchor={async (anchor) => { if (menuEnabledV2) { openHomeMenu(anchor); } else { await loadRecents(); setRecentsVisible(true); } }}
          rightIconName={'menu'}
        />
        <View style={styles.filtersSection}>
          <View style={styles.filtersHeaderRow}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setFiltersVisible(true)} style={styles.filtersHeaderLeft}>
              <Ionicons name="funnel" size={16} color={'#D5D8DC'} />
              <Text style={styles.filtersHeaderText}>Filtro</Text>
            </TouchableOpacity>
            <View style={styles.filtersDivider} />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setFavoritesOnly(!favoritesOnly)}
              style={styles.filtersHeaderRight}
            >
              <Ionicons name={favoritesOnly ? 'star' : 'star-outline'} size={16} color={'#D5D8DC'} />
              <Text style={styles.filtersHeaderText}>Favoritos</Text>
            </TouchableOpacity>
          </View>
          {/* Radius chips */}
          <RadiusChips value={distanceFilter as DistanceFilter} onChange={(d) => setDistanceFilter(d)} />
        </View>
      </View>
      <HomeMenuSheet />
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
          activeOpacity={0.85}
        >
          <Ionicons name="locate" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        {/* QR scanner FAB */}
        <TouchableOpacity
          style={styles.qrFab}
          onPress={() => {
            try {
              // @ts-ignore
              navigation.navigate('QRScanner');
            } catch {}
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="qr-code" size={24} color={COLORS.white} />
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
          <View style={{ paddingHorizontal: SIZES.padding, backgroundColor: COLORS.white }}>
            <SkeletonList count={6} />
          </View>
        ) : (
          <FlatList
            data={visibleOnline}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StationCard
                station={{ ...item, isFavorite: favIds.includes(item.id) }}
                onFavoritePress={() => toggleOnlineFavorite(item.id)}
                onPress={() => navigation.navigate('Charge' as never, { chargeBoxId: item.id } as never)}
              />
            )}
            style={styles.listBackground}
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
      <FilterModal
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        onConfirm={() => setFiltersVisible(false)}
        freeParkingOnly={freeParkingOnly}
        idleOnly={idleOnly}
        onToggleFreeParking={() => setFreeParkingOnly(!freeParkingOnly)}
        onToggleIdle={() => setIdleOnly(!idleOnly)}
      />

      <RecentDrawer
        visible={recentsVisible}
        onClose={() => setRecentsVisible(false)}
        items={recents}
        onSelect={(item) => {
          setRecentsVisible(false);
          try {
            // @ts-ignore
            navigation.navigate('Charge' as never, { chargeBoxId: item.chargeBoxId } as never);
          } catch {}
        }}
      />

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
    bottom: Platform.OS === 'web' ? 84 : 24,
    left: '50%',
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.textPrimary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 5,
  },
  qrFab: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 84 : 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 6,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 20 : 8,
    paddingBottom: 8,
    backgroundColor: '#3D3F45',
    zIndex: 6,
  },
  filtersSection: {
    paddingHorizontal: SIZES.md,
    paddingTop: 6,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  filtersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 as any,
  },
  filtersHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 as any,
  },
  filtersHeaderText: {
    color: '#D5D8DC',
    fontSize: SIZES.fontSM,
    fontWeight: '600',
  },
  filtersDivider: {
    height: 16,
    width: 1,
    backgroundColor: '#D5D8DC',
    opacity: 0.6,
  },
  distanceRow: {
    flexDirection: 'row',
    gap: 8 as any,
    paddingTop: 6,
    paddingBottom: 8,
  },
  distanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.textLight,
    backgroundColor: 'transparent',
  },
  distanceChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  distanceChipText: {
    marginLeft: 6,
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: SIZES.fontSM,
  },
  distanceChipTextActive: {
    color: COLORS.background,
  },
  listContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'web' ? 70 : 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  listHeader: {
    alignItems: 'center',
    paddingVertical: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray + '20',
    backgroundColor: COLORS.white,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray,
    borderRadius: 2,
    marginBottom: SIZES.base / 2,
  },
  listContent: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  listBackground: {
    backgroundColor: COLORS.white,
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