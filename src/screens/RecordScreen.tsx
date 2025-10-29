import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRecordStore } from '../stores/recordStore';
import AmountChart from '../components/charts/AmountChart';
import { PeriodToggle } from '../components/record/PeriodToggle';
// Removido: PeriodPicker
import { InfoCards } from '../components/record/InfoCards';

const ENERGY_COLOR = 'rgba(31,119,180,1)'; // azul
const MONEY_COLOR = 'rgba(255,127,14,1)'; // laranja

export default function RecordScreen() {
  const recordStore = useRecordStore();
  const { chartData, mode, loading, totals, error, metric } = recordStore;

  // Carregamento inicial quando o modo mudar
  React.useEffect(() => {
    recordStore.loadChart().catch(() => {});
  }, [mode]);

  const monthAbbr = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const hasData = React.useMemo(() => {
    const labelsOk = Array.isArray(chartData?.labels) && chartData.labels.length > 0;
    const dsOk = Array.isArray(chartData?.datasets) && chartData.datasets.length > 0 && chartData.datasets[0].data.length > 0;
    return labelsOk && dsOk;
  }, [chartData]);

  const allZero = React.useMemo(() => {
    if (!hasData) return false;
    const all = chartData!.datasets[0].data.every((v) => Number(v) === 0);
    return all;
  }, [hasData, chartData]);

  const emptyChartData = React.useMemo(() => {
    const now = new Date();
    const count = mode === 'month' ? 5 : 5;
    const labels: string[] = [];
    if (mode === 'month') {
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const abbr = monthAbbr[d.getMonth()];
        labels.push(abbr);
      }
    } else {
      for (let i = count - 1; i >= 0; i--) {
        labels.push(String(now.getFullYear() - i));
      }
    }
    return { labels, datasets: [{ data: new Array(labels.length).fill(0) }] };
  }, [mode]);

  const displayData = React.useMemo(() => {
    const base = !hasData || allZero ? emptyChartData : chartData!;
    if (Array.isArray(base.datasets) && base.datasets.length > 0) {
      let idx = 0;
      if (metric === 'money' && base.datasets.length > 1) idx = 1;
      const rawLabels = base.labels ?? [];
      const dataset = base.datasets[idx] ?? { data: new Array(rawLabels.length).fill(0) };
      const labels = mode === 'month'
        ? rawLabels.map((lm) => {
            const m = (() => { const mm = lm.split('-')[1]; const n = parseInt(mm, 10); return Number.isFinite(n) ? n : NaN; })();
            if (!Number.isFinite(m)) return lm;
            return monthAbbr[m - 1] ?? lm;
          })
        : rawLabels;
      return { labels, datasets: [dataset] };
    }
    return base;
  }, [chartData, emptyChartData, hasData, allZero, metric, mode]);

  const accentColor = metric === 'energy' ? ENERGY_COLOR : MONEY_COLOR;
  const hasTwoSeries = Array.isArray(chartData?.datasets) && chartData.datasets.length > 1;

  const onToggleMode = (m: 'month'|'year') => recordStore.setMode(m);

  // Header
  const Header = (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>Registro</Text>
    </View>
  );

  // Banner de erro
  const ErrorBanner = error ? (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      <View style={{ backgroundColor: '#FFE8E8', borderWidth: 1, borderColor: '#FFC9C9', borderRadius: 8, padding: 10 }}>
        <Text style={{ color: '#C92A2A', fontWeight: '600' }}>Falha ao carregar</Text>
        <Text style={{ color: '#C92A2A' }}>{String(error)}</Text>
      </View>
    </View>
  ) : null;

  // Skeleton simples
  const Skeleton = (
    <View style={{ padding: 16 }}>
      <View style={{ height: 20, width: 120, backgroundColor: '#E9ECEF', borderRadius: 8, marginBottom: 12 }} />
      <View style={{ height: 36, backgroundColor: '#E9ECEF', borderRadius: 8, marginBottom: 12 }} />
      <View style={{ height: 240, backgroundColor: '#F1F3F5', borderRadius: 12 }} />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <View style={{ flex: 1, height: 80, backgroundColor: '#F1F3F5', borderRadius: 12 }} />
        <View style={{ flex: 1, height: 80, backgroundColor: '#F1F3F5', borderRadius: 12 }} />
        <View style={{ flex: 1, height: 80, backgroundColor: '#F1F3F5', borderRadius: 12 }} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#343A40' }}>
      {Header}

      {/* Centraliza o filtro Mês/Ano */}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <PeriodToggle mode={mode} onChange={onToggleMode} />
      </View>

      {ErrorBanner}

      {loading ? (
        Skeleton
      ) : (
        <View style={{ padding: 16 }}>
          {/* Card do gráfico */}
          <View style={{ backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#343a40' }}>Estatísticas de Valor</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Chip label="Energia" active={metric === 'energy'} color={ENERGY_COLOR} onPress={() => recordStore.setMetric('energy')} />
                <Chip label="Dinheiro" active={metric === 'money'} color={MONEY_COLOR} onPress={() => recordStore.setMetric('money')} disabled={!hasTwoSeries} />
              </View>
            </View>

            <View style={{ paddingHorizontal: 8, paddingBottom: 12 }}>
              <AmountChart data={displayData as any} mode={mode} isDarkMode={false} accentColor={accentColor} showValues={!allZero} />
            </View>
            {allZero && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                <Text style={{ color: '#6C757D' }}>Sem recargas no período selecionado.</Text>
              </View>
            )}
          </View>

          {/* Cards resumo */}
          <View style={{ marginTop: 16 }}>
            <InfoCards totalMoney={totals.amountBr} totalKWh={totals.energyKwh} totalMinutes={totals.minutes} isLoading={loading} />
          </View>
        </View>
      )}
    </View>
  );
}

function Chip({ label, active, color, onPress, disabled }: { label: string; active: boolean; color: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={{
      minHeight: 44,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: active ? 0 : 1,
      borderColor: '#dee2e6',
      backgroundColor: active ? color : '#fff',
      opacity: disabled ? 0.5 : 1,
      justifyContent: 'center'
    }}>
      <Text style={{ color: active ? '#fff' : '#495057', fontWeight: '600', fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );
}