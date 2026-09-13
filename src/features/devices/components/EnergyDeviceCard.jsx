import { motion } from 'framer-motion';
import {
  Gauge,
  Sun,
  Battery,
  Wind,
  Zap,
  CloudSun,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  Calendar,
  Wifi,
} from 'lucide-react';
import Card, { CardContent } from '../../../components/common/Card';
import StatusIndicator from './StatusIndicator';
import SimulationBadge from './SimulationBadge';

const typeIcons = {
  'Smart Meter': Gauge,
  'Solar Inverter': Sun,
  'Battery Storage': Battery,
  'Wind Turbine': Wind,
  'EV Charger': Zap,
  'Weather Station': CloudSun,
};

export default function EnergyDeviceCard({ device, onView, onEdit, onDelete }) {
  const Icon = typeIcons[device.deviceType] || Zap;

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Card className="border-border shadow-card bg-surface overflow-hidden h-full flex flex-col justify-between hover:border-primary/40 transition-all">
        <CardContent className="p-5 space-y-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary line-clamp-1">
                  {device.deviceName}
                </h3>
                <p className="text-xs text-text-secondary font-medium">{device.deviceType}</p>
              </div>
            </div>
            <StatusIndicator status={device.status} />
          </div>

          {/* Simulation Badge */}
          {device.status === 'Simulation Mode' && <SimulationBadge showDetails={false} />}

          {/* Details & Specifications Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 bg-background rounded-xl border border-border/70 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary">Capacity</span>
              <span className="font-mono font-bold text-emerald-600 block">{device.capacity || 'N/A'}</span>
            </div>
            <div className="p-2.5 bg-background rounded-xl border border-border/70 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-text-secondary">Connection</span>
              <span className="font-semibold text-text-primary block truncate">{device.connectionMode || 'Manual'}</span>
            </div>
          </div>

          {/* Location & Meta info */}
          <div className="space-y-1.5 text-xs text-text-secondary pt-1 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{device.location || 'Unspecified Location'}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-text-secondary" /> Installed {device.installationDate || 'N/A'}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Wifi className="w-3 h-3 text-emerald-600" /> {device.signalStrength || -60} dBm
              </span>
            </div>
          </div>
        </CardContent>

        {/* Action Buttons Footer */}
        <div className="px-5 py-3 bg-background/80 border-t border-border flex items-center justify-between gap-2">
          <button
            onClick={() => onView(device)}
            className="flex-1 py-1.5 px-3 bg-surface hover:bg-primary/10 hover:text-primary border border-border rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Details
          </button>
          <button
            onClick={() => onEdit(device)}
            className="p-1.5 text-text-secondary hover:text-primary hover:bg-surface rounded-lg border border-border transition-colors"
            title="Edit Device"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(device)}
            className="p-1.5 text-text-secondary hover:text-rose-600 hover:bg-rose-500/10 rounded-lg border border-border transition-colors"
            title="Delete Device"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
