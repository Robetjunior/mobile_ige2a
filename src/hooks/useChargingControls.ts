import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import ChargingService from '../services/ChargingService';
import ChargerService from '../services/chargerService';

type UseChargingControlsArgs = {
  chargeBoxId: string;
  defaultIdTag?: string;
  defaultConnectorId?: number | string;
  enableOnlineCheck?: boolean;
  sseTimeoutMs?: number;
};

type Phase = 'IDLE' | 'STARTING' | 'CHARGING' | 'STOPPING';

export function useChargingControls({ chargeBoxId, defaultIdTag, defaultConnectorId, enableOnlineCheck = false, sseTimeoutMs = 30000 }: UseChargingControlsArgs) {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [activeTx, setActiveTx] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('IDLE');
  const lastActionAtRef = useRef<number>(0);
  const unsubSseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (unsubSseRef.current) {
        try { unsubSseRef.current(); } catch {}
      }
      unsubSseRef.current = null;
    };
  }, []);

  async function onStart(idTag?: string, connectorId?: number | string): Promise<'sent'|'idempotentDuplicate'|'pending'|'error'> {
    const now = Date.now();
    if (now - (lastActionAtRef.current || 0) < 800) return 'error';
    lastActionAtRef.current = now;
    if (isStarting) return 'error';
    setIsStarting(true);
    setPhase('STARTING');
    setStatusMsg('');
    try {
      const envDefault = (process.env.EXPO_PUBLIC_DEFAULT_IDTAG || '').trim();
      const finalIdTag = (idTag?.trim() || (defaultIdTag ? String(defaultIdTag).trim() : '') || envDefault || 'DEMO-USER').trim();
      const finalConnector = connectorId ?? defaultConnectorId;
      // idTag agora é automático; se vazio, usa fallback DEMO-USER

      if (enableOnlineCheck) {
        const online = await ChargingService.isOnline(chargeBoxId).catch(() => false);
        if (!online) {
          setStatusMsg('CP offline ou HB antigo. Comando pode ficar pendente.');
        }
      }

      const resp = await ChargingService.remoteStart(chargeBoxId, finalIdTag, finalConnector);
      if (resp.status === 'sent') {
        setStatusMsg('Comando enviado ao CP.');
        // Se já houver sessão ativa, atualiza fase
        try {
          const tx = await ChargingService.getActiveSessionTx(chargeBoxId);
          if (tx != null) {
            setActiveTx(tx);
            setPhase('CHARGING');
          }
        } catch {}
        return 'sent';
      } else if (resp.status === 'idempotentDuplicate') {
        setStatusMsg('Comando duplicado já aberto. Evitando reenvio.');
        // Tratar como sessão já em andamento
        try {
          const tx = await ChargingService.getActiveSessionTx(chargeBoxId);
          if (tx != null) setActiveTx(tx);
        } catch {}
        setPhase('CHARGING');
        return 'idempotentDuplicate';
      } else if (resp.status === 'pending') {
        setStatusMsg('Comando pendente (CP offline ou sem conexão).');
        // permanece STARTING até repoll
        return 'pending';
      } else {
        setStatusMsg('Comando processado.');
        return 'sent';
      }

      // Opcional: ouvir session-start. Mantemos como exemplo simples
      try {
        const unsub = ChargingService.subscribeSessionEndSse(chargeBoxId, (ev) => {
          // Apenas demonstração; o app pode ouvir session-start especificamente se o stream emitir
          if (ev?.type === 'session-start') {
            const t = ev?.transaction_id ?? ev?.transactionId;
            if (t != null) setActiveTx(Number(t));
          }
        }, { timeoutMs: sseTimeoutMs });
        unsubSseRef.current = unsub;
      } catch {}
    } catch (err: any) {
      setStatusMsg(err?.message || 'Falha ao iniciar.');
      setPhase('IDLE');
      return 'error';
    } finally {
      setIsStarting(false);
    }
  }

  async function onStop(): Promise<'confirmed'|'sent'|'pending'|'error'> {
    const now = Date.now();
    if (now - (lastActionAtRef.current || 0) < 800) return 'error';
    lastActionAtRef.current = now;
    if (isStopping) return 'error';
    setIsStopping(true);
    setPhase('STOPPING');
    setStatusMsg('');
    try {
      // Descobrir transactionId: prefer sessions/active, fallback debug last-tx
      let tx = await ChargingService.getActiveSessionTx(chargeBoxId);
      if (tx == null) tx = await ChargingService.getLastTxDebug(chargeBoxId);
      if (tx == null) throw new Error('Nenhuma sessão ativa encontrada.');
      setActiveTx(tx);

      const resp = await ChargingService.remoteStop(tx);
      if (resp.status === 'sent') {
        setStatusMsg('Comando enviado ao CP.');
      } else if (resp.status === 'idempotentDuplicate') {
        setStatusMsg('Comando de STOP já estava aberto.');
      } else if (resp.status === 'pending') {
        setStatusMsg('Comando de STOP pendente (CP offline).');
      }

      let confirmed = false;
      if (Platform.OS === 'web') {
        try {
          // Aguarda confirmação via SSE
          await ChargerService.waitForSessionEndSSE(chargeBoxId, sseTimeoutMs);
          confirmed = true;
        } catch {
          // Fallback para polling
          confirmed = await ChargerService.waitForSessionEndPoll(tx!, Math.max(15000, sseTimeoutMs));
        }
      } else {
        confirmed = await ChargerService.waitForSessionEndPoll(tx!, Math.max(15000, sseTimeoutMs));
      }

      if (confirmed) {
        setStatusMsg('Sessão encerrada.');
        setActiveTx(null);
        setPhase('IDLE');
        return 'confirmed';
      } else {
        setStatusMsg('Aguardando confirmação de encerramento (timeout).');
        setPhase('CHARGING');
        return 'sent';
      }
    } catch (err: any) {
      setStatusMsg(err?.message || 'Falha ao parar.');
      setPhase('CHARGING');
      return 'error';
    } finally {
      setIsStopping(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const tx = await ChargingService.getActiveSessionTx(chargeBoxId).catch(() => null);
        if (!mounted) return;
        if (tx != null) {
          setActiveTx(tx);
          setPhase('CHARGING');
        } else {
          setActiveTx(null);
          setPhase('IDLE');
        }
      } catch {}
    };
    const iv = setInterval(check, 5000);
    check();
    return () => { mounted = false; clearInterval(iv); };
  }, [chargeBoxId]);

  return { isStarting, isStopping, statusMsg, activeTx, phase, onStart, onStop };
}

export default useChargingControls;