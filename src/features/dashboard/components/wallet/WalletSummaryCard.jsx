import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, ArrowDownLeft, Clock, ArrowUpRight, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardContent } from '../../../../components/common/Card';
import AnimatedCounter from '../../../../components/common/AnimatedCounter/AnimatedCounter';
import { fetchWalletSummary } from '../../../../services/walletService';
import WithdrawModal from '../../../../components/common/WithdrawModal';
import { useAuth } from '../../../../context/AuthContext';

export default function WalletSummaryCard({ onSettled }) {
  const { user, userProfile } = useAuth();
  const isConsumer = !userProfile?.role || userProfile?.role === 'consumer';
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWalletSummary(user?.uid || 'guest');
      setWallet(data);
    } catch {
      toast.error('Failed to load wallet summary');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const handleSettlement = () => {
    if (!wallet || wallet.balance <= 0) {
      toast.error('No balance available for settlement');
      return;
    }
    setWithdrawOpen(true);
  };

  const curr = wallet?.currency || '₹';

  return (
    <Card className="overflow-hidden border-border shadow-card bg-surface relative">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <CardContent className="p-6 space-y-6">
        {/* Header Title & Growth Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl gradient-yuga text-white shadow-md">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                {isConsumer ? 'Consumer Energy Wallet' : 'Wallet & Earnings Overview'}
              </h2>
              <p className="text-xs text-text-secondary">
                {isConsumer
                  ? 'Track your P2P solar energy purchase payments and energy credits'
                  : 'Real-time clean energy sales payouts & microgrid settlement balance'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadWallet}
              disabled={loading}
              className="p-2 text-text-secondary hover:text-primary rounded-xl border border-border bg-background hover:bg-surface transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Primary Wallet Balance Banner Card with Glassmorphism & Animated Glow */}
        <div className="gradient-dashboard-header p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-white/20">
          {/* Ambient organic energy blobs */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-blob pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-emerald-300/20 rounded-full blur-2xl animate-float-delayed pointer-events-none" />

          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-lime-300 text-xs font-bold uppercase tracking-wider border border-white/20 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-lime-300" /> Current Wallet Balance
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm">
              <AnimatedCounter value={wallet?.balance || 0} prefix={curr} decimals={2} />
            </div>
            <p className="text-xs text-emerald-100/90 font-medium">Available balance for P2P solar purchases and instant bank settlements.</p>
          </div>

          <div className="flex items-center gap-3 z-10">
            <button
              onClick={handleSettlement}
              disabled={loading || (wallet?.balance || 0) <= 0}
              className="px-5 py-3 bg-lime-400 hover:bg-lime-300 text-navy font-extrabold rounded-2xl text-xs transition-all shadow-[0_4px_14px_rgba(163,230,53,0.4)] hover:shadow-[0_6px_20px_rgba(163,230,53,0.6)] flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-900" /> Settle to Bank / UPI
            </button>
            <button
              onClick={() => toast.success('Instant Deposit: Add funds via UPI, NetBanking or Card.')}
              className="px-4 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-xl text-white font-bold rounded-2xl text-xs transition-all border border-white/30 flex items-center gap-2 shadow-sm active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4 text-lime-300" /> Add Money
            </button>
          </div>
        </div>

        {/* KPI Grid with Neumorphic / Glassmorphic Depth */}
        {isConsumer ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4.5 bg-slate-50/90 backdrop-blur-md rounded-2xl border border-white shadow-[4px_4px_12px_rgba(203,213,225,0.5),-4px_-4px_12px_rgba(255,255,255,0.9)] space-y-1 hover:border-emerald-500/30 transition-all">
              <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider block">Total P2P Purchases Spent</span>
              <div className="text-xl font-extrabold text-emerald-600 font-mono">
                ₹{(wallet?.todayEarnings || 0).toFixed(2)}
              </div>
              <span className="text-[10px] text-text-secondary font-medium">Community solar energy bought</span>
            </div>

            <div className="p-4.5 bg-slate-50/90 backdrop-blur-md rounded-2xl border border-white shadow-[4px_4px_12px_rgba(203,213,225,0.5),-4px_-4px_12px_rgba(255,255,255,0.9)] space-y-1 hover:border-emerald-500/30 transition-all">
              <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider block">Average Rate Paid</span>
              <div className="text-xl font-extrabold text-navy font-mono">
                ₹7.20 / kWh
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">YUGA Community Solar Tariff</span>
            </div>

            <div className="p-4.5 bg-slate-50/90 backdrop-blur-md rounded-2xl border border-white shadow-[4px_4px_12px_rgba(203,213,225,0.5),-4px_-4px_12px_rgba(255,255,255,0.9)] space-y-1 hover:border-emerald-500/30 transition-all">
              <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider block">Total Energy Purchased</span>
              <div className="text-xl font-extrabold text-text-primary font-mono">
                25.0 kWh
              </div>
              <span className="text-[10px] text-text-secondary font-medium">Verified via Smart Meter</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4.5 bg-slate-50/90 backdrop-blur-md rounded-2xl border border-white shadow-[4px_4px_12px_rgba(203,213,225,0.5),-4px_-4px_12px_rgba(255,255,255,0.9)] space-y-1 hover:border-emerald-500/30 transition-all">
              <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider block">Today&apos;s Earnings</span>
              <div className="text-xl font-extrabold text-emerald-600 font-mono">
                <AnimatedCounter value={wallet?.todayEarnings || 0} prefix={curr} decimals={2} />
              </div>
              <span className="text-[10px] text-text-secondary font-medium">From solar feed-in trades</span>
            </div>

            <div className="p-4.5 bg-slate-50/90 backdrop-blur-md rounded-2xl border border-white shadow-[4px_4px_12px_rgba(203,213,225,0.5),-4px_-4px_12px_rgba(255,255,255,0.9)] space-y-1 hover:border-emerald-500/30 transition-all">
              <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider block">Monthly Earnings</span>
              <div className="text-xl font-extrabold text-navy font-mono">
                <AnimatedCounter value={wallet?.monthlyEarnings || 0} prefix={curr} decimals={2} />
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">+12% vs last month</span>
            </div>

            <div className="p-4.5 bg-slate-50/90 backdrop-blur-md rounded-2xl border border-white shadow-[4px_4px_12px_rgba(203,213,225,0.5),-4px_-4px_12px_rgba(255,255,255,0.9)] space-y-1 hover:border-emerald-500/30 transition-all">
              <span className="text-text-secondary text-[11px] font-bold uppercase tracking-wider block">Lifetime Earnings</span>
              <div className="text-xl font-extrabold text-text-primary font-mono">
                <AnimatedCounter value={wallet?.lifetimeEarnings || 0} prefix={curr} decimals={2} />
              </div>
              <span className="text-[10px] text-text-secondary font-medium">Total microgrid yield</span>
            </div>

            <div className="p-4.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-1 backdrop-blur-md shadow-[4px_4px_12px_rgba(245,158,11,0.08)]">
              <div className="flex justify-between items-center text-amber-700">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Pending Settlement</span>
                <Clock className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="text-xl font-extrabold text-amber-600 font-mono">
                <AnimatedCounter value={wallet?.pendingSettlement || 0} prefix={curr} decimals={2} />
              </div>
              <span className="text-[10px] text-amber-700 font-medium">Clears within 24 hours</span>
            </div>
          </div>
        )}

        {/* Producer Bank / UPI Withdrawal Modal */}
        <WithdrawModal
          isOpen={withdrawOpen}
          onClose={() => setWithdrawOpen(false)}
          availableBalance={wallet?.balance || 0}
          userId={user?.uid || 'guest'}
          onWithdrawSuccess={() => {
            loadWallet();
            if (onSettled) onSettled();
          }}
        />
      </CardContent>
    </Card>
  );
}
