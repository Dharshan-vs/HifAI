import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Plus } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

export default function GenerationEntryForm({ isOpen, onClose, onSubmit, entry, loading }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (entry) {
      reset({
        generatedEnergy: entry.generatedEnergy || 0,
        currentOutput: entry.currentOutput || 0,
        peakOutput: entry.peakOutput || 5.0,
        efficiency: entry.efficiency || 98.0,
        temperature: entry.temperature || 40,
        timestamp: entry.timestamp ? entry.timestamp.slice(0, 16) : new Date().toISOString().slice(0, 16),
      });
    } else {
      reset({
        generatedEnergy: 18.5,
        currentOutput: 3.85,
        peakOutput: 4.95,
        efficiency: 97.8,
        temperature: 42,
        timestamp: new Date().toISOString().slice(0, 16),
      });
    }
  }, [entry, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data) => {
    const formatted = {
      generatedEnergy: parseFloat(data.generatedEnergy),
      currentOutput: parseFloat(data.currentOutput),
      peakOutput: parseFloat(data.peakOutput),
      efficiency: parseFloat(data.efficiency),
      temperature: parseFloat(data.temperature),
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
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  {entry ? 'Edit Generation Entry' : 'Manual Generation Entry'}
                </h3>
                <p className="text-xs text-text-secondary">Simulated solar inverter generation log</p>
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
                label="Generated Energy (kWh)"
                type="number"
                step="0.1"
                error={errors.generatedEnergy?.message}
                {...register('generatedEnergy', { required: 'Required' })}
              />
              <Input
                label="Current Output (kW)"
                type="number"
                step="0.1"
                error={errors.currentOutput?.message}
                {...register('currentOutput', { required: 'Required' })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Peak Output (kW)"
                type="number"
                step="0.1"
                {...register('peakOutput')}
              />
              <Input
                label="Inverter Efficiency (%)"
                type="number"
                step="0.1"
                {...register('efficiency')}
              />
            </div>

            <Input
              label="Temperature (°C)"
              type="number"
              step="1"
              {...register('temperature')}
            />

            <Input
              label="Timestamp"
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
                Save Generation Log
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
