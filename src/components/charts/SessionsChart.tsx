import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { 
  VictoryChart, 
  VictoryBar, 
  VictoryLine, 
  VictoryAxis 
} from 'victory-native';
import { SessionsSeriesData } from '../../mocks/record';

interface SessionsChartProps {
  data: SessionsSeriesData[];
  periodMode: 'month' | 'year';
  isDarkMode?: boolean;
}

const getResponsiveDimensions = () => {
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;
  const chartWidth = width - 32; // 16px padding on each side
  const chartHeight = isLandscape ? Math.min(220, height * 0.45) : 260;
  
  return { chartWidth, chartHeight, isLandscape };
};

export const SessionsChart: React.FC<SessionsChartProps> = ({ 
  data, 
  periodMode, 
  isDarkMode = false 
}) => {
  const [dimensions, setDimensions] = useState(getResponsiveDimensions());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDimensions(getResponsiveDimensions());
    });

    return () => subscription?.remove();
  }, []);
  const formatTooltip = (datum: any) => {
    const x = datum.x;
    const count = datum.count || datum.y;
    const kWh = datum.kWh;
    
    if (kWh !== undefined) {
      return `${x} — ${count} sessões, ${kWh} kWh`;
    }
    return `${x} — ${count} sessões`;
  };

  const getXAxisLabel = (x: string) => {
    if (periodMode === 'month') {
      // For month mode, show day number (e.g., "10-01" -> "01")
      return x.split('-')[1];
    } else {
      // For year mode, show month number (e.g., "01" -> "Jan")
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                         'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthIndex = parseInt(x) - 1;
      return monthNames[monthIndex] || x;
    }
  };

  const theme = {
    axis: {
      style: {
        axis: { stroke: isDarkMode ? '#6C757D' : '#E9ECEF' },
        grid: { stroke: isDarkMode ? '#495057' : '#F8F9FA' },
        tickLabels: { 
          fill: isDarkMode ? '#E9ECEF' : '#6C757D',
          fontSize: 12,
          fontFamily: 'System'
        },
      },
    },
  };

  // Prepare data for bars (sessions count)
  const barData = data.map(item => ({ x: item.x, y: item.count }));
  
  // Prepare data for line (kWh)
  const lineData = data.map(item => ({ x: item.x, y: item.kWh }));

  // Calculate max values for scaling
  const maxCount = Math.max(...data.map(d => d.count));
  const maxKWh = Math.max(...data.map(d => d.kWh));

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
            Sem dados no período
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Text style={[styles.title, isDarkMode && styles.titleDark]}>
        Charging sessions
      </Text>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#27AE60' }]} />
          <Text style={[styles.legendText, isDarkMode && styles.legendTextDark]}>
            Sessões
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#95A5A6' }]} />
          <Text style={[styles.legendText, isDarkMode && styles.legendTextDark]}>
            kWh
          </Text>
        </View>
      </View>
      
      <VictoryChart
        theme={theme}
        width={dimensions.chartWidth}
        height={dimensions.chartHeight}
        padding={{ 
          left: dimensions.isLandscape ? 50 : 60, 
          top: 20, 
          right: dimensions.isLandscape ? 50 : 60, 
          bottom: dimensions.isLandscape ? 50 : 60 
        }}
        domainPadding={{ x: 20 }}
      >
        {/* Left Y-axis for sessions count */}
        <VictoryAxis
          dependentAxis
          tickFormat={(value) => `${value}`}
          style={{
            tickLabels: { fontSize: 11, fill: isDarkMode ? '#ccc' : '#666' }
          }}
          domain={[0, maxCount + 1]}
        />
        
        {/* Right Y-axis for kWh */}
        <VictoryAxis
          dependentAxis
          orientation="right"
          tickFormat={(value) => `${value} kWh`}
          style={{
            tickLabels: { fontSize: 11, fill: isDarkMode ? '#ccc' : '#666' }
          }}
          domain={[0, maxKWh + 5]}
        />
        
        {/* X-axis */}
        <VictoryAxis
          tickFormat={(x) => getXAxisLabel(x)}
          style={{
            tickLabels: { fontSize: 11, fill: isDarkMode ? '#ccc' : '#666', angle: 0 }
          }}
        />
        
        {/* Bar chart for sessions count */}
        <VictoryBar
          data={barData}
          x="x"
          y="y"
          style={{
            data: { 
              fill: '#27AE60',
              fillOpacity: 0.7,
              stroke: '#27AE60',
              strokeWidth: 1
            }
          }}
          cornerRadius={{ top: 4, bottom: 0 }}
        />
        
        {/* Line chart for kWh - scaled to match the right axis */}
        <VictoryLine
          data={lineData.map(d => ({ 
            x: d.x, 
            y: (d.y / maxKWh) * maxCount // Scale kWh to match left axis range
          }))}
          x="x"
          y="y"
          style={{
            data: { 
              stroke: '#95A5A6',
              strokeWidth: 3
            }
          }}
          animate={{
            duration: 1000,
            onLoad: { duration: 500 }
          }}
        />
      </VictoryChart>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  titleDark: {
    color: '#fff',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
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
  legendTextDark: {
    color: '#ccc',
  },
  emptyState: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#ccc',
  },
});

export default SessionsChart;