import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import { useNavigation } from '@react-navigation/native';

const Row: React.FC<{ title: string; icon: any; onPress: () => void }> = ({ title, icon, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={20} color={COLORS.textPrimary} />
      <Text style={styles.rowText}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
  </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações</Text>
      <View style={styles.card}>
        <Row title="Alterar Senha" icon="key-outline" onPress={() => navigation.navigate('SettingsPassword')} />
        <Row title="Alterar número de telefone" icon="call-outline" onPress={() => navigation.navigate('SettingsPhone')} />
        <Row title="Trocar idioma" icon="language-outline" onPress={() => navigation.navigate('SettingsLanguage')} />
        <Row title="Configurações do Carregador" icon="construct-outline" onPress={() => navigation.navigate('SettingsPile')} />
        <Row title="Cancelamento de Conta" icon="trash-outline" onPress={() => navigation.navigate('AccountCancel')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  title: { fontSize: SIZES.fontXL, fontWeight: '700', color: COLORS.textPrimary, padding: SIZES.md },
  card: { backgroundColor: COLORS.background, marginHorizontal: SIZES.md, borderRadius: SIZES.radiusMD, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SIZES.md, paddingHorizontal: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm as any },
  rowText: { color: COLORS.textPrimary, fontSize: SIZES.fontMD },
});

export default SettingsScreen;