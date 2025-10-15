import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Ops! Algo deu errado',
  message,
  onRetry,
  retryText = 'Tentar Novamente',
  icon = 'alert-circle-outline',
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={COLORS.error} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={20} color={COLORS.white} />
          <Text style={styles.retryText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  title: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
    textAlign: 'center',
  },
  message: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SIZES.padding * 1.5,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 1.5,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  retryText: {
    color: COLORS.white,
    fontSize: SIZES.body3,
    fontWeight: '600',
    marginLeft: SIZES.base / 2,
  },
});