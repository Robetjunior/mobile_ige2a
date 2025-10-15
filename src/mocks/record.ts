// Mock data for Record screen charts and statistics

export interface AmountSeriesData {
  x: string;
  y: number;
}

export interface SessionsSeriesData {
  x: string;
  count: number;
  kWh: number;
}

export interface MockSummary {
  period: string;
  totalMoney: number;
  totalKWh: number;
  totalMinutes: number;
  amountSeries: AmountSeriesData[];
  sessionsSeries: SessionsSeriesData[];
}

export const mockSummaryMonth: MockSummary = {
  period: '2025-10',
  totalMoney: 318.7,
  totalKWh: 142.5,
  totalMinutes: 1190,
  amountSeries: [
    { x: '10-01', y: 12.8 },
    { x: '10-02', y: 0 },
    { x: '10-03', y: 22.4 },
    { x: '10-04', y: 9.6 },
    { x: '10-05', y: 31.2 },
    { x: '10-06', y: 0 },
    { x: '10-07', y: 18.7 },
    { x: '10-08', y: 14.2 },
    { x: '10-09', y: 25.3 },
    { x: '10-10', y: 19.8 },
    { x: '10-11', y: 0 },
    { x: '10-12', y: 28.1 },
    { x: '10-13', y: 16.5 },
    { x: '10-14', y: 21.9 },
    { x: '10-15', y: 33.4 },
    { x: '10-16', y: 0 },
    { x: '10-17', y: 24.7 },
    { x: '10-18', y: 17.3 },
    { x: '10-19', y: 29.6 },
    { x: '10-20', y: 15.8 }
  ],
  sessionsSeries: [
    { x: '10-01', count: 1, kWh: 6.2 },
    { x: '10-02', count: 0, kWh: 0 },
    { x: '10-03', count: 2, kWh: 12.4 },
    { x: '10-04', count: 1, kWh: 4.8 },
    { x: '10-05', count: 3, kWh: 15.9 },
    { x: '10-06', count: 0, kWh: 0 },
    { x: '10-07', count: 2, kWh: 10.1 },
    { x: '10-08', count: 2, kWh: 8.7 },
    { x: '10-09', count: 2, kWh: 13.5 },
    { x: '10-10', count: 1, kWh: 9.8 },
    { x: '10-11', count: 0, kWh: 0 },
    { x: '10-12', count: 3, kWh: 16.2 },
    { x: '10-13', count: 1, kWh: 7.9 },
    { x: '10-14', count: 2, kWh: 11.3 },
    { x: '10-15', count: 3, kWh: 18.1 },
    { x: '10-16', count: 0, kWh: 0 },
    { x: '10-17', count: 2, kWh: 12.8 },
    { x: '10-18', count: 1, kWh: 8.4 },
    { x: '10-19', count: 2, kWh: 14.7 },
    { x: '10-20', count: 1, kWh: 7.6 }
  ]
};

export const mockSummaryYear: MockSummary = {
  period: '2025',
  totalMoney: 2458.2,
  totalKWh: 1095.7,
  totalMinutes: 9360,
  amountSeries: [
    { x: '01', y: 120.5 },
    { x: '02', y: 98.3 },
    { x: '03', y: 210.9 },
    { x: '04', y: 165.0 },
    { x: '05', y: 220.7 },
    { x: '06', y: 180.2 },
    { x: '07', y: 260.4 },
    { x: '08', y: 340.1 },
    { x: '09', y: 220.0 },
    { x: '10', y: 318.7 },
    { x: '11', y: 130.6 },
    { x: '12', y: 192.8 }
  ],
  sessionsSeries: [
    { x: '01', count: 6, kWh: 28 },
    { x: '02', count: 5, kWh: 25 },
    { x: '03', count: 10, kWh: 52 },
    { x: '04', count: 8, kWh: 44 },
    { x: '05', count: 11, kWh: 60 },
    { x: '06', count: 9, kWh: 50 },
    { x: '07', count: 13, kWh: 70 },
    { x: '08', count: 17, kWh: 92 },
    { x: '09', count: 11, kWh: 63 },
    { x: '10', count: 15, kWh: 83 },
    { x: '11', count: 7, kWh: 36 },
    { x: '12', count: 9, kWh: 52 }
  ]
};

// Mock session items for the list
export const mockSessionItems = [
  {
    id: '1',
    stationName: 'Shopping Center Norte',
    chargeBoxId: 'SCN-001',
    connectorId: 1,
    connectorType: 'CCS2',
    status: 'finished' as const,
    startedAt: '2025-10-20T14:30:00Z',
    endedAt: '2025-10-20T15:45:00Z',
    energyKWh: 7.6,
    unitPrice: 2.08,
    totalAmount: 15.8
  },
  {
    id: '2',
    stationName: 'Posto Shell Marginal',
    chargeBoxId: 'PSM-003',
    connectorId: 2,
    connectorType: 'Type 2',
    status: 'finished' as const,
    startedAt: '2025-10-19T09:15:00Z',
    endedAt: '2025-10-19T11:30:00Z',
    energyKWh: 14.7,
    unitPrice: 2.01,
    totalAmount: 29.6
  },
  {
    id: '3',
    stationName: 'Estação Vila Madalena',
    chargeBoxId: 'EVM-002',
    connectorId: 1,
    connectorType: 'CCS2',
    status: 'finished' as const,
    startedAt: '2025-10-18T16:20:00Z',
    endedAt: '2025-10-18T17:35:00Z',
    energyKWh: 8.4,
    unitPrice: 2.06,
    totalAmount: 17.3
  },
  {
    id: '4',
    stationName: 'Carrefour Anália Franco',
    chargeBoxId: 'CAF-001',
    connectorId: 3,
    connectorType: 'CHAdeMO',
    status: 'finished' as const,
    startedAt: '2025-10-17T13:45:00Z',
    endedAt: '2025-10-17T15:50:00Z',
    energyKWh: 12.8,
    unitPrice: 1.93,
    totalAmount: 24.7
  },
  {
    id: '5',
    stationName: 'Posto Ipiranga Paulista',
    chargeBoxId: 'PIP-004',
    connectorId: 1,
    connectorType: 'CCS2',
    status: 'finished' as const,
    startedAt: '2025-10-15T10:30:00Z',
    endedAt: '2025-10-15T13:15:00Z',
    energyKWh: 18.1,
    unitPrice: 1.85,
    totalAmount: 33.4
  },
  {
    id: '6',
    stationName: 'Estação Brooklin',
    chargeBoxId: 'EBR-001',
    connectorId: 2,
    connectorType: 'Type 2',
    status: 'finished' as const,
    startedAt: '2025-10-14T08:00:00Z',
    endedAt: '2025-10-14T10:20:00Z',
    energyKWh: 11.3,
    unitPrice: 1.94,
    totalAmount: 21.9
  },
  {
    id: '7',
    stationName: 'Shopping Eldorado',
    chargeBoxId: 'SEL-002',
    connectorId: 1,
    connectorType: 'CCS2',
    status: 'finished' as const,
    startedAt: '2025-10-13T15:10:00Z',
    endedAt: '2025-10-13T16:45:00Z',
    energyKWh: 7.9,
    unitPrice: 2.09,
    totalAmount: 16.5
  },
  {
    id: '8',
    stationName: 'Posto BR Faria Lima',
    chargeBoxId: 'PBR-003',
    connectorId: 2,
    connectorType: 'CHAdeMO',
    status: 'finished' as const,
    startedAt: '2025-10-12T11:30:00Z',
    endedAt: '2025-10-12T14:45:00Z',
    energyKWh: 16.2,
    unitPrice: 1.73,
    totalAmount: 28.1
  },
  {
    id: '9',
    stationName: 'Estação Moema',
    chargeBoxId: 'EMO-001',
    connectorId: 1,
    connectorType: 'CCS2',
    status: 'finished' as const,
    startedAt: '2025-10-10T12:15:00Z',
    endedAt: '2025-10-10T14:00:00Z',
    energyKWh: 9.8,
    unitPrice: 2.02,
    totalAmount: 19.8
  },
  {
    id: '10',
    stationName: 'Shopping Ibirapuera',
    chargeBoxId: 'SIB-002',
    connectorId: 3,
    connectorType: 'Type 2',
    status: 'finished' as const,
    startedAt: '2025-10-09T09:45:00Z',
    endedAt: '2025-10-09T12:30:00Z',
    energyKWh: 13.5,
    unitPrice: 1.87,
    totalAmount: 25.3
  }
];