import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  Sun,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  MapPin,
  Bot,
  Search,
  Crosshair,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import Card from '../../../components/common/Card';
import { predictEnergyGeneration, fetchLiveWeatherData, getBrowserPosition } from '../../../services/predictionService';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

export default function EnergyPredictionCard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('next_24h');
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState(null);
  const [cityInput, setCityInput] = useState('');
  const [isChangingCity, setIsChangingCity] = useState(false);

  const loadPredictions = useCallback(async (selectedPeriod, customCity = '') => {
    setLoading(true);
    try {
      const data = await predictEnergyGeneration(selectedPeriod, user?.uid || 'guest', customCity);
      setForecast(data);
      if (data?.weatherData?.city) {
        setCityInput(data.weatherData.city);
      }
    } catch (err) {
      console.warn('Error fetching energy predictions:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadPredictions(period);
  }, [period, loadPredictions]);

  const handleCitySubmit = async (e) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    toast.loading(`Fetching Weather for ${cityInput}...`, { id: 'city' });
    await loadPredictions(period, cityInput.trim());
    setIsChangingCity(false);
    toast.success(`✨ Weather Synced for ${cityInput}!`, { id: 'city' });
  };

  const handleAutoDetectGPS = async () => {
    toast.loading('Detecting Device GPS Location...', { id: 'gps' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hifai_user_city');
    }
    const coords = await getBrowserPosition();
    if (!coords) {
      toast.error('GPS permission denied or unavailable. Using IP location fallback.', { id: 'gps' });
    }
    await loadPredictions(period, '');
    toast.success('✨ GPS Location Weather Synced!', { id: 'gps' });
  };

  const handleRecalibrate = async () => {
    setLoading(true);
    toast.loading('AI Model Ingesting Real-Time Telemetry...', { id: 'recalibrate' });
    await loadPredictions(period, cityInput);
    toast.success('✨ AI Generation Forecast & Weather Synced!', { id: 'recalibrate' });
  };

  const periodOptions = [
    { key: 'next_24h', label: 'Next 24 Hours' },
    { key: 'next_7d', label: 'Next 7 Days' },
    { key: 'next_30d', label: 'Next 30 Days' },
  ];

  return (
    <Card className="border border-emerald-500/30 shadow-md bg-gradient-to-br from-surface via-surface to-emerald-500/5 overflow-hidden space-y-6">
      {/* Card Header with AI Badge & Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold font-heading text-navy tracking-tight">
                AI Generation Forecast & Automated Pricing
              </h3>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-extrabold uppercase border border-emerald-500/20">
                Real-Time Weather
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Predicts solar generation & surplus power based on your exact location weather and historical smart meter telemetry.
            </p>
          </div>
        </div>

        {/* Prediction Period Selector Tabs */}
        <div className="flex items-center gap-2 bg-background p-1.5 rounded-xl border border-border/80 shrink-0">
          {periodOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === opt.key
                  ? 'gradient-yuga text-white shadow-xs'
                  : 'text-text-secondary hover:text-navy hover:bg-surface'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Real-Time Location Weather Banner with Location Changer */}
      {forecast?.weatherData && (
        <div className="bg-surface p-3.5 rounded-2xl border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-navy font-bold flex-wrap">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Station Location:</span>
            <span className="text-emerald-700 font-extrabold">{forecast.weatherData.locationName}</span>

            {/* Change Location Toggle */}
            {!isChangingCity ? (
              <button
                onClick={() => setIsChangingCity(true)}
                className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-500/30 transition-all ml-1"
              >
                Change Location
              </button>
            ) : (
              <form onSubmit={handleCitySubmit} className="flex items-center gap-1.5 ml-1">
                <input
                  type="text"
                  placeholder="Enter City Name (e.g. Chennai)"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="px-2 py-1 bg-background border border-border rounded-lg text-xs text-navy focus:outline-none focus:border-emerald-500 w-44 font-semibold"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-all"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingCity(false)}
                  className="px-2 py-1 text-text-secondary hover:text-navy text-[10px]"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* GPS Auto-Detect Button */}
            <button
              onClick={handleAutoDetectGPS}
              className="px-2 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 rounded-md text-[10px] font-bold border border-cyan-500/30 transition-all flex items-center gap-1 ml-1"
              title="Detect Exact GPS Coordinates"
            >
              <Crosshair className="w-3 h-3 text-cyan-600" /> GPS Auto-Detect
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-text-secondary shrink-0">
            <span className="px-2 py-0.5 bg-background rounded-md border border-border text-navy">
              Temp: {forecast.weatherData.temp}
            </span>
            <span className="px-2 py-0.5 bg-background rounded-md border border-border text-navy">
              Cloudiness: {forecast.weatherData.clouds}
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-md border border-emerald-500/20">
              Condition: {forecast.weatherData.condition}
            </span>
          </div>
        </div>
      )}

      {/* 4 Understandable Prediction KPI Cards */}
      {forecast && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Predicted Future Generation */}
          <div className="bg-surface p-4 rounded-2xl border border-emerald-500/20 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                Predicted Solar Generation
              </span>
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold font-mono text-navy">
                {forecast.summary.predictedTotalKwh}
              </span>
              <span className="text-xs font-bold text-emerald-600">kWh</span>
            </div>
            <p className="text-[11px] font-medium text-emerald-600">
              Forecast Period: {forecast.period}
            </p>
          </div>

          {/* Metric 2: Predicted Surplus Available to Sell */}
          <div className="bg-surface p-4 rounded-2xl border border-amber-500/20 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
                Predicted Surplus to Sell
              </span>
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold font-mono text-amber-600">
                {forecast.summary.predictedSurplusKwh}
              </span>
              <span className="text-xs font-bold text-amber-600">kWh</span>
            </div>
            <p className="text-[11px] font-medium text-amber-700">
              Available for P2P Marketplace
            </p>
          </div>

          {/* Metric 3: Model Confidence Score */}
          <div className="bg-surface p-4 rounded-2xl border border-teal-500/20 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider">
                Prediction Accuracy
              </span>
              <ShieldCheck className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold font-mono text-teal-600">
                {forecast.summary.confidenceScore}%
              </span>
              <span className="text-xs font-bold text-teal-600">Confidence</span>
            </div>
            <p className="text-[11px] font-medium text-teal-700">
              Local Weather Synced
            </p>
          </div>

          {/* Metric 4: AI Automated Tariff Pricing */}
          <div className="bg-surface p-4 rounded-2xl border border-cyan-500/20 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-cyan-700 uppercase tracking-wider">
                AI Automated Price
              </span>
              <Bot className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-xl font-extrabold font-mono text-navy truncate">
              {forecast.bestSellRec?.aiPricePerKwh || '₹7.20'} / kWh
            </div>
            <p className="text-[11px] font-medium text-cyan-700 truncate">
              Optimal Window: {forecast.summary.peakWindow}
            </p>
          </div>
        </div>
      )}

      {/* AI Best Time to Sell in Marketplace Card for Producers */}
      {forecast && forecast.bestSellRec && (
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-white font-bold shadow-xs">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-navy font-heading">
                  AI Best Time to Sell in Marketplace for Producers
                </h4>
                <p className="text-xs text-text-secondary">
                  Calculated based on previous generation & real-time local weather ({forecast.weatherData?.locationName})
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-800 rounded-full text-xs font-extrabold border border-amber-500/30">
              {forecast.bestSellRec.marketDemand}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-surface p-3 rounded-xl border border-border">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase block">Optimal Selling Time Slot</span>
              <span className="text-sm font-extrabold font-mono text-amber-600">{forecast.bestSellRec.bestTimeSlot}</span>
            </div>
            <div className="bg-surface p-3 rounded-xl border border-border">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase block">AI Automated Tariff Rate</span>
              <span className="text-sm font-extrabold font-mono text-emerald-600">{forecast.bestSellRec.aiPricePerKwh} / kWh</span>
            </div>
            <div className="bg-surface p-3 rounded-xl border border-border">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase block">Expected Revenue Yield</span>
              <span className="text-sm font-extrabold font-mono text-navy">₹{forecast.bestSellRec.expectedRevenue}</span>
            </div>
          </div>

          <p className="text-xs text-text-secondary italic pt-1">
            💡 <strong>AI Recommendation:</strong> {forecast.bestSellRec.reasoning}
          </p>
        </div>
      )}

      {/* Interactive Forecast Chart: Historical Baseline vs. AI Prediction */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy">Energy Forecast Curve:</span>
            <span className="text-text-secondary">Comparing Historical Telemetry against AI Prediction ({forecast?.period})</span>
          </div>
          <button
            onClick={handleRecalibrate}
            disabled={loading}
            className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Recalibrate AI Model
          </button>
        </div>

        <div className="h-64 w-full bg-surface p-4 rounded-2xl border border-border/80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast?.chartData || []}>
              <defs>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSurplus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} unit=" kWh" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area
                type="monotone"
                dataKey="historical"
                name="Historical Generation (kWh)"
                stroke="#64748B"
                strokeWidth={2}
                fill="none"
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="predicted"
                name="AI Predicted Generation (kWh)"
                stroke="#10B981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPredicted)"
              />
              <Area
                type="monotone"
                dataKey="surplus"
                name="Predicted Surplus Power (kWh)"
                stroke="#F59E0B"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSurplus)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
