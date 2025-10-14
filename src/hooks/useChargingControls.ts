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

export function useChargingControls({ chargeBoxId, defaultIdTag, defaultConnectorId, enableOnlineCheck = false, sseTimeoutMs = 30000 }: UseChargingControlsArgs) {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [activeTx, setActiveTx] = useState<number | null>(null);
  const unsubSseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (unsubSseRef.current) {
        try { unsubSseRef.current(); } catch {}
      }
      unsubSseRef.current = null;
    };
  }, []);

  async function onStart(idTag?: string, connectorId?: number | string) {
    if (isStarting) return;
    setIsStarting(true);
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
      } else if (resp.status === 'idempotentDuplicate') {
        setStatusMsg('Comando duplicado já aberto. Evitando reenvio.');
      } else if (resp.status === 'pending') {
        setStatusMsg('Comando pendente (CP offline ou sem conexão).');
      } else {
        setStatusMsg('Comando processado.');
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
    } finally {
      setIsStarting(false);
    }
  }

  async function onStop() {
    if (isStopping) return;
    setIsStopping(true);
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
      } else {
        setStatusMsg('Aguardando confirmação de encerramento (timeout).');
      }
    } catch (err: any) {
      setStatusMsg(err?.message || 'Falha ao parar.');
    } finally {
      setIsStopping(false);
    }
  }

  return { isStarting, isStopping, statusMsg, activeTx, onStart, onStop };
}

export default useChargingControls;