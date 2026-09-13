import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Battery, Activity, RefreshCw, AlertCircle, CheckCircle2, Layers } from 'lucide-react';
import StatusIndicator from './StatusIndicator';
import SimulationBadge from './SimulationBadge';
import { formatDate } from '../../../utils/helpers';

export default function ConnectionStatusCard({ deviceStatus, onRetry }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await onRetry(deviceStatus.deviceId || deviceStatus.id);
    setRetrying(false);
  };

  const isFailed = deviceStatus.status === 'Disconnected' || !!deviceStatus.errorMessage;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <div className={`p-5 rounded-2xl border bg-surface shadow-card space-y-4 relative overflow-hidden ${
        isFailed ? 'border-rose-500/40 bg-rose-500/5' : 'border-border'
      }`}>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-text-primary">{deviceStatus.deviceName}</h4>
            <p className="text-xs text-text-secondary">{deviceStatus.deviceType}</p>
          </div>
          <StatusIndicator status={deviceStatus.status} />
        </div>

        {/* Simulation Badge */}
        {deviceStatus.isSimulation && <SimulationBadge showDetails={false} />}

        {/* Failed Banner & Retry Button */}
        {isFailed && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-rose-700">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Connection Failed
              </span>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Retrying...' : 'Retry Connection'}
              </button>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed font-mono">
              {deviceStatus.errorMessage || 'Target IoT Gateway did not respond to ping poll.'}
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
          <div className="p-2.5 bg-background rounded-xl border border-border/70 text-center">
            <span className="text-[10px] text-text-secondary uppercase font-bold block">Health</span>
            <span className="font-mono font-bold text-emerald-600 text-sm mt-0.5 block">
              {deviceStatus.healthScore || 98}%
            </span>
          </div>

          <div className="p-2.5 bg-background rounded-xl border border-border/70 text-center">
            <span className="text-[10px] text-text-secondary uppercase font-bold block">Battery</span>
            <span className="font-mono font-bold text-navy text-sm mt-0.5 block flex items-center justify-center gap-1">
              <Battery className="w-3.5 h-3.5 text-emerald-600" />
              {deviceStatus.batteryLevel || 100}%
            </span>
          </div>

          <div className="p-2.5 bg-background rounded-xl border border-border/70 text-center">
            <span className="text-[10px] text-text-secondary uppercase font-bold block">Signal</span>
            <span className="font-mono font-bold text-text-primary text-sm mt-0.5 block flex items-center justify-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-primary" />
              {deviceStatus.signalStrength || -60} dBm
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center text-[11px] text-text-secondary pt-1 border-t border-border/60">
          <span>Data Source: <strong className="text-text-primary">{deviceStatus.dataSource || 'Internal'}</strong></span>
          <span className="font-mono">
            {deviceStatus.lastSync ? formatDate(deviceStatus.lastSync, { timeStyle: 'short' }) : 'Just now'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
