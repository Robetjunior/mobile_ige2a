import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InfoCards } from './InfoCards';
// Removido o quadrante de gráfico mock

const KPI_MOCK = {
  total_gasto: 128.75,
  energia_carregada_kWh: 42.5,
  tempo_carregamento_min: 186,
};

export const KpiPreview: React.FC = () => {
  return (
    <View style={styles.wrapper}>
      <InfoCards
        totalMoney={KPI_MOCK.total_gasto}
        totalKWh={KPI_MOCK.energia_carregada_kWh}
        totalMinutes={KPI_MOCK.tempo_carregamento_min}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
});

export default KpiPreview;