import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants';
import profileService from '../../services/profileService';
import { useProfileStore } from '../../stores/profileStore';

const SettingsPhoneScreen: React.FC = () => {
  const { me } = useProfileStore();
  const [phone, setPhone] = useState(me?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const save = async () => {
    setLoading(true); setError(null); setSuccess(false);
    try {
      await profileService.updatePhone(phone);
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message || 'Erro ao alterar telefone');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modify mobile phone number</Text>
      <View style={styles.card}>
        <TextInput value={phone} placeholder="Phone" keyboardType="phone-pad" onChangeText={setPhone} style={styles.input} placeholderTextColor={COLORS.textSecondary} />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>Telefone atualizado</Text>}
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
  input: { paddingVertical: SIZES.md, paddingHorizontal: SIZES.md, color: COLORS.textPrimary },
  error: { color: COLORS.error, paddingHorizontal: SIZES.md, paddingTop: SIZES.sm },
  success: { color: COLORS.success || '#22c55e', paddingHorizontal: SIZES.md, paddingTop: SIZES.sm },
  saveBtn: { marginTop: SIZES.lg, marginHorizontal: SIZES.md, backgroundColor: COLORS.primary, paddingVertical: SIZES.md, borderRadius: SIZES.radiusMD, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});

export default SettingsPhoneScreen;