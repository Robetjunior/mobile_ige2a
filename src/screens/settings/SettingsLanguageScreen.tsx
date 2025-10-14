import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants';
import { useProfileStore } from '../../stores/profileStore';

const LANGS: Array<{ code: 'pt-BR'|'en-US'|'es-ES'; label: string }> = [
  { code: 'pt-BR', label: 'Português' },
  { code: 'en-US', label: 'English' },
  { code: 'es-ES', label: 'Español' },
];

const SettingsLanguageScreen: React.FC = () => {
  const { me, updateLanguage, loading } = useProfileStore();
  const [selected, setSelected] = useState(me?.language || 'pt-BR');

  const save = async () => {
    await updateLanguage(selected);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Language</Text>
      <View style={styles.card}>
        {LANGS.map((l) => (
          <TouchableOpacity key={l.code} style={[styles.row, selected === l.code && styles.rowActive]} onPress={() => setSelected(l.code)}>
            <Text style={[styles.rowText, selected === l.code && styles.rowTextActive]}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.5 }]} disabled={loading} onPress={save}>
        <Text style={styles.saveText}>Salvar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  title: { fontSize: SIZES.fontXL, fontWeight: '700', color: COLORS.textPrimary, padding: SIZES.md },
  card: { backgroundColor: COLORS.background, marginHorizontal: SIZES.md, borderRadius: SIZES.radiusMD, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  row: { paddingVertical: SIZES.md, paddingHorizontal: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  rowActive: { backgroundColor: COLORS.backgroundSecondary },
  rowText: { color: COLORS.textPrimary, fontSize: SIZES.fontMD },
  rowTextActive: { color: COLORS.primary, fontWeight: '600' },
  saveBtn: { marginTop: SIZES.lg, marginHorizontal: SIZES.md, backgroundColor: COLORS.primary, paddingVertical: SIZES.md, borderRadius: SIZES.radiusMD, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});

export default SettingsLanguageScreen;