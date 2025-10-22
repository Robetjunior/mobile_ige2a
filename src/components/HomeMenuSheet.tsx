import React, { useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, BackHandler } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants';
import { useHomeMenuStore } from '../stores/homeMenuStore';
import HomeMenuItem from './HomeMenuItem';
import { useCardsStore } from '../stores/cardsStore';
import { useUserStore } from '../stores/userStore';
import { LOGGER } from '../lib/logger';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const HomeMenuSheet: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isOpen, close, anchor, setLastSelection, loadLastSelection } = useHomeMenuStore();
  const { items: cards } = useCardsStore();
  const { signOut } = useUserStore();

  useEffect(() => {
    loadLastSelection().catch(() => {});
  }, [loadLastSelection]);

  // Animations
  const backdropOpacity = useSharedValue(0);
  const sheetScale = useSharedValue(0.98);
  const sheetOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(-4);

  useEffect(() => {
    if (isOpen) {
      backdropOpacity.value = withTiming(1, { duration: 140 });
      sheetOpacity.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) });
      sheetScale.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) });
      sheetTranslateY.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.cubic) });
      // Android back handler
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        close();
        return true;
      });
      return () => sub.remove();
    } else {
      backdropOpacity.value = withTiming(0, { duration: 120 });
      sheetOpacity.value = withTiming(0, { duration: 120 });
      sheetScale.value = withTiming(0.98, { duration: 120 });
      sheetTranslateY.value = withTiming(-4, { duration: 120 });
    }
  }, [isOpen, close]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sheetScale.value }, { translateY: sheetTranslateY.value }],
    opacity: sheetOpacity.value,
  }));

  const anchorPos = useMemo(() => {
    const margin = SIZES.sm;
    const top = anchor ? anchor.y + anchor.height + margin : 80;
    const right = SIZES.md;
    return { top, right };
  }, [anchor]);

  // Gesture to dismiss by swiping down
  const onGestureEvent = useCallback((e: PanGestureHandlerGestureEvent) => {
    const dy = e.nativeEvent.translationY;
    if (dy > 40) {
      close();
    }
  }, [close]);

  // Close when HomeScreen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => close();
    }, [close])
  );

  const handleSelect = useCallback(async (id: string) => {
    await setLastSelection(id);
    // Navigate based on id
    switch (id) {
      case 'profile':
        navigation.navigate('Me');
        break;
      case 'cards':
        navigation.navigate('Cards');
        break;
      case 'history':
        navigation.navigate('Record');
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      case 'support':
        navigation.navigate('Support');
        break;
      case 'about':
        navigation.navigate('About');
        break;
      case 'logout':
        try {
          await signOut();
          navigation.navigate('Home');
        } catch (e) {
          LOGGER.UI.warn('logout.failed', String(e));
        }
        break;
    }
    close();
  }, [setLastSelection, navigation, close, signOut]);

  const menuItems = useMemo(() => {
    const cardsCount = cards.length;
    return [
      { id: 'profile', icon: 'person-outline' as const, label: 'Perfil/Conta' },
      { id: 'cards', icon: 'card-outline' as const, label: 'Carteira/Meus cartões', badgeCount: cardsCount },
      { id: 'history', icon: 'time-outline' as const, label: 'Histórico' },
      { id: 'settings', icon: 'settings-outline' as const, label: 'Configurações' },
      { id: 'support', icon: 'help-circle-outline' as const, label: 'Ajuda/Suporte', showChevron: true },
      { id: 'about', icon: 'information-circle-outline' as const, label: 'Sobre' },
      { id: 'logout', icon: 'log-out-outline' as const, label: 'Sair', subtitle: 'Encerrar sessão atual' },
    ];
  }, [cards.length]);

  if (!isOpen) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <AnimatedPressable
        onPress={close}
        style={[styles.backdrop, backdropStyle]}
        accessibilityRole="button"
        accessibilityLabel="Fechar menu"
      />

      {/* Sheet */}
      <PanGestureHandler onGestureEvent={onGestureEvent}>
        <Animated.View style={[styles.sheet, sheetAnimatedStyle, { top: anchorPos.top, right: anchorPos.right }]}
          accessibilityRole="menu"
        >
          {/* Header (optional) */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
          </View>

          {/* Items */}
          {menuItems.map((it, idx) => (
            <View key={it.id}>
              <HomeMenuItem
                id={it.id}
                label={it.label}
                subtitle={it.subtitle}
                iconName={it.icon}
                badgeCount={it.badgeCount}
                showChevron={it.showChevron}
                onPress={handleSelect}
              />
              {/* Dividers mimic video positions: simple divider between groups */}
              {idx === 3 || idx === 5 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 99,
  },
  sheet: {
    position: 'absolute',
    minWidth: 260,
    maxWidth: 300,
    borderRadius: SIZES.radiusLG,
    backgroundColor: COLORS.background,
    paddingVertical: SIZES.sm,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    // Android elevation
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    zIndex: 100,
  },
  header: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  headerTitle: {
    fontSize: SIZES.fontMD,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.xs,
    marginHorizontal: SIZES.md,
  },
});

export default HomeMenuSheet;