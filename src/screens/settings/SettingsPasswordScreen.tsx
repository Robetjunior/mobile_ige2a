import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants';
import profileService from '../../services/profileService';

const SettingsPasswordScreen: React.FC = () => {
  const [oldPassword, setOld] = useState('');
  const [newPassword, setNew] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const save = async () => {
    setLoading(true); setError(null); setSuccess(false);
    try {
      await profileService.updatePassword(oldPassword, newPassword);
      setSuccess(true);
      setOld(''); setNew('');
    } catch (e: any) {
      setError(e?.message || 'Erro ao alterar senha');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Password</Text>
      <View style={styles.card}>
        <TextInput value={oldPassword} placeholder="Old password" secureTextEntry onChangeText={setOld} style={styles.input} placeholderTextColor={COLORS.textSecondary} />
        <TextInput value={newPassword} placeholder="New password" secureTextEntry onChangeText={setNew} style={styles.input} placeholderTextColor={COLORS.textSecondary} />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>Senha alterada com sucesso</Text>}
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
  input: { paddingVertical: SIZES.md, paddingHorizontal: SIZES.md, color: COLORS.textPrimary, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  error: { color: COLORS.error, paddingHorizontal: SIZES.md, paddingTop: SIZES.sm },
  success: { color: COLORS.success || '#22c55e', paddingHorizontal: SIZES.md, paddingTop: SIZES.sm },
  saveBtn: { marginTop: SIZES.lg, marginHorizontal: SIZES.md, backgroundColor: COLORS.primary, paddingVertical: SIZES.md, borderRadius: SIZES.radiusMD, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});

export default SettingsPasswordScreen;