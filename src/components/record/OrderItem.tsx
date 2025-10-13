import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingSessionItem } from '../../types';

interface OrderItemProps {
  session: ChargingSessionItem;
  onPress?: (session: ChargingSessionItem) => void;
  formatCurrency: (amount: number) => string;
  formatEnergy: (kWh: number) => string;
  formatUnitPrice: (price: number) => string;
  formatDuration: (minutes: number) => string;
  getStatusColor: (status: ChargingSessionItem['status']) => string;
  getStatusLabel: (status: ChargingSessionItem['status']) => string;
}

export const OrderItem: React.FC<OrderItemProps> = ({
  session,
  onPress,
  formatCurrency,
  formatEnergy,
  formatUnitPrice,
  formatDuration,
  getStatusColor,
  getStatusLabel,
}) => {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = () => {
    if (!session.endedAt) return 0;
    
    const start = new Date(session.startedAt);
    const end = new Date(session.endedAt);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
  };

  const getConnectorInfo = () => {
    const connectorType = session.connectorType || 'CCS2';
    return `Conector ${session.connectorId} (${connectorType})`;
  };

  const duration = calculateDuration();
  const statusColor = getStatusColor(session.status);
  const statusLabel = getStatusLabel(session.status);

  const accessibilityLabel = `Sessão de carregamento na ${session.stationName}, 
    ${formatDateTime(session.startedAt)}, 
    ${formatEnergy(session.energyKWh)}, 
    ${formatCurrency(session.totalAmount)}, 
    status ${statusLabel}`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(session)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Toque para ver detalhes da sessão"
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.stationName} numberOfLines={1}>
            {session.stationName}
          </Text>
          <View style={[styles.statusChip, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.dateTimeContainer}>
        <Ionicons name="time-outline" size={14} color="#6C757D" />
        <Text style={styles.dateTime}>
          {formatDateTime(session.startedAt)}
          {session.endedAt && ` - ${formatDateTime(session.endedAt)}`}
        </Text>
        {duration > 0 && (
          <Text style={styles.duration}>
            • {formatDuration(duration)}
          </Text>
        )}
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metric}>
          <Ionicons name="flash-outline" size={16} color="#3498DB" />
          <Text style={styles.metricValue}>{formatEnergy(session.energyKWh)}</Text>
        </View>
        
        <View style={styles.metric}>
          <Ionicons name="cash-outline" size={16} color="#27AE60" />
          <Text style={styles.metricValue}>{formatCurrency(session.totalAmount)}</Text>
        </View>
        
        <View style={styles.metric}>
          <Ionicons name="pricetag-outline" size={16} color="#F39C12" />
          <Text style={styles.metricValue}>{formatUnitPrice(session.unitPrice)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.connectorInfo}>
          <Ionicons name="plug-outline" size={14} color="#6C757D" />
          <Text style={styles.connectorText}>{getConnectorInfo()}</Text>
        </View>
        
        <View style={styles.actionContainer}>
          <Text style={styles.actionText}>Ver detalhes</Text>
          <Ionicons name="chevron-forward" size={16} color="#6C757D" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    marginRight: 12,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  dateTime: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 6,
  },
  duration: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 6,
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  connectorText: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 6,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '500',
    marginRight: 4,
  },
});