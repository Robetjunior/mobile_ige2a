import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { PeriodMode } from '../../stores/recordStore';

interface Props {
  mode: PeriodMode;
  onChange: (mode: PeriodMode) => void;
}

export const PeriodToggle: React.FC<Props> = ({ mode, onChange }) => {
  return (
    <View style={styles.container}>
      <Segment label="Mensal" active={mode === 'month'} onPress={() => onChange('month')} />
      <View style={styles.divider} />
      <Segment label="Anual" active={mode === 'year'} onPress={() => onChange('year')} />
    </View>
  );
};

const Segment = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} accessibilityRole="button">
    <Text style={[styles.segmentLabel, active && styles.segmentActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    justifyContent: 'center',
  },
  segmentLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ADB5BD',
  },
  segmentActive: {
    color: '#20C997', // primary accent do app
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#6C757D',
    marginHorizontal: 16,
    opacity: 0.6,
  },
});

export default PeriodToggle;