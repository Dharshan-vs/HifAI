import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';
import BuyEnergy from '../components/BuyEnergy';
import SellEnergy from '../components/SellEnergy';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import TransactionTable from '../../dashboard/components/marketplace/TransactionTable';
import { fetchUserTransactions } from '../../../services/marketplaceService';
import { useAuth } from '../../../context/AuthContext';
import { USER_ROLES, ROUTES } from '../../../utils/constants';

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || USER_ROLES.CONSUMER;
  const isProducer = userRole === USER_ROLES.PRODUCER;
  const isProducerOrProsumer = isProducer || userRole === 'prosumer' || userRole === USER_ROLES.BUSINESS;

  const [activeTab, setActiveTab] = useState(isProducer ? 'sell' : 'buy');
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [errorTx, setErrorTx] = useState(null);

  const loadTransactions = async () => {
    setLoadingTx(true);
    setErrorTx(null);
    try {
      const data = await fetchUserTransactions(user?.uid || 'guest');
      setTransactions(data || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setErrorTx(err.message || 'Unable to load marketplace history.');
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadTransactions();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-[var(--radius-card)] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 border border-white/20 shadow-xs">
            <ShoppingBag className="w-3.5 h-3.5 text-lime-300" /> HIFAI P2P ENERGY MARKETPLACE
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">Solar Energy Marketplace</h1>
          <p className="text-emerald-100/90 text-xs sm:text-sm max-w-xl">
            {isProducer
              ? 'List excess solar generation for sale. Energy revenues are credited directly to your wallet.'
              : 'Buy clean solar power directly from local solar producers and prosumers in your microgrid.'}
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-surface rounded-2xl border border-border w-full sm:w-auto self-start shadow-xs">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'buy'
              ? 'gradient-yuga text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-background'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" /> {isProducer ? 'Browse Marketplace Offers' : 'Buy Energy'}
        </button>

        {isProducerOrProsumer && (
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'sell'
                ? 'gradient-yuga text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-background'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Sell Energy
          </button>
        )}

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'history'
              ? 'gradient-yuga text-white shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-background'
          }`}
        >
          <History className="w-4 h-4" /> Transaction History & Orders
        </button>
      </div>

      {/* Tab Contents */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'buy' && (
          <BuyEnergy onPurchaseSuccess={() => {}} />
        )}

        {activeTab === 'sell' && isProducerOrProsumer && (
          <SellEnergy onOfferCreated={() => setActiveTab('buy')} />
        )}

        {activeTab === 'history' && (
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle>My P2P Energy Orders & Transactions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <TransactionTable
                transactions={transactions}
                loading={loadingTx}
                error={errorTx}
                onRefresh={loadTransactions}
              />
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
