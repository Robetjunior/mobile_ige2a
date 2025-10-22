import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export type MetricCardProps = {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
};

export default function MetricCard({ title, value, unit, icon }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{typeof value === 'number' ? value.toString() : value}</Text>
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 64,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#6B7280',
    fontSize: 12,
  },
  icon: {
    marginLeft: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  unit: {
    color: '#4B5563',
    fontSize: 12,
    marginLeft: 4,
  },
});