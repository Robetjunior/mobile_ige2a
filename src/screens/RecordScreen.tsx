import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Alert,
  useColorScheme,
} from 'react-native';

// Store
import { useRecordStore, useFormattedRecordData } from '../stores/recordStore';
import { useUserStore } from '../stores/userStore';

// Components
import { PeriodTabs } from '../components/record/PeriodTabs';
import { PeriodPicker } from '../components/record/PeriodPicker';
import { InfoCards } from '../components/record/InfoCards';
import { OrderItem } from '../components/record/OrderItem';
import { EmptyState } from '../components/record/EmptyState';
import { SkeletonList, SkeletonCards, SkeletonChart } from '../components/record/SkeletonList';
import ErrorBoundary from '../components/ErrorBoundary';
import { LOGGER } from '../lib/logger';

// Types
import { ChargingSessionItem, PeriodMode } from '../types';

export const RecordScreen: React.FC = () => {
  const {
    periodMode,
    ref,
    summary,
    sessions,
    page,
    total,
    pageSize,
    isLoading,
    isLoadingMore,
    error,
    chartSummary,
    setPeriodMode,
    setRef,
    loadSummary,
    loadSessions,
    loadMoreSessions,
    refresh,
    reset,
    loadMockData,
  } = useRecordStore();

  // Formatting and status helpers (lives outside the store state)
  const {
    formatCurrency,
    formatEnergy,
    formatUnitPrice,
    formatDuration,
    getStatusColor,
    getStatusLabel,
  } = useFormattedRecordData();

  // PeriodPicker gerencia o próprio modal; não precisamos de estado local

  const { preferences } = useUserStore();
  const systemColorScheme = useColorScheme();
  
  // Determine if dark mode is active
  const isDarkMode = preferences.theme === 'dark' || 
    (preferences.theme === 'auto' && systemColorScheme === 'dark');
  const [refreshing, setRefreshing] = useState(false);
  const [ready, setReady] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    LOGGER.UI.info('[RECORD] mounted');
    loadInitialData();
    const id = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(id);
  }, []);

  // Reload data when period mode or reference changes
  useEffect(() => {
    if (ref) {
      loadInitialData();
    }
  }, [periodMode, ref]);

  const loadInitialData = useCallback(async () => {
    try {
      // For now, use mock data for charts demonstration
      loadMockData();
      
      // TODO: Uncomment when ready to use real API
      // const userId = 'user123'; // TODO: Get actual user ID
      // await Promise.all([
      //   loadSummary(userId),
      //   loadSessions(userId, 1),
      // ]);
    } catch (err) {
      LOGGER.UI.error('Error loading initial data:', err);
      Alert.alert(
        'Erro',
        'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
        [{ text: 'OK' }]
      );
    }
  }, [loadMockData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh('user123'); // TODO: Get actual user ID
    } catch (err) {
      LOGGER.UI.error('Error refreshing data:', err);
      Alert.alert(
        'Erro',
        'Não foi possível atualizar os dados. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  // Calculate if there are more sessions to load
  const hasMore = sessions.length < total;

  // Load more sessions when reaching end
  const handleLoadMore = useCallback(async () => {
    if (!isLoadingMore && hasMore) {
      try {
        LOGGER.UI.info('record.pagination_load', { nextPage: page + 1 });
        await loadMoreSessions('user123'); // TODO: Get actual user ID
      } catch (err) {
        LOGGER.UI.error('Error loading more sessions:', err);
      }
    }
  }, [isLoadingMore, hasMore, loadMoreSessions, page]);

  const handlePeriodModeChange = useCallback((mode: PeriodMode) => {
    setPeriodMode(mode);
  }, [setPeriodMode]);

  const handlePeriodChange = useCallback((period: string) => {
    setRef(period);
    setShowPeriodPicker(false);
  }, [setRef]);

  const renderSessionItem = useCallback(({ item }: { item: ChargingSessionItem }) => (
    <OrderItem 
      session={item}
      formatCurrency={formatCurrency}
      formatEnergy={formatEnergy}
      formatUnitPrice={formatUnitPrice}
      formatDuration={formatDuration}
      getStatusColor={getStatusColor}
      getStatusLabel={getStatusLabel}
    />
  ), [formatCurrency, formatEnergy, formatUnitPrice, formatDuration, getStatusColor, getStatusLabel]);

  const renderListFooter = useCallback(() => {
    if (isLoadingMore && sessions.length > 0) {
      return <SkeletonList count={3} />;
    }
    return null;
  }, [isLoadingMore, sessions.length]);

  const renderListEmpty = useCallback(() => {
    if (isLoading) {
      return <SkeletonList count={5} />;
    }
    
    if (error) {
      return (
        <EmptyState
          title="Erro ao carregar dados"
          message="Não foi possível carregar as sessões. Puxe para baixo para tentar novamente."
          icon="alert-circle-outline"
        />
      );
    }

    return (
      <EmptyState
        title="Nenhuma sessão encontrada"
        message="Não há sessões de carregamento para o período selecionado."
        icon="document-text-outline"
      />
    );
  }, [isLoading, error]);

  // Gráficos removidos da página /record conforme solicitado

  if (!ready) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 16 }}>
          <Text>Iniciando… (modo: {periodMode})</Text>
          <SkeletonChart />
          <View style={{ height: 8 }} />
          <SkeletonCards count={2} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
    <SafeAreaView style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registros</Text>
      </View>

      

      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#27AE60']}
            tintColor="#27AE60"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderListEmpty}
        ListHeaderComponent={
          <View>
            {/* Period Controls */}
            <View style={styles.periodControls}>
              <PeriodTabs
                selectedMode={periodMode}
                onModeChange={handlePeriodModeChange}
              />
              
              <PeriodPicker
                mode={periodMode}
                selectedRef={ref}
                onRefChange={handlePeriodChange}
              />
            </View>

            {/* Gráficos removidos */}

            {/* Quadrantes de Informações */}
            <View style={styles.cardsSection}>
              {isLoading ? (
                <SkeletonCards count={3} />
              ) : (
                <InfoCards
                  totalMoney={chartSummary?.totalMoney || 0}
                  totalKWh={chartSummary?.totalKWh || 0}
                  totalMinutes={chartSummary?.totalMinutes || 0}
                />
              )}
            </View>

            {/* Sessions List Header */}
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Sessões de Carregamento</Text>
              <Text style={styles.listHeaderSubtitle}>
                {sessions.length > 0 ? `${sessions.length} sessões` : ''}
              </Text>
            </View>
          </View>
        }
        contentContainerStyle={sessions.length === 0 ? styles.emptyContainer : undefined}
      />

      {/* PeriodPicker já contém seu próprio Modal; nada extra aqui */}
    </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  periodControls: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  chartSection: {
    marginVertical: 8,
  },
  cardsSection: {
    marginVertical: 8,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  listHeaderSubtitle: {
    fontSize: 14,
    color: '#6C757D',
  },
  modeProbe: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modeProbeText: {
    fontSize: 12,
    color: '#6C757D',
  },
  emptyContainer: {
    flexGrow: 1,
  },
});

export default RecordScreen;