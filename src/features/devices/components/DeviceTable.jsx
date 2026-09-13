import { useState, useMemo } from 'react';
import { Eye, Edit2, Trash2, Search, Filter, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import StatusIndicator from './StatusIndicator';

export default function DeviceTable({
  devices = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchesSearch =
        d.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.manufacturer && d.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.serialNumber && d.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.location && d.location.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === 'all' || d.deviceType === typeFilter;
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [devices, searchTerm, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage) || 1;
  const paginatedDevices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDevices.slice(start, start + itemsPerPage);
  }, [filteredDevices, currentPage]);

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background p-3.5 rounded-xl border border-border">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search devices by name, manufacturer, serial #, location..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2">
          {/* Device Type Select */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All Device Types</option>
            <option value="Smart Meter">Smart Meter</option>
            <option value="Solar Inverter">Solar Inverter</option>
            <option value="Battery Storage">Battery Storage</option>
            <option value="Wind Turbine">Wind Turbine</option>
            <option value="EV Charger">EV Charger</option>
            <option value="Weather Station">Weather Station</option>
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Simulation Mode">Simulation Mode</option>
            <option value="Connected">Connected</option>
            <option value="Disconnected">Disconnected</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-background/80 text-text-secondary uppercase text-[10px] font-bold border-b border-border tracking-wider">
            <tr>
              <th className="py-3 px-4">Device Name & Type</th>
              <th className="py-3 px-4">Manufacturer & Model</th>
              <th className="py-3 px-4">Serial Number</th>
              <th className="py-3 px-4">Capacity</th>
              <th className="py-3 px-4">Connection Mode</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-3 w-32 bg-gray-200 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-3 w-28 bg-gray-200 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-3 w-24 bg-gray-200 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-3 w-16 bg-gray-200 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-3 w-20 bg-gray-200 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-20 bg-gray-200 rounded-full" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-6 w-20 bg-gray-200 rounded-lg ml-auto" /></td>
                </tr>
              ))
            ) : paginatedDevices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-background rounded-full border border-border text-text-secondary">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-text-primary">No devices found</p>
                    <p className="text-xs text-text-secondary">
                      Adjust your search query or add a new energy device.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedDevices.map((dev) => (
                <tr key={dev.id} className="hover:bg-background/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-text-primary block">{dev.deviceName}</span>
                    <span className="text-[11px] text-text-secondary">{dev.deviceType}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-text-primary block">{dev.manufacturer || '—'}</span>
                    <span className="text-[11px] font-mono text-text-secondary">{dev.modelNumber || '—'}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-navy font-semibold">{dev.serialNumber || '—'}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{dev.capacity || '—'}</td>
                  <td className="py-3.5 px-4 font-medium text-text-primary">{dev.connectionMode || 'Manual'}</td>
                  <td className="py-3.5 px-4">
                    <StatusIndicator status={dev.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(dev)}
                        className="p-1.5 text-text-secondary hover:text-primary rounded-lg border border-border transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(dev)}
                        className="p-1.5 text-text-secondary hover:text-primary rounded-lg border border-border transition-colors"
                        title="Edit Device"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(dev)}
                        className="p-1.5 text-text-secondary hover:text-rose-600 rounded-lg border border-border transition-colors"
                        title="Delete Device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && filteredDevices.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary pt-1">
          <span>
            Showing <strong className="text-text-primary">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong className="text-text-primary">
              {Math.min(currentPage * itemsPerPage, filteredDevices.length)}
            </strong>{' '}
            of <strong className="text-text-primary">{filteredDevices.length}</strong> devices
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border bg-surface hover:bg-background disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-text-primary">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-border bg-surface hover:bg-background disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
