import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Plus } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

export default function SolarInverterForm({ isOpen, onClose, onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      serialNumber: '',
      capacityKw: 5.0,
      manufacturer: 'SolarEdge',
      model: 'SE5000H',
      status: 'Connected',
    },
  });

  if (!isOpen) return null;

  const handleFormSubmit = async (data) => {
    await onSubmit({
      ...data,
      capacityKw: parseFloat(data.capacityKw),
    });
    reset();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 relative"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Register Solar Inverter</h3>
                <p className="text-xs text-text-secondary">Add solar generation inverter asset</p>
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
              label="Inverter Name"
              placeholder="e.g. Primary Rooftop Solar Inverter Alpha"
              error={errors.name?.message}
              {...register('name', { required: 'Inverter name is required' })}
            />

            <Input
              label="Serial Number"
              placeholder="e.g. SE-INV-7721-X"
              error={errors.serialNumber?.message}
              {...register('serialNumber', { required: 'Serial number is required' })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Rated Capacity (kW)"
                type="number"
                step="0.1"
                {...register('capacityKw')}
              />
              <Input
                label="Manufacturer"
                placeholder="e.g. SolarEdge / Fronius"
                {...register('manufacturer')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Model"
                placeholder="e.g. SE5000H-HD"
                {...register('model')}
              />
              <div className="space-y-1">
                <label className="font-semibold text-text-primary block">Status</label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-medium focus:outline-none focus:border-primary"
                >
                  <option value="Connected">Connected</option>
                  <option value="Simulation Mode">Simulation Mode</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
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
                Register Inverter
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
