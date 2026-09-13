import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Sparkles, RefreshCw, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../../../components/common/Card';
import CircularProgressCard from './CircularProgressCard';
import CarbonStatisticsGrid from './CarbonStatisticsGrid';
import { fetchCarbonImpact, updateEnergyImpact } from '../../../../services/carbonImpactService';
import { useAuth } from '../../../../context/AuthContext';

export default function CarbonImpactCard() {
  const { user } = useAuth();
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadImpact = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCarbonImpact(user?.uid || 'guest');
      setImpact(data);
    } catch {
      toast.error('Failed to load carbon impact');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadImpact();
  }, [loadImpact]);

  const handleSimulateGeneration = async () => {
    setUpdating(true);
    const addedKwh = 50; // Simulate 50 kWh solar generation update
    const updated = await updateEnergyImpact(user?.uid || 'guest', addedKwh);
    setUpdating(false);
    setImpact(updated);
    toast.success(`Solar generation logged! +${addedKwh} kWh added. Saved ~40 kg CO₂.`);
  };

  const chartData = impact?.monthlyData || [
    { month: 'Jan', co2: 380, cleanKwh: 475 },
    { month: 'Feb', co2: 410, cleanKwh: 512 },
    { month: 'Mar', co2: 450, cleanKwh: 562 },
    { month: 'Apr', co2: 520, cleanKwh: 650 },
    { month: 'May', co2: 510, cleanKwh: 637 },
    { month: 'Jun', co2: 570, cleanKwh: 714 },
  ];

  return (
    <Card className="overflow-hidden border-border shadow-card bg-surface">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Carbon Impact & ESG Sustainability</CardTitle>
            <p className="text-xs text-text-secondary mt-0.5">
              Quantified environmental savings from your clean solar and community renewable energy assets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadImpact}
            disabled={loading}
            className="p-2 text-text-secondary hover:text-primary rounded-xl border border-border bg-background hover:bg-surface transition-colors"
            title="Refresh Impact Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Motivational Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-lime-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-lime-300" /> Motivational Impact Award
            </div>
            <h3 className="text-base sm:text-lg font-extrabold">
              You have prevented <span className="text-lime-300 font-mono">{impact?.co2SavedKg ?? 0} kg</span> of CO₂ emissions!
            </h3>
            <p className="text-xs text-emerald-100/90">
              Your renewable energy contributions equal planting{' '}
              <strong className="text-lime-300 font-mono">{impact?.treesEquivalent ?? 0} mature trees</strong> this year.
            </p>
          </div>

          <div className="shrink-0 px-4 py-2 bg-white/15 backdrop-blur-md rounded-xl text-xs font-bold text-white border border-white/20 text-center">
            Zero Carbon Footprint
          </div>
        </motion.div>

        {/* Animated Statistics Grid */}
        <CarbonStatisticsGrid impact={impact || {}} />

        {/* Circular Score & Monthly Trend Mini-Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CircularProgressCard
            score={impact?.environmentalScore ?? 0}
            grade={impact?.scoreGrade || (impact?.environmentalScore ? 'A+' : 'N/A')}
            monthlyProgressPercent={impact?.monthlyProgressPercent ?? 0}
          />

          {/* Mini Recharts Trend Chart */}
          <div className="lg:col-span-2 p-5 bg-surface rounded-2xl border border-border space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-emerald-600" /> Monthly CO₂ Offset Trend (kg)
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  6-month historical trajectory of carbon displacement
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                +18.4% YoY Growth
              </span>
            </div>

            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      borderColor: '#E2E8F0',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="co2"
                    stroke="#059669"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#co2Gradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
