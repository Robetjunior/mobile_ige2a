import React from 'react';
import { View, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

export type PeriodMode = 'month' | 'year';
export type ChartKitData = { labels: string[]; datasets: { data: number[]; color?: (opacity: number) => string }[] };

type Props = {
  data: ChartKitData;
  mode: PeriodMode;
  isDarkMode?: boolean;
  accentColor?: string;
  showValues?: boolean;
};

export default function AmountChart({ data, mode, isDarkMode, accentColor = '#1f77b4', showValues = true }: Props) {
  const W = Dimensions.get('window').width;
  const [containerWidth, setContainerWidth] = React.useState<number | null>(null);
  const chartWidth = Math.max(280, Math.min(W - 32, (containerWidth ?? W) - 16));
  const chartHeight = 220;

  const chartConfig = {
    backgroundGradientFrom: isDarkMode ? '#1a1a1a' : '#ffffff',
    backgroundGradientTo: isDarkMode ? '#1a1a1a' : '#ffffff',
    color: (opacity = 1) => accentColor.includes('rgba') ? accentColor.replace(',1)', `,${opacity})`) : accentColor,
    labelColor: (opacity = 1) => (isDarkMode ? `rgba(255,255,255,${opacity})` : `rgba(108,117,125,${opacity})`),
    decimalPlaces: 0,
    barPercentage: 0.5,
    propsForBackgroundLines: { stroke: isDarkMode ? '#495057' : '#E9ECEF' },
  } as const;

  const safeData = React.useMemo(() => {
    const labelsFull = Array.isArray(data?.labels) ? data.labels : [];
    const hasDatasets = Array.isArray(data?.datasets) && data.datasets.length > 0;
    const targetCount = 5;
    const labels = labelsFull.slice(-targetCount);
    const baseDatasets = hasDatasets ? data.datasets : [{ data: new Array(labelsFull.length).fill(0) }];
    const datasets = baseDatasets.map(ds => {
      const arr = Array.isArray(ds.data) ? ds.data : [];
      const sliced = arr.slice(-(labels.length || targetCount));
      return { ...ds, data: sliced };
    });
    return { labels, datasets };
  }, [data]);

  return (
    <View style={{ alignItems: 'center', width: '100%' }} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <BarChart
        data={safeData}
        width={chartWidth}
        height={chartHeight}
        fromZero
        showValuesOnTopOfBars={showValues}
        chartConfig={chartConfig}
        style={{ borderRadius: 8 }}
      />
    </View>
  );
}