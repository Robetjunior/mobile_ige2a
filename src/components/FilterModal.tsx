import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  freeParkingOnly: boolean;
  idleOnly: boolean;
  onToggleFreeParking: () => void;
  onToggleIdle: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onConfirm,
  freeParkingOnly,
  idleOnly,
  onToggleFreeParking,
  onToggleIdle,
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
            <TouchableOpacity
              style={[
                styles.option,
                freeParkingOnly && styles.selectedOption,
              ]}
              onPress={onToggleFreeParking}
              accessibilityRole="button"
              accessibilityLabel="Filtrar por Free Parking"
            >
              <Text
                style={[
                  styles.optionText,
                ]}
              >
                Free Parking (P)
              </Text>
              <Ionicons
                name={freeParkingOnly ? 'checkbox' : 'square-outline'}
                size={20}
                color={freeParkingOnly ? COLORS.primary : COLORS.gray}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.option,
                idleOnly && styles.selectedOption,
              ]}
              onPress={onToggleIdle}
              accessibilityRole="button"
              accessibilityLabel="Exibir apenas pontos Idle"
            >
              <Text
                style={[
                  styles.optionText,
                ]}
              >
                Idle state
              </Text>
              <Ionicons
                name={idleOnly ? 'checkbox' : 'square-outline'}
                size={20}
                color={idleOnly ? COLORS.primary : COLORS.gray}
              />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: SIZES.padding }}>
            <TouchableOpacity style={[styles.applyButton, { backgroundColor: COLORS.lightGray }]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancelar filtros">
              <Text style={[styles.applyButtonText, { color: COLORS.black }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={onConfirm} accessibilityRole="button" accessibilityLabel="Aplicar filtros">
              <Text style={styles.applyButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
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