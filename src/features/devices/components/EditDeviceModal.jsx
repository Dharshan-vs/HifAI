import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, HardDrive } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { DEVICE_TYPES, DEVICE_STATUSES, CONNECTION_MODES } from '../../../services/deviceService';

export default function EditDeviceModal({ isOpen, onClose, device, onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (device) {
      reset({
        deviceName: device.deviceName || '',
        deviceType: device.deviceType || DEVICE_TYPES.SMART_METER,
        manufacturer: device.manufacturer || '',
        modelNumber: device.modelNumber || '',
        serialNumber: device.serialNumber || '',
        capacity: device.capacity || '',
        location: device.location || '',
        installationDate: device.installationDate || '',
        status: device.status || DEVICE_STATUSES.SIMULATION,
        connectionMode: device.connectionMode || CONNECTION_MODES.MANUAL_SIMULATION,
        dataSource: device.dataSource || '',
        description: device.description || '',
      });
    }
  }, [device, reset]);

  if (!isOpen || !device) return null;

  const handleFormSubmit = async (data) => {
    await onSubmit(device.id, data);
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
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Edit Device Configuration</h3>
                <p className="text-xs text-text-secondary">Update attributes for {device.deviceName}</p>
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
              <Input label="Manufacturer" {...register('manufacturer')} />
              <Input label="Model Number" {...register('modelNumber')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Serial Number" {...register('serialNumber')} />
              <Input label="Capacity" {...register('capacity')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Location" {...register('location')} />
              <Input label="Installation Date" type="date" {...register('installationDate')} />
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

              <Input label="Data Source" {...register('dataSource')} />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-primary block">Description & Notes</label>
              <textarea
                rows={2}
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
                Update Device
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
