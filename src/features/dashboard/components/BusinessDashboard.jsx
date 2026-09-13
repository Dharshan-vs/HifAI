import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Zap,
  ShieldCheck,
  FileText,
  Briefcase,
  Download,
  Users,
  Factory,
  Globe2,
  Plus,
  X,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import StatsCard from '../../../components/common/StatsCard';

export default function BusinessDashboard({ userProfile }) {
  const displayName = userProfile?.fullName || 'Enterprise Director';
  const [showPpaModal, setShowPpaModal] = useState(false);
  const [newVolume, setNewVolume] = useState('1.0');
  const [newTariff, setNewTariff] = useState('5.50');

  const facilities = [
    { name: 'Corporate Headquarter', location: 'Commercial Site A', power: '0.0 kW', greenRatio: '0%', carbonAvoided: '0.0 Tons' },
  ];

  const [ppaContracts, setPpaContracts] = useState([]);

  const handleCreatePPA = (e) => {
    e.preventDefault();
    const newContract = {
      id: `PPA-2026-${Math.floor(Math.random() * 90 + 10)}`,
      provider: 'YUGA Solar Microgrid',
      volume: `${newVolume} GWh / yr`,
      rate: `₹${newTariff} / kWh`,
      status: 'Active PPA',
      duration: '2026 – 2031',
    };
    setPpaContracts([newContract, ...ppaContracts]);
    setShowPpaModal(false);
    toast.success(`PPA Contract ${newContract.id} executed successfully!`);
  };

  const handleExportEsg = () => {
    toast.success('ESG Audit Report (Scope 1 & 2) generated and downloaded!');
  };

  return (
    <div className="space-y-8">
      {/* Business Hero Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-gradient-to-r from-slate-900 via-navy to-cyan-950 rounded-[var(--radius-card)] p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-cyan-500/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 backdrop-blur-md rounded-full text-xs font-medium text-cyan-300 mb-3 border border-cyan-400/30">
                <Building2 className="w-3.5 h-3.5 text-lime-300" /> BUSINESS ENTERPRISE • Multi-Site ESG Compliance
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {displayName}</h1>
              <p className="text-slate-300 text-sm mt-1">
                Enterprise Commercial Microgrid Hub for YUGA solar & grid compliance.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportEsg}
                className="px-4 py-2.5 bg-gradient-to-r from-lime-400 to-emerald-500 text-navy font-bold hover:brightness-110 rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg"
              >
                <FileText className="w-4 h-4" /> Export ESG Report
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Corporate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Enterprise Power Load"
          value={0}
          unit="kW"
          icon={Zap}
          color="primary"
          trend="down"
          trendValue="Zero Baseline"
          delay={0.1}
        />
        <StatsCard
          title="Scope 2 Carbon Avoided"
          value={0.0}
          unit="Tons CO₂"
          icon={Globe2}
          color="success"
          trend="up"
          trendValue="Zero Baseline"
          delay={0.2}
        />
        <StatsCard
          title="Active PPA Volume"
          value={0.0}
          unit="GWh"
          icon={Briefcase}
          color="accent"
          trend="up"
          trendValue="Zero Baseline"
          delay={0.3}
        />
        <StatsCard
          title="ESG Compliance Score"
          value="0/100"
          icon={ShieldCheck}
          color="secondary"
          animate={false}
          delay={0.4}
        />
      </div>

      {/* Facilities & PPA Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Multi-Site Facility Telemetry</CardTitle>
                <p className="text-xs text-text-secondary mt-0.5">Real-time commercial power draw across active sites</p>
              </div>
              <button
                onClick={() => toast.success('Facility registered!')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                + Register New Facility
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {facilities.map((fac, i) => (
                  <div key={i} className="p-4 bg-background/60 rounded-xl border border-border/80 hover:border-primary/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-navy/10 text-navy">
                        <Factory className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">{fac.name}</h4>
                        <p className="text-xs text-text-secondary">{fac.location} • Load: {fac.power}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <div>
                        <span className="text-text-secondary block text-[10px]">Clean Ratio</span>
                        <span className="text-emerald-600">{fac.greenRatio}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary block text-[10px]">CO₂ Avoided</span>
                        <span className="text-navy">{fac.carbonAvoided}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Power Purchase Agreements (PPAs) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Corporate PPA Portfolio</CardTitle>
              <button
                onClick={() => setShowPpaModal(true)}
                className="px-3 py-1.5 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary-dark transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Draft New PPA Contract
              </button>
            </CardHeader>
            <CardContent>
              {ppaContracts.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-secondary">
                  No active PPA contracts yet. Click &quot;Draft New PPA Contract&quot; above to add one.
                </div>
              ) : (
                <div className="space-y-3">
                  {ppaContracts.map((ppa) => (
                    <div key={ppa.id} className="p-4 bg-background/50 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">
                            {ppa.id}
                          </span>
                          <span className="text-sm font-semibold text-text-primary">{ppa.provider}</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1">Volume: {ppa.volume} • Tariff: {ppa.rate} • Contract: {ppa.duration}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 bg-success/10 text-success text-xs font-semibold rounded-lg inline-block">
                          {ppa.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ESG Audit Summary Widget */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>ESG Audit Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-background rounded-xl border border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Scope 1 Emissions:</span>
                  <span className="font-semibold text-navy">0.0 Tons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Scope 2 Market-Based:</span>
                  <span className="font-semibold text-emerald-600">0.0 Tons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">RECs (Renewable Certs):</span>
                  <span className="font-bold text-cyan-600">0 Verified</span>
                </div>
              </div>
              <button
                onClick={handleExportEsg}
                className="w-full py-2.5 bg-navy text-white rounded-xl text-xs font-semibold hover:bg-navy-light transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Certified ESG PDF
              </button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-900 via-slate-900 to-navy text-white border-cyan-500/30">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
                <Users className="w-4 h-4" /> Team & Governance Permissions
              </div>
              <p className="text-xs text-slate-300">
                Grant auditor & compliance manager access to your YUGA Enterprise dashboard for real-time ESG disclosures.
              </p>
              <button
                onClick={() => toast.success('Auditor access permissions updated')}
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-navy font-bold rounded-xl text-xs transition-colors"
              >
                Manage Access Roles
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Draft PPA Modal */}
      <AnimatePresence>
        {showPpaModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-lg font-bold text-navy">Draft Corporate PPA Contract</h3>
                <button onClick={() => setShowPpaModal(false)} className="text-text-secondary hover:text-navy">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePPA} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-text-primary">Annual Power Volume (GWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newVolume}
                    onChange={(e) => setNewVolume(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-navy font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-text-primary">Fixed Tariff Rate (₹ / kWh)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newTariff}
                    onChange={(e) => setNewTariff(e.target.value)}
                    className="w-full p-2.5 bg-background border border-border rounded-xl font-mono text-emerald-600 font-bold"
                    required
                  />
                </div>

                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-900 border border-emerald-500/20 font-medium">
                  <p className="flex items-center gap-1.5 font-bold"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 5-Year Fixed Rate Lock</p>
                  <p className="text-[11px] text-text-secondary mt-1">Includes 100% RECs verification for Scope 2 compliance.</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPpaModal(false)}
                    className="flex-1 py-2.5 bg-background border border-border rounded-xl font-semibold hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 gradient-yuga text-white font-bold rounded-xl shadow-md hover:brightness-105"
                  >
                    Sign & Execute PPA
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
