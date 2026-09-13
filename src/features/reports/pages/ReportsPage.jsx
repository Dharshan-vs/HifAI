import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  Leaf,
  Flame,
  Award,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import StatsCard from '../../../components/common/StatsCard';
import {
  exportToCSV,
  generateDailyReportData,
  generateWeeklyReportData,
  generateMonthlyReportData,
} from '../../../services/reportsService';

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const handleExportCSV = (period) => {
    let data = [];
    let filename = `YUGA_Energy_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`;

    if (period === 'daily') data = generateDailyReportData();
    else if (period === 'weekly') data = generateWeeklyReportData();
    else data = generateMonthlyReportData();

    exportToCSV(filename, data);
    toast.success(`Exported ${period.toUpperCase()} report as CSV!`);
  };

  const handleDownloadPDF = (period) => {
    toast.success(`Preparing ${period.toUpperCase()} report print/PDF view...`);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-[var(--radius-card)] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-medium text-emerald-100 mb-3 border border-white/20">
              <FileText className="w-3.5 h-3.5 text-lime-300" /> MODULE 5 & 6 • ENVIRONMENTAL IMPACT & REPORTS
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Audit Reports & Carbon Impact</h1>
            <p className="text-emerald-100/90 text-sm mt-1">
              Certified daily, weekly, and monthly ESG reports with real CSV export and PDF printing.
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white text-navy hover:bg-lime-300 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-emerald-700" /> Print Summary
          </button>
        </div>
      </div>

      {/* MODULE 5: Environmental Impact Animated Counter Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-navy flex items-center gap-2">
          <Leaf className="w-5 h-5 text-emerald-600" /> Environmental Sustainability Impact
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatsCard
            title="CO₂ Avoided"
            value="0.0"
            unit="kg CO₂"
            icon={ShieldCheck}
            color="primary"
            trend="up"
            trendValue="Zero Baseline"
            delay={0.1}
          />
          <StatsCard
            title="Trees Planted Equivalent"
            value={0}
            unit="Trees"
            icon={Leaf}
            color="success"
            trend="up"
            trendValue="Zero Baseline"
            delay={0.2}
          />
          <StatsCard
            title="Coal Saved"
            value="0.0"
            unit="kg Coal"
            icon={Flame}
            color="accent"
            trend="up"
            trendValue="Zero Baseline"
            delay={0.3}
          />
          <StatsCard
            title="Efficiency Rating"
            value="0/100"
            icon={Award}
            color="secondary"
            animate={false}
            delay={0.4}
          />
        </div>
      </div>

      {/* MODULE 6: Reports Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Download & Export Energy Reports
          </h2>
          <div className="flex bg-surface p-1 rounded-xl border border-border shadow-xs">
            {['daily', 'weekly', 'monthly', 'all'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  selectedPeriod === p ? 'gradient-yuga text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {p === 'all' ? 'All Reports' : p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Report Card */}
          {(selectedPeriod === 'daily' || selectedPeriod === 'all') && (
            <Card className="hover:border-primary/50 transition-all flex flex-col justify-between shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-bold rounded-md uppercase">
                    Daily Log
                  </span>
                  <Calendar className="w-4 h-4 text-text-secondary" />
                </div>
                <CardTitle className="mt-2">Daily Energy & Consumption Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-text-secondary">
                  Detailed hourly breakdown of solar consumption and P2P telemetry for today.
                </p>
                <div className="p-3 bg-background rounded-xl text-xs space-y-1.5 border border-border">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Energy:</span>
                    <span className="font-bold text-navy">0.0 kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Status:</span>
                    <span className="font-semibold text-emerald-600">Active Logging</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleExportCSV('daily')}
                    className="flex-1 py-2 bg-background border border-border hover:border-primary text-text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" /> CSV
                  </button>
                  <button
                    onClick={() => handleDownloadPDF('daily')}
                    className="flex-1 py-2 gradient-yuga text-white rounded-xl text-xs font-bold shadow-sm hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Report Card */}
          {(selectedPeriod === 'weekly' || selectedPeriod === 'all') && (
            <Card className="hover:border-primary/50 transition-all flex flex-col justify-between shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 text-[10px] font-bold rounded-md uppercase">
                    Weekly Log
                  </span>
                  <Calendar className="w-4 h-4 text-text-secondary" />
                </div>
                <CardTitle className="mt-2">Weekly Microgrid Audit Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-text-secondary">
                  Aggregated 7-day performance, solar energy usage, and P2P trade savings.
                </p>
                <div className="p-3 bg-background rounded-xl text-xs space-y-1.5 border border-border">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Weekly Yield:</span>
                    <span className="font-bold text-navy">0.0 kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Tariff Savings:</span>
                    <span className="font-semibold text-emerald-600">₹0.00</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleExportCSV('weekly')}
                    className="flex-1 py-2 bg-background border border-border hover:border-primary text-text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" /> CSV
                  </button>
                  <button
                    onClick={() => handleDownloadPDF('weekly')}
                    className="flex-1 py-2 gradient-yuga text-white rounded-xl text-xs font-bold shadow-sm hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Report Card */}
          {(selectedPeriod === 'monthly' || selectedPeriod === 'all') && (
            <Card className="hover:border-primary/50 transition-all flex flex-col justify-between shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-600 text-[10px] font-bold rounded-md uppercase">
                    Monthly Log
                  </span>
                  <Calendar className="w-4 h-4 text-text-secondary" />
                </div>
                <CardTitle className="mt-2">Monthly ESG & Financial Settlement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-text-secondary">
                  Certified 30-day compliance statement and carbon offset certificate.
                </p>
                <div className="p-3 bg-background rounded-xl text-xs space-y-1.5 border border-border">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Monthly Yield:</span>
                    <span className="font-bold text-navy">0.0 kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Scope 2 Certificate:</span>
                    <span className="font-semibold text-cyan-600">READY</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleExportCSV('monthly')}
                    className="flex-1 py-2 bg-background border border-border hover:border-primary text-text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" /> CSV
                  </button>
                  <button
                    onClick={() => handleDownloadPDF('monthly')}
                    className="flex-1 py-2 gradient-yuga text-white rounded-xl text-xs font-bold shadow-sm hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
