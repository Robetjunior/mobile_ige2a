import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useProfileStore } from '../stores/profileStore';
import { COLORS, SIZES } from '../constants';

const Shortcut: React.FC<{ title: string; icon: any; subtitle?: string; onPress: () => void }> = ({ title, icon, subtitle, onPress }) => (
  <TouchableOpacity style={styles.shortcut} onPress={onPress}>
    <View style={styles.shortcutIconWrap}>
      <Ionicons name={icon} size={20} color={COLORS.textPrimary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.shortcutTitle}>{title}</Text>
      {subtitle ? <Text style={styles.shortcutSubtitle}>{subtitle}</Text> : null}
    </View>
    <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
  </TouchableOpacity>
);

const ProfileMeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { me, loading, error, fetchMe, logout } = useProfileStore();
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const Header = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Perfil</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}> 
        <Header />
        <View style={styles.skeleton}>
          <View style={styles.avatarSkeleton} />
          <View style={styles.lineSkeleton} />
          <View style={[styles.lineSkeleton, { width: '50%' }]} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchMe}><Text style={styles.retryText}>Tentar novamente</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!me) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loginBox}>
          <Ionicons name="person-circle-outline" size={80} color={COLORS.textSecondary} />
          <Text style={styles.loginText}>Faça login para acessar seu perfil</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.primaryBtnText}>Fazer login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.topCard}>
        {me.avatarUrl ? (
          <Image source={{ uri: me.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}><Ionicons name="person" size={36} color={COLORS.textPrimary} /></View>
        )}
        <Text style={styles.name}>{me.name}</Text>
        <Text style={styles.subId}>{me.userId}</Text>
      </View>

      <View style={styles.shortcutsCard}>
        <View style={styles.shortcutsGrid}>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Favorites')}>
            <Ionicons name="star" size={28} color="#f59e0b" />
            <Text style={styles.gridTitle}>Recentes</Text>
            {typeof me.favoritesCount === 'number' ? (
              <Text style={styles.gridSubtitle}>{me.favoritesCount} lugares</Text>
            ) : null}
          </TouchableOpacity>
          <View style={styles.gridDivider} />
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Cards')}>
            <Ionicons name="wallet" size={28} color="#ef476f" />
            <Text style={styles.gridTitle}>Meus Cartões</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.optionsCard}>
        <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate('Settings')}>
          <View style={styles.optionLeft}><Ionicons name="settings-outline" size={20} color={COLORS.textPrimary} /><Text style={styles.optionText}>Configurações</Text></View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionRow} onPress={() => setAboutOpen(true)}>
          <View style={styles.optionLeft}><Ionicons name="information-circle-outline" size={20} color={COLORS.textPrimary} /><Text style={styles.optionText}>Sobre</Text></View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={async () => { await logout(); (navigation as any).navigate('Home'); }}>
        <Text style={styles.signOutText}>Sair</Text>
      </TouchableOpacity>

      <Modal visible={aboutOpen} transparent animationType="fade" onRequestClose={() => setAboutOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sobre</Text>
            <Text style={styles.modalText}>Versão do aplicativo 1.0.0</Text>
            <Text style={styles.modalText}>Termos: example.com/terms • Contato: suporte@example.com</Text>
            <TouchableOpacity style={styles.modalClose} onPress={() => setAboutOpen(false)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  header: { paddingTop: SIZES.lg, paddingHorizontal: SIZES.md, paddingBottom: SIZES.md, backgroundColor: COLORS.backgroundSecondary },
  headerTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontXL, fontWeight: '700' },
  topCard: { alignItems: 'center', paddingVertical: SIZES.lg },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: SIZES.md },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, marginBottom: SIZES.md, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  name: { color: COLORS.textPrimary, fontSize: SIZES.fontXL, fontWeight: '700' },
  subId: { color: COLORS.textSecondary, marginTop: 2 },
  shortcutsCard: { backgroundColor: COLORS.background, marginHorizontal: SIZES.md, borderRadius: SIZES.radiusMD, borderWidth: 1, borderColor: COLORS.border },
  shortcutsGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SIZES.md, paddingHorizontal: SIZES.md },
  gridItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontMD, fontWeight: '600', marginTop: 6 },
  gridSubtitle: { color: COLORS.textSecondary, fontSize: SIZES.fontSM, marginTop: 2 },
  gridDivider: { width: 1, height: 48, backgroundColor: COLORS.borderLight },
  shortcut: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.md, paddingHorizontal: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  shortcutIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.backgroundSecondary, alignItems: 'center', justifyContent: 'center', marginRight: SIZES.md },
  shortcutTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontMD, fontWeight: '600' },
  shortcutSubtitle: { color: COLORS.textSecondary, fontSize: SIZES.fontSM },
  optionsCard: { backgroundColor: COLORS.background, marginHorizontal: SIZES.md, marginTop: SIZES.md, borderRadius: SIZES.radiusMD, borderWidth: 1, borderColor: COLORS.border },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SIZES.md, paddingHorizontal: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm as any },
  optionText: { color: COLORS.textPrimary, fontSize: SIZES.fontMD },
  signOutBtn: { marginTop: SIZES.lg, marginHorizontal: SIZES.md, backgroundColor: COLORS.background, borderColor: COLORS.border, borderWidth: 1, paddingVertical: SIZES.md, borderRadius: SIZES.radiusMD, alignItems: 'center' },
  signOutText: { color: COLORS.textPrimary, fontWeight: '700' },
  skeleton: { paddingVertical: SIZES.lg, alignItems: 'center' },
  avatarSkeleton: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.borderLight, marginBottom: SIZES.md },
  lineSkeleton: { width: '70%', height: 16, backgroundColor: COLORS.borderLight, borderRadius: 8, marginBottom: 8 },
  errorBox: { padding: SIZES.md },
  errorText: { color: COLORS.error || '#ef4444' },
  retryBtn: { marginTop: SIZES.md, backgroundColor: COLORS.primary, paddingVertical: SIZES.md, borderRadius: SIZES.radiusMD, alignItems: 'center' },
  retryText: { color: '#fff', fontWeight: '700' },
  loginBox: { alignItems: 'center', padding: SIZES.lg },
  loginText: { color: COLORS.textPrimary, marginTop: SIZES.md },
  primaryBtn: { marginTop: SIZES.md, backgroundColor: COLORS.primary, paddingVertical: SIZES.md, paddingHorizontal: SIZES.lg, borderRadius: SIZES.radiusMD },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: COLORS.background, borderRadius: SIZES.radiusMD, padding: SIZES.md, width: '86%', borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: COLORS.textPrimary, fontSize: SIZES.fontLG, fontWeight: '700', marginBottom: SIZES.sm },
  modalText: { color: COLORS.textSecondary, marginBottom: 4 },
  modalClose: { marginTop: SIZES.md, alignSelf: 'flex-end', backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: SIZES.radiusSM },
  modalCloseText: { color: '#fff', fontWeight: '700' },
});

export default ProfileMeScreen;