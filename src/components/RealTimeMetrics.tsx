import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SessionTelemetryProgress } from '../types';
import { COLORS } from '../constants';

interface RealTimeMetricsProps {
  progress: SessionTelemetryProgress | null;
  isPolling: boolean;
}

export default function RealTimeMetrics({ progress, isPolling }: RealTimeMetricsProps) {
  if (!progress) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Ionicons name="analytics-outline" size={32} color={COLORS.gray} />
          <Text style={styles.noDataText}>
            {isPolling ? 'Aguardando dados de telemetria...' : 'Nenhuma sessão ativa'}
          </Text>
        </View>
      </View>
    );
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatValue = (value: number | undefined, unit: string, decimals = 1): string => {
    if (value === undefined || value === null) return `-- ${unit}`;
    return `${value.toFixed(decimals)} ${unit}`;
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'R$ --';
    try {
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(value);
    } catch {
      return `R$ ${value.toFixed(2)}`;
    }
  };

  const formatTime = (isoString: string): string => {
    try {
      return new Date(isoString).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--:--';
    }
  };

  const metrics = [
    {
      label: 'Energia',
      value: formatValue(progress.kwh, 'kWh', 3),
      icon: 'flash-outline' as const,
      primary: true
    },
    {
      label: 'Duração',
      value: formatDuration(progress.duration_seconds),
      icon: 'time-outline' as const,
      primary: true
    },
    {
      label: 'Potência',
      value: formatValue(progress.power_kw, 'kW'),
      icon: 'speedometer-outline' as const,
      primary: true
    },
    {
      label: 'Tensão',
      value: formatValue(progress.voltage_v, 'V', 0),
      icon: 'analytics-outline' as const,
      primary: false
    },
    {
      label: 'Corrente',
      value: formatValue(progress.current_a, 'A'),
      icon: 'pulse-outline' as const,
      primary: false
    },
    {
      label: 'Temperatura',
      value: formatValue(progress.temperature_c, '°C', 0),
      icon: 'thermometer-outline' as const,
      primary: false
    }
  ];

  const primaryMetrics = metrics.filter(m => m.primary);
  const secondaryMetrics = metrics.filter(m => !m.primary);

  return (
    <View style={styles.container}>
      {/* Status indicator */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, isPolling && styles.statusDotActive]} />
        <Text style={styles.statusText}>
          {isPolling ? 'Dados em tempo real' : 'Dados estáticos'}
        </Text>
        <Text style={styles.startTime}>
          Iniciado às {formatTime(progress.started_at)}
        </Text>
      </View>

      {/* Primary metrics - larger cards */}
      <View style={styles.primaryRow}>
        {primaryMetrics.map((metric, index) => (
          <View key={index} style={styles.primaryCard}>
            <View style={styles.metricHeader}>
              <Ionicons name={metric.icon} size={16} color={COLORS.primary} />
              <Text style={styles.primaryLabel}>{metric.label}</Text>
            </View>
            <Text style={styles.primaryValue}>{metric.value}</Text>
          </View>
        ))}
      </View>

      {/* Secondary metrics - smaller cards */}
      <View style={styles.secondaryRow}>
        {secondaryMetrics.map((metric, index) => (
          <View key={index} style={styles.secondaryCard}>
            <View style={styles.metricHeader}>
              <Ionicons name={metric.icon} size={14} color="#6B7280" />
              <Text style={styles.secondaryLabel}>{metric.label}</Text>
            </View>
            <Text style={styles.secondaryValue}>{metric.value}</Text>
          </View>
        ))}
      </View>

      {/* SoC indicator if available */}
      {progress.soc_percent_at !== undefined && (
        <View style={styles.socContainer}>
          <View style={styles.socHeader}>
            <Ionicons name="battery-charging-outline" size={16} color={COLORS.primary} />
            <Text style={styles.socLabel}>Estado de Carga (SoC)</Text>
          </View>
          <View style={styles.socBar}>
            <View 
              style={[
                styles.socFill, 
                { width: `${Math.min(100, Math.max(0, progress.soc_percent_at))}%` }
              ]} 
            />
            <Text style={styles.socText}>{progress.soc_percent_at}%</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noDataText: {
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  startTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  primaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  primaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  primaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  primaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 4,
  },

  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  secondaryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  secondaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  secondaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 2,
  },

  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  socContainer: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  socHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  socLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  socBar: {
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  socText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    zIndex: 1,
  },
});