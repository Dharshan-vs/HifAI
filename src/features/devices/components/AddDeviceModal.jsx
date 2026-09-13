import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HardDrive, Plus, Cpu } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { DEVICE_TYPES, DEVICE_STATUSES, CONNECTION_MODES } from '../../../services/deviceService';

export default function AddDeviceModal({ isOpen, onClose, onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      deviceName: '',
      deviceType: DEVICE_TYPES.SMART_METER,
      manufacturer: '',
      modelNumber: '',
      serialNumber: '',
      capacity: '',
      location: '',
      installationDate: new Date().toISOString().split('T')[0],
      status: DEVICE_STATUSES.SIMULATION,
      connectionMode: CONNECTION_MODES.MANUAL_SIMULATION,
      dataSource: 'Manual & Sync Engine',
      description: '',
    },
  });

  if (!isOpen) return null;

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
    reset();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Register New Energy Device</h3>
                <p className="text-xs text-text-secondary">Add IoT meter or solar asset to REOS</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-background transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-xs">
            <Input
              label="Device Name"
              icon={HardDrive}
              placeholder="e.g. Primary Rooftop Solar Inverter A1"
              error={errors.deviceName?.message}
              {...register('deviceName', { required: 'Device name is required' })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-text-primary block">Device Type</label>
                <select
                  {...register('deviceType')}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-medium focus:outline-none focus:border-primary"
                >
                  {Object.values(DEVICE_TYPES).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-primary block">Operational Status</label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-medium focus:outline-none focus:border-primary"
                >
                  {Object.values(DEVICE_STATUSES).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Manufacturer"
                placeholder="e.g. Schneider Electric / SolarEdge"
                {...register('manufacturer')}
              />
              <Input
                label="Model Number"
                placeholder="e.g. SE5000H-WAVE"
                {...register('modelNumber')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Serial Number"
                placeholder="e.g. SE-98210-SM1"
                {...register('serialNumber')}
              />
              <Input
                label="Capacity"
                placeholder="e.g. 5.0 kW / 13.5 kWh"
                {...register('capacity')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Location"
                placeholder="e.g. Rooftop Section A"
                {...register('location')}
              />
              <Input
                label="Installation Date"
                type="date"
                {...register('installationDate')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-text-primary block">Connection Mode</label>
                <select
                  {...register('connectionMode')}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-medium focus:outline-none focus:border-primary"
                >
                  {Object.values(CONNECTION_MODES).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Data Source"
                placeholder="e.g. Manual & Sync Engine"
                {...register('dataSource')}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-primary block">Description & Technical Notes</label>
              <textarea
                rows={2}
                placeholder="Optional notes or specification details..."
                {...register('description')}
                className="w-full p-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-background border border-border rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <Button type="submit" loading={loading} className="flex-1">
                Save & Register Device
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
