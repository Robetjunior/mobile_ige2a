import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Path, Skia, useValue, runTiming, useComputedValue } from '@shopify/react-native-skia';

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
  const p = useValue(0);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, progress || 0));
    try {
      runTiming(p, clamped, { duration: 800 });
    } catch {
      p.current = clamped;
    }
  }, [progress]);

  const rect = Skia.XYWHRect(
    strokeWidth / 2,
    strokeWidth / 2,
    size - strokeWidth,
    size - strokeWidth
  );

  const trackPath = useComputedValue(() => {
    const path = Skia.Path.Make();
    path.addArc(rect, 0, 360);
    return path;
  }, [size, strokeWidth]);

  const arcPath = useComputedValue(() => {
    const path = Skia.Path.Make();
    const sweep = (p.current || 0) * 360;
    path.addArc(rect, -90, sweep);
    return path;
  }, [p]);

  const percent = Math.round((progress || 0) * 100);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        <Path path={trackPath} color={trackColor} style="stroke" strokeWidth={strokeWidth} />
        <Path path={arcPath} color={color} style="stroke" strokeWidth={strokeWidth} strokeCap="round" />
      </Canvas>
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