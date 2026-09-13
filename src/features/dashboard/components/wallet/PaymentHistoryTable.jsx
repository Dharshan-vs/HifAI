import { useEffect, useState, useMemo, useCallback } from 'react';
import { CreditCard, Search, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../../components/common/Card';
import { fetchPaymentHistory } from '../../../../services/walletService';
import { useAuth } from '../../../../context/AuthContext';
import { formatDate } from '../../../../utils/helpers';

export default function PaymentHistoryTable({ refreshTrigger }) {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPaymentHistory(user?.uid || 'guest');
      setPayments(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments, refreshTrigger]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.paymentMethod && p.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType =
        typeFilter === 'all' || p.type.toLowerCase().includes(typeFilter.toLowerCase());

      return matchesSearch && matchesType;
    });
  }, [payments, searchTerm, typeFilter]);

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Recent Payment Transactions</CardTitle>
            <p className="text-xs text-text-secondary mt-0.5">
              Settlements, deposits, and automated solar generation payouts
            </p>
          </div>
        </div>

        <button
          onClick={loadPayments}
          disabled={loading}
          className="p-2 text-text-secondary hover:text-primary rounded-xl border border-border bg-background hover:bg-surface transition-colors self-start sm:self-auto"
          title="Refresh Payments"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background p-3 rounded-xl border border-border">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Payment ID, reference, or method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>

          <div className="flex bg-surface rounded-lg p-1 border border-border">
            {['all', 'settlement', 'deposit', 'trade'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 text-[11px] font-semibold capitalize rounded-md transition-all ${
                  typeFilter === t
                    ? 'bg-secondary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {t === 'settlement' ? 'Payouts' : t === 'deposit' ? 'Deposits' : t === 'trade' ? 'Trades' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Payment History List / Table */}
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-background/80 text-text-secondary uppercase text-[10px] font-bold border-b border-border tracking-wider">
              <tr>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Type & Description</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-3 w-16 bg-gray-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-32 bg-gray-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-20 bg-gray-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-24 bg-gray-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-20 bg-gray-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-16 bg-gray-200 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 w-16 bg-gray-200 rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-secondary text-xs">
                    No payment history matches your search filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isCredit = p.type.includes('Payout') || p.type.includes('Credit') || p.type.includes('Deposit');
                  return (
                    <tr key={p.id} className="hover:bg-background/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-navy">{p.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-text-primary block">{p.type}</span>
                        <span className="text-[11px] text-text-secondary">{p.description}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-text-primary">{p.paymentMethod}</td>
                      <td className="py-3.5 px-4 font-mono text-text-secondary text-[11px]">{p.reference || '—'}</td>
                      <td className="py-3.5 px-4 text-text-secondary text-[11px]">
                        {p.date ? formatDate(p.date, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sm">
                        <span className={isCredit ? 'text-emerald-600' : 'text-text-primary'}>
                          {isCredit ? '+' : '-'}{p.currency || '₹'}
                          {typeof p.amount === 'number' ? p.amount.toFixed(2) : p.amount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          p.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {p.status === 'Completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
