import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import { formatDate } from '../../../utils/helpers';

export default function SynchronizationHistory({ history = [], loading = false }) {
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-2 border-b border-border">
        <CardTitle>Synchronization Run History</CardTitle>
        <p className="text-xs text-text-secondary mt-0.5">
          Audit trail of manual & automated simulation sync payloads
        </p>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-background/80 text-text-secondary uppercase text-[10px] font-bold border-b border-border tracking-wider">
              <tr>
                <th className="py-3 px-4">Sync Run ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Source Device / Pool</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Records Sync&apos;d</th>
                <th className="py-3 px-4 text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-3 w-16 bg-gray-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-28 bg-gray-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-32 bg-gray-200 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-gray-200 rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-12 bg-gray-200 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-3 w-14 bg-gray-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-secondary text-xs">
                    No synchronization run history recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-background/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy">{h.id}</td>
                    <td className="py-3.5 px-4 text-text-secondary font-mono text-[11px]">
                      {h.timestamp ? formatDate(h.timestamp, { dateStyle: 'short', timeStyle: 'medium' }) : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-text-primary">{h.sourceDevice || 'All Devices'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        h.status === 'Success'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}>
                        {h.status === 'Success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {h.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                      {h.recordsCount} records
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-text-primary">
                      {h.durationMs} ms
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
