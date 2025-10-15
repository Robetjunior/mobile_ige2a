import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants';

const FavoritesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favoritos</Text>
      <Text style={styles.text}>Lista de favoritos (mock)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary, padding: SIZES.md },
  title: { color: COLORS.textPrimary, fontSize: SIZES.fontXL, fontWeight: '700', marginBottom: SIZES.md },
  text: { color: COLORS.textSecondary },
});

export default FavoritesScreen;