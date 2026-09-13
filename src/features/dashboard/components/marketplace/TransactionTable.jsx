import { useState, useMemo } from 'react';
import {
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Inbox,
  ShieldCheck,
  CheckCircle2,
  Zap,
  PackageCheck,
  Ban,
  AlertCircle,
  RefreshCw,
  Sun,
  Wind,
  Droplets,
  Leaf,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TransactionStatusBadge from './TransactionStatusBadge';
import TransactionDetailModal from './TransactionDetailModal';
import CancelOrderModal from './CancelOrderModal';
import RateReviewModal from './RateReviewModal';
import ProofOfDeliveryModal from '../../../marketplace/components/ProofOfDeliveryModal';
import { formatDate } from '../../../../utils/helpers';
import { useAuth } from '../../../../context/AuthContext';
import { updateTransactionStatus, cancelTransaction } from '../../../../services/marketplaceService';

// Helper for dynamic energy source icon & badge
function getSourceBadge(source = 'Solar') {
  const s = String(source).toLowerCase();
  if (s.includes('wind')) {
    return { icon: Wind, text: 'Wind', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20' };
  }
  if (s.includes('hydro') || s.includes('water')) {
    return { icon: Droplets, text: 'Hydro', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' };
  }
  if (s.includes('bio') || s.includes('green') || s.includes('eco')) {
    return { icon: Leaf, text: 'Biomass', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
  }
  return { icon: Sun, text: 'Solar', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
}

export default function TransactionTable({
  transactions = [],
  loading = false,
  error = null,
  onRefresh,
}) {
  const { user, userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState(null);
  const [selectedProofTx, setSelectedProofTx] = useState(null);
  const [selectedCancelTx, setSelectedCancelTx] = useState(null);
  const [selectedRateTx, setSelectedRateTx] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const isProducerRole = userProfile?.role === 'producer' || userProfile?.role === 'prosumer';
  const itemsPerPage = 6;

  const handleAction = async (txId, newStatus) => {
    setActionLoadingId(txId);
    const toastId = toast.loading(`Updating order status to ${newStatus.toUpperCase()}...`);
    try {
      if (newStatus === 'cancelled') {
        await cancelTransaction(txId, 'User cancelled transaction');
        toast.success('Order cancelled. Energy restored and wallet refund issued.', { id: toastId });
      } else {
        await updateTransactionStatus(txId, newStatus);
        const labels = {
          accepted: 'ACCEPTED',
          in_transmission: 'IN TRANSMISSION',
          delivered: 'DELIVERED',
          completed: 'COMPLETED',
        };
        toast.success(`Order advanced to ${labels[newStatus] || newStatus.toUpperCase()}!`, { id: toastId });
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to update order status', { id: toastId });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.created_at || 0).getTime();
        return dateB - dateA;
      })
      .filter((tx) => {
        const matchesSearch =
          String(tx.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(tx.buyer || tx.buyer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(tx.seller || tx.seller_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(tx.energy_source || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(tx.location || tx.seller_location || '').toLowerCase().includes(searchTerm.toLowerCase());

        const normalizedTxStatus = String(tx.status || 'pending').toLowerCase().replace(/\s+/g, '_');
        const matchesStatus =
          statusFilter === 'all' || normalizedTxStatus === statusFilter.toLowerCase();
        const matchesType =
          typeFilter === 'all' || String(tx.type || '').toLowerCase() === typeFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesType;
      });
  }, [transactions, searchTerm, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background p-3.5 rounded-xl border border-border">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search orders by ID, Producer, Consumer, Energy Source, or Location..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Filter Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <div className="flex bg-surface rounded-lg p-1 border border-border">
            {['all', 'purchase', 'sale'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTypeFilter(t);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-[11px] font-semibold capitalize rounded-md transition-all cursor-pointer ${
                  typeFilter === t
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {t === 'purchase' ? 'Purchases' : t === 'sale' ? 'Sales' : 'All Orders'}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-text-secondary absolute left-2.5 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-navy focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_transmission">In Transmission</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 bg-surface border border-border hover:bg-background rounded-lg text-text-secondary hover:text-primary transition-colors cursor-pointer"
              title="Refresh Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-background/80 text-text-secondary uppercase text-[10px] font-bold border-b border-border tracking-wider">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Role / Counterparty</th>
              <th className="py-3 px-4">Energy (kWh)</th>
              <th className="py-3 px-4">Price / Rate</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Order Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              /* Loading State */
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-semibold text-text-secondary">Loading marketplace history...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              /* Error State */
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-600">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-navy">Unable to load marketplace history.</p>
                    <p className="text-xs text-text-secondary max-w-sm">
                      {typeof error === 'string' ? error : 'Please check your connection and try again.'}
                    </p>
                    {onRefresh && (
                      <button
                        onClick={onRefresh}
                        className="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : paginatedTransactions.length === 0 ? (
              /* Empty State */
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-background rounded-full border border-border text-text-secondary">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-navy">
                      {transactions.length === 0
                        ? 'No marketplace transactions yet.'
                        : 'No transactions match your filters.'}
                    </p>
                    <p className="text-xs text-text-secondary max-w-sm">
                      {transactions.length === 0
                        ? 'Your completed and ongoing energy orders will appear here.'
                        : 'Try adjusting your search query or clearing active filters.'}
                    </p>
                    {transactions.length > 0 && (statusFilter !== 'all' || searchTerm || typeFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setSearchTerm('');
                          setTypeFilter('all');
                        }}
                        className="mt-2 px-3 py-1.5 bg-background border border-border hover:bg-gray-100 rounded-lg text-xs font-semibold text-navy transition-colors cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx) => {
                const normStatus = String(tx.status || 'pending').toLowerCase().replace(/\s+/g, '_');
                const isCurrentTxLoading = actionLoadingId === tx.id;

                const isSeller =
                  tx.seller_id === user?.uid ||
                  tx.seller === (userProfile?.fullName || user?.displayName) ||
                  tx.type === 'sale' ||
                  isProducerRole;

                const counterpartyName = isSeller
                  ? (tx.buyer || tx.buyer_name || 'Consumer')
                  : (tx.seller || tx.seller_name || 'Producer');

                const counterpartyRole = isSeller ? 'Consumer (Buyer)' : 'Producer (Seller)';
                const sourceBadge = getSourceBadge(tx.energy_source || 'Solar');
                const SourceIcon = sourceBadge.icon;

                const energyAmount = parseFloat(tx.energyAmount || tx.energy_kwh || 0).toFixed(1);
                const rate = parseFloat(tx.pricePerKwh || tx.price_per_kwh || 7.20).toFixed(2);
                const total = parseFloat(tx.price || tx.total_amount || 0).toFixed(2);

                return (
                  <tr key={tx.id} className="hover:bg-background/40 transition-colors">
                    {/* 1. Order ID */}
                    <td className="py-3.5 px-4 font-mono font-extrabold text-navy">
                      #{tx.id}
                    </td>

                    {/* 2. Role / Counterparty */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-navy text-xs block truncate max-w-[150px]">
                          {counterpartyName}
                        </span>
                        <span className="text-[10px] text-text-secondary flex items-center gap-1 font-medium">
                          {isSeller ? (
                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3 text-cyan-600" />
                          )}
                          <span>{counterpartyRole}</span>
                        </span>
                      </div>
                    </td>

                    {/* 3. Energy (kWh) & Source */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="font-mono font-extrabold text-emerald-600 text-xs block">
                          {energyAmount} kWh
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${sourceBadge.color}`}
                        >
                          <SourceIcon className="w-2.5 h-2.5" />
                          <span>{sourceBadge.text}</span>
                        </span>
                      </div>
                    </td>

                    {/* 4. Price / Rate */}
                    <td className="py-3.5 px-4 font-mono text-xs text-text-secondary">
                      ₹{rate} <span className="text-[10px]">/ kWh</span>
                    </td>

                    {/* 5. Total Value */}
                    <td className="py-3.5 px-4 font-mono font-extrabold text-navy text-xs">
                      ₹{total}
                    </td>

                    {/* 6. Order Date */}
                    <td className="py-3.5 px-4 text-text-secondary text-[11px] font-mono">
                      {tx.date || tx.created_at
                        ? formatDate(tx.date || tx.created_at, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>

                    {/* 7. Status Badge */}
                    <td className="py-3.5 px-4">
                      <TransactionStatusBadge status={tx.status} />
                    </td>

                    {/* 8. Lifecycle Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Producer-Only Lifecycle Controls */}
                        {normStatus === 'pending' && isSeller && (
                          <button
                            disabled={isCurrentTxLoading}
                            onClick={() => handleAction(tx.id, 'accepted')}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors border border-emerald-500/20 shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                            title="Accept energy order"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                          </button>
                        )}

                        {normStatus === 'accepted' && isSeller && (
                          <button
                            disabled={isCurrentTxLoading}
                            onClick={() => handleAction(tx.id, 'in_transmission')}
                            className="px-2.5 py-1 text-[11px] font-bold bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors border border-blue-500/20 shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                            title="Start electrical transmission to microgrid"
                          >
                            <Zap className="w-3.5 h-3.5" /> Transmit
                          </button>
                        )}

                        {normStatus === 'in_transmission' && isSeller && (
                          <button
                            disabled={isCurrentTxLoading}
                            onClick={() => handleAction(tx.id, 'delivered')}
                            className="px-2.5 py-1 text-[11px] font-bold bg-teal-500/10 text-teal-600 hover:bg-teal-600 hover:text-white rounded-lg transition-colors border border-teal-500/20 shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                            title="Confirm power delivery to grid meter"
                          >
                            <PackageCheck className="w-3.5 h-3.5" /> Deliver
                          </button>
                        )}

                        {normStatus === 'delivered' && (
                          <button
                            disabled={isCurrentTxLoading}
                            onClick={() => handleAction(tx.id, 'completed')}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors border border-emerald-500/20 shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                            title="Finalize settlement"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                          </button>
                        )}

                        {/* Cancellation Action (Allowed in Pending / Accepted for both Buyer & Seller) */}
                        {(normStatus === 'pending' || normStatus === 'accepted') && (
                          <button
                            disabled={isCurrentTxLoading}
                            onClick={() => setSelectedCancelTx(tx)}
                            className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center gap-1 border border-rose-500/20 cursor-pointer"
                            title="Cancel order and refund energy/wallet"
                          >
                            <Ban className="w-3.5 h-3.5" /> Cancel
                          </button>
                        )}

                        {/* Rate & Review (Completed only) */}
                        {normStatus === 'completed' && (
                          <button
                            onClick={() => setSelectedRateTx(tx)}
                            className="px-2 py-1 text-[11px] font-bold bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1 border border-amber-500/20 shadow-2xs cursor-pointer"
                            title="Rate and review this completed energy transaction"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" /> Rate
                          </button>
                        )}

                        {/* Proof of Delivery (Delivered or Completed) */}
                        {(normStatus === 'delivered' || normStatus === 'completed') && (
                          <button
                            onClick={() => setSelectedProofTx(tx)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1 border border-emerald-500/20 shadow-2xs cursor-pointer"
                            title="View Official Proof of Delivery Certificate"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Proof
                          </button>
                        )}

                        {/* Order Details Modal Button */}
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="View order details and lifecycle progression"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && filteredTransactions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary pt-1">
          <span>
            Showing <strong className="text-navy">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong className="text-navy">
              {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
            </strong>{' '}
            of <strong className="text-navy">{filteredTransactions.length}</strong> orders
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border bg-surface hover:bg-background disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-navy">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-border bg-surface hover:bg-background disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal with 5-Stage Lifecycle Progression */}
      <TransactionDetailModal
        transaction={selectedTx}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        onStatusUpdate={onRefresh}
      />

      {/* HD-61: Rate & Review Modal */}
      <RateReviewModal
        transaction={selectedRateTx}
        isOpen={!!selectedRateTx}
        onClose={() => setSelectedRateTx(null)}
        onReviewSubmitted={() => {
          setSelectedRateTx(null);
          if (onRefresh) onRefresh();
        }}
      />

      {/* Cancellation Confirmation Modal */}
      <CancelOrderModal
        order={selectedCancelTx}
        isOpen={!!selectedCancelTx}
        onClose={() => setSelectedCancelTx(null)}
        onCancelled={() => {
          setSelectedCancelTx(null);
          if (onRefresh) onRefresh();
        }}
      />

      {/* Proof of Delivery Certificate Modal */}
      <ProofOfDeliveryModal
        isOpen={!!selectedProofTx}
        onClose={() => setSelectedProofTx(null)}
        proofData={
          selectedProofTx
            ? {
                id: selectedProofTx.id,
                energy_kwh: selectedProofTx.energyAmount || selectedProofTx.energy_kwh,
                seller_name: selectedProofTx.seller || selectedProofTx.seller_name,
                buyer_name: selectedProofTx.buyer || selectedProofTx.buyer_name,
                total_amount: selectedProofTx.price || selectedProofTx.total_amount,
                created_at: selectedProofTx.date || selectedProofTx.created_at,
              }
            : null
        }
      />
    </div>
  );
}
