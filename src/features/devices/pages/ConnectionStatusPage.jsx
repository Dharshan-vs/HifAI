import { useState, useEffect, useCallback } from 'react';
import { Wifi, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../../components/common/PageHeader';
import Breadcrumb from '../../../components/common/Breadcrumb';
import ConnectionStatusCard from '../components/ConnectionStatusCard';
import SimulationBadge from '../components/SimulationBadge';
import { fetchDeviceStatuses, retryDeviceConnection } from '../../../services/syncEngineService';
import { useAuth } from '../../../context/AuthContext';

export default function ConnectionStatusPage() {
  const { user } = useAuth();
  const [deviceStatuses, setDeviceStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDeviceStatuses(user?.uid || 'guest');
      setDeviceStatuses(data);
    } catch {
      toast.error('Failed to load device connection statuses');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  const handleRetry = async (deviceId) => {
    const res = await retryDeviceConnection(user?.uid || 'guest', deviceId);
    if (res.success) {
      toast.success('Connection restored! Status updated to Connected.');
      loadStatuses();
    } else {
      toast.error('Retry connection failed');
    }
  };

  const totalConnected = deviceStatuses.filter((s) => s.status === 'Connected').length;
  const totalSimulation = deviceStatuses.filter((s) => s.status === 'Simulation Mode' || s.isSimulation).length;
  const totalFailed = deviceStatuses.filter((s) => s.status === 'Disconnected' || s.errorMessage).length;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Energy Devices', path: '/devices' }, { label: 'Connection Status' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Device Connection Status & Health Dashboard"
            subtitle="Live status monitoring, signal strength, battery levels, and driver health scores"
          />
          <div className="mt-1">
            <SimulationBadge />
          </div>
        </div>

        <button
          onClick={loadStatuses}
          disabled={loading}
          className="p-2.5 text-text-secondary hover:text-primary rounded-xl border border-border bg-surface hover:bg-background transition-colors self-start md:self-auto"
          title="Refresh Statuses"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-emerald-800">
          <div>
            <span className="text-[11px] font-extrabold uppercase block">Fully Connected</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-600">{totalConnected} Devices</span>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-600 opacity-80" />
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-amber-800">
          <div>
            <span className="text-[11px] font-extrabold uppercase block">Simulation Mode</span>
            <span className="text-2xl font-extrabold font-mono text-amber-600">{totalSimulation} Devices</span>
          </div>
          <Wifi className="w-8 h-8 text-amber-600 opacity-80" />
        </div>

        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between text-rose-800">
          <div>
            <span className="text-[11px] font-extrabold uppercase block">Disconnected / Failed</span>
            <span className="text-2xl font-extrabold font-mono text-rose-600">{totalFailed} Devices</span>
          </div>
          <AlertCircle className="w-8 h-8 text-rose-600 opacity-80" />
        </div>
      </div>

      {/* Status Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-56 bg-surface rounded-2xl border border-border animate-pulse" />
          ))
        ) : deviceStatuses.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-surface rounded-2xl border border-border text-text-secondary text-xs">
            No registered devices found. Register devices in the Energy Devices tab.
          </div>
        ) : (
          deviceStatuses.map((ds) => (
            <ConnectionStatusCard
              key={ds.deviceId || ds.id}
              deviceStatus={ds}
              onRetry={handleRetry}
            />
          ))
        )}
      </div>
    </div>
  );
}
