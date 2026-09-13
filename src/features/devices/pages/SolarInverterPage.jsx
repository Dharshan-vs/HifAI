import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun, Plus, RefreshCw, Trash2, Edit2, Zap, Flame, Award } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import PageHeader from '../../../components/common/PageHeader';
import Breadcrumb from '../../../components/common/Breadcrumb';
import Button from '../../../components/common/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import SimulationBadge from '../components/SimulationBadge';
import SolarInverterForm from '../components/SolarInverterForm';
import GenerationEntryForm from '../components/GenerationEntryForm';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import {
  fetchSolarInverters,
  registerSolarInverter,
  fetchSolarGeneration,
  addSolarGenerationEntry,
  updateSolarGenerationEntry,
  deleteSolarGenerationEntry,
} from '../../../services/solarInverterService';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/helpers';

export default function SolarInverterPage() {
  const { user } = useAuth();
  const [inverters, setInverters] = useState([]);
  const [generationLogs, setGenerationLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [invertersData, logsData] = await Promise.all([
        fetchSolarInverters(user?.uid || 'guest'),
        fetchSolarGeneration(user?.uid || 'guest'),
      ]);
      setInverters(invertersData);
      setGenerationLogs(logsData);
    } catch {
      toast.error('Failed to load solar inverter generation data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeInverter = inverters[0] || null;

  const handleRegisterInverter = async (data) => {
    setActionLoading(true);
    await registerSolarInverter(user?.uid || 'guest', data);
    setActionLoading(false);
    setIsRegisterOpen(false);
    toast.success(`Solar inverter "${data.name}" registered!`);
    loadData();
  };

  const handleSaveEntry = async (data) => {
    setActionLoading(true);
    if (selectedEntry) {
      await updateSolarGenerationEntry(selectedEntry.id, data, user?.uid || 'guest');
      toast.success('Generation log entry updated!');
    } else {
      await addSolarGenerationEntry(user?.uid || 'guest', {
        inverterId: activeInverter?.id || 'INV-001',
        inverterName: activeInverter?.name || 'Rooftop Solar Inverter',
        ...data,
      });
      toast.success('New solar generation log added!');
    }
    setActionLoading(false);
    setIsLogModalOpen(false);
    setSelectedEntry(null);
    loadData();
  };

  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;
    setActionLoading(true);
    await deleteSolarGenerationEntry(selectedEntry.id, user?.uid || 'guest');
    setActionLoading(false);
    setIsDeleteOpen(false);
    setSelectedEntry(null);
    toast.success('Generation entry deleted.');
    loadData();
  };

  const chartData = useMemo(() => {
    return [...generationLogs].reverse().map((g) => ({
      time: formatDate(g.timestamp, { hour: '2-digit', minute: '2-digit' }),
      generated: g.generatedEnergy,
      output: g.currentOutput,
      efficiency: g.efficiency,
    }));
  }, [generationLogs]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Energy Devices', path: '/devices' }, { label: 'Solar Inverter' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Solar Inverter Generation (Simulation Mode)"
            subtitle="Track solar generation output, peak capacity, conversion efficiency %, and operating thermal levels"
          />
          <div className="mt-1">
            <SimulationBadge />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 text-text-secondary hover:text-primary rounded-xl border border-border bg-surface hover:bg-background transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button onClick={() => setIsRegisterOpen(true)} variant="outline">
            Register Inverter
          </Button>
          <Button onClick={() => { setSelectedEntry(null); setIsLogModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-1 inline" /> Manual Generation Entry
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-surface rounded-2xl border border-border space-y-1">
          <span className="text-text-secondary text-[11px] font-semibold uppercase block">Active Inverter</span>
          <div className="text-base font-bold text-navy font-mono truncate">
            {activeInverter ? activeInverter.name : 'No Inverter Registered'}
          </div>
          <span className="text-[10px] text-amber-600 font-semibold">
            Rated: {activeInverter ? (activeInverter.capacityKw || 5.0) : 0} kW
          </span>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-border space-y-1">
          <span className="text-text-secondary text-[11px] font-semibold uppercase block">Current Solar Output</span>
          <div className="text-xl font-bold text-amber-600 font-mono">
            {generationLogs[0]?.currentOutput ?? 0} kW
          </div>
          <span className="text-[10px] text-text-secondary">
            Peak: {generationLogs[0]?.peakOutput ?? 0} kW
          </span>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-border space-y-1">
          <span className="text-text-secondary text-[11px] font-semibold uppercase block">Conversion Efficiency</span>
          <div className="text-xl font-bold text-emerald-600 font-mono">
            {generationLogs[0]?.efficiency ?? 0}%
          </div>
          <span className="text-[10px] text-text-secondary">
            Temp: {generationLogs[0]?.temperature ?? 0}°C
          </span>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-border space-y-1">
          <span className="text-text-secondary text-[11px] font-semibold uppercase block">Total Generation Logged</span>
          <div className="text-xl font-bold text-navy font-mono">
            {generationLogs.reduce((acc, g) => acc + (g.generatedEnergy || 0), 0).toFixed(1)} kWh
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">Clean Feed-in Yield</span>
        </div>
      </div>

      {/* Generation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Solar Output Profile (kW)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', borderColor: '#E2E8F0' }} />
                  <Area type="monotone" dataKey="output" name="Output (kW)" stroke="#F59E0B" strokeWidth={3} fill="url(#solarGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inverter Efficiency Performance (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis domain={[90, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', borderColor: '#E2E8F0' }} />
                  <Bar dataKey="efficiency" name="Efficiency %" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
          <div>
            <CardTitle>Solar Generation Logs History</CardTitle>
            <p className="text-xs text-text-secondary mt-0.5">Historical log of manual entries and automatic sync generation events</p>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-background/80 text-text-secondary uppercase text-[10px] font-bold border-b border-border tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Energy Generated (kWh)</th>
                  <th className="py-3 px-4">Current Output (kW)</th>
                  <th className="py-3 px-4">Peak Output (kW)</th>
                  <th className="py-3 px-4">Efficiency</th>
                  <th className="py-3 px-4">Temperature</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {generationLogs.map((g) => (
                  <tr key={g.id} className="hover:bg-background/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-text-primary">
                      {formatDate(g.timestamp, { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600">{g.generatedEnergy} kWh</td>
                    <td className="py-3.5 px-4 font-mono text-navy font-bold">{g.currentOutput} kW</td>
                    <td className="py-3.5 px-4 font-mono text-text-primary">{g.peakOutput} kW</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 font-semibold">{g.efficiency}%</td>
                    <td className="py-3.5 px-4 font-mono text-text-primary">{g.temperature}°C</td>
                    <td className="py-3.5 px-4 text-text-secondary text-[11px]">{g.source}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedEntry(g); setIsLogModalOpen(true); }}
                          className="p-1.5 text-text-secondary hover:text-primary rounded-lg border border-border transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedEntry(g); setIsDeleteOpen(true); }}
                          className="p-1.5 text-text-secondary hover:text-rose-600 rounded-lg border border-border transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <SolarInverterForm
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSubmit={handleRegisterInverter}
        loading={actionLoading}
      />

      <GenerationEntryForm
        isOpen={isLogModalOpen}
        onClose={() => { setIsLogModalOpen(false); setSelectedEntry(null); }}
        onSubmit={handleSaveEntry}
        entry={selectedEntry}
        loading={actionLoading}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedEntry(null); }}
        onConfirm={handleDeleteEntry}
        title="Delete Generation Log"
        message="Are you sure you want to delete this solar generation log entry?"
        loading={actionLoading}
      />
    </div>
  );
}
