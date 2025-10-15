import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis } from 'victory-native';
import { AmountSeriesData } from '../../mocks/record';

interface AmountChartProps {
  data: AmountSeriesData[];
  periodMode: 'month' | 'year';
  isDarkMode?: boolean;
}

const getResponsiveDimensions = () => {
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;
  const chartWidth = width - 32; // 16px padding on each side
  const chartHeight = isLandscape ? Math.min(200, height * 0.4) : 240;
  
  return { chartWidth, chartHeight, isLandscape };
};

export const AmountChart: React.FC<AmountChartProps> = ({ 
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
    return `R$ ${datum.y.toFixed(2)}`;
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

  // Mock default data when empty
  const defaultMock = [
    { x: '10-01', y: 25.5 },
    { x: '10-02', y: 31.0 },
    { x: '10-03', y: 72.25 },
  ];
  const displayData = (data && data.length > 0) ? data : defaultMock;

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Text style={[styles.title, isDarkMode && styles.titleDark]}>
        Amount statistics
      </Text>
      
      <VictoryChart
        theme={theme}
        width={dimensions.chartWidth}
        height={dimensions.chartHeight}
        padding={{ 
          left: dimensions.isLandscape ? 50 : 60, 
          top: 20, 
          right: dimensions.isLandscape ? 30 : 40, 
          bottom: dimensions.isLandscape ? 50 : 60 
        }}
        domainPadding={{ x: 20 }}
      >
        <VictoryAxis
          dependentAxis
          tickFormat={(value) => `R$ ${value}`}
          style={{
            tickLabels: { fontSize: 11, fill: isDarkMode ? '#ccc' : '#666' }
          }}
        />
        
        <VictoryAxis
          tickFormat={(x) => getXAxisLabel(x)}
          style={{
            tickLabels: { fontSize: 11, fill: isDarkMode ? '#ccc' : '#666', angle: 0 }
          }}
        />
        
        <VictoryBar
          data={displayData}
          x="x"
          y="y"
          style={{
            data: { 
              fill: '#27AE60',
              fillOpacity: 0.8,
              stroke: '#27AE60',
              strokeWidth: 1
            }
          }}
          cornerRadius={{ top: 4, bottom: 0 }}
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
});

export default AmountChart;