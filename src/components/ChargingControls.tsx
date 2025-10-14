import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { useChargingControls } from '../hooks/useChargingControls';

type Props = {
  chargeBoxId: string;
  defaultIdTag?: string;
  defaultConnectorId?: number | string;
};

export default function ChargingControls({ chargeBoxId, defaultIdTag, defaultConnectorId }: Props) {
  const { isStarting, isStopping, statusMsg, onStart, onStop } = useChargingControls({ chargeBoxId, defaultIdTag, defaultConnectorId, enableOnlineCheck: true });

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Controles de Carregamento</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.startBtn, isStarting && styles.disabled]} onPress={() => onStart()} disabled={isStarting} accessibilityLabel={isStarting ? 'Iniciando carregamento' : 'Iniciar Carregamento'}>
          <Text style={styles.btnText}>{isStarting ? 'Iniciando…' : 'Iniciar Carregamento'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.stopBtn, isStopping && styles.disabled]} onPress={onStop} disabled={isStopping} accessibilityLabel={isStopping ? 'Parando carregamento' : 'Parar Carregamento'}>
          <Text style={styles.btnText}>{isStopping ? 'Parando…' : 'Parar Carregamento'}</Text>
        </TouchableOpacity>
      </View>
      {!!statusMsg && (
        <Text style={styles.status}>{statusMsg}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 12 },
  title: { fontWeight: '700', color: '#111827', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  startBtn: { backgroundColor: COLORS.primary },
  stopBtn: { backgroundColor: COLORS.error },
  disabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700' },
  status: { marginTop: 10, color: '#374151' },
});