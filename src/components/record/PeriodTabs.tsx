import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PeriodMode } from '../../types';

interface PeriodTabsProps {
  selectedMode: PeriodMode;
  onModeChange: (mode: PeriodMode) => void;
}

export const PeriodTabs: React.FC<PeriodTabsProps> = ({
  selectedMode,
  onModeChange,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.tab,
          selectedMode === 'month' && styles.activeTab,
        ]}
        onPress={() => onModeChange('month')}
        accessibilityLabel="Visualizar por mês"
        accessibilityRole="tab"
        accessibilityState={{ selected: selectedMode === 'month' }}
      >
        <Text
          style={[
            styles.tabText,
            selectedMode === 'month' && styles.activeTabText,
          ]}
        >
          Mês
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tab,
          selectedMode === 'year' && styles.activeTab,
        ]}
        onPress={() => onModeChange('year')}
        accessibilityLabel="Visualizar por ano"
        accessibilityRole="tab"
        accessibilityState={{ selected: selectedMode === 'year' }}
      >
        <Text
          style={[
            styles.tabText,
            selectedMode === 'year' && styles.activeTabText,
          ]}
        >
          Ano
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Accessibility touch target
  },
  activeTab: {
    backgroundColor: '#27AE60',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6C757D',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});