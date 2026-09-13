import { motion, AnimatePresence } from 'framer-motion';
import { X, HardDrive, Cpu, MapPin, Calendar, Wifi, Battery, ShieldCheck, Layers, FileText } from 'lucide-react';
import StatusIndicator from './StatusIndicator';
import SimulationBadge from './SimulationBadge';

export default function DeviceDetailsModal({ device, isOpen, onClose }) {
  if (!isOpen || !device) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden"
        >
          {/* Top Line Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 gradient-yuga" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">{device.deviceName}</h3>
                <p className="text-xs text-text-secondary">{device.deviceType}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-background transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="space-y-4 text-xs">
            {/* Status & Badge */}
            <div className="p-3.5 bg-background rounded-xl border border-border flex items-center justify-between">
              <div>
                <span className="text-text-secondary block text-[10px] uppercase font-bold">Current Operational Status</span>
                <div className="mt-1">
                  <StatusIndicator status={device.status} />
                </div>
              </div>
              <SimulationBadge showDetails={false} />
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-surface rounded-xl border border-border/80">
                <span className="text-text-secondary block text-[10px] uppercase font-bold">Manufacturer</span>
                <span className="font-semibold text-text-primary text-xs mt-0.5 block truncate">
                  {device.manufacturer || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-border/80">
                <span className="text-text-secondary block text-[10px] uppercase font-bold">Model Number</span>
                <span className="font-semibold font-mono text-navy text-xs mt-0.5 block truncate">
                  {device.modelNumber || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-border/80">
                <span className="text-text-secondary block text-[10px] uppercase font-bold">Serial Number</span>
                <span className="font-bold font-mono text-text-primary text-xs mt-0.5 block truncate">
                  {device.serialNumber || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-border/80">
                <span className="text-text-secondary block text-[10px] uppercase font-bold">Capacity</span>
                <span className="font-bold font-mono text-emerald-600 text-xs mt-0.5 block">
                  {device.capacity || 'N/A'}
                </span>
              </div>
            </div>

            {/* Driver & Data Source */}
            <div className="p-3 bg-surface rounded-xl border border-border/80 space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-text-secondary font-medium">Connection Driver Mode:</span>
                <span className="font-bold text-navy">{device.connectionMode || 'Manual Simulation'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-text-secondary font-medium">Telemetry Data Source:</span>
                <span className="font-semibold text-primary">{device.dataSource || 'Internal Engine'}</span>
              </div>
            </div>

            {/* Signal & Battery Health */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-background rounded-xl border border-border/70 text-center">
                <span className="text-[10px] text-text-secondary uppercase font-bold block">Health Score</span>
                <span className="font-mono font-bold text-emerald-600 text-sm mt-0.5 block">
                  {device.healthScore || 98}%
                </span>
              </div>
              <div className="p-2.5 bg-background rounded-xl border border-border/70 text-center">
                <span className="text-[10px] text-text-secondary uppercase font-bold block">Battery</span>
                <span className="font-mono font-bold text-navy text-sm mt-0.5 block">
                  {device.batteryLevel || 100}%
                </span>
              </div>
              <div className="p-2.5 bg-background rounded-xl border border-border/70 text-center">
                <span className="text-[10px] text-text-secondary uppercase font-bold block">Signal</span>
                <span className="font-mono font-bold text-text-primary text-sm mt-0.5 block">
                  {device.signalStrength || -60} dBm
                </span>
              </div>
            </div>

            {/* Location & Install Date */}
            <div className="p-3 bg-surface rounded-xl border border-border/80 space-y-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-text-primary">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-medium">Location: {device.location || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Calendar className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                <span>Installed on {device.installationDate || 'N/A'}</span>
              </div>
            </div>

            {/* Description */}
            {device.description && (
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-1">
                <span className="text-primary text-[11px] font-bold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Description & Notes
                </span>
                <p className="text-text-secondary text-[11px] leading-relaxed">{device.description}</p>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 gradient-yuga text-white font-bold rounded-xl text-xs shadow-md hover:brightness-105 transition-all"
            >
              Close Details
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
