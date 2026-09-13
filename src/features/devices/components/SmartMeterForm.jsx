import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gauge } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import LocationMapPicker from '../../../components/common/LocationMapPicker';

export default function SmartMeterForm({ isOpen, onClose, onSubmit, meter = null, loading }) {
  const [mapLoc, setMapLoc] = useState({
    address: 'Main Household Electrical Panel',
    lat: 13.0827,
    lon: 80.2707,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      serialNumber: '',
      location: 'Main Household Panel',
      status: 'Connected',
    },
  });

  useEffect(() => {
    if (meter) {
      setValue('name', meter.name || '');
      setValue('serialNumber', meter.serialNumber || '');
      setValue('location', meter.location || 'Main Household Panel');
      setValue('status', meter.status || 'Connected');
      if (meter.lat && meter.lon) {
        setMapLoc({
          address: meter.location || 'Main Household Panel',
          lat: parseFloat(meter.lat),
          lon: parseFloat(meter.lon),
        });
      }
    } else {
      let initialAddress = 'Main Road, Dindigul, Tamil Nadu';
      let initialLat = 10.3673;
      let initialLon = 77.9803;

      try {
        const savedLoc =
          localStorage.getItem('yuga_consumer_location') ||
          localStorage.getItem('yuga_consumer_location_guest');
        if (savedLoc) {
          const parsed = JSON.parse(savedLoc);
          if (parsed.lat && parsed.lon) {
            initialLat = parseFloat(parsed.lat);
            initialLon = parseFloat(parsed.lon);
            initialAddress = parsed.address || 'Main Road, Dindigul, Tamil Nadu';
          }
        }
      } catch {}

      reset({
        name: 'Household Main Smart Meter',
        serialNumber: `SM-${Math.floor(100000 + Math.random() * 900000)}`,
        location: initialAddress,
        status: 'Connected',
      });
      setMapLoc({
        address: initialAddress,
        lat: initialLat,
        lon: initialLon,
      });
    }
  }, [meter, setValue, reset, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data) => {
    await onSubmit({
      ...data,
      location: mapLoc.address || data.location,
      lat: parseFloat(mapLoc.lat),
      lon: parseFloat(mapLoc.lon),
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative my-8"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy">
                  {meter ? 'Edit Household Smart Meter Location' : 'Register Household Smart Meter & GPS Location'}
                </h3>
                <p className="text-xs text-text-secondary">Verify Google Maps location for 1.0 km P2P Microgrid transfer eligibility</p>
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
              label="Meter Name"
              placeholder="e.g. Household Main Smart Meter"
              error={errors.name?.message}
              {...register('name', { required: 'Meter name is required' })}
            />

            <Input
              label="Meter Serial Number (S/N)"
              placeholder="e.g. SM-IND-98210"
              error={errors.serialNumber?.message}
              {...register('serialNumber', { required: 'Serial number is required' })}
            />

            {/* Google Maps Location & GPS Verification Picker */}
            <LocationMapPicker
              label="Smart Meter Google Maps Location Pin & GPS Coordinates"
              value={mapLoc}
              onChange={(newLoc) => {
                setMapLoc(newLoc);
                setValue('location', newLoc.address);
              }}
            />

            <div className="space-y-1">
              <label className="font-semibold text-text-primary block">Connection Status</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl font-medium focus:outline-none focus:border-emerald-500 text-xs"
              >
                <option value="Connected">Connected & Active</option>
                <option value="Simulation Mode">Simulation Mode</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-background border border-border rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <Button type="submit" loading={loading} variant="primary" className="flex-1">
                {meter ? 'Save Verified Meter' : 'Register Meter on Google Maps'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
