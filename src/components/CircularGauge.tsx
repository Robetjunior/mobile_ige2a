import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants';
import ProgressRing from './ProgressRing';

export type CircularGaugeProps = {
  percent: number | null; // 0–100 or null when unknown
  size?: number;
  centerImageSrc?: any; // ImageSourcePropType
  loading?: boolean;
};

function lerpColor(from: string, to: string, t: number) {
  // expects hex #RRGGBB
  const f = from.replace('#', '');
  const tt = to.replace('#', '');
  const fr = parseInt(f.substring(0, 2), 16);
  const fg = parseInt(f.substring(2, 4), 16);
  const fb = parseInt(f.substring(4, 6), 16);
  const tr = parseInt(tt.substring(0, 2), 16);
  const tg = parseInt(tt.substring(2, 4), 16);
  const tb = parseInt(tt.substring(4, 6), 16);
  const r = Math.round(fr + (tr - fr) * t);
  const g = Math.round(fg + (tg - fg) * t);
  const b = Math.round(fb + (tb - fb) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function CircularGauge({ percent, size = 220, centerImageSrc, loading }: CircularGaugeProps) {
  const p = typeof percent === 'number' ? Math.max(0, Math.min(100, percent)) : 0;
  const color = lerpColor('#E5E7EB', COLORS.primary, p / 100);
  const label = typeof percent === 'number' ? `${Math.round(p)}%` : '—%';

  const imgSrc = centerImageSrc || require('../../assets/icon.png');

  return (
    <View style={[styles.card, { width: size + 24, height: size + 24 }]}> 
      <View style={styles.headerStatusDot} />
      <View style={styles.ringWrap}>
        <ProgressRing
          size={size}
          strokeWidth={12}
          progress={p}
          color={color}
          trackColor="#E5E7EB"
          label={label}
        />
        <View style={[styles.centerWrap, { width: size * 0.6, height: size * 0.6 }]}> 
          <Image source={imgSrc} style={styles.centerImage} resizeMode="contain" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#3F4A54',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  headerStatusDot: {
    position: 'absolute',
    top: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerImage: {
    width: '100%',
    height: '100%',
  },
});