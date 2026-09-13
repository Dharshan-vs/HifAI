import { CheckCircle2, Clock, Loader2, AlertCircle, Zap, Ban, PackageCheck } from 'lucide-react';

export default function TransactionStatusBadge({ status = 'Completed' }) {
  const normalized = String(status || 'completed').toLowerCase().replace(/\s+/g, '_');

  const configs = {
    completed: {
      label: 'Completed',
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      icon: CheckCircle2,
    },
    delivered: {
      label: 'Delivered',
      color: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
      icon: PackageCheck,
    },
    in_transmission: {
      label: 'In Transmission',
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      icon: Zap,
      pulse: true,
    },
    accepted: {
      label: 'Accepted',
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      icon: CheckCircle2,
    },
    pending: {
      label: 'Pending Approval',
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      icon: Clock,
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      icon: Ban,
    },
    failed: {
      label: 'Failed',
      color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      icon: AlertCircle,
    },
    processing: {
      label: 'Processing',
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      icon: Loader2,
      spin: true,
    },
  };

  const config = configs[normalized] || configs.completed;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${config.color}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.spin ? 'animate-spin' : ''} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span>{config.label}</span>
    </span>
  );
}
