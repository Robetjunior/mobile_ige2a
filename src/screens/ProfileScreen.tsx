import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../stores/userStore';
import { COLORS, SIZES } from '../constants';

const ProfileScreen: React.FC = () => {
  const { user, preferences, updatePreferences, signOut } = useUserStore();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            signOut();
            // Navigation would be handled by the auth state change
          },
        },
      ]
    );
  };

  const toggleTheme = () => {
    updatePreferences({
      theme: preferences.theme === 'light' ? 'dark' : 'light',
    });
  };

  const toggleNotifications = () => {
    updatePreferences({
      notifications: !preferences.notifications,
    });
  };

  const selectLanguage = (language: 'pt' | 'en' | 'es') => {
    updatePreferences({ language });
    setShowLanguageModal(false);
  };

  const getLanguageText = (lang: string) => {
    switch (lang) {
      case 'pt':
        return 'Português';
      case 'en':
        return 'English';
      case 'es':
        return 'Español';
      default:
        return 'Português';
    }
  };

  const menuItems = [
    {
      id: 'profile',
      title: 'Editar Perfil',
      icon: 'person-outline',
      onPress: () => {
        // Navigate to edit profile screen
        console.log('Navigate to edit profile');
      },
    },
    {
      id: 'payment',
      title: 'Métodos de Pagamento',
      icon: 'card-outline',
      onPress: () => {
        // Navigate to payment methods screen
        console.log('Navigate to payment methods');
      },
    },
    {
      id: 'history',
      title: 'Histórico de Carregamentos',
      icon: 'time-outline',
      onPress: () => {
        // Navigate to charging history
        console.log('Navigate to charging history');
      },
    },
    {
      id: 'favorites',
      title: 'Estações Favoritas',
      icon: 'heart-outline',
      onPress: () => {
        // Navigate to favorite stations
        console.log('Navigate to favorite stations');
      },
    },
    {
      id: 'support',
      title: 'Suporte',
      icon: 'help-circle-outline',
      onPress: () => {
        // Navigate to support screen
        console.log('Navigate to support');
      },
    },
    {
      id: 'about',
      title: 'Sobre o App',
      icon: 'information-circle-outline',
      onPress: () => {
        // Navigate to about screen
        console.log('Navigate to about');
      },
    },
  ];

  const renderLanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Idioma</Text>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          <View style={styles.languageOptions}>
            {[
              { code: 'pt', name: 'Português', flag: '🇧🇷' },
              { code: 'en', name: 'English', flag: '🇺🇸' },
              { code: 'es', name: 'Español', flag: '🇪🇸' },
            ].map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  preferences.language === language.code && styles.languageOptionActive,
                ]}
                onPress={() => selectLanguage(language.code as any)}
              >
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <Text
                  style={[
                    styles.languageText,
                    preferences.language === language.code && styles.languageTextActive,
                  ]}
                >
                  {language.name}
                </Text>
                {preferences.language === language.code && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={64} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>Não logado</Text>
          <Text style={styles.emptyText}>Faça login para acessar seu perfil</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={COLORS.white} />
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userPhone}>{user.phone}</Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Carregamentos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>156.8</Text>
            <Text style={styles.statLabel}>kWh Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>R$ 89.50</Text>
            <Text style={styles.statLabel}>Economizado</Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={20} color={COLORS.black} />
              <Text style={styles.settingText}>Modo Escuro</Text>
            </View>
            <Switch
              value={preferences.theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.black} />
              <Text style={styles.settingText}>Notificações</Text>
            </View>
            <Switch
              value={preferences.notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={20} color={COLORS.black} />
              <Text style={styles.settingText}>Idioma</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{getLanguageText(preferences.language)}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as any} size={20} color={COLORS.black} />
                <Text style={styles.menuText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.signOutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
      </ScrollView>

      {renderLanguageModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  avatarContainer: {
    marginRight: SIZES.padding,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SIZES.padding,
    marginHorizontal: SIZES.padding,
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.white,
  },
  section: {
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.base,
    paddingHorizontal: SIZES.padding,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: SIZES.body3,
    color: COLORS.black,
    marginLeft: SIZES.base,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    marginRight: SIZES.base / 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuText: {
    fontSize: SIZES.body3,
    color: COLORS.black,
    marginLeft: SIZES.base,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding,
    marginHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  signOutText: {
    fontSize: SIZES.body3,
    color: COLORS.error,
    marginLeft: SIZES.base,
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.padding,
  },
  versionText: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  emptyTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: SIZES.padding,
    marginBottom: SIZES.base,
  },
  emptyText: {
    fontSize: SIZES.body3,
    color: COLORS.gray,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius * 2,
    padding: SIZES.padding,
    width: '80%',
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.black,
  },
  languageOptions: {
    gap: SIZES.base,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.base,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  languageOptionActive: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.primary,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: SIZES.base,
  },
  languageText: {
    fontSize: SIZES.body3,
    color: COLORS.black,
    flex: 1,
  },
  languageTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default ProfileScreen;