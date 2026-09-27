export const GENERATION_DATASETS = {
  today: [
    { time: '00:00', Solar: 0.0, Grid: 0.4, total: 0.4 },
    { time: '04:00', Solar: 0.0, Grid: 0.6, total: 0.6 },
    { time: '08:00', Solar: 1.85, Grid: 0.8, total: 2.65 },
    { time: '12:00', Solar: 5.40, Grid: 0.2, total: 5.60 },
    { time: '16:00', Solar: 3.10, Grid: 0.5, total: 3.60 },
    { time: '20:00', Solar: 0.0, Grid: 1.2, total: 1.2 },
  ],
  weekly: [
    { day: 'Mon', Solar: 28.4, Grid: 4.2 },
    { day: 'Tue', Solar: 31.2, Grid: 3.8 },
    { day: 'Wed', Solar: 26.8, Grid: 5.1 },
    { day: 'Thu', Solar: 33.5, Grid: 2.9 },
    { day: 'Fri', Solar: 29.7, Grid: 4.0 },
    { day: 'Sat', Solar: 35.1, Grid: 2.1 },
    { day: 'Sun', Solar: 32.8, Grid: 2.5 },
  ],
  monthly: [
    { month: 'Jan', Solar: 685, Grid: 110 },
    { month: 'Feb', Solar: 720, Grid: 95 },
    { month: 'Mar', Solar: 760, Grid: 85 },
    { month: 'Apr', Solar: 810, Grid: 70 },
    { month: 'May', Solar: 845, Grid: 65 },
    { month: 'Jun', Solar: 790, Grid: 80 },
  ],
};

export const COLOR_MAP = {
  Solar: '#F59E0B',
  Grid: '#64748B',
};

export async function fetchGenerationMetrics() {
  return {
    todayTotal: '28.4 kWh',
    weeklyTotal: '217.5 kWh',
    monthlyTotal: '845.0 kWh',
    lifetimeTotal: '4,610 kWh',
    currentOutput: '4.25 kW',
    peakOutput: '5.60 kW',
    efficiency: '97.8%',
    co2Saved: '23.3 kg',
  };
}
