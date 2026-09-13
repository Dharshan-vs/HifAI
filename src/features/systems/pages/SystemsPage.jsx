import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Zap,
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  X,
  Cpu,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchEnergySystems,
  addEnergySystem,
  updateEnergySystem,
  deleteEnergySystem,
} from '../../../services/systemsService';

const SYSTEM_TYPES = [
  { id: 'all', label: 'All Systems', icon: Cpu },
  { id: 'Solar', label: 'Solar Systems', icon: Sun, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
];

export default function SystemsPage() {
  const { user } = useAuth();
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSystem, setEditingSystem] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const loadSystems = async () => {
    setLoading(true);
    const data = await fetchEnergySystems(user?.uid || 'guest');
    setSystems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSystems();
  }, [user?.uid]);

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAddModal = () => {
    if (systems.length >= 1) {
      toast.error('⚠️ Single System Limit: Producers can register only 1 solar energy system for marketplace verification.');
      return;
    }
    setEditingSystem(null);
    setPhotoDataUrl('');
    reset({
      name: '',
      type: 'Solar',
      capacity: 5.0,
      installationDate: new Date().toISOString().split('T')[0],
      manufacturer: '',
      location: '',
      status: 'Active',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (sys) => {
    setEditingSystem(sys);
    setPhotoDataUrl(sys.photoURL || '');
    setValue('name', sys.name);
    setValue('type', sys.type);
    setValue('capacity', sys.capacity);
    setValue('installationDate', sys.installationDate);
    setValue('manufacturer', sys.manufacturer);
    setValue('location', sys.location);
    setValue('status', sys.status);
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      photoURL: photoDataUrl || '',
    };

    try {
      if (editingSystem) {
        const updated = await updateEnergySystem(editingSystem.id, { ...payload, userId: user?.uid || 'guest' });
        setSystems(systems.map((s) => (s.id === editingSystem.id ? { ...s, ...updated } : s)));
        toast.success('Solar energy system updated!');
      } else {
        const created = await addEnergySystem(user?.uid || 'guest', payload);
        setSystems([created, ...systems]);
        toast.success('Solar system registered & verified for marketplace selling!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to register solar energy system');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteEnergySystem(id, user?.uid || 'guest');
      setSystems(systems.filter((s) => s.id !== id));
      toast.success('System removed');
    }
  };

  const filteredSystems = systems.filter((sys) => {
    const matchesSearch =
      sys.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sys.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sys.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || sys.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-[var(--radius-card)] p-6 sm:p-7 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 mb-2 border border-white/20">
              <Sun className="w-3.5 h-3.5 text-lime-300" /> SOLAR ENERGY SYSTEMS
            </div>
            <h1 className="text-2xl font-extrabold font-heading tracking-tight">Solar System Assets</h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-xl">
              Register and manage your rooftop solar arrays and solar panel hardware assets.
            </p>
          </div>
          {systems.length >= 1 ? (
            <div className="px-4 py-2.5 bg-emerald-950/40 backdrop-blur-md text-emerald-100 rounded-xl text-xs font-bold border border-emerald-400/30 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-lime-300" />
              <span>1 Verified System Registered (Limit Reached)</span>
            </div>
          ) : (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-lime-400 text-navy hover:bg-lime-300 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Register Solar System
            </button>
          )}
        </div>
      </div>

      {/* Marketplace Verification Status Banner */}
      {systems.length >= 1 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-navy">Marketplace Verification Active</h4>
            <p className="text-[11px] text-text-secondary">
              Your 1 registered Solar Energy System & connected Energy Meter are verified. Producer accounts are limited to 1 verified system to validate all energy offers listed on the Marketplace.
            </p>
          </div>
        </div>
      )}

      {/* Controls: Search & Category Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
          <input
            type="text"
            placeholder="Search solar arrays or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border/80 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Compact & Elegant Systems Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-surface rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      ) : filteredSystems.length === 0 ? (
        <Card className="p-8 text-center space-y-3 border-dashed">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <Sun className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-navy">No Solar Systems Registered</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            {searchQuery ? 'No solar system matches your search query.' : 'Register your Solar Panel array to connect your renewable energy asset.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-sm hover:bg-emerald-700 transition-colors"
          >
            + Register Solar System
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSystems.map((sys) => {
            return (
              <motion.div
                key={sys.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                className="bg-surface rounded-2xl border border-border/80 hover:border-emerald-500/40 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Compact Header Badge */}
                  <div className="p-4 bg-background/60 border-b border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-navy group-hover:text-emerald-600 transition-colors leading-snug">
                          {sys.name}
                        </h3>
                        <span className="text-[11px] text-text-secondary flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" /> {sys.location || 'Site Unspecified'}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full shadow-xs ${
                      sys.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    }`}>
                      {sys.status}
                    </span>
                  </div>

                  {/* Sleek Spec Pills */}
                  <div className="p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-background rounded-xl border border-border/60">
                        <span className="text-[10px] uppercase font-bold text-text-secondary block">Capacity</span>
                        <span className="font-mono font-extrabold text-emerald-600 text-sm">{sys.capacity} kW</span>
                      </div>
                      <div className="p-2.5 bg-background rounded-xl border border-border/60">
                        <span className="text-[10px] uppercase font-bold text-text-secondary block">Manufacturer</span>
                        <span className="font-semibold text-navy truncate block">{sys.manufacturer || 'SunPower'}</span>
                      </div>
                    </div>

                    {sys.photoURL && (
                      <div className="h-24 rounded-xl overflow-hidden border border-border/60">
                        <img src={sys.photoURL} alt={sys.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-2.5 bg-background/40 border-t border-border/60 flex items-center justify-between text-xs font-bold">
                  <button
                    onClick={() => handleOpenEditModal(sys)}
                    className="text-text-secondary hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sys.id, sys.name)}
                    className="text-rose-500/80 hover:text-rose-600 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit System Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-base font-bold text-navy">
                  {editingSystem ? 'Edit Solar System' : 'Register Solar System'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-navy">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 text-xs" noValidate>
                <Input
                  label="Solar System Name"
                  placeholder="e.g. Household Rooftop Solar Array"
                  error={errors.name?.message}
                  {...register('name', { required: 'System name is required' })}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Capacity (kW)"
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    error={errors.capacity?.message}
                    {...register('capacity', { required: 'Capacity is required', valueAsNumber: true })}
                  />
                  <Input
                    label="Manufacturer"
                    placeholder="e.g. SunPower / SolarEdge"
                    {...register('manufacturer')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Installation Date"
                    type="date"
                    {...register('installationDate')}
                  />
                  <Input
                    label="Location"
                    placeholder="e.g. Rooftop Terrace"
                    {...register('location')}
                  />
                </div>

                {/* System Photo Picker */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-text-primary">System Photo (Optional)</label>
                  <label className="flex items-center justify-center gap-2 p-2.5 bg-background border border-dashed border-border rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-text-secondary font-medium">Upload photo file...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                  {photoDataUrl && (
                    <div className="relative mt-2 h-20 rounded-xl overflow-hidden border border-border">
                      <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 bg-background border border-border rounded-xl text-xs font-semibold hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 gradient-yuga text-white text-xs font-bold rounded-xl shadow-md hover:brightness-105"
                  >
                    {editingSystem ? 'Save Changes' : 'Register System'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
