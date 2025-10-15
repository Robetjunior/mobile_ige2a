import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nenhum registro encontrado',
  message = 'Não há sessões de carregamento para o período selecionado.',
  icon = 'document-text-outline',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color="#ADB5BD" />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      <View style={styles.illustration}>
        <View style={styles.illustrationLine1} />
        <View style={styles.illustrationLine2} />
        <View style={styles.illustrationLine3} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  illustration: {
    alignItems: 'center',
    opacity: 0.3,
  },
  illustrationLine1: {
    width: 120,
    height: 4,
    backgroundColor: '#ADB5BD',
    borderRadius: 2,
    marginBottom: 8,
  },
  illustrationLine2: {
    width: 80,
    height: 4,
    backgroundColor: '#ADB5BD',
    borderRadius: 2,
    marginBottom: 8,
  },
  illustrationLine3: {
    width: 100,
    height: 4,
    backgroundColor: '#ADB5BD',
    borderRadius: 2,
  },
});