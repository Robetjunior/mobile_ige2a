import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { COLORS, SIZES } from '../../constants';
const KEY = 'pile_settings';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PileSettings = {
  autoStart: boolean;
  defaultIdTag?: string | null;
};

const SettingsPileScreen: React.FC = () => {
  const [settings, setSettings] = useState<PileSettings>({ autoStart: true, defaultIdTag: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        try { setSettings(JSON.parse(raw)); } catch {}
      }
    })();
  }, []);

  const save = async () => {
    setLoading(true);
    await AsyncStorage.setItem(KEY, JSON.stringify(settings));
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações do Carregador</Text>
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.rowText}>Iniciar carregamento automaticamente</Text>
          <Switch value={settings.autoStart} onValueChange={(v) => setSettings({ ...settings, autoStart: v })} />
        </View>
        <Text style={styles.hint}>Define comportamentos padrão ao iniciar uma sessão.</Text>
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
  card: { backgroundColor: COLORS.background, marginHorizontal: SIZES.md, borderRadius: SIZES.radiusMD, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', padding: SIZES.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { color: COLORS.textPrimary, fontSize: SIZES.fontMD },
  hint: { color: COLORS.textSecondary, marginTop: SIZES.sm },
  saveBtn: { marginTop: SIZES.lg, marginHorizontal: SIZES.md, backgroundColor: COLORS.primary, paddingVertical: SIZES.md, borderRadius: SIZES.radiusMD, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});

export default SettingsPileScreen;