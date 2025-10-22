import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

export interface RecentItem {
  chargeBoxId: string;
  name?: string;
  address?: string;
}

interface RecentDrawerProps {
  visible: boolean;
  onClose: () => void;
  items: RecentItem[];
  onSelect: (item: RecentItem) => void;
}

export const RecentDrawer: React.FC<RecentDrawerProps> = ({ visible, onClose, items, onSelect }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.drawer}>
          <View style={styles.header}>
            <Text style={styles.title}>Recently Used</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar recentemente usados">
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {!items?.length ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="time-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyTitle}>No data</Text>
              <Text style={styles.emptyText}>Nenhum item recente encontrado.</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.chargeBoxId}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.item} onPress={() => onSelect(item)} accessibilityRole="button" accessibilityLabel={`Abrir ${item.name || item.chargeBoxId}`}>
                  <View style={styles.itemIcon}>
                    <Ionicons name="flash-outline" size={20} color={COLORS.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.name || item.chargeBoxId}</Text>
                    {!!item.address && <Text style={styles.itemSub}>{item.address}</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: SIZES.padding }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  drawer: {
    backgroundColor: '#0F172A',
    width: '86%',
    alignSelf: 'flex-end',
    minHeight: '40%',
    maxHeight: '80%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 6 },
      web: {},
    }),
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomColor: '#1F2937', borderBottomWidth: StyleSheet.hairlineWidth },
  title: { color: COLORS.white, fontSize: SIZES.h3, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36 },
  emptyTitle: { color: COLORS.white, fontSize: SIZES.body2, fontWeight: '700', marginTop: 12 },
  emptyText: { color: COLORS.gray, fontSize: SIZES.body3, marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomColor: '#1F2937', borderBottomWidth: StyleSheet.hairlineWidth },
  itemIcon: { backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemTitle: { color: COLORS.white, fontSize: SIZES.body2, fontWeight: '600' },
  itemSub: { color: COLORS.gray, fontSize: SIZES.caption },
});