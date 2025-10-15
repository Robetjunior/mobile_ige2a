import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/constants';
import ErrorBoundary from './src/components/ErrorBoundary';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { initConsoleProxy, LOGGER } from './src/lib/logger';

export default function App() {
  useEffect(() => {
    initConsoleProxy();
    LOGGER.APP.info('App mounted');
  }, []);

  const [showWatchdog, setShowWatchdog] = useState(false);
  const firstRenderDone = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!firstRenderDone.current) {
        setShowWatchdog(true);
        LOGGER.UI.warn('Watchdog: first render taking too long');
      }
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      firstRenderDone.current = true;
      setShowWatchdog(false);
    });
  });
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppNavigator />
      </ErrorBoundary>
      {showWatchdog && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>Carregando…</Text>
            <Text style={styles.overlaySubtitle}>Ver logs no console</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={async () => {
                const content = LOGGER.getBuffer().join('\n');
                try {
                  // @ts-ignore
                  if (navigator?.clipboard?.writeText) {
                    // @ts-ignore
                    await navigator.clipboard.writeText(content);
                  }
                } catch {}
              }}
            >
              <Text style={styles.copyButtonText}>Copiar logs</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <StatusBar style="auto" backgroundColor={COLORS.primary} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  overlayCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    minWidth: 240,
    alignItems: 'center',
  },
  overlayTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  overlaySubtitle: { fontSize: 12, color: '#666', marginBottom: 12 },
  copyButton: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  copyButtonText: { color: '#fff', fontWeight: '600' },
});
