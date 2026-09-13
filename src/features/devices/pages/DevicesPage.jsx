import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Plus, LayoutGrid, ListFilter, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../../components/common/PageHeader';
import Breadcrumb from '../../../components/common/Breadcrumb';
import Button from '../../../components/common/Button';
import EnergyDeviceCard from '../components/EnergyDeviceCard';
import DeviceTable from '../components/DeviceTable';
import DeviceDetailsModal from '../components/DeviceDetailsModal';
import AddDeviceModal from '../components/AddDeviceModal';
import EditDeviceModal from '../components/EditDeviceModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import SimulationBadge from '../components/SimulationBadge';
import {
  fetchEnergyDevices,
  addEnergyDevice,
  updateEnergyDevice,
  deleteEnergyDevice,
} from '../../../services/deviceService';
import { useAuth } from '../../../context/AuthContext';

export default function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEnergyDevices(user?.uid || 'guest');
      setDevices(data);
    } catch {
      toast.error('Failed to load energy devices');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Handlers
  const handleAdd = async (data) => {
    setActionLoading(true);
    const result = await addEnergyDevice(user?.uid || 'guest', data);
    setActionLoading(false);
    setIsAddOpen(false);
    toast.success(`Device "${data.deviceName}" registered successfully!`);
    loadDevices();
  };

  const handleEdit = async (id, data) => {
    setActionLoading(true);
    await updateEnergyDevice(id, data, user?.uid || 'guest');
    setActionLoading(false);
    setIsEditOpen(false);
    setSelectedDevice(null);
    toast.success('Device updated successfully!');
    loadDevices();
  };

  const handleDelete = async () => {
    if (!selectedDevice) return;
    setActionLoading(true);
    await deleteEnergyDevice(selectedDevice.id, user?.uid || 'guest');
    setActionLoading(false);
    setIsDeleteOpen(false);
    toast.success(`Device "${selectedDevice.deviceName}" deleted.`);
    setSelectedDevice(null);
    loadDevices();
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Energy Devices' }]} />

      {/* Header & Simulation Notice Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Energy Device Management"
            subtitle="Register and manage smart meters, solar inverters, and microgrid assets"
          />
          <div className="mt-1">
            <SimulationBadge />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid vs Table View Switcher */}
          <div className="flex bg-surface rounded-xl p-1 border border-border shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'grid'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Table View"
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={loadDevices}
            disabled={loading}
            className="p-2.5 text-text-secondary hover:text-primary rounded-xl border border-border bg-surface hover:bg-background transition-colors"
            title="Refresh Devices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Button onClick={() => setIsAddOpen(true)} className="shadow-md">
            <Plus className="w-4 h-4 mr-1 inline" /> Register Device
          </Button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-64 bg-surface rounded-2xl border border-border animate-pulse" />
            ))
          ) : devices.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-surface rounded-2xl border border-border">
              <HardDrive className="w-10 h-10 text-text-secondary mx-auto mb-2" />
              <p className="font-semibold text-text-primary">No energy devices registered yet</p>
              <p className="text-xs text-text-secondary mt-1">
                Click &quot;Register Device&quot; to add your first meter or inverter.
              </p>
            </div>
          ) : (
            devices.map((dev) => (
              <EnergyDeviceCard
                key={dev.id}
                device={dev}
                onView={(d) => {
                  setSelectedDevice(d);
                  setIsDetailsOpen(true);
                }}
                onEdit={(d) => {
                  setSelectedDevice(d);
                  setIsEditOpen(true);
                }}
                onDelete={(d) => {
                  setSelectedDevice(d);
                  setIsDeleteOpen(true);
                }}
              />
            ))
          )}
        </div>
      ) : (
        <DeviceTable
          devices={devices}
          loading={loading}
          onView={(d) => {
            setSelectedDevice(d);
            setIsDetailsOpen(true);
          }}
          onEdit={(d) => {
            setSelectedDevice(d);
            setIsEditOpen(true);
          }}
          onDelete={(d) => {
            setSelectedDevice(d);
            setIsDeleteOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <AddDeviceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAdd}
        loading={actionLoading}
      />

      <EditDeviceModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedDevice(null);
        }}
        device={selectedDevice}
        onSubmit={handleEdit}
        loading={actionLoading}
      />

      <DeviceDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedDevice(null);
        }}
        device={selectedDevice}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedDevice(null);
        }}
        onConfirm={handleDelete}
        title="Delete Energy Device"
        message={`Are you sure you want to delete "${selectedDevice?.deviceName}"? Telemetry logs linked to this device will remain archived.`}
        loading={actionLoading}
      />
    </div>
  );
}
