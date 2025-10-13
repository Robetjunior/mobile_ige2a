import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useSessionStore } from '../stores/sessionStore';
import { usePolling } from '../hooks/usePolling';
import { ChargingSession } from '../types';
import { COLORS, SIZES } from '../constants';
import { apiService } from '../services/api';

type RootStackParamList = {
  Home: undefined;
  Record: undefined;
};

type ChargeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export const ChargeScreen = () => {
  const navigation = useNavigation<ChargeScreenNavigationProp>();
  const { currentSession, setCurrentSession, clearCurrentSession } = useSessionStore();
  const { startPolling, stopPolling, isPolling } = usePolling();
  
  const [isStoppingSession, setIsStoppingSession] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (currentSession) {
      startPolling();
      startPulseAnimation();
    }

    return () => {
      stopPolling();
    };
  }, [currentSession]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleStopCharging = () => {
    Alert.alert(
      'Parar Carregamento',
      'Tem certeza que deseja parar o carregamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Parar', style: 'destructive', onPress: stopCharging },
      ]
    );
  };

  const stopCharging = async () => {
    if (!currentSession) return;

    setIsStoppingSession(true);
    try {
      const response = await apiService.stopSession(currentSession.id);
      if (response.success) {
        stopPolling();
        clearCurrentSession();
        Alert.alert(
          'Carregamento Finalizado',
          'Sua sessão foi finalizada com sucesso!',
          [{ text: 'OK', onPress: () => navigation.navigate('Record') }]
        );
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível parar o carregamento');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na comunicação com o servidor');
    } finally {
      setIsStoppingSession(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'charging':
        return COLORS.success;
      case 'paused':
        return COLORS.warning;
      case 'error':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'charging':
        return 'Carregando';
      case 'paused':
        return 'Pausado';
      case 'error':
        return 'Erro';
      case 'completed':
        return 'Concluído';
      default:
        return 'Desconhecido';
    }
  };

  if (!currentSession) {
    return (
      <View style={styles.noSessionContainer}>
        <Ionicons name="flash-off" size={80} color={COLORS.gray} />
        <Text style={styles.noSessionTitle}>Nenhuma sessão ativa</Text>
        <Text style={styles.noSessionText}>
          Inicie uma sessão de carregamento em uma estação para ver os detalhes aqui.
        </Text>
        <TouchableOpacity
          style={styles.goHomeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.goHomeButtonText}>Encontrar Estações</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <Animated.View style={[styles.statusIndicator, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(currentSession.status) }]} />
          </Animated.View>
          <Text style={styles.statusText}>{getStatusText(currentSession.status)}</Text>
        </View>
        
        <View style={styles.stationInfo}>
          <Text style={styles.stationName}>{currentSession.stationName}</Text>
          <Text style={styles.connectorInfo}>
            {currentSession.connectorType} • {currentSession.connectorPower} kW
          </Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.primaryMetric}>
          <Text style={styles.primaryMetricValue}>
            {currentSession.energyDelivered.toFixed(1)}
          </Text>
          <Text style={styles.primaryMetricUnit}>kWh</Text>
          <Text style={styles.primaryMetricLabel}>Energia Entregue</Text>
        </View>

        <View style={styles.secondaryMetrics}>
          <View style={styles.metricCard}>
            <Ionicons name="time" size={24} color={COLORS.primary} />
            <Text style={styles.metricValue}>{formatTime(currentSession.duration)}</Text>
            <Text style={styles.metricLabel}>Tempo</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="flash" size={24} color={COLORS.primary} />
            <Text style={styles.metricValue}>{currentSession.currentPower.toFixed(1)} kW</Text>
            <Text style={styles.metricLabel}>Potência Atual</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="cash" size={24} color={COLORS.primary} />
            <Text style={styles.metricValue}>{formatCurrency(currentSession.cost)}</Text>
            <Text style={styles.metricLabel}>Custo</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="speedometer" size={24} color={COLORS.primary} />
            <Text style={styles.metricValue}>{currentSession.averagePower.toFixed(1)} kW</Text>
            <Text style={styles.metricLabel}>Potência Média</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Progresso do Carregamento</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${Math.min(currentSession.batteryLevel || 0, 100)}%` }
            ]} 
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>
            {currentSession.batteryLevel ? `${currentSession.batteryLevel}%` : 'N/A'}
          </Text>
          <Text style={styles.progressLabel}>100%</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Detalhes da Sessão</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ID da Sessão:</Text>
          <Text style={styles.detailValue}>{currentSession.id}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Início:</Text>
          <Text style={styles.detailValue}>
            {new Date(currentSession.startTime).toLocaleString('pt-BR')}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Preço por kWh:</Text>
          <Text style={styles.detailValue}>{formatCurrency(currentSession.pricePerKWh)}</Text>
        </View>

        {currentSession.estimatedEndTime && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Término Estimado:</Text>
            <Text style={styles.detailValue}>
              {new Date(currentSession.estimatedEndTime).toLocaleString('pt-BR')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.stopButton, isStoppingSession && styles.disabledButton]}
          onPress={handleStopCharging}
          disabled={isStoppingSession || currentSession.status === 'completed'}
        >
          <Ionicons name="stop" size={24} color={COLORS.white} />
          <Text style={styles.stopButtonText}>
            {isStoppingSession ? 'Parando...' : 'Parar Carregamento'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.secondaryButtonText}>Ver Mapa</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.connectionStatus}>
        <View style={styles.connectionIndicator}>
          <View style={[styles.connectionDot, { backgroundColor: isPolling ? COLORS.success : COLORS.error }]} />
          <Text style={styles.connectionText}>
            {isPolling ? 'Conectado' : 'Desconectado'}
          </Text>
        </View>
        <Text style={styles.lastUpdateText}>
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  noSessionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
    backgroundColor: COLORS.white,
  },
  noSessionTitle: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
  },
  noSessionText: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.padding * 2,
  },
  goHomeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  goHomeButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body2,
    fontWeight: '600',
  },
  header: {
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  statusIndicator: {
    marginRight: SIZES.base,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusText: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.black,
  },
  stationInfo: {
    marginLeft: SIZES.padding + 4,
  },
  stationName: {
    fontSize: SIZES.body2,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 2,
  },
  connectorInfo: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
  },
  metricsContainer: {
    padding: SIZES.padding,
  },
  primaryMetric: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  primaryMetricValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  primaryMetricUnit: {
    fontSize: SIZES.h3,
    color: COLORS.gray,
    marginTop: -8,
  },
  primaryMetricLabel: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    marginTop: SIZES.base,
  },
  secondaryMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  metricValue: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: SIZES.base / 2,
  },
  metricLabel: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  progressContainer: {
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  progressTitle: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.padding,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.base / 2,
  },
  progressLabel: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
  detailsContainer: {
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  detailsTitle: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.padding,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  detailLabel: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    flex: 1,
  },
  detailValue: {
    fontSize: SIZES.body3,
    color: COLORS.black,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  actionContainer: {
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  stopButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
  },
  stopButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body2,
    fontWeight: '600',
    marginLeft: SIZES.base,
  },
  secondaryButton: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.black,
    fontSize: SIZES.body2,
    fontWeight: '500',
  },
  connectionStatus: {
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    alignItems: 'center',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base / 2,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SIZES.base / 2,
  },
  connectionText: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
  lastUpdateText: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
});

export default ChargeScreen;