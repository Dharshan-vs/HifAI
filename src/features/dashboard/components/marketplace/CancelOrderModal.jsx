import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  Ban,
  ArrowRight,
  CheckCircle2,
  Wallet,
  Zap,
  RotateCcw,
  Sun,
  Wind,
  Droplets,
  Leaf,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { cancelTransaction } from '../../../../services/marketplaceService';

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

const CANCELLATION_REASONS = [
  'User no longer needs energy',
  'Unable to fulfill energy request',
  'Technical / microgrid connection issue',
  'Rate or pricing discrepancy',
  'Placed order by mistake',
  'Other',
];

export default function CancelOrderModal({
  order,
  isOpen,
  onClose,
  onCancelled,
}) {
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [customNotes, setCustomNotes] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancellationResult, setCancellationResult] = useState(null);

  if (!isOpen || !order) return null;

  const energyKwh = parseFloat(order.energyAmount || order.energy_kwh || 0).toFixed(1);
  const totalAmount = parseFloat(order.price || order.total_amount || 0).toFixed(2);
  const rate = parseFloat(order.pricePerKwh || order.price_per_kwh || 7.20).toFixed(2);
  const sourceBadge = getSourceBadge(order.energy_source || 'Solar');
  const SourceIcon = sourceBadge.icon;

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (cancelling) return;

    setCancelling(true);
    const fullReason = selectedReason === 'Other' && customNotes.trim()
      ? `Other: ${customNotes.trim()}`
      : selectedReason;

    try {
      const res = await cancelTransaction(order.id, fullReason);
      const refundAmount = res?.refund_amount !== undefined ? res.refund_amount.toFixed(2) : totalAmount;
      const restoredKwh = res?.restored_kwh !== undefined ? res.restored_kwh.toFixed(1) : energyKwh;

      setCancellationResult({
        refundAmount,
        restoredKwh,
        orderId: order.id,
      });

      toast.success(`Order #${order.id} cancelled. ₹${refundAmount} refunded to wallet.`);
      if (onCancelled) onCancelled(res);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel energy order');
    } finally {
      setCancelling(false);
    }
  };

  const handleFinishAndClose = () => {
    setCancellationResult(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative overflow-hidden"
        >
          {/* Top Red Accent Header */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />

          {!cancellationResult ? (
            /* ========================================================================= */
            /* STEP 1: CANCELLATION CONFIRMATION VIEW                                    */
            /* ========================================================================= */
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy font-heading">
                      Cancel Energy Order?
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Review order details and confirm cancellation refund
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-text-secondary hover:text-navy rounded-xl hover:bg-background transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Warning Notice Card */}
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1 text-xs text-rose-800">
                <p className="font-bold flex items-center gap-1.5 text-rose-700">
                  <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                  Order Cancellation & Wallet Reversal
                </p>
                <p className="text-[11px] text-rose-700/90 leading-relaxed">
                  Cancelling this order will immediately restore <strong>{energyKwh} kWh</strong> back to the producer&apos;s available marketplace listing and refund <strong>₹{totalAmount}</strong> back to your wallet.
                </p>
              </div>

              {/* Order Summary Breakdown */}
              <div className="p-4 bg-background rounded-xl border border-border space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border/80">
                  <span className="text-text-secondary font-medium">Order ID:</span>
                  <span className="font-mono font-extrabold text-navy text-xs">#{order.id}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-text-secondary font-medium">Counterparty:</span>
                  <span className="font-bold text-navy">
                    {order.seller || order.seller_name || order.buyer || order.buyer_name || 'Community Member'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-text-secondary font-medium">Energy Reserved:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold font-mono text-navy">{energyKwh} kWh</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${sourceBadge.color}`}>
                      <SourceIcon className="w-2.5 h-2.5" />
                      <span>{sourceBadge.text}</span>
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-text-secondary font-medium">Tariff Rate:</span>
                  <span className="font-mono text-navy font-semibold">₹{rate} / kWh</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/80">
                  <span className="text-text-secondary font-bold text-[11px] uppercase tracking-wider">
                    Full Refund Amount:
                  </span>
                  <span className="text-lg font-mono font-extrabold text-emerald-600">
                    ₹{totalAmount}
                  </span>
                </div>
              </div>

              {/* Cancellation Reason Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy block">
                  Cancellation Reason (Optional):
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-navy focus:outline-none focus:border-primary cursor-pointer transition-colors"
                >
                  {CANCELLATION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {selectedReason === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter specific reason for cancellation..."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-navy placeholder:text-text-secondary/70 focus:outline-none focus:border-primary mt-1.5 transition-all"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={cancelling}
                  className="flex-1 py-2.5 bg-background hover:bg-gray-100 border border-border rounded-xl text-xs font-bold text-navy transition-all cursor-pointer"
                >
                  Keep Order
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {cancelling ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                  <span>{cancelling ? 'Cancelling...' : 'Cancel Order'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* STEP 2: CANCELLATION SUCCESS FEEDBACK VIEW                                */
            /* ========================================================================= */
            <div className="space-y-5 text-center pt-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-navy font-heading">
                  Order Cancelled
                </h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                  Energy order <strong>#{cancellationResult.orderId}</strong> has been cancelled successfully.
                </p>
              </div>

              {/* Refund and Restoration Summary Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs text-left">
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                    <Wallet className="w-3.5 h-3.5" /> Wallet Refunded
                  </div>
                  <div className="text-lg font-extrabold font-mono text-emerald-700">
                    ₹{cancellationResult.refundAmount}
                  </div>
                  <span className="text-[10px] text-emerald-600/90 block">
                    Credited to your wallet
                  </span>
                </div>

                <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-700 font-bold text-[11px]">
                    <RotateCcw className="w-3.5 h-3.5" /> Energy Restored
                  </div>
                  <div className="text-lg font-extrabold font-mono text-cyan-700">
                    {cancellationResult.restoredKwh} kWh
                  </div>
                  <span className="text-[10px] text-cyan-600/90 block">
                    Returned to microgrid
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinishAndClose}
                  className="w-full py-2.5 gradient-yuga text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View Order History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
