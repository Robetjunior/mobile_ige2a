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
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatEnergy = (kWh: number): string => {
    return `${kWh.toFixed(1)} kWh`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const formatCurrencyForAccessibility = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount).replace('R$', 'reais');
  };

  const cards: CardData[] = [
    {
      title: 'Total Gasto',
      value: isLoading ? '---' : formatCurrency(totalMoney),
      icon: 'cash-outline',
      color: '#27AE60',
      accessibilityLabel: isLoading 
        ? 'Total gasto, carregando' 
        : `Total gasto, ${formatCurrencyForAccessibility(totalMoney)}`,
    },
    {
      title: 'Energia Carregada',
      value: isLoading ? '---' : formatEnergy(totalKWh),
      icon: 'flash-outline',
      color: '#3498DB',
      accessibilityLabel: isLoading 
        ? 'Energia carregada, carregando' 
        : `Energia carregada, ${totalKWh.toFixed(1)} quilowatt-hora`,
    },
    {
      title: 'Tempo de Carregamento',
      value: isLoading ? '---' : formatDuration(totalMinutes),
      icon: 'time-outline',
      color: '#F39C12',
      accessibilityLabel: isLoading 
        ? 'Tempo de carregamento, carregando' 
        : `Tempo de carregamento, ${formatDuration(totalMinutes)}`,
    },
  ];

  const Card: React.FC<{ card: CardData }> = ({ card }) => (
    <View 
      style={styles.card}
      accessibilityLabel={card.accessibilityLabel}
      accessibilityRole="text"
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${card.color}15` }]}>
          <Ionicons name={card.icon} size={24} color={card.color} />
        </View>
      </View>
      
      <Text style={styles.cardTitle}>{card.title}</Text>
      <Text style={[styles.cardValue, isLoading && styles.loadingValue]}>
        {card.value}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {cards.map((card, index) => (
        <Card key={index} card={card} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 8,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    lineHeight: 22,
  },
  loadingValue: {
    color: '#ADB5BD',
  },
});