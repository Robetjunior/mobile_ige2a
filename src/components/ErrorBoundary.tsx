import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export class ErrorBoundary extends React.Component<{ fallback?: React.ReactNode }, { err?: Error }> {
  state = { err: undefined as Error | undefined };

  static getDerivedStateFromError(err: Error) {
    return { err };
  }

  componentDidCatch(err: any, info: any) {
    console.error('[ERR]', err, info);
  }

  reset = () => this.setState({ err: undefined });

  render() {
    return this.state.err ? (this.props.fallback ?? <FallbackError err={this.state.err} onRetry={this.reset} />) : this.props.children;
  }
}

function FallbackError({ err, onRetry }: { err: Error; onRetry?: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Algo deu errado</Text>
      <Text style={styles.message}>{err?.message ?? 'Erro inesperado'}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  message: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
});

export default ErrorBoundary;