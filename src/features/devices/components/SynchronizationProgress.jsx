import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function SynchronizationProgress({ status = 'idle', progressPercent = 100, onRetry }) {
  if (status === 'idle') return null;

  const isSyncing = status === 'syncing' || status === 'loading';
  const isSuccess = status === 'success';
  const isFailed = status === 'failed';

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isSyncing
        ? 'bg-primary/5 border-primary/30 text-primary'
        : isSuccess
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
        : 'bg-rose-500/10 border-rose-500/30 text-rose-700'
    }`}>
      <div className="flex items-center justify-between text-xs font-bold mb-2">
        <div className="flex items-center gap-2">
          {isSyncing && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {isFailed && <AlertTriangle className="w-4 h-4 text-rose-600" />}

          <span>
            {isSyncing
              ? 'Synchronizing Energy Telemetry...'
              : isSuccess
              ? 'Synchronization Completed Successfully'
              : 'Synchronization Engine Error'}
          </span>
        </div>

        {isFailed && onRetry && (
          <button
            onClick={onRetry}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry Sync
          </button>
        )}
      </div>

      <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${
            isSyncing ? 'gradient-yuga' : isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />
      </div>
    </div>
  );
}
