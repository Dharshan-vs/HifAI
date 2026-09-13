import { Sparkles, Layers } from 'lucide-react';

export default function SimulationBadge({
  showDetails = true,
  size = 'md',
  className = '',
}) {
  return (
    <div
      className={`inline-flex flex-col sm:flex-row items-start sm:items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-xl ${className}`}
      title="This device operates in Simulation Mode. Manual data entry is enabled and future REST API / MQTT drivers are supported."
    >
      <div className="flex items-center gap-1.5 font-extrabold text-xs">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-amber-800">Simulation Mode</span>
      </div>

      {showDetails && (
        <span className="text-[10px] text-amber-700/90 font-medium sm:border-l sm:border-amber-500/30 sm:pl-2">
          Manual Data Entry Enabled • Future API Ready
        </span>
      )}
    </div>
  );
}
