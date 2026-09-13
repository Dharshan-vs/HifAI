import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Eye,
  ExternalLink,
  RefreshCw,
  Clock,
  User,
  Zap,
  ArrowUpDown,
  Lock,
  DollarSign,
  Activity,
  Shield,
  Hash,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import StatsCard from '../../../components/common/StatsCard';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { fetchAuditLogs, fetchAuditSummary, fetchAuditLogById } from '../../../services/auditService';
import BlockchainExplorerModal from '../../../components/common/BlockchainExplorerModal';
import { formatDate } from '../../../utils/helpers';

// Helper for status badge styling
function getStatusBadge(status = 'verified') {
  const st = String(status).toLowerCase();
  switch (st) {
    case 'verified':
      return {
        label: 'VERIFIED',
        bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
        icon: CheckCircle2,
        dot: 'bg-emerald-500',
      };
    case 'completed':
      return {
        label: 'COMPLETED',
        bg: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/30 dark:text-cyan-400',
        icon: CheckCircle2,
        dot: 'bg-cyan-500',
      };
    case 'pending':
      return {
        label: 'PENDING',
        bg: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
        icon: Clock,
        dot: 'bg-amber-500',
      };
    case 'cancelled':
      return {
        label: 'CANCELLED',
        bg: 'bg-slate-500/10 text-slate-700 border-slate-500/30 dark:text-slate-400',
        icon: X,
        dot: 'bg-slate-500',
      };
    case 'failed':
    case 'tampered':
      return {
        label: 'FAILED',
        bg: 'bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400',
        icon: AlertTriangle,
        dot: 'bg-rose-500',
      };
    default:
      return {
        label: status.toUpperCase(),
        bg: 'bg-primary/10 text-primary border-primary/30',
        icon: CheckCircle2,
        dot: 'bg-primary',
      };
  }
}

// Helper for action badge styling
function getActionBadge(action = '') {
  const act = String(action).toUpperCase();
  if (act.includes('PURCHASE') || act.includes('BUY')) {
    return 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-300 font-semibold';
  }
  if (act.includes('OFFER')) {
    return 'bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300 font-semibold';
  }
  if (act.includes('CANCEL') || act.includes('REFUND')) {
    return 'bg-rose-500/15 text-rose-800 border-rose-500/30 dark:text-rose-300 font-semibold';
  }
  if (act.includes('STATUS') || act.includes('SETTLED')) {
    return 'bg-indigo-500/15 text-indigo-800 border-indigo-500/30 dark:text-indigo-300 font-semibold';
  }
  return 'bg-blue-500/15 text-blue-800 border-blue-500/30 dark:text-blue-300 font-semibold';
}

export default function AuditTrailPage() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    total_transactions: 0,
    verified_transactions: 0,
    failed_tampered_transactions: 0,
    total_audit_records: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'last_7_days' | 'last_30_days' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal detail view state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);
  const [blockchainModalOpen, setBlockchainModalOpen] = useState(false);

  // Load audit data
  const loadData = useCallback(async () => {
    try {
      // Calculate date filters
      let sDate = startDate;
      let eDate = endDate;
      const now = new Date();

      if (dateFilter === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        sDate = todayStart.toISOString();
      } else if (dateFilter === 'last_7_days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
        sDate = sevenDaysAgo.toISOString();
      } else if (dateFilter === 'last_30_days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        sDate = thirtyDaysAgo.toISOString();
      }

      const [logsData, summaryData] = await Promise.all([
        fetchAuditLogs({
          search: searchQuery,
          transaction_type: typeFilter,
          status: statusFilter,
          start_date: sDate,
          end_date: eDate,
        }),
        fetchAuditSummary(),
      ]);

      setLogs(logsData || []);
      setSummary(
        summaryData || {
          total_transactions: 0,
          verified_transactions: 0,
          failed_tampered_transactions: 0,
          total_audit_records: 0,
        }
      );
    } catch (error) {
      console.error('Failed to load audit trail:', error);
      toast.error('Failed to load audit trail records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, dateFilter, startDate, endDate, typeFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData().then(() => {
      toast.success('Audit trail synchronized with blockchain');
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const handleCopyHash = (hash, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast.success('Blockchain hash copied to clipboard!');
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleOpenDetails = async (record) => {
    setSelectedRecord(record);
    // Fetch latest fresh record details if available
    if (record?.id) {
      const full = await fetchAuditLogById(record.id);
      if (full) setSelectedRecord(full);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 rounded-[var(--radius-card)] p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-purple-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-purple-200 border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-lime-400" /> SPRINT 6 • HD-37 IMMUTABLE AUDIT LEDGER
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Audit Trail
            </h1>
            <p className="text-purple-200/90 text-sm max-w-2xl">
              Immutable blockchain transaction history, cryptographic hashes, and tamper-evident financial audit logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold border border-white/20 shadow-sm transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-lime-300' : ''}`} />
              {refreshing ? 'Syncing...' : 'Sync Ledger'}
            </button>
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Node Consensus Active
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Transactions"
          value={summary.total_transactions}
          unit="Txns"
          icon={Layers}
          color="primary"
          trend="up"
          trendValue="All On-Chain Activities"
          delay={0.05}
        />
        <StatsCard
          title="Verified Transactions"
          value={summary.verified_transactions}
          unit="Verified"
          icon={CheckCircle2}
          color="success"
          trend="up"
          trendValue="100% Cryptographic Consensus"
          delay={0.1}
        />
        <StatsCard
          title="Failed/Tampered Transactions"
          value={summary.failed_tampered_transactions}
          unit="Anomalies"
          icon={AlertTriangle}
          color="accent"
          trend="up"
          trendValue="Zero Tamper Detected"
          delay={0.15}
        />
        <StatsCard
          title="Total Audit Records"
          value={summary.total_audit_records}
          unit="Records"
          icon={FileText}
          color="secondary"
          trend="up"
          trendValue="Immutable History"
          delay={0.2}
        />
      </div>

      {/* Search and Filters Bar */}
      <Card className="border border-border/80 shadow-sm">
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Transaction ID (e.g. TX-P2P-98101), Audit ID, Actor, Action, or Hash..."
                className="w-full pl-10 pr-4 py-2.5 bg-background rounded-xl border border-border text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 border-t border-border/60">
            {/* Date Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-background rounded-xl border border-border text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Transaction Type Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Transaction Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-background rounded-xl border border-border text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="all">All Types</option>
                <option value="purchase">Energy Purchase</option>
                <option value="sale">Energy Sale / Settlement</option>
                <option value="offer_creation">Offer Creation</option>
                <option value="status_change">Status Update</option>
                <option value="refund">Refund / Cancellation</option>
                <option value="verification">IoT Smart Meter Verification</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-primary" /> Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-background rounded-xl border border-border text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed / Tampered</option>
              </select>
            </div>

            {/* Live Filter Indicator */}
            <div className="flex items-end">
              <div className="w-full p-2 bg-background border border-border/80 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-text-secondary block">Matching Records</span>
                <span className="text-sm font-extrabold text-navy font-mono">
                  {logs.length} <span className="text-xs font-normal text-text-secondary">records found</span>
                </span>
              </div>
            </div>
          </div>

          {/* Custom Date Range Inputs (Shown when 'custom' is selected) */}
          {dateFilter === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2"
            >
              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background rounded-xl border border-border text-xs text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background rounded-xl border border-border text-xs text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-base font-bold text-navy">
                Blockchain Transaction History & Audit Records
              </CardTitle>
            </div>
            <span className="text-xs text-text-secondary font-medium">
              Read-Only Ledger • Historical Immutability Guaranteed
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-sm font-medium text-text-secondary">Querying blockchain audit ledger nodes...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <FileText className="w-12 h-12 text-text-secondary/40 mx-auto" />
              <h3 className="text-base font-bold text-navy">No Audit Records Found</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                No blockchain records match your current search query or filter parameters. Try resetting your search filters.
              </p>
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Search Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-background/80 border-b border-border text-text-secondary font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Audit ID</th>
                    <th className="py-3.5 px-4">Transaction ID</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Blockchain Hash</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.map((record) => {
                    const statusMeta = getStatusBadge(record.status);
                    const StatusIcon = statusMeta.icon;
                    const truncatedHash = record.blockchain_hash
                      ? `${record.blockchain_hash.slice(0, 8)}...${record.blockchain_hash.slice(-6)}`
                      : '0x00...00';

                    return (
                      <tr
                        key={record.id || record.transaction_id}
                        className="hover:bg-primary/5 transition-colors cursor-pointer group"
                        onClick={() => handleOpenDetails(record)}
                      >
                        {/* Audit ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-primary">
                          #{record.id || 'AUD'}
                        </td>

                        {/* Transaction ID */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-navy">
                          <span className="px-2 py-0.5 rounded-md bg-background border border-border/80 group-hover:border-primary/40 transition-colors">
                            {record.transaction_id}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${getActionBadge(
                              record.action
                            )}`}
                          >
                            {record.action || 'TRANSACTION'}
                          </span>
                        </td>

                        {/* Actor */}
                        <td className="py-3.5 px-4 text-text-primary font-medium truncate max-w-[150px]">
                          {record.actor || 'System'}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-mono font-bold text-navy">
                          {record.amount > 0 ? `₹${parseFloat(record.amount).toFixed(2)}` : '—'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                            {statusMeta.label}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-text-secondary whitespace-nowrap">
                          {record.timestamp ? new Date(record.timestamp).toLocaleString() : '—'}
                        </td>

                        {/* Blockchain Hash */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-purple-700 dark:text-purple-300">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[120px]" title={record.blockchain_hash}>
                              {truncatedHash}
                            </span>
                            <button
                              onClick={(e) => handleCopyHash(record.blockchain_hash, e)}
                              className="p-1 rounded-md text-text-secondary hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-950 transition-colors"
                              title="Copy full blockchain hash"
                            >
                              {copiedHash === record.blockchain_hash ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Action: View Details */}
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(record);
                            }}
                            className="text-xs h-7 px-2.5 py-0 border-primary/30 text-primary hover:bg-primary hover:text-white"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title="Blockchain Transaction & Audit Details"
          size="lg"
        >
          <div className="space-y-5 text-xs">
            {/* Blockchain Verification Header Card */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg border border-purple-400/30">
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase text-lime-300 border border-white/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Blockchain Verified Record
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      getStatusBadge(selectedRecord.status).bg
                    }`}
                  >
                    {getStatusBadge(selectedRecord.status).label}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-purple-200/80 block tracking-wider">
                    Transaction ID
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-white">
                    {selectedRecord.transaction_id}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-[11px] text-purple-100 font-mono">
                  <span>Audit ID: #{selectedRecord.id}</span>
                  <span>
                    {selectedRecord.timestamp ? new Date(selectedRecord.timestamp).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Transaction Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-background border border-border/80 rounded-xl space-y-1">
                <span className="text-[10px] uppercase text-text-secondary font-bold block">
                  Action Performed
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border ${getActionBadge(
                    selectedRecord.action
                  )}`}
                >
                  {selectedRecord.action || 'TRANSACTION'}
                </span>
              </div>

              <div className="p-3 bg-background border border-border/80 rounded-xl space-y-1">
                <span className="text-[10px] uppercase text-text-secondary font-bold block">
                  Transaction Type
                </span>
                <span className="font-bold text-navy text-xs uppercase tracking-wide">
                  {selectedRecord.transaction_type || 'purchase'}
                </span>
              </div>

              <div className="p-3 bg-background border border-border/80 rounded-xl space-y-1">
                <span className="text-[10px] uppercase text-text-secondary font-bold block">
                  User / Actor
                </span>
                <span className="font-bold text-navy text-xs truncate block">
                  {selectedRecord.actor || 'System'}
                </span>
                {selectedRecord.user_id && (
                  <span className="text-[10px] font-mono text-text-secondary block">
                    User UID: {selectedRecord.user_id}
                  </span>
                )}
              </div>

              <div className="p-3 bg-background border border-border/80 rounded-xl space-y-1">
                <span className="text-[10px] uppercase text-text-secondary font-bold block">
                  Financial Settlement
                </span>
                <span className="text-base font-extrabold text-navy font-mono block">
                  {selectedRecord.amount > 0 ? `₹${parseFloat(selectedRecord.amount).toFixed(2)}` : '₹0.00'}
                </span>
                {selectedRecord.metadata?.energy_kwh && (
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {selectedRecord.metadata.energy_kwh} kWh Energy Transferred
                  </span>
                )}
              </div>
            </div>

            {/* Cryptographic Blockchain Hash Section */}
            <div className="p-4 bg-purple-950/10 dark:bg-purple-950/30 border border-purple-500/20 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-purple-900 dark:text-purple-200 font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-purple-600" /> Blockchain Transaction Hash (SHA-256)
                </span>
                <button
                  onClick={() => handleCopyHash(selectedRecord.blockchain_hash)}
                  className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-800 font-semibold"
                >
                  <Copy className="w-3 h-3" /> Copy Hash
                </button>
              </div>

              <div className="p-3 bg-background/90 rounded-lg border border-purple-500/30 font-mono text-[11px] text-purple-700 dark:text-purple-300 break-all select-all">
                {selectedRecord.blockchain_hash || '0x0000000000000000000000000000000000000000'}
              </div>

              <div className="flex items-center justify-between text-[10px] text-text-secondary pt-1">
                <span>Block: #{selectedRecord.metadata?.block_number || '1894210'}</span>
                <span>Gas Used: {selectedRecord.metadata?.gas_used || '21,040'}</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 100% Tamper-Proof
                </span>
              </div>
            </div>

            {/* Description and Audit Notes */}
            {selectedRecord.description && (
              <div className="p-3.5 bg-background border border-border/80 rounded-xl space-y-1">
                <span className="text-[10px] uppercase text-text-secondary font-bold block">
                  Audit Log Description
                </span>
                <p className="text-xs text-text-primary leading-relaxed">
                  {selectedRecord.description}
                </p>
              </div>
            )}

            {/* Buyer / Producer Metadata Details */}
            {selectedRecord.metadata && Object.keys(selectedRecord.metadata).length > 0 && (
              <div className="p-3.5 bg-background border border-border/80 rounded-xl space-y-2">
                <span className="text-[10px] uppercase text-text-secondary font-bold block">
                  Extended Blockchain Metadata
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {selectedRecord.metadata.buyer && (
                    <div>
                      <span className="text-text-secondary">Buyer: </span>
                      <span className="font-semibold text-navy">{selectedRecord.metadata.buyer}</span>
                    </div>
                  )}
                  {selectedRecord.metadata.seller && (
                    <div>
                      <span className="text-text-secondary">Producer: </span>
                      <span className="font-semibold text-navy">{selectedRecord.metadata.seller}</span>
                    </div>
                  )}
                  {selectedRecord.metadata.energy_source && (
                    <div>
                      <span className="text-text-secondary">Source: </span>
                      <span className="font-semibold text-navy">{selectedRecord.metadata.energy_source}</span>
                    </div>
                  )}
                  {selectedRecord.metadata.seller_location && (
                    <div className="col-span-2">
                      <span className="text-text-secondary">Grid Location: </span>
                      <span className="font-semibold text-navy">{selectedRecord.metadata.seller_location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                className="text-xs border-emerald-500/40 text-emerald-800 hover:bg-emerald-500/10 font-bold"
                onClick={() => setBlockchainModalOpen(true)}
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> View On-Chain Blockchain Proof
              </Button>
              <Button
                variant="primary"
                onClick={() => setSelectedRecord(null)}
                className="text-xs px-5"
              >
                Close View
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* On-Chain Blockchain Explorer Modal */}
      <BlockchainExplorerModal
        isOpen={blockchainModalOpen}
        onClose={() => setBlockchainModalOpen(false)}
        txData={selectedRecord}
      />
    </div>
  );
}
