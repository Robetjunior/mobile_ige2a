import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryAxis } from 'victory-native';

interface HistoricoItem {
  data: string; // YYYY-MM-DD
  gasto: number; // BRL
  energia: number; // kWh
  tempo: number; // minutes
}

interface KpiMockData {
  total_gasto: number;
  energia_carregada_kWh: number;
  tempo_carregamento_min: number;
  historico_sessoes: HistoricoItem[];
}

const MOCK: KpiMockData = {
  total_gasto: 128.75,
  energia_carregada_kWh: 42.5,
  tempo_carregamento_min: 186,
  historico_sessoes: [
    { data: '2025-10-01', gasto: 25.5, energia: 10.2, tempo: 45 },
    { data: '2025-10-02', gasto: 31.0, energia: 12.5, tempo: 50 },
    { data: '2025-10-03', gasto: 72.25, energia: 19.8, tempo: 91 },
  ],
};

const getResponsiveDimensions = () => {
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;
  const chartWidth = width - 32; // 16px padding on each side
  const chartHeight = isLandscape ? Math.min(240, height * 0.45) : 260;
  return { chartWidth, chartHeight, isLandscape };
};

export const KpiMockChart: React.FC = () => {
  const [dimensions, setDimensions] = useState(getResponsiveDimensions());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDimensions(getResponsiveDimensions());
    });
    return () => subscription?.remove();
  }, []);

  const points = MOCK.historico_sessoes.map((h) => ({
    x: h.data.split('-')[2], // day part
    gasto: h.gasto,
    energia: h.energia,
    tempo: h.tempo,
  }));

  const maxGasto = Math.max(...points.map((p) => p.gasto));
  const maxEnergia = Math.max(...points.map((p) => p.energia));
  const maxTempo = Math.max(...points.map((p) => p.tempo));

  // Scale secondary series to the left axis range for visual comparison
  const scaleToGasto = (value: number, maxValue: number) => {
    return (value / maxValue) * (maxGasto || 1);
  };

  const theme = {
    axis: {
      style: {
        axis: { stroke: '#E9ECEF' },
        grid: { stroke: '#F8F9FA' },
        tickLabels: {
          fill: '#6C757D',
          fontSize: 12,
        },
      },
    },
  };

  // Guard: if Victory components are unavailable for any reason, avoid rendering undefined elements
  const victoryReady = Boolean(VictoryChart) && Boolean(VictoryAxis) && Boolean(VictoryLine);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Evolução por dia (mock)</Text>

      {!victoryReady && (
        <Text style={{ color: '#C0392B', marginBottom: 8 }}>
          Erro ao carregar componentes de gráfico. Verifique a instalação do pacote victory-native.
        </Text>
      )}

      {/* Legend (manual) */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#27AE60' }]} />
          <Text style={styles.legendText}>Gasto (R$)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#3498DB' }]} />
          <Text style={styles.legendText}>Energia (kWh)*</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#F39C12' }]} />
          <Text style={styles.legendText}>Tempo (min)*</Text>
        </View>
      </View>

      {victoryReady && (
      <VictoryChart
        theme={theme}
        width={dimensions.chartWidth}
        height={dimensions.chartHeight}
        padding={{ left: 60, top: 20, right: 60, bottom: 60 }}
        domainPadding={{ x: 20 }}
      >
        {/* Left Y-axis for BRL */}
        <VictoryAxis
          dependentAxis
          tickFormat={(v) => `R$ ${v}`}
          style={{ tickLabels: { fontSize: 11, fill: '#666' } }}
        />

        {/* Right Y-axis for kWh */}
        <VictoryAxis
          dependentAxis
          orientation="right"
          tickFormat={(v) => `${((v / (maxGasto || 1)) * (maxEnergia || 1)).toFixed(0)} kWh`}
          style={{ tickLabels: { fontSize: 11, fill: '#666' } }}
        />

        {/* X-axis (day) */}
        <VictoryAxis
          tickFormat={(x) => `${x}`}
          style={{ tickLabels: { fontSize: 11, fill: '#666' } }}
        />

        {/* Gasto (BRL) */}
        <VictoryLine
          data={points.map((p) => ({ x: p.x, y: p.gasto }))}
          style={{ data: { stroke: '#27AE60', strokeWidth: 3 } }}
          animate={{ duration: 800, onLoad: { duration: 400 } }}
        />

        {/* Energia (kWh) scaled to gasto axis */}
        <VictoryLine
          data={points.map((p) => ({ x: p.x, y: scaleToGasto(p.energia, maxEnergia || 1) }))}
          style={{ data: { stroke: '#3498DB', strokeWidth: 3 } }}
          animate={{ duration: 800, onLoad: { duration: 400 } }}
        />

        {/* Tempo (min) scaled to gasto axis (dashed) */}
        <VictoryLine
          data={points.map((p) => ({ x: p.x, y: scaleToGasto(p.tempo, maxTempo || 1) }))}
          style={{ data: { stroke: '#F39C12', strokeWidth: 3, strokeDasharray: [6, 4] } }}
          animate={{ duration: 800, onLoad: { duration: 400 } }}
        />

      </VictoryChart>
      )}

      <Text style={styles.legendNote}>
        * Escalas normalizadas para visualização conjunta.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  legendNote: {
    fontSize: 11,
    color: '#6C757D',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default KpiMockChart;