import { useState, useEffect } from 'react';
import { RefreshCw, Play, Pause, Clock, CheckCircle2, Zap } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import SynchronizationProgress from './SynchronizationProgress';
import SimulationBadge from './SimulationBadge';
import { formatDate } from '../../../utils/helpers';

export default function SynchronizationCard({
  onTriggerSync,
  lastSync,
  recordsCount = 0,
  durationMs = 0,
  loading = false,
}) {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [nextSyncTimer, setNextSyncTimer] = useState(30);

  // 30 second auto sync countdown timer
  useEffect(() => {
    let timerInterval = null;
    if (autoSyncEnabled) {
      timerInterval = setInterval(() => {
        setNextSyncTimer((prev) => {
          if (prev <= 1) {
            onTriggerSync();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [autoSyncEnabled, onTriggerSync]);

  const handleManualTrigger = async () => {
    setNextSyncTimer(30);
    await onTriggerSync();
  };

  return (
    <Card className="border-border shadow-card bg-surface overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Simulation Synchronization Engine</CardTitle>
            <p className="text-xs text-text-secondary mt-0.5">
              Automated 30-second telemetric data generation for connected energy devices
            </p>
          </div>
        </div>

        <SimulationBadge showDetails={false} />
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Top Control Bar */}
        <div className="p-4 bg-background rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-navy">
              <Clock className="w-4 h-4 text-primary" /> Auto-Sync Cycle Status
            </div>
            <p className="text-xs text-text-secondary">
              Engine status: <strong className={autoSyncEnabled ? 'text-emerald-600' : 'text-amber-600'}>
                {autoSyncEnabled ? 'Active (Auto-polling every 30s)' : 'Paused'}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                autoSyncEnabled
                  ? 'bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              {autoSyncEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autoSyncEnabled ? 'Pause Auto-Sync' : 'Resume Auto-Sync'}
            </button>

            <button
              onClick={handleManualTrigger}
              disabled={loading}
              className="px-4 py-2 gradient-yuga text-white rounded-xl text-xs font-bold shadow-md hover:brightness-105 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Synchronizing...' : 'Synchronize Now'}
            </button>
          </div>
        </div>

        {/* Sync Progress Component */}
        <SynchronizationProgress
          status={loading ? 'syncing' : 'success'}
          progressPercent={loading ? 65 : 100}
          onRetry={handleManualTrigger}
        />

        {/* 4 Sync Metric Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-surface rounded-xl border border-border/80 space-y-1">
            <span className="text-text-secondary text-[11px] font-semibold uppercase block">Last Sync Time</span>
            <div className="text-sm font-bold text-navy font-mono">
              {lastSync ? formatDate(lastSync, { timeStyle: 'medium' }) : 'Just now'}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Verified Sync Result</span>
          </div>

          <div className="p-4 bg-surface rounded-xl border border-border/80 space-y-1">
            <span className="text-text-secondary text-[11px] font-semibold uppercase block">Next Auto-Sync In</span>
            <div className="text-base font-bold text-primary font-mono">
              {autoSyncEnabled ? `00:${nextSyncTimer < 10 ? `0${nextSyncTimer}` : nextSyncTimer}` : 'Paused'}
            </div>
            <span className="text-[10px] text-text-secondary">Every 30 seconds</span>
          </div>

          <div className="p-4 bg-surface rounded-xl border border-border/80 space-y-1">
            <span className="text-text-secondary text-[11px] font-semibold uppercase block">Records Synchronized</span>
            <div className="text-base font-bold text-emerald-600 font-mono">
              {recordsCount} Telemetry Payload{recordsCount === 1 ? '' : 's'}
            </div>
            <span className="text-[10px] text-text-secondary">Smart Meter & Inverter Data</span>
          </div>

          <div className="p-4 bg-surface rounded-xl border border-border/80 space-y-1">
            <span className="text-text-secondary text-[11px] font-semibold uppercase block">Sync Duration</span>
            <div className="text-base font-bold text-text-primary font-mono">
              {durationMs} ms
            </div>
            <span className="text-[10px] text-text-secondary">Low-latency simulation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
