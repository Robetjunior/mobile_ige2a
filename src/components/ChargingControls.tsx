import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { useChargingControls } from '../hooks/useChargingControls';

type Props = {
  chargeBoxId: string;
  defaultIdTag?: string;
  defaultConnectorId?: number | string;
  onToast?: (type: 'info'|'warn'|'error'|'success', message: string) => void;
};

export default function ChargingControls({ chargeBoxId, defaultIdTag, defaultConnectorId, onToast }: Props) {
  const { isStarting, isStopping, statusMsg, phase, activeTx, onStart, onStop } = useChargingControls({ chargeBoxId, defaultIdTag, defaultConnectorId, enableOnlineCheck: true });
  const lastActionRef = useRef<'start'|'stop'|null>(null);
  const [allowStop, setAllowStop] = useState(false);

  const startLoading = phase === 'STARTING' || isStarting;
  const stopLoading = phase === 'STOPPING' || isStopping;
  const startDisabled = phase !== 'IDLE';
  const stopDisabled = !(phase === 'CHARGING' || !!activeTx || allowStop);

  const handleStart = async () => {
    lastActionRef.current = 'start';
    const res = await onStart();
    if (res === 'sent' || res === 'idempotentDuplicate') {
      onToast?.('success', 'Carregamento iniciado');
      // Habilita STOP imediatamente após envio do comando
      setAllowStop(true);
    } else if (res === 'pending') {
      onToast?.('info', 'Comando pendente (CP offline).');
      // Mesmo pendente, permitir STOP caso usuário queira cancelar
      setAllowStop(true);
    } else if (res === 'error') {
      onToast?.('error', 'Falha ao iniciar.');
      setAllowStop(false);
    }
  };

  const handleStop = async () => {
    lastActionRef.current = 'stop';
    const res = await onStop();
    if (res === 'confirmed') {
      onToast?.('success', 'Carregamento parado');
      setAllowStop(false);
    } else if (res === 'sent') {
      onToast?.('info', 'Aguardando confirmação de encerramento.');
    } else if (res === 'pending') {
      onToast?.('info', 'Comando pendente (CP offline).');
    } else if (res === 'error') {
      onToast?.('error', 'Falha ao parar.');
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Controles de Carregamento</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.startBtn, (startDisabled || startLoading) && styles.disabled]} onPress={handleStart} disabled={startDisabled || startLoading} accessibilityLabel={startLoading ? 'Iniciando carregamento' : 'Iniciar Carregamento'}>
          {startLoading ? (
            <View style={styles.btnInner}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.btnText}>Iniciando…</Text>
            </View>
          ) : (
            <Text style={styles.btnText}>Iniciar Carregamento</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.stopBtn, (stopDisabled || stopLoading) && styles.disabled]} onPress={handleStop} disabled={stopDisabled || stopLoading} accessibilityLabel={stopLoading ? 'Parando carregamento' : 'Parar Carregamento'}>
          {stopLoading ? (
            <View style={styles.btnInner}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.btnText}>Parando…</Text>
            </View>
          ) : (
            <Text style={styles.btnText}>Parar Carregamento</Text>
          )}
        </TouchableOpacity>
      </View>
      {!!statusMsg && (
        <View style={styles.statusRow}>
          <Text style={styles.status}>{statusMsg}</Text>
          {statusMsg?.toLowerCase().includes('falha') && (
            <TouchableOpacity style={styles.retry} onPress={() => lastActionRef.current === 'start' ? handleStart() : handleStop()} accessibilityLabel="Tentar novamente">
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 12 },
  title: { fontWeight: '700', color: '#111827', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  startBtn: { backgroundColor: COLORS.primary },
  stopBtn: { backgroundColor: COLORS.error },
  disabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700' },
  statusRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  status: { color: '#374151' },
  retry: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#E5E7EB', borderRadius: 6 },
  retryText: { color: '#111827', fontWeight: '600' },
});