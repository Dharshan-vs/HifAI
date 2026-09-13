import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../../../components/common/Card';
import TransactionTable from './TransactionTable';
import { fetchMarketplaceTransactions } from '../../../../services/marketplaceService';
import { useAuth } from '../../../../context/AuthContext';

export default function MarketplaceActivityCard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMarketplaceTransactions(user?.uid || 'guest');
      setTransactions(data);
    } catch {
      toast.error('Failed to load marketplace activity');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { userProfile } = useAuth();
  const isConsumer = !userProfile?.role || userProfile?.role === 'consumer';
  const totalPurchases = transactions.filter((t) => t.type === 'purchase' || isConsumer).length;
  const totalSales = transactions.filter((t) => t.type === 'sale').length;
  const totalVolumeKwh = transactions.reduce((acc, t) => acc + (t.energyAmount || 0), 0).toFixed(1);

  return (
    <Card className="overflow-hidden border-border shadow-card">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Recent Marketplace Activity</CardTitle>
            <p className="text-xs text-text-secondary mt-0.5">
              Peer-to-peer clean energy purchases and feed-in settlements
            </p>
          </div>
        </div>

        {/* Quick Summary Pill Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-500/20">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>{totalPurchases} Purchases</span>
          </div>
          {!isConsumer && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-xl text-xs font-bold border border-amber-500/20">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{totalSales} Sales</span>
            </div>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-text-secondary hover:text-primary rounded-xl border border-border bg-background hover:bg-surface transition-colors disabled:opacity-40"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Metric Bar */}
        <div className="p-3.5 bg-background/70 rounded-xl border border-border flex items-center justify-between text-xs">
          <span className="text-text-secondary font-medium">Total P2P Volume Exchanged</span>
          <span className="font-mono font-extrabold text-navy text-sm">{totalVolumeKwh} kWh</span>
        </div>

        {/* Transaction Table Component */}
        <TransactionTable transactions={transactions} loading={loading} />
      </CardContent>
    </Card>
  );
}
