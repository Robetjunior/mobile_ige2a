import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
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

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const WOW = { dark: '#474A51', teal: '#17C0A4', yellow: '#FFC107', pink: '#FF4D86', lightGray: '#DADDE2' };
  const t = (key: string) => {
    const map = {
      accountTitle: 'Conta',
      recentlyUsed: 'Recentes',
      myCard: 'Meu Cartão',
      settings: 'Configurações',
      about: 'Sobre nós',
      signOut: 'Sair',
    } as const;
    return (map as any)[key] || key;
  };

  const HeaderSkeleton = () => (
    <View style={styles.headerBand} accessibilityRole="header">
      <Text style={styles.headerAccountTitle}>{t('accountTitle')}</Text>
      <View style={styles.headerCenter}>
        <View style={styles.headerAvatarSkeleton} />
        <View style={styles.skelLine} />
        <View style={[styles.skelLine, { width: '40%' }]} />
      </View>
    </View>
  );

  const Header = () => (
    <View style={styles.headerBand} accessibilityRole="header">
      <Text style={styles.headerAccountTitle}>{t('accountTitle')}</Text>
      <View style={styles.headerCenter}>
        {me?.avatarUrl ? (
          <Image source={{ uri: me.avatarUrl }} style={styles.headerAvatar} />
        ) : (
          <View style={styles.headerAvatar}>
            <View style={styles.headerAvatarInner}>
              <Ionicons name="person" size={44} color="#fff" />
            </View>
          </View>
        )}
        <Text style={styles.headerName} numberOfLines={1}>{me?.name || 'Demo User'}</Text>
        <Text style={styles.headerId} numberOfLines={1}>{me?.userId || 'Go250922150835958'}</Text>
      </View>
    </View>
  );

  const handleSignOut = () => {
    if (loading) return;
    try {
      Alert.alert(t('signOut'), 'Deseja sair da conta?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'OK', onPress: async () => {
            await logout();
            try { (navigation as any).navigate('Main', { screen: 'Home' }); } catch {}
          } 
        },
      ]);
    } catch {
      logout().then(() => { try { (navigation as any).navigate('Main', { screen: 'Home' }); } catch {} });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchMe} accessibilityRole="button" accessibilityLabel="Retry">
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
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
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Home')} accessibilityRole="button" accessibilityLabel="Login">
            <Text style={styles.primaryBtnText}>Fazer login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.shortcutGridCard}>
        <View style={styles.shortcutGridRow}>
          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() => navigation.navigate('Favorites')}
            accessibilityRole="button"
            accessibilityLabel={t('recentlyUsed')}
            activeOpacity={0.75}
          >
            <Ionicons name="star" size={40} color={WOW.yellow} />
            <Text style={styles.shortcutLabel}>{t('recentlyUsed')}</Text>
          </TouchableOpacity>
          <View style={styles.vertDivider} />
          <TouchableOpacity
            style={styles.shortcutItem}
            onPress={() => navigation.navigate('Cards')}
            accessibilityRole="button"
            accessibilityLabel={t('myCard')}
            activeOpacity={0.75}
          >
            <Ionicons name="wallet" size={40} color={WOW.pink} />
            <Text style={styles.shortcutLabel}>{t('myCard')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.optionsBlock}>
        <TouchableOpacity
          style={styles.optionRowWow}
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          accessibilityLabel={t('settings')}
          activeOpacity={0.7}
        >
          <View style={styles.optionLeftWow}>
            <Ionicons name="settings-outline" size={22} color="#222" />
            <Text style={styles.optionLabel}>{t('settings')}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.optionsDivider} />
        <TouchableOpacity
          style={styles.optionRowWow}
          onPress={() => navigation.navigate('About')}
          accessibilityRole="button"
          accessibilityLabel={t('about')}
          activeOpacity={0.7}
        >
          <View style={styles.optionLeftWow}>
            <Ionicons name="information-circle-outline" size={22} color="#222" />
            <Text style={styles.optionLabel}>{t('about')}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.signOutButtonWow, loading && styles.signOutDisabled]}
        onPress={handleSignOut}
        accessibilityRole="button"
        accessibilityLabel={t('signOut')}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.signOutTextWow}>{t('signOut')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerBand: {
    height: 200,
    backgroundColor: '#474A51',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'stretch',
  },
  headerAccountTitle: {
    color: '#17C0A4',
    fontSize: 22,
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  headerCenter: {
    alignItems: 'center',
    marginTop: 16,
  },
  headerAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  headerAvatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  headerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  headerId: {
    color: '#DADDE2',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  shortcutGridCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  shortcutGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8 as any,
  },
  shortcutLabel: {
    color: '#222',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  vertDivider: {
    width: 1,
    height: 56,
    backgroundColor: '#E3E6EA',
    marginHorizontal: 8,
  },
  optionsBlock: {
    backgroundColor: '#DADDE2',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  optionRowWow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  optionLeftWow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 as any,
  },
  optionLabel: {
    color: '#222',
    fontSize: 18,
    fontWeight: '500',
  },
  optionsDivider: {
    height: 1,
    backgroundColor: '#C8CCD1',
    marginHorizontal: 8,
  },
  signOutButtonWow: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#474A51',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutTextWow: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signOutDisabled: {
    opacity: 0.6,
  },
  headerAvatarSkeleton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#5A5D64',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#6E7178',
  },
  skelLine: {
    width: '60%',
    height: 16,
    backgroundColor: '#6E7178',
    borderRadius: 8,
    marginTop: 8,
  },
  errorBox: { padding: 16 },
  errorText: { color: COLORS.error || '#ef4444' },
  retryBtn: { marginTop: 16, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  retryText: { color: '#fff', fontWeight: '700' },
  loginBox: { alignItems: 'center', padding: 24 },
  loginText: { color: COLORS.textPrimary, marginTop: 16 },
  primaryBtn: { marginTop: 16, backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
});

export default ProfileMeScreen;