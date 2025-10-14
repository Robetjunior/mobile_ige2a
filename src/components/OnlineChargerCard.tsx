import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import { OnlineChargerItem } from '../types';

interface OnlineChargerCardProps {
  item: OnlineChargerItem;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDetails: () => void;
  onStart: () => void;
  onStop: () => void;
  onPress?: () => void;
}

export const OnlineChargerCard: React.FC<OnlineChargerCardProps> = ({
  item,
  isFavorite,
  onToggleFavorite,
  onDetails,
  onStart,
  onStop,
  onPress,
}) => {
  const title = item.name || item.chargeBoxId;
  const hbTime = item.lastHeartbeatAt ? formatTime(item.lastHeartbeatAt) : '--';
  const statusTime = item.lastStatusAt ? formatTime(item.lastStatusAt) : '--';
  const connectors = item.connectors || [];
  const visible = connectors.slice(0, 3);
  const remaining = Math.max(0, connectors.length - visible.length);

  const canStart = (() => {
    // Se está online via WS, permitir tentativa de início mesmo sem status detalhado
    if (item.wsOnline) return true;
    const st = (item.lastStatus || '').toLowerCase();
    if (st === 'available' || st === 'preparing') return true;
    return connectors.some((c) => {
      const cs = (c.status || '').toLowerCase();
      return cs === 'available' || cs === 'preparing';
    });
  })();

  const canStop = (() => {
    // Se está online via WS, permitir tentativa de parada com fallback de transactionId
    if (item.wsOnline) return true;
    if (item.lastTransactionId != null) return true;
    const st = (item.lastStatus || '').toLowerCase();
    if (st === 'charging') return true;
    return connectors.some((c) => (c.status || '').toLowerCase() === 'charging');
  })();

  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container style={styles.container} onPress={onPress} activeOpacity={0.85}>
      {/* Linha 1: Título + badges + favorito */}
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <View style={styles.badges}>
            {item.wsOnline && (
              <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}> 
                <Text style={[styles.badgeText, { color: '#065F46' }]}>Conectado (WS)</Text>
              </View>
            )}
            {item.onlineRecently && (
              <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}> 
                <Text style={[styles.badgeText, { color: '#1E40AF' }]}>Ativo (hb)</Text>
              </View>
            )}
            {!!item.lastStatus && (
              <View style={[styles.pill, { backgroundColor: getStatusBg(item.lastStatus) }]}> 
                <Text style={[styles.pillText, { color: getStatusFg(item.lastStatus) }]}>{item.lastStatus}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={onToggleFavorite} accessibilityLabel={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? COLORS.error : COLORS.gray} />
        </TouchableOpacity>
      </View>

      {/* Linha 2: conectores mini-grid */}
      {!!visible.length && (
        <View style={styles.connectorsRow}>
          {visible.map((c) => (
            <View key={c.connectorId} style={styles.connectorChip}>
              <Text style={styles.connectorText}>#{c.connectorId} {c.status}</Text>
            </View>
          ))}
          {remaining > 0 && (
            <View style={styles.connectorChipMore}>
              <Text style={styles.connectorMoreText}>+{remaining}</Text>
            </View>
          )}
        </View>
      )}

      {/* Linha 3: Meta */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Último HB: {hbTime}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.metaText}>Status às {statusTime}</Text>
      </View>

      {/* Ações removidas na listagem da Home */}
    </Container>
  );
};

function formatTime(iso?: string | null) {
  try {
    if (!iso) return '--';
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '--';
  }
}

function getStatusBg(status?: string) {
  switch ((status || '').toLowerCase()) {
    case 'charging':
      return '#FEF3C7'; // amber-100
    case 'available':
      return '#D1FAE5'; // emerald-100
    case 'faulted':
    case 'unavailable':
      return '#FFE4E6'; // rose-100
    default:
      return '#E5E7EB'; // gray-200
  }
}

function getStatusFg(status?: string) {
  switch ((status || '').toLowerCase()) {
    case 'charging':
      return '#92400E';
    case 'available':
      return '#065F46';
    case 'faulted':
    case 'unavailable':
      return '#9F1239';
    default:
      return '#374151';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleWrap: { flex: 1, marginRight: 8 },
  title: { fontSize: SIZES.body2, fontWeight: '600', color: COLORS.black },
  badges: { flexDirection: 'row', gap: 6 as any, flexWrap: 'wrap', marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  pillText: { fontSize: 10, fontWeight: '700' },

  connectorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 as any, marginBottom: 8 },
  connectorChip: { backgroundColor: '#F3F4F6', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  connectorText: { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  connectorChipMore: { backgroundColor: '#E5E7EB', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  connectorMoreText: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  metaText: { fontSize: 12, color: COLORS.gray },
  dot: { paddingHorizontal: 6, color: COLORS.gray },

  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E5E7EB' },
  btnGhostText: { color: COLORS.gray, fontWeight: '600' },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnPrimaryText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  btnSecondary: { backgroundColor: COLORS.error },
  btnSecondaryText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  btnDisabled: { opacity: 0.4 },
});

export default OnlineChargerCard;