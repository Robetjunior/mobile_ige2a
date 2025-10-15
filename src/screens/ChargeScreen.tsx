import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import ChargerService from '../services/chargerService';
import ChargingControls from '../components/ChargingControls';
import type { OnlineChargerItem } from '../types';
import { COLORS, SIZES } from '../constants';
import ProgressRing from '../components/ProgressRing';
import type { TabParamList } from '../navigation/TabNavigator';
import { useSessionStore } from '../stores/sessionStore';
import { Telemetry } from '../lib/telemetry';
import * as Haptics from 'expo-haptics';
import useProfileStore from '../stores/profileStore';

type ChargeRoute = RouteProp<TabParamList, 'Charge'>;

export default function ChargeScreen() {
  const route = useRoute<ChargeRoute>();
  const navigation = useNavigation<any>();
  const { me } = useProfileStore();
  const { currentSession, setCurrentSession, startPolling, stopPolling } = useSessionStore();

  const [chargeBoxId, setChargeBoxId] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [online, setOnline] = useState<OnlineChargerItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [startVisible, setStartVisible] = useState(false);
  const [startConnectorId, setStartConnectorId] = useState('');
  const [startIdTag, setStartIdTag] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; type: 'info'|'warn'|'error'|'success'; message: string }[]>([]);
  const toastSeq = useRef(1);
  const [preparedTxId, setPreparedTxId] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const fromParams = route?.params?.chargeBoxId || null;
    let fromQuery: string | null = null;
    if (Platform.OS === 'web') {
      try {
        const usp = new URLSearchParams((globalThis as any)?.window?.location?.search || '');
        fromQuery = usp.get('chargeBoxId');
      } catch {}
    }
    setChargeBoxId(fromParams || fromQuery || null);
  }, [route?.params?.chargeBoxId]);

  useEffect(() => {
    if (me?.defaultIdTag && !startIdTag) setStartIdTag(me.defaultIdTag);
  }, [me?.defaultIdTag]);

  useEffect(() => {
    if (!chargeBoxId) return;
    fetchData(chargeBoxId);
  }, [chargeBoxId]);

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      const [det, onlineList] = await Promise.all([
        ChargerService.getChargerDetails(id).catch(() => null as any),
        ChargerService.getOnlineStatusList(7, 200).catch(() => ({ items: [], count: 0 })),
      ]);
      setDetails(det);
      const it = (onlineList.items || []).find((x: OnlineChargerItem) => x.chargeBoxId === id) || null;
      setOnline(it);

      // Prepara transactionId para parar carregamento: usa lastTransactionId ou consulta last-tx
      let effTxId = it?.lastTransactionId != null ? String(it.lastTransactionId) : null;
      if (!effTxId) {
        const lastTx = await ChargerService.getLastTransactionId(id).catch(() => null as any);
        if (lastTx != null) effTxId = String(lastTx);
      }
      setPreparedTxId(effTxId);
      if (effTxId && (!currentSession || currentSession.id !== effTxId)) {
        const now = new Date().toISOString();
        const connectorId = (it?.connectors || []).find(c => (c.status || '').toLowerCase() === 'charging')?.connectorId || String(startConnectorId || '1');
        const seed = {
          id: effTxId,
          stationId: id,
          stationName: det?.name || id,
          connectorId: String(connectorId),
          status: 'charging' as const,
          startTime: now,
          powerKw: 0,
          voltageV: 0,
          currentA: 0,
          energyKWh: 0,
          unitPrice: 0,
          totalAmount: 0,
          temperatureC: 0,
          duration: 0,
        };
        setCurrentSession(seed);
        startPolling(effTxId, (session) => setCurrentSession(session));
      }
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao carregar dados do carregador');
    } finally {
      setLoading(false);
    }
  };

  const availableConnectors = useMemo(() => {
    const conns = online?.connectors || [];
    return conns.filter(c => (c.status || '').toLowerCase() === 'available');
  }, [online?.connectors]);

  const isCharging = useMemo(() => {
    const status = (online?.lastStatus || '').toLowerCase();
    return status === 'charging' || online?.lastTransactionId != null;
  }, [online?.lastStatus, online?.lastTransactionId]);

  // Permite parar mesmo quando o WS está offline, desde que tenhamos chargeBoxId
  // e alguma pista de sessão (status charging, lastTransactionId ou preparedTxId)
  const stopEnabled = useMemo(() => {
    const status = (online?.lastStatus || '').toLowerCase();
    return Boolean(chargeBoxId) && (status === 'charging' || online?.lastTransactionId != null || preparedTxId != null);
  }, [chargeBoxId, online?.lastStatus, online?.lastTransactionId, preparedTxId]);

  const hbRecent = useMemo(() => {
    const hb = online?.lastHeartbeatAt ? new Date(online.lastHeartbeatAt) : null;
    if (!hb) return false;
    return Date.now() - hb.getTime() < 7 * 60 * 1000;
  }, [online?.lastHeartbeatAt]);

  const topLabel = useMemo(() => {
    const s = (online?.lastStatus || '').toLowerCase();
    if (isCharging) return 'Carregando';
    if (s === 'available') return 'Disponível';
    if (s === 'faulted') return 'Com falha';
    if (s) return online!.lastStatus!;
    return '';
  }, [online?.lastStatus, isCharging]);

  const startDisabled = useMemo(() => {
    const offline = !online?.wsOnline;
    const oldHb = !hbRecent;
    return offline || oldHb || availableConnectors.length === 0;
  }, [online?.wsOnline, hbRecent, availableConnectors.length]);

  const priceSubtext = useMemo(() => {
    const price = currentSession?.unitPrice ?? 0;
    if (price > 0) {
      try {
        const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
        return `Cobraremos ${formatted} por kWh`;
      } catch {
        return `Cobraremos R$ ${price.toFixed(2)} por kWh`;
      }
    }
    return 'Tarifa indisponível';
  }, [currentSession?.unitPrice]);

  function pushToast(type: 'info'|'warn'|'error'|'success', message: string) {
    const id = toastSeq.current++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter(t => t.id !== id)), 3500);
  }

  const fmt = (val: any, unit?: string) => {
    if (val == null || Number.isNaN(val)) return unit ? `0 ${unit}` : '';
    if (typeof val === 'number') return unit ? `${val} ${unit}` : String(val);
    return String(val);
  };

  // Progresso e ETA (mock inicial, preparado para dados reais)
  const targetKWh = useMemo(() => {
    const envTarget = Number((process as any)?.env?.EXPO_PUBLIC_CHARGE_TARGET_KWH || 0);
    return envTarget > 0 ? envTarget : 20;
  }, []);
  const energyKWh = currentSession?.energyKWh ?? 0;
  const powerKw = currentSession?.powerKw ?? (details?.powerKw ?? 7);
  const progressPct = Math.max(0, Math.min(1, targetKWh > 0 ? energyKWh / targetKWh : 0));
  const etaMin = useMemo(() => {
    if (!powerKw || powerKw <= 0) return null;
    const remaining = Math.max(0, targetKWh - energyKWh);
    return Math.round((remaining / powerKw) * 60);
  }, [powerKw, targetKWh, energyKWh]);

  const handleStart = async () => {
    if (!chargeBoxId) return;
    try {
      setIsStarting(true);
      Telemetry.track('charge.remote_start.request', { chargeBoxId, connectorId: startConnectorId || null });
      if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const effIdTag = (startIdTag?.trim() || me?.defaultIdTag?.trim() || (process.env.EXPO_PUBLIC_DEFAULT_IDTAG || '').trim() || 'DEMO-USER');
      await ChargerService.remoteStart({
        chargeBoxId,
        connectorId: startConnectorId || undefined,
        idTag: effIdTag,
      });
      setStartVisible(false);
      Telemetry.track('charge.remote_start.success', { chargeBoxId });
      pushToast('success', online?.wsOnline ? 'Comando enviado ao CP.' : 'Comando pendente (CP offline).');
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      fetchData(chargeBoxId);
    } catch (e: any) {
      Telemetry.track('charge.remote_start.fail', { chargeBoxId, error: e?.message });
      pushToast('error', e?.message || 'Não foi possível iniciar.');
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    if (!chargeBoxId) return;
    // Descobrir transactionId com helper unificado
    let tx: number | null = await ChargerService.discoverActiveTransactionId(chargeBoxId);
    if (tx == null) {
      const fromMem: any = online?.lastTransactionId ?? preparedTxId ?? null;
      if (typeof fromMem === 'number') tx = fromMem; else if (fromMem != null) tx = Number(fromMem);
    }
    if (tx == null) {
      Alert.alert('Sem sessão ativa', 'Não foi possível identificar a transação em andamento.');
      return;
    }
    Alert.alert('Parar carregamento', 'Deseja encerrar a sessão atual?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Parar', style: 'destructive', onPress: async () => {
          setIsStopping(true);
          try {
            Telemetry.track('charge.remote_stop.request', { chargeBoxId, transactionId: tx });
            if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            // Opcional: checar status OCPP
            const ocppStatus = await ChargerService.getOcppStatus(chargeBoxId).catch(() => null);

            const resp = await ChargerService.remoteStop({ transactionId: tx! });
            const sentNow = !((resp as any)?.status === 'pending' || (resp as any)?.pending);

            if (Platform.OS === 'web') {
              try {
                await ChargerService.waitForSessionEndSSE(chargeBoxId, 20000);
                pushToast('success', 'Sessão encerrada (confirmada via SSE).');
                setPreparedTxId(null);
                setCurrentSession(null as any);
              } catch (err) {
                // SSE expirou: tenta polling da sessão por transactionId
                const confirmed = await ChargerService.waitForSessionEndPoll(tx!, 15000);
                if (confirmed) {
                  pushToast('success', 'Sessão encerrada (confirmada por polling).');
                  setPreparedTxId(null);
                  setCurrentSession(null as any);
                } else {
                  if (sentNow) {
                    pushToast('info', 'Aguardando confirmação (SSE indisponível).');
                  } else {
                    pushToast('info', 'Comando pendente. CP offline ou sessão já finalizada.');
                  }
                }
              }
            } else {
              // Mobile/Native: polling simples
              const confirmed = await ChargerService.waitForSessionEndPoll(tx!, 15000);
              if (confirmed) {
                pushToast('success', 'Sessão encerrada.');
                setPreparedTxId(null);
                setCurrentSession(null as any);
              } else {
                if (sentNow) pushToast('info', 'Comando enviado ao CP. Aguardando confirmação.');
                else pushToast('info', 'Comando pendente. CP offline ou sessão já finalizada.');
              }
            }

            stopPolling();
            await new Promise((r) => setTimeout(r, 1000));
            await fetchData(chargeBoxId);
            Telemetry.track('charge.remote_stop.success', { chargeBoxId, transactionId: tx, wsOnline: online?.wsOnline, ocppStatus });
            if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          } catch (e: any) {
            Telemetry.track('charge.remote_stop.fail', { chargeBoxId, transactionId: tx, error: e?.message });
            pushToast('error', e?.message || 'Não foi possível encerrar.');
            if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          } finally {
            setIsStopping(false);
          }
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statusHeader}>
        <View style={styles.statusBar}>
          {topLabel ? (<Text style={styles.statusLabel}>{topLabel}</Text>) : null}
        </View>
        {!!online?.lastStatus && (
          <View style={styles.badgesRow}>
            <View style={[styles.pill, { backgroundColor: getStatusBg(online.lastStatus) }]}>
              <Text style={[styles.pillText, { color: getStatusFg(online.lastStatus) }]}>{online.lastStatus}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <ProgressRing
            size={140}
            strokeWidth={10}
            progress={progressPct}
            color={COLORS.primary}
            trackColor="#E5E7EB"
            label={topLabel || 'Pronto'}
            // Removido conforme solicitação: ocultar ETA e Meta no subtítulo
            subtitle={undefined}
          />
        </View>
      </View>

      {!!chargeBoxId && (
        <ChargingControls
          chargeBoxId={chargeBoxId}
          defaultIdTag={startIdTag}
          defaultConnectorId={availableConnectors[0]?.connectorId || online?.connectors?.[0]?.connectorId}
          onToast={pushToast}
        />
      )}

      {/* KPIs principais */}
      <View style={styles.kpiGridRow}>
        {[
          { label: 'Potência', value: fmt(currentSession?.powerKw ?? 0, 'kW'), icon: 'flash-outline' as const, color: '#2563EB' },
          { label: 'Duração', value: `${Math.max(0, Math.floor((currentSession?.duration ?? 0)))} min`, icon: 'time-outline' as const, color: '#111827' },
          { label: 'Valor Total', value: (() => { const v = currentSession?.totalAmount ?? 0; try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); } catch { return `R$ ${v.toFixed(2)}`; } })(), icon: 'cash-outline' as const, color: '#27AE60' },
        ].map((m, idx) => (
          <View key={idx} style={styles.kpiCardLg}>
            <View style={styles.kpiHeader}>
              <Ionicons name={m.icon} size={16} color={m.color} />
              <Text style={styles.kpiLabel}>{m.label}</Text>
            </View>
            <Text style={styles.kpiValueLg}>{m.value}</Text>
          </View>
        ))}
      </View>

      {/* KPIs secundários */}
      <View style={styles.kpiGridWrap}>
        {[
          { label: 'Tensão', value: fmt(currentSession?.voltageV ?? 0, 'V'), icon: 'analytics-outline' as const },
          { label: 'Corrente', value: fmt(currentSession?.currentA ?? 0, 'A'), icon: 'speedometer-outline' as const },
          { label: 'Energia', value: fmt(currentSession?.energyKWh ?? 0, 'kWh'), icon: 'flash-outline' as const },
          { label: 'Preço Unitário', value: (() => { const v = currentSession?.unitPrice ?? 0; try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) + '/kWh'; } catch { return `R$ ${v.toFixed(2)}/kWh`; } })(), icon: 'pricetag-outline' as const },
          { label: 'Temperatura', value: fmt(currentSession?.temperatureC ?? 0, '°C'), icon: 'thermometer-outline' as const },
          { label: 'Início', value: currentSession?.startTime ? new Date(currentSession.startTime).toLocaleTimeString() : '', icon: 'time-outline' as const },
        ].map((m, idx) => (
          <View key={idx} style={styles.kpiCardSm}>
            <View style={styles.kpiHeader}>
              <Ionicons name={m.icon} size={14} color="#6C757D" />
              <Text style={styles.kpiLabel}>{m.label}</Text>
            </View>
            <Text style={styles.kpiValueSm}>{m.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panelContainer}>
        <TouchableOpacity onPress={() => setPanelOpen((p) => !p)} accessibilityLabel="Abrir painel de sessão" style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Sessão & Conector</Text>
          <Ionicons name={panelOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#374151" />
        </TouchableOpacity>
        {panelOpen && (
          <View style={styles.panelBody}>
            <Text style={styles.panelRow}>Estação: {details?.name || chargeBoxId || ''}</Text>
            <Text style={styles.panelRow}>Conector: #{availableConnectors[0]?.connectorId || online?.connectors?.[0]?.connectorId || ''}  Status: {online?.lastStatus || ''}</Text>
          </View>
        )}
      </View>

      <Modal visible={startVisible} transparent animationType="slide" onRequestClose={() => setStartVisible(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Iniciar Carregamento</Text>
            <Text style={styles.sheetLabel}>Conector disponível</Text>
            <View style={styles.connectorRow}>
              {availableConnectors.map((c) => (
                <TouchableOpacity key={String(c.connectorId)}
                  style={[styles.connectorChip, startConnectorId === String(c.connectorId) && styles.connectorChipActive]}
                  onPress={() => setStartConnectorId(String(c.connectorId))}
                >
                  <Text style={[styles.connectorText, startConnectorId === String(c.connectorId) && styles.connectorTextActive]}>#{c.connectorId}</Text>
                </TouchableOpacity>
              ))}
              {!availableConnectors.length && (
                <Text style={styles.sheetHint}>Nenhum conector disponível</Text>
              )}
            </View>
            <Text style={styles.sheetLabel}>idTag</Text>
            <TextInput style={styles.input} placeholder="Digite seu idTag" value={startIdTag} onChangeText={setStartIdTag} autoCapitalize="none" />
            <View style={styles.sheetActions}>
              <TouchableOpacity style={[styles.sheetBtn, styles.sheetCancel]} onPress={() => setStartVisible(false)}>
                <Text style={styles.sheetBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sheetBtn, styles.sheetConfirm, isStarting && styles.disabled]} onPress={handleStart} disabled={isStarting}>
                <Text style={[styles.sheetBtnText, { color: '#fff' }]}>{isStarting ? 'Iniciando…' : 'Iniciar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de ajuda rápida removido */}

      <View style={styles.toasterWrap} pointerEvents="none">
        {toasts.map(t => (
          <View key={t.id} style={[styles.toast, t.type === 'success' ? styles.toastSuccess : t.type === 'error' ? styles.toastError : t.type === 'warn' ? styles.toastWarn : styles.toastInfo]}>
            <Text style={styles.toastText}>{t.message}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function getStatusBg(status?: string) {
  switch ((status || '').toLowerCase()) {
    case 'charging':
      return '#FEF3C7';
    case 'available':
      return '#D1FAE5';
    case 'faulted':
    case 'unavailable':
      return '#FEE2E2';
    default:
      // Cor padrão não-cinza para estados não mapeados
      return '#DBEAFE';
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
      return '#991B1B';
    default:
      // Texto em azul para combinar com o fundo padrão
      return '#1E40AF';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SIZES.padding },
  statusHeader: { alignItems: 'center', marginBottom: 12 },
  statusBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4B5563', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  statusLabel: { color: COLORS.white, fontWeight: '600' },
  helpIcon: { marginLeft: 8 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999 },
  pillText: { fontSize: 12, fontWeight: '700' },

  headerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3, marginBottom: 12, alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, marginLeft: 16 },

  primaryButton: { marginTop: 16, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 28 },
  startBtn: { backgroundColor: COLORS.primary },
  stopBtn: { backgroundColor: COLORS.error },
  disabled: { opacity: 0.5 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  priceSubtext: { marginTop: 8, color: '#6B7280' },

  // KPIs
  kpiGridRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  kpiCardLg: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  kpiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kpiLabel: { color: '#6B7280', fontSize: 12 },
  kpiValueLg: { marginTop: 4, fontSize: 18, fontWeight: '700', color: COLORS.black },
  kpiGridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  kpiCardSm: { width: '48%', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  kpiValueSm: { marginTop: 2, fontSize: 16, fontWeight: '700', color: COLORS.black },

  panelContainer: { marginTop: 8, backgroundColor: '#F3F4F6', borderRadius: 12 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12 },
  panelTitle: { fontWeight: '700', color: '#111827' },
  panelBody: { paddingHorizontal: 12, paddingBottom: 12 },
  panelRow: { color: '#374151', marginVertical: 2 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  sheetLabel: { fontSize: 12, color: COLORS.gray, marginTop: 6 },
  connectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  connectorChip: { backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999 },
  connectorChipActive: { backgroundColor: '#D1FAE5' },
  connectorText: { color: COLORS.gray, fontWeight: '600' },
  connectorTextActive: { color: '#065F46' },
  sheetHint: { color: COLORS.gray, marginVertical: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginTop: 6 },
  sheetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  sheetBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  sheetCancel: { backgroundColor: '#F3F4F6' },
  sheetConfirm: { backgroundColor: COLORS.primary },
  sheetBtnText: { fontWeight: '700', color: COLORS.black },

  toasterWrap: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
  toast: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  toastText: { color: '#fff', fontWeight: '600' },
  toastSuccess: { backgroundColor: '#16A34A' },
  toastError: { backgroundColor: '#DC2626' },
  toastWarn: { backgroundColor: '#D97706' },
  toastInfo: { backgroundColor: '#2563EB' },
});
