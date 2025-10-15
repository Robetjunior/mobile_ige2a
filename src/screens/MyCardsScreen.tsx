import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import { useCardsStore } from '../stores/cardsStore';
import CardItem from '../components/CardItem';
import AddCardSheet from '../components/AddCardSheet';
import { useNavigation } from '@react-navigation/native';

const SkeletonCard: React.FC = () => (
  <View style={styles.skeleton} />
);

const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <View style={styles.emptyWrap}>
    <View style={styles.emptyIconCircle}>
      <Ionicons name="card" size={32} color={COLORS.gray} />
    </View>
    <Text style={styles.emptyTitle}>Nenhum cartão</Text>
    <Text style={styles.emptySub}>Adicione um cartão para agilizar sua cobrança</Text>
    <TouchableOpacity style={styles.emptyCTA} onPress={onAdd} accessibilityLabel="Adicionar cartão">
      <Ionicons name="add" size={18} color={COLORS.white} />
      <Text style={styles.emptyCTAText}>Adicionar cartão</Text>
    </TouchableOpacity>
  </View>
);

const MyCardsScreen: React.FC = () => {
  const { items, loading, load } = useCardsStore();
  const [sheetVisible, setSheetVisible] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    load().catch(() => {
      Alert.alert('Erro', 'Falha ao carregar cartões do dispositivo');
    });
  }, [load]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <View style={{ marginTop: SIZES.md }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }
    if (!items.length) {
      return <EmptyState onAdd={() => setSheetVisible(true)} />;
    }
    return (
      <FlatList
        data={items}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <CardItem card={item} />}
        contentContainerStyle={{ paddingVertical: SIZES.sm }}
      />
    );
  }, [items, loading]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Voltar"
          onPress={() => {
            if (Platform.OS === 'web') {
              try {
                const href = '/profile';
                (globalThis as any)?.window?.location?.assign
                  ? (globalThis as any).window.location.assign(href)
                  : ((globalThis as any).window.location.href = href);
              } catch {
                navigation.navigate('Main', { screen: 'Me' });
              }
            } else {
              navigation.navigate('Main', { screen: 'Me' });
            }
          }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Cartões</Text>
      </View>
      {content}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setSheetVisible(true)}
        accessibilityLabel="Adicionar cartão"
        style={styles.fab}
      >
        <Ionicons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>

      <AddCardSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  header: { paddingTop: SIZES.lg, paddingHorizontal: SIZES.md, paddingBottom: SIZES.md, flexDirection: 'row', alignItems: 'center', gap: SIZES.sm as any },
  headerTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXL, fontWeight: '700' },
  skeleton: {
    height: 88,
    marginHorizontal: SIZES.md,
    marginVertical: SIZES.sm,
    borderRadius: SIZES.radiusMD,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  fab: {
    position: 'absolute',
    right: SIZES.md,
    bottom: SIZES.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  emptyWrap: {
    marginTop: SIZES.lg,
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.fontLG,
    fontWeight: '700',
    marginTop: SIZES.md,
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: SIZES.fontSM,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyCTA: {
    marginTop: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.md,
    paddingVertical: 10,
    borderRadius: SIZES.radiusMD,
  },
  emptyCTAText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: SIZES.fontSM,
  },
});

export default MyCardsScreen;