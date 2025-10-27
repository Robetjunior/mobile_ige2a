import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, DISTANCE_FILTERS } from '../constants';
import { DistanceFilter } from '../types';

interface RadiusChipsProps {
  value: DistanceFilter;
  onChange: (distance: DistanceFilter) => void;
}

export default function RadiusChips({ value, onChange }: RadiusChipsProps) {
  return (
    <View style={styles.row}>
      {DISTANCE_FILTERS.map((km) => {
        const active = value === km;
        return (
          <TouchableOpacity
            key={km}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(km)}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={14} color={active ? COLORS.background : COLORS.textSecondary} />
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{km} KM</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16 as any,
    marginTop: 8,
    paddingBottom: 8,
    flexWrap: 'nowrap',
    width: '100%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 92,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.textLight,
    backgroundColor: 'transparent',
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { marginLeft: 6, color: COLORS.textSecondary, fontWeight: '600', fontSize: SIZES.fontSM },
  chipTextActive: { color: COLORS.background },
});