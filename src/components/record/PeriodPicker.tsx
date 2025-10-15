import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PeriodMode } from '../../types';

interface PeriodPickerProps {
  mode: PeriodMode;
  selectedRef: string;
  onRefChange: (ref: string) => void;
}

interface PeriodOption {
  value: string;
  label: string;
}

export const PeriodPicker: React.FC<PeriodPickerProps> = ({
  mode,
  selectedRef,
  onRefChange,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const options = useMemo(() => {
    const currentDate = new Date();
    const options: PeriodOption[] = [];

    if (mode === 'month') {
      // Generate last 24 months
      for (let i = 0; i < 24; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const value = `${year}-${month}`;
        const label = date.toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: 'long' 
        });
        options.push({ value, label });
      }
    } else {
      // Generate last 5 years
      for (let i = 0; i < 5; i++) {
        const year = currentDate.getFullYear() - i;
        options.push({ 
          value: year.toString(), 
          label: year.toString() 
        });
      }
    }

    return options;
  }, [mode]);

  const selectedOption = options.find(option => option.value === selectedRef);

  const handleSelect = (value: string) => {
    onRefChange(value);
    setIsVisible(false);
  };

  const renderOption = ({ item }: { item: PeriodOption }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.value === selectedRef && styles.selectedOption,
      ]}
      onPress={() => handleSelect(item.value)}
      accessibilityLabel={`Selecionar ${item.label}`}
      accessibilityRole="button"
    >
      <Text
        style={[
          styles.optionText,
          item.value === selectedRef && styles.selectedOptionText,
        ]}
      >
        {item.label}
      </Text>
      {item.value === selectedRef && (
        <Ionicons name="checkmark" size={20} color="#27AE60" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setIsVisible(true)}
        accessibilityLabel={`Período selecionado: ${selectedOption?.label}. Toque para alterar`}
        accessibilityRole="button"
        accessibilityHint="Abre lista de períodos disponíveis"
      >
        <Text style={styles.pickerText}>
          {selectedOption?.label || selectedRef}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6C757D" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Selecionar {mode === 'month' ? 'Mês' : 'Ano'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
                accessibilityLabel="Fechar"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color="#6C757D" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.value}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    minHeight: 44,
  },
  pickerText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  closeButton: {
    padding: 4,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
    minHeight: 44,
  },
  selectedOption: {
    backgroundColor: '#F8F9FA',
  },
  optionText: {
    fontSize: 16,
    color: '#212529',
  },
  selectedOptionText: {
    color: '#27AE60',
    fontWeight: '600',
  },
});