import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type SessionInfoAccordionProps = {
  connectorId?: number | null;
  idTag?: string | null;
  transactionId?: string | number | null;
};

export default function SessionInfoAccordion({ connectorId, idTag, transactionId }: SessionInfoAccordionProps) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={() => setOpen(!open)} style={styles.header}>
        <Text style={styles.headerText}>Sessão & Conector</Text>
        <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.body}>
          <Row label="Connector" value={connectorId != null ? String(connectorId) : '—'} />
          <Row label="idTag" value={idTag || '—'} />
          <Row label="Transaction" value={transactionId != null ? String(transactionId) : '—'} />
        </View>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
  },
  headerText: {
    fontWeight: '600',
    color: '#111827',
  },
  chevron: {
    color: '#6B7280',
  },
  body: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  rowLabel: { color: '#6B7280' },
  rowValue: { color: '#111827', fontWeight: '600' },
});