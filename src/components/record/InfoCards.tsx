import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InfoCardsProps {
  totalMoney: number;
  totalKWh: number;
  totalMinutes: number;
  isLoading?: boolean;
}

interface CardData {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  accessibilityLabel: string;
}

export const InfoCards: React.FC<InfoCardsProps> = ({
  totalMoney,
  totalKWh,
  totalMinutes,
  isLoading = false,
}) => {
  const formatCurrency = (amount: number): string => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
    // Garantir espaço não separável entre símbolo e valor
    return formatted.replace(/\s/g, '\u00A0');
  };

  const formatEnergy = (kWh: number): string => {
    return `${kWh.toFixed(1)}\u00A0kWh`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h\u00A0${remainingMinutes}min` : `${hours}h`;
  };

  const formatCurrencyForAccessibility = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount).replace('R$', 'reais');
  };

  const cards: CardData[] = [
    {
      title: 'Total Money',
      value: isLoading ? '---' : formatCurrency(totalMoney),
      icon: 'reader-outline',
      color: '#F39C12',
      accessibilityLabel: isLoading
        ? 'Total de dinheiro, carregando'
        : `Total de dinheiro, ${formatCurrencyForAccessibility(totalMoney)}`,
    },
    {
      title: 'Charging capacity',
      value: isLoading ? '---' : formatEnergy(totalKWh),
      icon: 'flash-outline',
      color: '#17C0A4',
      accessibilityLabel: isLoading
        ? 'Capacidade de carregamento, carregando'
        : `Capacidade de carregamento, ${totalKWh.toFixed(1)} quilowatt-hora`,
    },
    {
      title: 'Charging duration',
      value: isLoading ? '---' : formatDuration(totalMinutes),
      icon: 'time-outline',
      color: '#FFC107',
      accessibilityLabel: isLoading
        ? 'Duração do carregamento, carregando'
        : `Duração do carregamento, ${formatDuration(totalMinutes)}`,
    },
  ];

  const ListItem: React.FC<{ card: CardData; last?: boolean }> = ({ card, last }) => (
    <View
      style={[styles.itemRow, !last && styles.itemDivider]}
      accessibilityLabel={card.accessibilityLabel}
      accessibilityRole="text"
    >
      <View style={[styles.itemIconCircle, { backgroundColor: `${card.color}22` }]}> 
        <Ionicons name={card.icon} size={20} color={card.color} />
      </View>
      <Text style={styles.itemLabel}>{card.title}</Text>
      <View style={{ flex: 1 }} />
      <Text style={[styles.itemValue, isLoading && styles.loadingValue]}>{card.value}</Text>
    </View>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Information</Text>
      <View style={styles.listContainer}>
        {cards.map((card, idx) => (
          <ListItem key={idx} card={card} last={idx === cards.length - 1} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
  },
  itemValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '700',
  },
  loadingValue: {
    color: '#ADB5BD',
  },
});