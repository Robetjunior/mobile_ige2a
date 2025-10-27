import React, { useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void; // backward compat
  onRightPress?: () => void; // preferred prop for right button
  rightIconName?: keyof typeof Ionicons.glyphMap; // default 'options'
  onRightPressWithAnchor?: (anchor: { x: number; y: number; width: number; height: number }) => void;
  containerStyle?: StyleProp<ViewStyle>;
  variant?: 'default' | 'header';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Please enter search keywords',
  onFilterPress,
  onRightPress,
  rightIconName = 'options',
  onRightPressWithAnchor,
  containerStyle,
  variant = 'default',
}) => {
  const rightRef = useRef<TouchableOpacity | null>(null);

  const handleRightPress = () => {
    if (onRightPressWithAnchor && rightRef.current && rightRef.current.measureInWindow) {
      try {
        rightRef.current.measureInWindow((x, y, width, height) => {
          onRightPressWithAnchor({ x, y, width, height });
        });
        return;
      } catch {}
    }
    const fn = onRightPress || onFilterPress;
    fn && fn();
  };

  const isHeader = variant === 'header';

  return (
    <View style={[styles.container, containerStyle] }>
      <View style={[styles.searchContainer, isHeader && styles.searchContainerHeader] }>
        <Ionicons 
          name="search" 
          size={20} 
          color={isHeader ? 'rgba(255,255,255,0.7)' : COLORS.gray} 
          style={styles.searchIcon} 
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isHeader ? 'rgba(255,255,255,0.7)' : COLORS.gray}
          selectionColor={isHeader ? '#FFFFFF' : undefined}
          underlineColorAndroid="transparent"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={isHeader ? 'rgba(255,255,255,0.7)' : COLORS.gray} />
          </TouchableOpacity>
        )}

        {(onRightPress || onFilterPress || onRightPressWithAnchor) && (
          <TouchableOpacity
            ref={rightRef as any}
            style={styles.rightIconInside}
            onPress={handleRightPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={rightIconName as any} size={20} color={isHeader ? '#FFFFFF' : COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 24,
    paddingHorizontal: SIZES.sm,
    marginRight: 0,
    minHeight: 46,
  },
  searchContainerHeader: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  searchIcon: {
    marginRight: SIZES.sm,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: SIZES.fontSM,
    color: COLORS.textPrimary,
  },
  clearButton: {
    padding: 4,
  },
  rightIconInside: {
    width: 44,
    height: 44,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});