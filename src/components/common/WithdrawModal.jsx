import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Smartphone,
  ArrowDownLeft,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  X,
  Wallet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { withdrawProducerFunds } from '../../services/walletService';

export default function WithdrawModal({ isOpen, onClose, availableBalance = 0, userId = 'guest', onWithdrawSuccess }) {
  const [method, setMethod] = useState('upi'); // 'upi' | 'bank'
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount || 0);

  const handleQuickAmount = (pct) => {
    const val = (availableBalance * pct).toFixed(2);
    setAmount(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid withdrawal amount.');
      return;
    }
    if (numAmount > availableBalance) {
      toast.error(`Amount exceeds available wallet balance of ₹${availableBalance.toFixed(2)}.`);
      return;
    }
    if (method === 'upi' && (!upiId.trim() || !upiId.includes('@'))) {
      toast.error('Please enter a valid UPI ID (e.g. producer@okhdfcbank).');
      return;
    }
    if (method === 'bank' && (!accountNumber.trim() || !ifsc.trim())) {
      toast.error('Please provide Account Number and IFSC Code.');
      return;
    }

    setLoading(true);
    try {
      const res = await withdrawProducerFunds(userId, {
        amount: numAmount,
        method,
        upiId: upiId.trim(),
        accountNumber: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        bankName,
        accountHolder: accountHolder.trim() || 'Solar Energy Producer',
      });

      toast.success(
        `🎉 Withdrawal of ₹${numAmount.toFixed(2)} initiated successfully to ${
          method === 'upi' ? upiId : bankName
        }!`
      );
      if (onWithdrawSuccess) onWithdrawSuccess(res);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-surface border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative"
        >
          {/* Header */}
          <div className="gradient-dashboard-header p-5 text-white relative">
            <button
              onClick={onClose}
              disabled={loading}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-lime-400/20 text-lime-300 text-[10px] font-extrabold uppercase border border-lime-400/30 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-lime-300" /> Instant Bank Settlement
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-white font-heading">
              Withdraw Clean Energy Revenue
            </h3>
            <p className="text-xs text-emerald-100/80">
              Transfer solar sale proceeds directly to your Bank Account or UPI
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
            {/* Balance Overview Banner */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                  Available Wallet Balance
                </span>
                <span className="text-2xl font-extrabold text-emerald-900 font-mono">
                  ₹{availableBalance.toFixed(2)}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 bg-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                100% Withdrawable
              </span>
            </div>

            {/* Amount Input & Quick Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-navy uppercase tracking-wider block">
                Withdrawal Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-text-secondary">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={availableBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 rounded-2xl border border-border bg-background text-base font-mono font-bold text-navy focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Quick Percentage Chips */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickAmount(0.25)}
                  className="px-3 py-1 bg-background hover:bg-surface border border-border rounded-xl text-[11px] font-semibold text-text-secondary"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(0.5)}
                  className="px-3 py-1 bg-background hover:bg-surface border border-border rounded-xl text-[11px] font-semibold text-text-secondary"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(1.0)}
                  className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-[11px] font-bold text-emerald-700"
                >
                  All (100%)
                </button>
              </div>
            </div>

            {/* Payout Method Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-navy uppercase tracking-wider block">
                Select Payout Destination
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('upi')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                    method === 'upi'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 font-bold shadow-sm'
                      : 'border-border bg-background hover:bg-surface text-text-secondary'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="block text-xs">Instant UPI</span>
                    <span className="text-[10px] font-normal text-text-secondary">0s Payout</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('bank')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                    method === 'bank'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 font-bold shadow-sm'
                      : 'border-border bg-background hover:bg-surface text-text-secondary'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="block text-xs">Bank Transfer</span>
                    <span className="text-[10px] font-normal text-text-secondary">IMPS / NEFT</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Payout Details Input */}
            {method === 'upi' ? (
              <div className="space-y-1.5">
                <label className="text-[11px] text-text-secondary block">UPI ID / VPA</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. producer@okhdfcbank or 9876543210@paytm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono text-navy focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-text-secondary block mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="As in Bank Passbook"
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-navy focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-text-secondary block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Account No."
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-mono text-navy focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-secondary block mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value)}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-mono uppercase text-navy focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Settlement Guarantee notice */}
            <div className="p-3 bg-background border border-border/80 rounded-2xl flex items-center gap-2 text-[11px] text-text-secondary">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Funds are disbursed instantly via RBI NPCI payment switch. Audit record registered on blockchain.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || availableBalance <= 0}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-2xl text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Withdrawal...
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-4 h-4" />
                  Confirm Withdrawal of ₹{(numAmount || 0).toFixed(2)}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
