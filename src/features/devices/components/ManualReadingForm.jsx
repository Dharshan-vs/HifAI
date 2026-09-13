import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gauge, Plus } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

export default function ManualReadingForm({ isOpen, onClose, onSubmit, reading, loading }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (reading) {
      reset({
        energyConsumed: reading.energyConsumed || 0,
        energyExported: reading.energyExported || 0,
        voltage: reading.voltage || 230,
        current: reading.current || 10,
        powerFactor: reading.powerFactor || 0.96,
        frequency: reading.frequency || 50.0,
        timestamp: reading.timestamp ? reading.timestamp.slice(0, 16) : new Date().toISOString().slice(0, 16),
      });
    } else {
      reset({
        energyConsumed: 12.5,
        energyExported: 4.0,
        voltage: 230.5,
        current: 11.2,
        powerFactor: 0.96,
        frequency: 50.0,
        timestamp: new Date().toISOString().slice(0, 16),
      });
    }
  }, [reading, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data) => {
    const formatted = {
      energyConsumed: parseFloat(data.energyConsumed),
      energyExported: parseFloat(data.energyExported),
      voltage: parseFloat(data.voltage),
      current: parseFloat(data.current),
      powerFactor: parseFloat(data.powerFactor),
      frequency: parseFloat(data.frequency),
      timestamp: new Date(data.timestamp).toISOString(),
    };
    await onSubmit(formatted);
    reset();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  {reading ? 'Edit Meter Reading' : 'Manual Smart Meter Entry'}
                </h3>
                <p className="text-xs text-text-secondary">Simulated telemetry payload entry</p>
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
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Energy Consumed (kWh)"
                type="number"
                step="0.1"
                error={errors.energyConsumed?.message}
                {...register('energyConsumed', { required: 'Required' })}
              />
              <Input
                label="Energy Exported (kWh)"
                type="number"
                step="0.1"
                error={errors.energyExported?.message}
                {...register('energyExported', { required: 'Required' })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Voltage (V)"
                type="number"
                step="0.1"
                {...register('voltage')}
              />
              <Input
                label="Current (A)"
                type="number"
                step="0.1"
                {...register('current')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Power Factor (0.0 - 1.0)"
                type="number"
                step="0.01"
                {...register('powerFactor')}
              />
              <Input
                label="Frequency (Hz)"
                type="number"
                step="0.1"
                {...register('frequency')}
              />
            </div>

            <Input
              label="Reading Timestamp"
              type="datetime-local"
              {...register('timestamp', { required: 'Timestamp is required' })}
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-background border border-border rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <Button type="submit" loading={loading} className="flex-1">
                Save Reading Entry
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
