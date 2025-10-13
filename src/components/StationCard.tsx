import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Station } from '../types';
import { COLORS, SIZES } from '../constants';

interface StationCardProps {
  station: Station;
  onPress: () => void;
  onFavoritePress: () => void;
}

export const StationCard: React.FC<StationCardProps> = ({
  station,
  onPress,
  onFavoritePress,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'available':
        return COLORS.success;
      case 'busy':
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
      case 'online':
        return 'Online';
      case 'available':
        return 'Disponível';
      case 'busy':
        return 'Ocupado';
      case 'occupied':
        return 'Ocupado';
      case 'offline':
        return 'Offline';
      default:
        return 'Desconhecido';
    }
  };

  const availableConnectors = station.connectors.filter(c => c.status === 'available').length;
  const pricePerKwh = station.connectors.reduce<number | undefined>((acc, c) => {
    if (typeof c.pricePerKwh === 'number') {
      return typeof acc === 'number' ? Math.min(acc, c.pricePerKwh) : c.pricePerKwh;
    }
    return acc;
  }, undefined);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {station.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(station.status) }]}>
            <Text style={styles.statusText}>
              {getStatusText(station.status)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onFavoritePress} style={styles.favoriteButton}>
          <Ionicons
            name={station.isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={station.isFavorite ? COLORS.error : COLORS.gray}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.address} numberOfLines={2}>
        {station.address}
      </Text>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="car" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>
            {availableConnectors}/{station.connectors.length} disponíveis
          </Text>
        </View>
        
        {typeof station.distance === 'number' && (
          <View style={styles.detailItem}>
            <Ionicons name="location" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>
              {station.distance.toFixed(1)} km
            </Text>
          </View>
        )}

        <View style={styles.detailItem}>
          <Ionicons name="flash" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>
            R$ {typeof pricePerKwh === 'number' ? pricePerKwh.toFixed(2) : '--'}/kWh
          </Text>
        </View>
      </View>

      {/* Rodapé no mesmo espírito do Skeleton: info de conectores + ação */}
      <View style={styles.footer}>
        <View style={styles.connectorInfo}>
          <Ionicons name="git-network" size={14} color={COLORS.gray} />
          <Text style={styles.connectorText} numberOfLines={1}>
            {buildConnectorSummary(station)}
          </Text>
        </View>
        <TouchableOpacity onPress={onPress} accessibilityLabel={`Ver detalhes de ${station.name}`}
          style={styles.actionContainer}
        >
          <Text style={styles.actionText}>Ver detalhes</Text>
          <Ionicons name="chevron-forward" size={16} color={styles.actionText.color as string} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    marginHorizontal: SIZES.padding,
    marginVertical: SIZES.base / 2,
    borderRadius: SIZES.radius,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.base,
  },
  titleContainer: {
    flex: 1,
    marginRight: SIZES.base,
  },
  name: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.base / 2,
  },
  statusBadge: {
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    borderRadius: SIZES.radius / 2,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: SIZES.caption,
    color: COLORS.white,
    fontWeight: '500',
  },
  favoriteButton: {
    padding: SIZES.base / 2,
  },
  address: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    marginBottom: SIZES.base,
    lineHeight: 18,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base / 2,
  },
  detailText: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginLeft: SIZES.base / 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SIZES.base,
  },
  connectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SIZES.base,
  },
  connectorText: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginLeft: 6,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: SIZES.body3,
    color: '#27AE60',
    fontWeight: '500',
    marginRight: 4,
  },
});

// Helpers
function buildConnectorSummary(station: Station) {
  try {
    const counts: Record<string, number> = {};
    station.connectors.forEach((c) => {
      const key = c.type || 'Outro';
      counts[key] = (counts[key] || 0) + 1;
    });
    const parts = Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([type, count]) => `${type} (${count})`);
    return parts.length ? `Conectores: ${parts.join(' • ')}` : 'Conectores: --';
  } catch {
    return 'Conectores: --';
  }
}