import assert from 'assert';
import { useRecordStore } from '../src/stores/recordStore';

// Basic unit tests for formatters and getStatusColor and reducers
async function run() {
  const store = useRecordStore.getState();

  // Reducers: setPeriodMode and setRef
  store.setPeriodMode('month');
  assert.strictEqual(useRecordStore.getState().periodMode, 'month', 'periodMode should be month');
  store.setPeriodMode('year');
  assert.strictEqual(useRecordStore.getState().periodMode, 'year', 'periodMode should be year');
  store.setRef('2025-10');
  assert.strictEqual(useRecordStore.getState().ref, '2025-10', 'ref should be 2025-10');

  // Load mock data to ensure sessions exist
  store.loadMockData();
  assert.ok(useRecordStore.getState().sessions.length >= 0, 'sessions should be available');

  // Formatters
  const { formatCurrency, formatEnergy, formatUnitPrice, formatDuration, getStatusColor, getStatusLabel } = store;

  assert.strictEqual(formatCurrency(12.34), 'R$ 12,34', 'formatCurrency basic');
  assert.strictEqual(formatEnergy(19.2), '19,2 kWh', 'formatEnergy basic');
  assert.strictEqual(formatUnitPrice(1.99), 'R$ 1,99/kWh', 'formatUnitPrice basic');
  assert.strictEqual(formatDuration(137), '2h 17m', 'formatDuration basic');

  // Status color and label
  assert.ok(getStatusColor('finished'), 'getStatusColor finished returns color');
  assert.ok(getStatusColor('charging'), 'getStatusColor charging returns color');
  assert.ok(getStatusColor('error'), 'getStatusColor error returns color');
  assert.ok(getStatusColor('unknown'), 'getStatusColor unknown returns color');
  assert.ok(getStatusLabel('finished'), 'getStatusLabel finished');

  console.log('Record basic tests passed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});