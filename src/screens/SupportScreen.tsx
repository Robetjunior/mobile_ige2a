import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants';

const SupportScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajuda / Suporte</Text>
      <Text style={styles.subtitle}>Placeholder de suporte para navegação do submenu.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.md },
  title: { fontSize: SIZES.fontLG, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SIZES.sm },
  subtitle: { fontSize: SIZES.fontMD, color: COLORS.textSecondary }
});

export default SupportScreen;