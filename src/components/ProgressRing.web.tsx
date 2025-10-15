import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type ProgressRingProps = {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  label?: string;
  subtitle?: string;
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 140,
  strokeWidth = 12,
  progress,
  color = '#2563EB',
  trackColor = '#E5E7EB',
  label,
  subtitle,
}) => {
  const clamped = Math.max(0, Math.min(1, progress || 0));

  // Web animation via rAF
  const [animatedProgress, setAnimatedProgress] = useState<number>(clamped);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(clamped);

  useEffect(() => {
    const duration = 800;
    const startValue = startRef.current;
    const delta = clamped - startValue;
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const step = (now: number) => {
      const elapsed = now - t0;
      const t = Math.min(1, elapsed / duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const value = startValue + delta * eased;
      setAnimatedProgress(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        startRef.current = clamped;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [clamped]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(1, animatedProgress)));

  const percent = Math.round((progress || 0) * 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <Text style={styles.percent}>{percent}%</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 2,
  },
  percent: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 18,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
});

export default ProgressRing;