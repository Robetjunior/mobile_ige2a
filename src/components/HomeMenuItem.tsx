import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, SIZES } from '../constants';

export interface HomeMenuItemProps {
  id: string;
  label: string;
  subtitle?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  badgeLabel?: string;
  badgeCount?: number;
  disabled?: boolean;
  loading?: boolean;
  showChevron?: boolean;
  onPress: (id: string) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const HomeMenuItem: React.FC<HomeMenuItemProps> = ({
  id,
  label,
  subtitle,
  iconName,
  badgeLabel,
  badgeCount,
  disabled,
  loading,
  showChevron,
  onPress,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.98, { duration: 90 });
    opacity.value = withTiming(0.95, { duration: 90 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 90 });
    opacity.value = withTiming(1, { duration: 90 });
  }, []);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    try { Haptics.selectionAsync().catch(() => {}); } catch {}
    onPress(id);
  }, [id, disabled, loading, onPress]);

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.item, animatedStyle, disabled && styles.itemDisabled]}
      accessibilityRole="menuitem"
      accessibilityState={{ disabled: !!disabled }}
    >
      <View style={styles.leftWrap}>
        <Ionicons name={iconName as any} size={20} color={disabled ? COLORS.textLight : COLORS.textPrimary} />
        <View style={styles.textWrap}>
          <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.rightWrap}>
        {badgeLabel ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        ) : null}
        {typeof badgeCount === 'number' ? (
          <View style={styles.counter}>
            <Text style={styles.counterText}>{badgeCount}</Text>
          </View>
        ) : null}
        {showChevron ? (
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        ) : null}
      </View>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  item: {
    minHeight: 44,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemDisabled: {
    opacity: 0.6,
  },
  leftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textWrap: {
    marginLeft: SIZES.sm,
    flexShrink: 1,
  },
  label: {
    fontSize: SIZES.fontMD,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  labelDisabled: {
    color: COLORS.textLight,
  },
  subtitle: {
    marginTop: 2,
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
  },
  rightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 as any,
    marginLeft: SIZES.md,
  },
  badge: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radiusSM,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: SIZES.fontXS,
    fontWeight: '600',
  },
  counter: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radiusSM,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  counterText: {
    color: COLORS.textPrimary,
    fontSize: SIZES.fontXS,
    fontWeight: '600',
  },
});

export default HomeMenuItem;