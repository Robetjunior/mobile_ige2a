import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { ChartDataPoint, PeriodMode } from '../../types';

interface AmountChartProps {
  data: ChartDataPoint[];
  periodMode: PeriodMode;
  isLoading?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 32; // 16px margin on each side
const chartHeight = 200;
const padding = { top: 20, right: 20, bottom: 40, left: 50 };

export const AmountChart: React.FC<AmountChartProps> = ({
  data,
  periodMode,
  isLoading = false,
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const maxAmount = Math.max(...data.map(d => d.amount));
    const minAmount = Math.min(...data.map(d => d.amount));
    const range = maxAmount - minAmount || 1;

    const barWidth = (chartWidth - padding.left - padding.right) / data.length;
    const availableHeight = chartHeight - padding.top - padding.bottom;

    return data.map((item, index) => {
      const normalizedHeight = ((item.amount - minAmount) / range) * availableHeight;
      const x = padding.left + (index * barWidth) + (barWidth * 0.1);
      const y = chartHeight - padding.bottom - normalizedHeight;
      const width = barWidth * 0.8;
      const height = normalizedHeight || 2; // Minimum height for visibility

      return {
        ...item,
        x,
        y,
        width,
        height,
        barWidth,
        index,
      };
    });
  }, [data]);

  const formatLabel = (bucket: string) => {
    if (periodMode === 'month') {
      // bucket format: 'YYYY-MM-DD'
      const day = bucket.split('-')[2];
      return day;
    } else {
      // bucket format: 'YYYY-MM'
      const month = bucket.split('-')[1];
      return month;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const maxAmount = Math.max(...data.map(d => d.amount));
  const yAxisLabels = [0, maxAmount / 2, maxAmount].map(formatCurrency);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Estatísticas de Valor</Text>
        </View>
        <View style={styles.loadingChart}>
          <Text style={styles.loadingText}>Carregando gráfico...</Text>
        </View>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Estatísticas de Valor</Text>
        </View>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>Nenhum dado disponível</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estatísticas de Valor</Text>
        <Text style={styles.subtitle}>
          {periodMode === 'month' ? 'Por dia' : 'Por mês'}
        </Text>
      </View>
      
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Y-axis */}
          <Line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={chartHeight - padding.bottom}
            stroke="#E9ECEF"
            strokeWidth="1"
          />
          
          {/* X-axis */}
          <Line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="#E9ECEF"
            strokeWidth="1"
          />

          {/* Y-axis labels */}
          {yAxisLabels.map((label, index) => {
            const y = chartHeight - padding.bottom - (index * (chartHeight - padding.top - padding.bottom) / 2);
            return (
              <SvgText
                key={index}
                x={padding.left - 10}
                y={y + 4}
                fontSize="10"
                fill="#6C757D"
                textAnchor="end"
              >
                {label}
              </SvgText>
            );
          })}

          {/* Bars */}
          {chartData.map((item) => (
            <Rect
              key={item.bucket}
              x={item.x}
              y={item.y}
              width={item.width}
              height={item.height}
              fill="#27AE60"
              rx="2"
              ry="2"
            />
          ))}

          {/* X-axis labels */}
          {chartData.map((item) => (
            <SvgText
              key={`label-${item.bucket}`}
              x={item.x + item.width / 2}
              y={chartHeight - padding.bottom + 15}
              fontSize="10"
              fill="#6C757D"
              textAnchor="middle"
            >
              {formatLabel(item.bucket)}
            </SvgText>
          ))}
        </Svg>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendColor} />
          <Text style={styles.legendText}>Valor em R$</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingChart: {
    height: chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
  },
  emptyChart: {
    height: chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    backgroundColor: '#27AE60',
    borderRadius: 2,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#6C757D',
  },
});