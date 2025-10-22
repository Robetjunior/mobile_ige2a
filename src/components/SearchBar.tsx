import React, { useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Please enter search keywords',
  onFilterPress,
  onRightPress,
  rightIconName = 'options',
  onRightPressWithAnchor,
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

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons 
          name="search" 
          size={20} 
          color={COLORS.gray} 
          style={styles.searchIcon} 
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>
      
      {(onRightPress || onFilterPress || onRightPressWithAnchor) && (
        <TouchableOpacity
          ref={rightRef as any}
          style={styles.filterButton}
          onPress={handleRightPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={rightIconName as any} size={20} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radiusMD,
    paddingHorizontal: SIZES.sm,
    marginRight: SIZES.sm,
  },
  searchIcon: {
    marginRight: SIZES.sm,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: SIZES.fontSM,
    color: COLORS.textPrimary,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMD,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});