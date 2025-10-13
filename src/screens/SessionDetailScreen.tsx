import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useRecordStore } from '../stores/recordStore';
import { LOGGER } from '../lib/logger';

type SessionDetailRouteProp = RouteProp<RootStackParamList, 'SessionDetail'>;

const SessionDetailScreen: React.FC = () => {
  const route = useRoute<SessionDetailRouteProp>();
  const { id } = route.params;
  const { sessions } = useRecordStore();
  const session = sessions.find((s) => s.id === id);

  React.useEffect(() => {
    LOGGER.UI.info('record.open_session', { id });
  }, [id]);

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.title}>Sessão não encontrada</Text>
          <Text style={styles.text}>ID: {id}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.section}>
          <Text style={styles.title}>Detalhe da Sessão</Text>
          <Text style={styles.text}>ID: {session.id}</Text>
          <Text style={styles.text}>Estação: {session.stationName}</Text>
          <Text style={styles.text}>Conector: {session.connectorType}</Text>
          <Text style={styles.text}>Energia (kWh): {session.energyKWh}</Text>
          <Text style={styles.text}>Valor (R$): {session.amount}</Text>
          <Text style={styles.text}>Duração (min): {session.durationMin}</Text>
          <Text style={styles.text}>Status: {session.status}</Text>
          <Text style={styles.text}>Início: {session.startTime}</Text>
          <Text style={styles.text}>Fim: {session.endTime ?? '-'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 4,
  },
});

export default SessionDetailScreen;