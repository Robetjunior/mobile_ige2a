import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useStationStore } from '../stores/stationStore';
import { useSessionStore } from '../stores/sessionStore';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Station, Connector } from '../types';
import { COLORS, SIZES } from '../constants';
import { apiService } from '../services/api';

type RootStackParamList = {
  StationDetail: { stationId: string };
  Charge: undefined;
};

type StationDetailRouteProp = RouteProp<RootStackParamList, 'StationDetail'>;
type StationDetailNavigationProp = StackNavigationProp<RootStackParamList>;

export const StationDetailScreen = () => {
  const route = useRoute<StationDetailRouteProp>();
  const navigation = useNavigation<StationDetailNavigationProp>();
  const { stationId } = route.params;

  const { getStationById, toggleFavorite } = useStationStore();
  const { setCurrentSession } = useSessionStore();
  
  const [station, setStation] = useState<Station | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStationDetails();
  }, [stationId]);

  const loadStationDetails = async () => {
    // First try to get from store
    const storeStation = getStationById(stationId);
    if (storeStation) {
      setStation(storeStation);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Then fetch fresh data from API
    try {
      const response = await apiService.getStationById(stationId);
      if (response.success) {
        setStation(response.data);
      } else {
        setError('Estação não encontrada');
      }
    } catch (error) {
      console.error('Error loading station details:', error);
      setError('Falha ao carregar detalhes da estação. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCharging = async (connector: Connector) => {
    if (connector.status !== 'available') {
      Alert.alert('Conector Indisponível', 'Este conector não está disponível no momento.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.startSession(stationId, connector.id);
      if (response.success) {
        setCurrentSession(response.data);
        navigation.navigate('Charge');
        Alert.alert('Sucesso', 'Sessão de carregamento iniciada!');
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível iniciar o carregamento');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na comunicação com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = () => {
    if (!station) return;

    const url = Platform.select({
      ios: `maps:0,0?q=${station.latitude},${station.longitude}`,
      android: `geo:0,0?q=${station.latitude},${station.longitude}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir o aplicativo de mapas');
      });
    }
  };

  const handleFavoriteToggle = () => {
    if (station) {
      toggleFavorite(station.id);
      setStation({ ...station, isFavorite: !station.isFavorite });
    }
  };

  const getConnectorIcon = (type: string) => {
    switch (type) {
      case 'Type2':
        return 'flash';
      case 'CCS':
        return 'flash-outline';
      case 'CHAdeMO':
        return 'battery-charging';
      default:
        return 'flash';
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponível';
      case 'occupied':
        return 'Ocupado';
      case 'offline':
        return 'Offline';
      default:
        return 'Desconhecido';
    }
  };

  if (isLoading && !station) {
    return (
      <LoadingSpinner 
        text="Carregando detalhes da estação..." 
        overlay 
      />
    );
  }

  if (error && !station) {
    return (
      <ErrorMessage
        title="Erro ao carregar estação"
        message={error}
        onRetry={loadStationDetails}
      />
    );
  }

  if (!station) {
    return (
      <ErrorMessage
        title="Estação não encontrada"
        message="A estação solicitada não foi encontrada."
        onRetry={loadStationDetails}
      />
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.stationName}>{station.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(station.status) }]}>
            <Text style={styles.statusText}>{getStatusText(station.status)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleFavoriteToggle} style={styles.favoriteButton}>
          <Ionicons
            name={station.isFavorite ? 'heart' : 'heart-outline'}
            size={28}
            color={station.isFavorite ? COLORS.error : COLORS.gray}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color={COLORS.gray} />
          <Text style={styles.address}>{station.address}</Text>
        </View>
        
        {station.distance && (
          <View style={styles.infoRow}>
            <Ionicons name="car" size={20} color={COLORS.gray} />
            <Text style={styles.infoText}>{station.distance.toFixed(1)} km de distância</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="flash" size={20} color={COLORS.gray} />
          <Text style={styles.infoText}>R$ {station.pricePerKWh.toFixed(2)} por kWh</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conectores</Text>
        {station.connectors.map((connector) => (
          <View key={connector.id} style={styles.connectorCard}>
            <View style={styles.connectorInfo}>
              <Ionicons
                name={getConnectorIcon(connector.type)}
                size={24}
                color={COLORS.primary}
              />
              <View style={styles.connectorDetails}>
                <Text style={styles.connectorType}>{connector.type}</Text>
                <Text style={styles.connectorPower}>{connector.power} kW</Text>
              </View>
              <View style={[styles.connectorStatus, { backgroundColor: getStatusColor(connector.status) }]}>
                <Text style={styles.connectorStatusText}>
                  {getStatusText(connector.status)}
                </Text>
              </View>
            </View>
            
            {connector.status === 'available' && (
              <TouchableOpacity
                style={[styles.startButton, isLoading && styles.disabledButton]}
                onPress={() => handleStartCharging(connector)}
                disabled={isLoading}
              >
                <Text style={styles.startButtonText}>
                  {isLoading ? 'Iniciando...' : 'Iniciar Carregamento'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Adicionais</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Horário de Funcionamento</Text>
          <Text style={styles.infoCardText}>24 horas por dia, 7 dias por semana</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Formas de Pagamento</Text>
          <Text style={styles.infoCardText}>Cartão de crédito, débito e aplicativo</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Regras de Uso</Text>
          <Text style={styles.infoCardText}>
            • Tempo máximo de carregamento: 4 horas{'\n'}
            • Estacionamento gratuito durante o carregamento{'\n'}
            • Multa por ocupação indevida: R$ 50,00
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
          <Ionicons name="navigate" size={20} color={COLORS.white} />
          <Text style={styles.navigateButtonText}>Como Chegar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    fontSize: SIZES.body2,
    color: COLORS.gray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  titleContainer: {
    flex: 1,
    marginRight: SIZES.base,
  },
  stationName: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SIZES.base,
  },
  statusBadge: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    borderRadius: SIZES.radius,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: SIZES.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: SIZES.base,
  },
  section: {
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  address: {
    flex: 1,
    fontSize: SIZES.body3,
    color: COLORS.black,
    marginLeft: SIZES.base,
    lineHeight: 20,
  },
  infoText: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    marginLeft: SIZES.base,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.padding,
  },
  connectorCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
  },
  connectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  connectorDetails: {
    flex: 1,
    marginLeft: SIZES.base,
  },
  connectorType: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.black,
  },
  connectorPower: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
  },
  connectorStatus: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    borderRadius: SIZES.radius / 2,
  },
  connectorStatusText: {
    fontSize: SIZES.caption,
    color: COLORS.white,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body2,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
  },
  infoCardTitle: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.base / 2,
  },
  infoCardText: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    lineHeight: 18,
  },
  actionButtons: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  navigateButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  navigateButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body2,
    fontWeight: '600',
    marginLeft: SIZES.base,
  },
});

export default StationDetailScreen;