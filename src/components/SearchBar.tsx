import React from 'react';
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
  onFilterPress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Buscar estações...',
  onFilterPress,
}) => {
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
      
      {onFilterPress && (
        <TouchableOpacity
          style={styles.filterButton}
          onPress={onFilterPress}
        >
          <Ionicons name="options" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    backgroundColor: COLORS.white,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.base,
    marginRight: SIZES.base,
  },
  searchIcon: {
    marginRight: SIZES.base,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: SIZES.body3,
    color: COLORS.black,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
});