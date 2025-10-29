import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants';

export type MetricCardProps = {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
};

export default function MetricCard({ title, value, unit, icon }: MetricCardProps) {
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade-in leve quando o valor muda
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [value]);

  const valueStr = typeof value === 'number' ? value.toString() : value;

  return (
    <Animated.View style={[styles.card, { opacity: fade }]}> 
      <View style={styles.headerCenter}> 
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.valueColumn}>
        <Text style={styles.value}>{valueStr}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 72,
    backgroundColor: '#F4F5F7',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  title: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
  icon: {
    marginLeft: 8,
  },
  valueColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  unit: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
});