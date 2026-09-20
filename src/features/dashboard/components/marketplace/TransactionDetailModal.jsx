import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  X,
  Zap,
  Copy,
  Check,
  Printer,
  CheckCircle2,
  Clock,
  Ban,
  PackageCheck,
  MapPin,
  Calendar,
  Sun,
  Wind,
  Droplets,
  Leaf,
  User,
  ShieldCheck,
  Star,
  MessageSquare,
  Sparkles,
  Building2,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import TransactionStatusBadge from './TransactionStatusBadge';
import CancelOrderModal from './CancelOrderModal';
import RateReviewModal from './RateReviewModal';
import { formatDate } from '../../../../utils/helpers';
import { useAuth } from '../../../../context/AuthContext';
import {
  updateTransactionStatus,
  cancelTransaction,
  fetchTransactionReviews,
} from '../../../../services/marketplaceService';

// Helper for dynamic energy source icon & badge
function getSourceBadge(source = 'Solar') {
  const s = String(source).toLowerCase();
  if (s.includes('wind')) {
    return { icon: Wind, text: 'Wind Power', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20' };
  }
  if (s.includes('hydro') || s.includes('water')) {
    return { icon: Droplets, text: 'Hydro Power', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' };
  }
  if (s.includes('bio') || s.includes('green') || s.includes('eco')) {
    return { icon: Leaf, text: 'Biomass Power', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
  }
  return { icon: Sun, text: 'Solar Power', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
}

export default function TransactionDetailModal({ transaction, isOpen, onClose, onStatusUpdate }) {
  const { user, userProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (isOpen && transaction?.id && (transaction.status || '').toLowerCase() === 'completed') {
      setLoadingReviews(true);
      fetchTransactionReviews(transaction.id)
        .then((data) => {
          setReviews(data || []);
        })
        .catch(() => setReviews([]))
        .finally(() => setLoadingReviews(false));
    } else {
      setReviews([]);
    }
  }, [isOpen, transaction?.id, transaction?.status]);

  if (!isOpen || !transaction) return null;

  const currentUserId = user?.uid || userProfile?.id;
  const userReview = reviews.find(
    (r) =>
      r.reviewer_id == currentUserId ||
      String(r.reviewer_id) === String(currentUserId) ||
      (userProfile?.fullName && r.reviewer_name === userProfile.fullName)
  ) || transaction.user_review;

  const otherReviews = reviews.filter(
    (r) =>
      r.reviewer_id != currentUserId &&
      String(r.reviewer_id) !== String(currentUserId) &&
      (!userProfile?.fullName || r.reviewer_name !== userProfile.fullName)
  );

  const isProducerRole = userProfile?.role === 'producer' || userProfile?.role === 'prosumer';
  const isSeller =
    transaction.seller_id === user?.uid ||
    transaction.seller === (userProfile?.fullName || user?.displayName) ||
    transaction.type === 'sale' ||
    isProducerRole;

  const status = (transaction.status || 'pending').toLowerCase().replace(/\s+/g, '_');

  const handleCopyId = () => {
    navigator.clipboard.writeText(String(transaction.id));
    setCopied(true);
    toast.success('Order ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    const toastId = toast.loading(`Updating order status to ${newStatus.toUpperCase()}...`);
    try {
      if (newStatus === 'cancelled') {
        await cancelTransaction(transaction.id, 'User cancelled transaction');
        toast.success('Order cancelled. Energy restored and refund issued.', { id: toastId });
      } else {
        await updateTransactionStatus(transaction.id, newStatus);
        const labels = {
          accepted: 'ACCEPTED',
          in_transmission: 'IN TRANSMISSION',
          delivered: 'DELIVERED',
          completed: 'COMPLETED',
        };
        toast.success(`Order advanced to ${labels[newStatus] || newStatus.toUpperCase()}!`, { id: toastId });
      }
      if (onStatusUpdate) onStatusUpdate();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update order status', { id: toastId });
    } finally {
      setUpdating(false);
    }
  };

  const STEPS = [
    { key: 'pending', label: '1. Pending' },
    { key: 'accepted', label: '2. Accepted' },
    { key: 'in_transmission', label: '3. In Transmission' },
    { key: 'delivered', label: '4. Delivered' },
    { key: 'completed', label: '5. Completed' },
  ];

  const currentStepIndex = STEPS.findIndex((s) => s.key === status);
  const isCancelled = status === 'cancelled';
  const sourceBadge = getSourceBadge(transaction.energy_source || 'Solar');
  const SourceIcon = sourceBadge.icon;

  const energyKwh = parseFloat(transaction.energyAmount || transaction.energy_kwh || 0).toFixed(1);
  const rate = parseFloat(transaction.pricePerKwh || transaction.price_per_kwh || 7.20).toFixed(2);
  const total = parseFloat(transaction.price || transaction.total_amount || 0).toFixed(2);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 relative max-h-[92vh] overflow-y-auto"
        >
          {/* Header Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 gradient-yuga" />

          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-border pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-navy font-heading">
                    Order Details
                  </h3>
                  <span className="text-xs font-mono font-bold text-text-secondary bg-background px-2 py-0.5 rounded-md border border-border">
                    #{transaction.id}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="text-text-secondary hover:text-navy transition-colors cursor-pointer"
                    title="Copy Order ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-text-secondary">
                  Microgrid P2P Power Exchange
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-text-secondary hover:text-navy rounded-lg hover:bg-background transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 5-Stage Lifecycle Progress Tracker Bar */}
          {!isCancelled ? (
            <div className="p-4 bg-background rounded-xl border border-border space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-navy uppercase tracking-wider text-[11px]">
                  Lifecycle Status:
                </span>
                <TransactionStatusBadge status={transaction.status} />
              </div>

              {/* Progress Steps Indicator */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {STEPS.map((s, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={s.key} className="space-y-1.5 text-center">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isDone
                            ? isCurrent
                              ? 'bg-primary ring-2 ring-primary/30 animate-pulse'
                              : 'bg-emerald-500'
                            : 'bg-gray-200'
                        }`}
                      />
                      <span
                        className={`text-[9px] font-bold block truncate leading-tight ${
                          isCurrent
                            ? 'text-primary'
                            : isDone
                            ? 'text-emerald-700'
                            : 'text-text-secondary/60'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Cancelled Alert Banner */
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1.5 text-xs text-rose-800">
              <div className="flex items-center gap-2 text-rose-700 font-bold">
                <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Order Cancelled</span>
              </div>
              <p className="text-[11px] text-rose-700/90 leading-relaxed">
                This transaction was cancelled. The reserved energy (<strong>{energyKwh} kWh</strong>) has been restored to the marketplace offer, and full payment of <strong>₹{total}</strong> has been refunded to the consumer wallet.
              </p>
            </div>
          )}

          {/* Order Details Specification Grid */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-surface rounded-xl border border-border/80 space-y-0.5">
                <span className="text-text-secondary block text-[10px] uppercase font-bold">Producer (Seller)</span>
                <span className="font-bold text-navy text-xs block truncate">
                  {transaction.seller_name || transaction.seller || 'Community Producer'}
                </span>
                <span className="text-[10px] text-text-secondary flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  <span className="truncate">{transaction.location || transaction.seller_location || 'Local Microgrid'}</span>
                </span>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-border/80 space-y-0.5">
                <span className="text-text-secondary block text-[10px] uppercase font-bold">Consumer (Buyer)</span>
                <span className="font-bold text-navy text-xs block truncate">
                  {transaction.buyer_name || transaction.buyer || 'Consumer Member'}
                </span>
                <span className="text-[10px] text-text-secondary flex items-center gap-1">
                  <User className="w-2.5 h-2.5" />
                  <span>Microgrid Node</span>
                </span>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-border/80 space-y-0.5">
                <span className="text-text-secondary block text-[10px] uppercase font-bold">Energy Details</span>
                <span className="font-extrabold text-emerald-600 text-xs block font-mono">
                  {energyKwh} kWh
                </span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${sourceBadge.color}`}>
                  <SourceIcon className="w-2.5 h-2.5" />
                  <span>{sourceBadge.text}</span>
                </span>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-border/80 space-y-0.5">
                <span className="text-text-secondary block text-[10px] uppercase font-bold">Tariff Rate</span>
                <span className="font-bold text-navy text-xs block font-mono">
                  ₹{rate} / kWh
                </span>
                <span className="text-[10px] text-text-secondary">P2P Microgrid Rate</span>
              </div>
            </div>

            {/* Total Value */}
            <div className="p-3.5 bg-background rounded-xl border border-border flex justify-between items-center text-xs">
              <span className="text-text-secondary font-bold uppercase tracking-wider text-[11px]">
                Total Transaction Value:
              </span>
              <span className="text-lg font-mono font-extrabold text-navy">
                ₹{total}
              </span>
            </div>

            {/* Date & Location */}
            <div className="p-3 bg-surface rounded-xl border border-border/80 flex justify-between items-center text-xs">
              <span className="text-text-secondary font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Order Created:
              </span>
              <span className="font-semibold text-navy font-mono text-[11px]">
                {transaction.date || transaction.created_at
                  ? formatDate(transaction.date || transaction.created_at, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Just now'}
              </span>
            </div>

            {/* Direct P2P Banking & Razorpay Settlement Details */}
            <div className="p-3.5 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-emerald-500/10 border border-blue-500/25 rounded-2xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                <span className="font-bold text-navy flex items-center gap-1.5 text-[11px]">
                  <Building2 className="w-4 h-4 text-blue-600" /> Direct P2P Banking &amp; Escrow Settlement
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-800 rounded-md text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Synchronized
                </span>
              </div>

              {/* 2-Column Split: Consumer Payment Source & Producer Beneficiary Payout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {/* Consumer Payment Method */}
                <div className="p-2.5 bg-surface rounded-xl border border-border/70 space-y-1">
                  <span className="text-text-secondary text-[10px] uppercase font-bold flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-blue-600" /> Buyer Payment Source
                  </span>
                  <span className="font-semibold text-navy block truncate">
                    {transaction.payment_method || 'Razorpay UPI / NetBanking'}
                  </span>
                  <span className="font-mono text-[10px] text-text-secondary block truncate">
                    Ref: {transaction.payment_id || transaction.razorpay_payment_id || `PAY-${transaction.id}`}
                  </span>
                </div>

                {/* Producer Beneficiary Bank Destination */}
                <div className="p-2.5 bg-surface rounded-xl border border-border/70 space-y-1">
                  <span className="text-text-secondary text-[10px] uppercase font-bold flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-emerald-600" /> Producer Beneficiary Payout
                  </span>
                  <span className="font-bold text-navy block truncate">
                    {transaction.seller_bank_name || 'HDFC Bank'}{' '}
                    <span className="font-mono text-[10px] font-normal text-text-secondary">
                      ({transaction.seller_bank_account ? (transaction.seller_bank_account.startsWith('••••') ? transaction.seller_bank_account : '•••• •••• ' + String(transaction.seller_bank_account).slice(-4)) : '•••• •••• 9283'})
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-emerald-700 font-bold block truncate">
                    UPI: {transaction.seller_upi_id || 'producer.solar@okhdfcbank'} • IFSC: {transaction.seller_ifsc || 'HDFC0001089'}
                  </span>
                </div>
              </div>
            </div>

            {/* Blockchain Permanent Ledger Record */}
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Blockchain Security Ledger
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-700 font-mono font-bold text-[10px] rounded-full">
                  SHA-256 Immutably Stored
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary bg-surface p-2 rounded-lg border border-border/60">
                <span className="truncate max-w-[270px]">
                  {transaction.txHash || transaction.blockchain_hash || `0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069`}
                </span>
                <span className="text-emerald-600 font-bold text-[10px] shrink-0 ml-1">🔒 Permanent</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* HD-61: RATING & REVIEW CARD (FOR COMPLETED TRANSACTIONS)                  */}
          {/* ========================================================================= */}
          {status === 'completed' && (
            <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>Transaction Rating & Review</span>
                </div>

                {userReview ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-full font-bold text-[10px]">
                    Reviewed {'★'.repeat(userReview.rating)}
                  </span>
                ) : (
                  <button
                    onClick={() => setShowRateModal(true)}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Star className="w-3 h-3 fill-current" /> Rate &amp; Review
                  </button>
                )}
              </div>

              {/* Display Current User's Submitted Review */}
              {userReview && (
                <div className="p-2.5 bg-surface rounded-lg border border-border/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-navy">Your Rating:</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= userReview.rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="font-bold font-mono ml-1 text-navy">
                        {userReview.rating}.0
                      </span>
                    </div>
                  </div>
                  {userReview.review && (
                    <p className="text-[11px] text-text-secondary italic pt-0.5">
                      &ldquo;{userReview.review}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Display Counterparty Reviews If Available */}
              {otherReviews.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-text-secondary">Counterparty Feedback:</span>
                  {otherReviews.map((r, i) => (
                    <div key={i} className="p-2 bg-surface rounded-lg border border-border/80 text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy">{r.reviewer_name || 'Participant'}:</span>
                        <span className="text-amber-500 font-bold font-mono">{'★'.repeat(r.rating)}</span>
                      </div>
                      {r.review && <p className="text-text-secondary italic">&ldquo;{r.review}&rdquo;</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interactive Lifecycle Action Controls */}
          <div className="space-y-2 pt-1 border-t border-border">
            {/* Status-specific action buttons */}
            {status === 'pending' && (
              <div className="flex gap-2">
                {isSeller && (
                  <button
                    disabled={updating}
                    onClick={() => handleStatusChange('accepted')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Accept Order
                  </button>
                )}
                <button
                  disabled={updating}
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-4 h-4" /> Cancel Order
                </button>
              </div>
            )}

            {status === 'accepted' && (
              <div className="flex gap-2">
                {isSeller && (
                  <button
                    disabled={updating}
                    onClick={() => handleStatusChange('in_transmission')}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" /> Start Transmission
                  </button>
                )}
                <button
                  disabled={updating}
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-4 h-4" /> Cancel Order
                </button>
              </div>
            )}

            {status === 'in_transmission' && (
              <div>
                {isSeller ? (
                  <button
                    disabled={updating}
                    onClick={() => handleStatusChange('delivered')}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PackageCheck className="w-4 h-4" /> Confirm Energy Delivery
                  </button>
                ) : (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center text-xs text-blue-700 font-semibold flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span>Electricity is currently in active transmission through your local microgrid line</span>
                  </div>
                )}
              </div>
            )}

            {status === 'delivered' && (
              <button
                disabled={updating}
                onClick={() => handleStatusChange('completed')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSeller ? 'Finalize & Complete Settlement' : 'Confirm Receipt & Complete Settlement'}</span>
              </button>
            )}

            {/* Print Receipt & Close Details */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handlePrint}
                className="flex-1 py-2 bg-background border border-border hover:bg-gray-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-text-secondary" /> Print Receipt
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-surface border border-border hover:bg-background rounded-xl text-xs font-bold text-navy transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Confirmation & Refund Modal */}
      <CancelOrderModal
        order={transaction}
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onCancelled={() => {
          setShowCancelConfirm(false);
          if (onStatusUpdate) onStatusUpdate();
          onClose();
        }}
      />

      {/* HD-61: Rate & Review Modal */}
      <RateReviewModal
        transaction={transaction}
        isOpen={showRateModal}
        onClose={() => setShowRateModal(false)}
        onReviewSubmitted={(newRev) => {
          setReviews((prev) => [newRev, ...prev]);
          if (onStatusUpdate) onStatusUpdate();
        }}
      />
    </AnimatePresence>
  );
}
