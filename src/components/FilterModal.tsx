import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, DISTANCE_FILTERS } from '../constants';
import { DistanceFilter } from '../types';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDistance: DistanceFilter;
  onDistanceChange: (distance: DistanceFilter) => void;
  showFavoritesOnly: boolean;
  onFavoritesToggle: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  selectedDistance,
  onDistanceChange,
  showFavoritesOnly,
  onFavoritesToggle,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtros</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distância</Text>
            {DISTANCE_FILTERS.map((distance) => (
              <TouchableOpacity
                key={distance}
                style={[
                  styles.option,
                  selectedDistance === distance && styles.selectedOption,
                ]}
                onPress={() => onDistanceChange(distance)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedDistance === distance && styles.selectedOptionText,
                  ]}
                >
                  {distance} km
                </Text>
                {selectedDistance === distance && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.option,
                showFavoritesOnly && styles.selectedOption,
              ]}
              onPress={onFavoritesToggle}
            >
              <Text
                style={[
                  styles.optionText,
                  showFavoritesOnly && styles.selectedOptionText,
                ]}
              >
                Apenas favoritos
              </Text>
              <Ionicons
                name={showFavoritesOnly ? 'heart' : 'heart-outline'}
                size={20}
                color={showFavoritesOnly ? COLORS.primary : COLORS.gray}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={onClose}>
            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  section: {
    marginTop: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SIZES.base,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base / 2,
  },
  selectedOption: {
    backgroundColor: COLORS.lightGreen,
  },
  optionText: {
    fontSize: SIZES.body3,
    color: COLORS.black,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body2,
    fontWeight: '600',
  },
});