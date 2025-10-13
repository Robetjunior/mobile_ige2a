import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonItemProps {
  delay?: number;
}

const SkeletonItem: React.FC<SkeletonItemProps> = ({ delay = 0 }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    );

    const timer = setTimeout(() => {
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [opacity, delay]);

  return (
    <Animated.View style={[styles.skeletonItem, { opacity }]}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonStatus} />
      </View>
      
      <View style={styles.skeletonDateTime} />
      
      <View style={styles.skeletonMetrics}>
        <View style={styles.skeletonMetric} />
        <View style={styles.skeletonMetric} />
        <View style={styles.skeletonMetric} />
      </View>
      
      <View style={styles.skeletonFooter}>
        <View style={styles.skeletonConnector} />
        <View style={styles.skeletonAction} />
      </View>
    </Animated.View>
  );
};

interface SkeletonListProps {
  count?: number;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ count = 5 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonItem key={index} delay={index * 100} />
      ))}
    </View>
  );
};

interface SkeletonCardsProps {
  count?: number;
}

export const SkeletonCards: React.FC<SkeletonCardsProps> = ({ count = 3 }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.cardsContainer}>
      {Array.from({ length: count }, (_, index) => (
        <Animated.View key={index} style={[styles.skeletonCard, { opacity }]}>
          <View style={styles.skeletonCardIcon} />
          <View style={styles.skeletonCardTitle} />
          <View style={styles.skeletonCardValue} />
        </Animated.View>
      ))}
    </View>
  );
};

interface SkeletonChartProps {}

export const SkeletonChart: React.FC<SkeletonChartProps> = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.skeletonChartHeader}>
        <View style={styles.skeletonChartTitle} />
        <View style={styles.skeletonChartSubtitle} />
      </View>
      
      <Animated.View style={[styles.skeletonChartContent, { opacity }]}>
        <View style={styles.skeletonChartBars}>
          {Array.from({ length: 7 }, (_, index) => (
            <View
              key={index}
              style={[
                styles.skeletonBar,
                { height: Math.random() * 100 + 50 }
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  skeletonItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    flex: 1,
    marginRight: 12,
  },
  skeletonStatus: {
    height: 20,
    width: 80,
    backgroundColor: '#E9ECEF',
    borderRadius: 10,
  },
  skeletonDateTime: {
    height: 16,
    width: '70%',
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skeletonMetric: {
    height: 16,
    width: '30%',
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
  },
  skeletonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonConnector: {
    height: 14,
    width: '40%',
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
  },
  skeletonAction: {
    height: 14,
    width: '25%',
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
  },
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 8,
    gap: 12,
  },
  skeletonCard: {
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
  skeletonCardIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#E9ECEF',
    borderRadius: 24,
    marginBottom: 12,
  },
  skeletonCardTitle: {
    height: 12,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonCardValue: {
    height: 20,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    width: '80%',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
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
  skeletonChartHeader: {
    marginBottom: 16,
  },
  skeletonChartTitle: {
    height: 20,
    width: '60%',
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonChartSubtitle: {
    height: 16,
    width: '40%',
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
  },
  skeletonChartContent: {
    height: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  skeletonChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
  },
  skeletonBar: {
    width: 20,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
  },
});