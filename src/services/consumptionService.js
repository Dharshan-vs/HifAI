export const CONSUMPTION_DATASETS = {
  daily: [
    { time: '00:00', Peak: 0, Avg: 0, Solar: 0, Grid: 0 },
    { time: '04:00', Peak: 0, Avg: 0, Solar: 0, Grid: 0 },
    { time: '08:00', Peak: 0, Avg: 0, Solar: 0, Grid: 0 },
    { time: '12:00', Peak: 0, Avg: 0, Solar: 0, Grid: 0 },
    { time: '16:00', Peak: 0, Avg: 0, Solar: 0, Grid: 0 },
    { time: '20:00', Peak: 0, Avg: 0, Solar: 0, Grid: 0 },
  ],
  sourceSplit: [
    { name: 'Solar', value: 0, color: '#F59E0B' },
    { name: 'Grid', value: 0, color: '#64748B' },
  ],
};

export async function fetchConsumptionMetrics() {
  return {
    dailyTotal: '0.0 kWh',
    weeklyTotal: '0.0 kWh',
    monthlyTotal: '0.0 kWh',
    peakUsage: '0.0 kW',
    averageUsage: '0.0 kW',
    renewableRatio: '0.0%',
    gridRatio: '0.0%',
  };
}
