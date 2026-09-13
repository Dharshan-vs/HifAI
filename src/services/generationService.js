export const GENERATION_DATASETS = {
  today: [
    { time: '00:00', Solar: 0, Grid: 0, total: 0 },
    { time: '04:00', Solar: 0, Grid: 0, total: 0 },
    { time: '08:00', Solar: 0, Grid: 0, total: 0 },
    { time: '12:00', Solar: 0, Grid: 0, total: 0 },
    { time: '16:00', Solar: 0, Grid: 0, total: 0 },
    { time: '20:00', Solar: 0, Grid: 0, total: 0 },
  ],
  weekly: [
    { day: 'Mon', Solar: 0, Grid: 0 },
    { day: 'Tue', Solar: 0, Grid: 0 },
    { day: 'Wed', Solar: 0, Grid: 0 },
    { day: 'Thu', Solar: 0, Grid: 0 },
    { day: 'Fri', Solar: 0, Grid: 0 },
    { day: 'Sat', Solar: 0, Grid: 0 },
    { day: 'Sun', Solar: 0, Grid: 0 },
  ],
  monthly: [
    { month: 'Jan', Solar: 0, Grid: 0 },
    { month: 'Feb', Solar: 0, Grid: 0 },
    { month: 'Mar', Solar: 0, Grid: 0 },
    { month: 'Apr', Solar: 0, Grid: 0 },
    { month: 'May', Solar: 0, Grid: 0 },
    { month: 'Jun', Solar: 0, Grid: 0 },
  ],
};

export const COLOR_MAP = {
  Solar: '#F59E0B',
  Grid: '#64748B',
};

export async function fetchGenerationMetrics() {
  return {
    todayTotal: '0.0 kWh',
    weeklyTotal: '0.0 kWh',
    monthlyTotal: '0.0 kWh',
    lifetimeTotal: '0.0 kWh',
    currentOutput: '0.0 kW',
    peakOutput: '0.0 kW',
    efficiency: '0.0%',
    co2Saved: '0.0 kg',
  };
}
