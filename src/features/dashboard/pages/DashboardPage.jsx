import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Zap,
  Building2,
  ShieldCheck,
  Lock,
  ShoppingBag,
  Wallet,
  Leaf,
  LayoutDashboard,
  HardDrive,
  RefreshCw,
  Gauge,
  Wifi,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { USER_ROLES } from '../../../utils/constants';
import ProducerDashboard from '../components/ProducerDashboard';
import ConsumerDashboard from '../components/ConsumerDashboard';
import BusinessDashboard from '../components/BusinessDashboard';
import MarketplaceActivityCard from '../components/marketplace/MarketplaceActivityCard';
import WalletSummaryCard from '../components/wallet/WalletSummaryCard';
import PaymentHistoryTable from '../components/wallet/PaymentHistoryTable';
import CarbonImpactCard from '../components/carbon/CarbonImpactCard';
import SimulationBadge from '../../devices/components/SimulationBadge';
import { fetchEnergyDevices } from '../../../services/deviceService';
import { triggerSynchronization } from '../../../services/syncEngineService';
import { formatDate } from '../../../utils/helpers';

export default function DashboardPage({ forcedRole }) {
  const { user, userProfile } = useAuth();
  const activeRole = forcedRole || userProfile?.role || USER_ROLES.CONSUMER;
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [devices, setDevices] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toISOString());

  const loadDevices = useCallback(async () => {
    try {
      const data = await fetchEnergyDevices(user?.uid || 'guest');
      setDevices(data);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleManualSync = async () => {
    setSyncing(true);
    const res = await triggerSynchronization(user?.uid || 'guest');
    setSyncing(false);
    if (res.success) {
      setLastSyncTime(res.timestamp);
      toast.success(`Telemetry synchronized! (${res.recordsCount} records)`);
      loadDevices();
    } else {
      toast.error('Sync failed');
    }
  };

  const connectedCount = devices.filter((d) => d.status === 'Connected').length;
  const simulationCount = devices.filter((d) => d.status === 'Simulation Mode' || d.connectionMode === 'Manual Simulation').length;

  const roleMeta = {
    [USER_ROLES.CONSUMER]: {
      label: 'Consumer Portal',
      icon: Home,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      badge: 'Household & Community Member',
    },
    [USER_ROLES.PRODUCER]: {
      label: 'Producer Hub',
      icon: Zap,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      badge: 'Solar & Wind Generation Asset Owner',
    },
    [USER_ROLES.BUSINESS]: {
      label: 'Business Enterprise',
      icon: Building2,
      color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
      badge: 'Multi-Site Corporate ESG Director',
    },
  };

  const currentMeta = roleMeta[activeRole] || roleMeta[USER_ROLES.CONSUMER];
  const RoleIcon = currentMeta.icon;

  const DASHBOARD_TABS = [
    { id: 'overview', label: 'Role Overview', icon: LayoutDashboard },
    { id: 'marketplace', label: 'Marketplace Activity', icon: ShoppingBag },
    { id: 'wallet', label: 'Wallet & Earnings', icon: Wallet },
    { id: 'carbon', label: 'Carbon Impact', icon: Leaf },
  ];

  return (
    <div className="space-y-6">
      {/* Verified Role Access Banner & Module Sub-Tabs */}
      <div className="p-4 bg-surface rounded-2xl border border-border flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${currentMeta.color}`}>
            <RoleIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-navy uppercase tracking-wider">{currentMeta.label}</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-extrabold rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> VERIFIED ROLE
              </span>
            </div>
            <p className="text-xs text-text-secondary">{currentMeta.badge}</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-background rounded-xl border border-border w-full md:w-auto overflow-x-auto">
          {DASHBOARD_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isSelected
                    ? 'gradient-yuga text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden xl:flex items-center gap-2 text-xs font-semibold text-text-secondary bg-background px-3 py-1.5 rounded-xl border border-border">
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span>Strict Security</span>
        </div>
      </div>

      {/* Verified Role Access Banner & Module Sub-Tabs */}

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + activeRole}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-8"
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Role-Specific Dashboard Hub */}
              {activeRole === USER_ROLES.PRODUCER || activeRole === 'prosumer' ? (
                <ProducerDashboard userProfile={userProfile} />
              ) : activeRole === USER_ROLES.BUSINESS ? (
                <BusinessDashboard userProfile={userProfile} />
              ) : (
                <ConsumerDashboard userProfile={userProfile} />
              )}
            </div>
          )}

          {activeTab === 'marketplace' && <MarketplaceActivityCard />}

          {activeTab === 'wallet' && (
            <div className="space-y-6">
              <WalletSummaryCard onSettled={() => setRefreshTrigger((prev) => prev + 1)} />
              <PaymentHistoryTable refreshTrigger={refreshTrigger} />
            </div>
          )}

          {activeTab === 'carbon' && <CarbonImpactCard />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
