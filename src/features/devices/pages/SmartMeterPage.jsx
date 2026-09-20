import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Gauge, Plus, RefreshCw, Trash2, Edit2, Zap, Activity, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';
import PageHeader from '../../../components/common/PageHeader';
import Breadcrumb from '../../../components/common/Breadcrumb';
import Button from '../../../components/common/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import SimulationBadge from '../components/SimulationBadge';
import SmartMeterForm from '../components/SmartMeterForm';
import ManualReadingForm from '../components/ManualReadingForm';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import {
  fetchSmartMeters,
  registerSmartMeter,
  updateSmartMeter,
  fetchSmartMeterReadings,
  addSmartMeterReading,
  updateSmartMeterReading,
  deleteSmartMeterReading,
} from '../../../services/smartMeterService';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/helpers';

export default function SmartMeterPage() {
  const { user } = useAuth();
  const [meters, setMeters] = useState([]);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState(null);
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [metersData, readingsData] = await Promise.all([
        fetchSmartMeters(user?.uid || 'guest'),
        fetchSmartMeterReadings(user?.uid || 'guest'),
      ]);
      setMeters(metersData || []);
      setReadings(readingsData || []);
    } catch {
      toast.error('Failed to load smart meter telemetry');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeMeter = meters.length > 0 ? meters[0] : null;

  const handleOpenAddMeter = () => {
    setEditingMeter(null);
    setIsRegisterOpen(true);
  };

  const handleOpenEditMeter = () => {
    setEditingMeter(activeMeter);
    setIsRegisterOpen(true);
  };

  const handleSaveMeter = async (data) => {
    setActionLoading(true);
    if (editingMeter) {
      await updateSmartMeter(user?.uid || 'guest', editingMeter.id, data);
      toast.success('Household smart meter details updated!');
    } else {
      await registerSmartMeter(user?.uid || 'guest', data);
      toast.success(`Smart meter "${data.name}" registered successfully!`);
    }
    setActionLoading(false);
    setIsRegisterOpen(false);
    setEditingMeter(null);
    window.dispatchEvent(new Event('smart-meter-updated'));
    loadData();
  };

  const handleSaveReading = async (data) => {
    if (!activeMeter) {
      toast.error('Please register a Smart Meter first');
      return;
    }
    setActionLoading(true);
    if (selectedReading) {
      await updateSmartMeterReading(selectedReading.id, data);
      toast.success('Smart meter reading updated!');
    } else {
      await addSmartMeterReading(user?.uid || 'guest', {
        meterId: activeMeter.id,
        meterName: activeMeter.name,
        ...data,
      });
      toast.success('New smart meter reading saved!');
    }
    setActionLoading(false);
    setIsReadingModalOpen(false);
    setSelectedReading(null);
    loadData();
  };

  const handleDeleteReading = async () => {
    if (!selectedReading) return;
    setActionLoading(true);
    await deleteSmartMeterReading(selectedReading.id, user?.uid || 'guest');
    setActionLoading(false);
    setIsDeleteOpen(false);
    setSelectedReading(null);
    toast.success('Reading entry deleted.');
    loadData();
  };

  const chartData = useMemo(() => {
    return [...readings].reverse().map((r) => ({
      time: formatDate(r.timestamp, { hour: '2-digit', minute: '2-digit' }),
      consumed: r.energyConsumed,
      exported: r.energyExported,
      voltage: r.voltage,
    }));
  }, [readings]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Energy Devices', path: '/devices' }, { label: 'Smart Meter' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Household Smart Meter Connection & Telemetry"
            subtitle="Register your home Smart Meter to measure physical power transfer and live consumption when buying P2P solar energy"
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
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {!activeMeter && (
            <Button onClick={handleOpenAddMeter} variant="primary" className="shadow-md">
              <Gauge className="w-4 h-4 mr-1.5 inline" /> Register Smart Meter
            </Button>
          )}
          {activeMeter && (
            <Button onClick={() => { setSelectedReading(null); setIsReadingModalOpen(true); }} variant="outline">
              <Plus className="w-4 h-4 mr-1 inline" /> Manual Reading Entry
            </Button>
          )}
        </div>
      </div>

      {/* Household Smart Meter Connection Banner Card */}
      {activeMeter ? (
        <Card className="border-border/80 shadow-md bg-gradient-to-r from-surface via-emerald-500/5 to-teal-500/10 p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-xs">
                <Gauge className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-navy font-heading">{activeMeter.name}</h3>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-extrabold uppercase border border-emerald-500/20">
                    Physical Meter Connected
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-800 rounded-full text-[10px] font-mono font-extrabold border border-emerald-500/30 flex items-center gap-1">
                    🔒 Location Pinned &amp; Locked ({activeMeter.lat || 10.3673}, {activeMeter.lon || 77.9803})
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  Serial No: <strong className="font-mono text-navy">{activeMeter.serialNumber}</strong> • Fixed Site: <strong className="text-navy">{activeMeter.location || 'Household Smart Meter Site'}</strong>
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 pt-0.5">
                  <Zap className="w-3.5 h-3.5 text-lime-600" /> Physical installation location permanently pinned once. Microgrid transfer radius (&le; 1.0 km) anchored to this location.
                </p>
              </div>
            </div>

            <Button onClick={handleOpenEditMeter} size="sm" variant="outline" className="shrink-0">
              <Edit2 className="w-3.5 h-3.5 mr-1 inline" /> Edit Meter Details
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border-amber-500/30 shadow-md bg-amber-500/5 p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
            <Gauge className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-navy">No Household Smart Meter Registered</h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              Please register your household smart meter connection to monitor live line voltage, current draw, and enable P2P solar energy purchases. Location is pinned <strong>only once</strong> upon setup.
            </p>
          </div>
          <Button onClick={handleOpenAddMeter} variant="primary" className="shadow-md">
            + Register Smart Meter (1-Time Setup)
          </Button>
        </Card>
      )}

      {/* Telemetry Data Section: Rendered ONLY if meter is registered */}
      {activeMeter ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-surface rounded-2xl border border-border space-y-1 shadow-xs">
              <span className="text-text-secondary text-[11px] font-semibold uppercase block">Line Voltage</span>
              <div className="text-2xl font-extrabold text-navy font-mono">
                {readings[0]?.voltage || 230.5} V
              </div>
              <span className="text-[10px] text-text-secondary">Nominal Frequency: 50.0 Hz</span>
            </div>

            <div className="p-4 bg-surface rounded-2xl border border-border space-y-1 shadow-xs">
              <span className="text-text-secondary text-[11px] font-semibold uppercase block">Current Draw</span>
              <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                {readings[0]?.current || 12.4} A
              </div>
              <span className="text-[10px] text-text-secondary">Power Factor: {readings[0]?.powerFactor || 0.96}</span>
            </div>

            <div className="p-4 bg-surface rounded-2xl border border-border space-y-1 shadow-xs">
              <span className="text-text-secondary text-[11px] font-semibold uppercase block">Total Energy Transferred</span>
              <div className="text-2xl font-extrabold text-navy font-mono">
                {readings.reduce((acc, r) => acc + (r.energyConsumed || 0), 0).toFixed(1)} kWh
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">
                P2P Inflow Active
              </span>
            </div>
          </div>

          {/* Telemetry Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Power Consumption & P2P Inflow Trajectory (kWh)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="consumedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          borderColor: '#E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Area type="monotone" dataKey="consumed" name="Transferred kWh" stroke="#2563EB" strokeWidth={3} fill="url(#consumedGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Household Line Voltage Stability Trend (V)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis domain={[220, 240]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          borderColor: '#E2E8F0',
                          fontSize: '12px',
                        }}
                      />
                      <Line type="monotone" dataKey="voltage" name="Voltage (V)" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History Table */}
          <Card className="border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
              <div>
                <CardTitle>Smart Meter Readings History</CardTitle>
                <p className="text-xs text-text-secondary mt-0.5">Historical log of manual entries and physical meter sync payloads</p>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-background/80 text-text-secondary uppercase text-[10px] font-bold border-b border-border tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Transferred (kWh)</th>
                      <th className="py-3 px-4">Line Voltage (V)</th>
                      <th className="py-3 px-4">Current (A)</th>
                      <th className="py-3 px-4">Power Factor</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {readings.map((r) => (
                      <tr key={r.id} className="hover:bg-background/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-text-primary">
                          {formatDate(r.timestamp, { dateStyle: 'short', timeStyle: 'medium' })}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-navy">{r.energyConsumed} kWh</td>
                        <td className="py-3.5 px-4 font-mono text-text-primary">{r.voltage} V</td>
                        <td className="py-3.5 px-4 font-mono text-text-primary">{r.current} A</td>
                        <td className="py-3.5 px-4 font-mono text-text-primary">{r.powerFactor}</td>
                        <td className="py-3.5 px-4 text-text-secondary text-[11px]">{r.source}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setSelectedReading(r); setIsReadingModalOpen(true); }}
                              className="p-1.5 text-text-secondary hover:text-primary rounded-lg border border-border transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setSelectedReading(r); setIsDeleteOpen(true); }}
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
        </div>
      ) : (
        <Card className="p-12 text-center space-y-3 border-dashed">
          <Activity className="w-10 h-10 text-text-secondary mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-navy">Smart Meter Telemetry Unavailable</h4>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Telemetry metrics, voltage logs, and power draw charts will unlock automatically once your household smart meter connection is registered above.
          </p>
        </Card>
      )}

      {/* Modals */}
      <SmartMeterForm
        isOpen={isRegisterOpen}
        onClose={() => { setIsRegisterOpen(false); setEditingMeter(null); }}
        onSubmit={handleSaveMeter}
        meter={editingMeter}
        loading={actionLoading}
      />

      <ManualReadingForm
        isOpen={isReadingModalOpen}
        onClose={() => { setIsReadingModalOpen(false); setSelectedReading(null); }}
        onSubmit={handleSaveReading}
        reading={selectedReading}
        loading={actionLoading}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedReading(null); }}
        onConfirm={handleDeleteReading}
        title="Delete Reading Entry"
        message="Are you sure you want to delete this smart meter reading entry?"
        loading={actionLoading}
      />
    </div>
  );
}
