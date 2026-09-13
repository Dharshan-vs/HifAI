import { CheckCircle2, AlertTriangle, Wrench, XCircle } from 'lucide-react';

export default function StatusIndicator({ status = 'Connected', className = '' }) {
  const normalized = status.toLowerCase();

  const configs = {
    connected: {
      label: 'Connected',
      bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    'simulation mode': {
      label: 'Simulation Mode',
      bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      dot: 'bg-amber-500 animate-pulse',
      icon: AlertTriangle,
    },
    simulation: {
      label: 'Simulation Mode',
      bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      dot: 'bg-amber-500 animate-pulse',
      icon: AlertTriangle,
    },
    maintenance: {
      label: 'Maintenance',
      bg: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      dot: 'bg-orange-500',
      icon: Wrench,
    },
    disconnected: {
      label: 'Disconnected',
      bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      dot: 'bg-rose-500',
      icon: XCircle,
    },
  };

  const config = configs[normalized] || configs.connected;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
