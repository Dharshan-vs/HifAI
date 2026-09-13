import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../../components/common/PageHeader';
import Breadcrumb from '../../../components/common/Breadcrumb';
import SynchronizationCard from '../components/SynchronizationCard';
import SynchronizationHistory from '../components/SynchronizationHistory';
import SimulationBadge from '../components/SimulationBadge';
import { fetchSyncHistory, triggerSynchronization } from '../../../services/syncEngineService';
import { useAuth } from '../../../context/AuthContext';

export default function SynchronizationPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSyncHistory(user?.uid || 'guest');
      setHistory(data);
      if (data.length > 0) {
        setLastSyncResult(data[0]);
      }
    } catch {
      toast.error('Failed to load synchronization history');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSyncTrigger = async () => {
    setSyncing(true);
    const res = await triggerSynchronization(user?.uid || 'guest');
    setSyncing(false);

    if (res.success) {
      toast.success(`Synchronized ${res.recordsCount} telemetric records! (${res.durationMs}ms)`);
      setLastSyncResult(res);
      loadHistory();
    } else {
      toast.error(`Sync failed: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Energy Devices', path: '/devices' }, { label: 'Synchronization Engine' }]} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Automatic Telemetry Synchronization Engine"
            subtitle="Real-time 30-second automated telemetry polling for smart meters, inverters, and microgrids"
          />
          <div className="mt-1">
            <SimulationBadge />
          </div>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="p-2.5 text-text-secondary hover:text-primary rounded-xl border border-border bg-surface hover:bg-background transition-colors self-start md:self-auto"
          title="Refresh Run History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Synchronization Card & Engine Controls */}
      <SynchronizationCard
        onTriggerSync={handleSyncTrigger}
        lastSync={lastSyncResult?.timestamp}
        recordsCount={lastSyncResult?.recordsCount || 4}
        durationMs={lastSyncResult?.durationMs || 340}
        loading={syncing}
      />

      {/* Synchronization Run History Table */}
      <SynchronizationHistory history={history} loading={loading} />
    </div>
  );
}
