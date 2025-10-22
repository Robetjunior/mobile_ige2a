import React from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export type PrimaryCTAProps = {
  label: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  // Variante visual para indicar claramente iniciar/parar
  variant?: 'start' | 'stop';
};

export default function PrimaryCTA({ label, onPress, loading, disabled, variant }: PrimaryCTAProps) {
  const isDisabled = !!disabled || !!loading;
  const bgStyle = variant === 'stop' ? styles.btnStop : styles.btnStart;
  const disabledStyle = variant === 'stop' ? styles.btnStopDisabled : styles.btnStartDisabled;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={[styles.btn, isDisabled ? disabledStyle : bgStyle]}
    >
      {loading ? (
        <View style={styles.row}> 
          <ActivityIndicator color={COLORS.white} />
          <Text style={[styles.text, styles.textLoading]}> {label} </Text>
        </View>
      ) : (
        <Text style={styles.text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Iniciar: verde
  btnStart: {
    backgroundColor: '#16A34A',
  },
  btnStartDisabled: {
    backgroundColor: '#9CA3AF',
  },
  // Parar: vermelho
  btnStop: {
    backgroundColor: '#DC2626',
  },
  btnStopDisabled: {
    backgroundColor: '#FCA5A5',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textLoading: {
    marginLeft: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
});