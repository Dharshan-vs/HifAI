import { motion } from 'framer-motion';
import { ShieldCheck, Trees, Zap, Flame, TrendingUp } from 'lucide-react';
import AnimatedCounter from '../../../../components/common/AnimatedCounter/AnimatedCounter';

export default function CarbonStatisticsGrid({ impact = {} }) {
  const stats = [
    {
      title: 'CO₂ Saved',
      value: impact.co2SavedKg ?? 0,
      unit: 'kg',
      sub: `${(impact.co2SavedTons ?? 0).toFixed(2)} Metric Tons`,
      icon: ShieldCheck,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      decimals: 0,
    },
    {
      title: 'Trees Equivalent',
      value: impact.treesEquivalent ?? 0,
      unit: 'Trees',
      sub: 'Annual CO₂ absorption rate',
      icon: Trees,
      color: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
      decimals: 0,
    },
    {
      title: 'Clean RE Generated',
      value: impact.renewableGeneratedKwh ?? 0,
      unit: 'kWh',
      sub: 'Solar & Community Feed-in',
      icon: Zap,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      decimals: 0,
    },
    {
      title: 'Coal Saved',
      value: impact.coalSavedKg ?? 0,
      unit: 'kg',
      sub: 'Fossil fuel displacement',
      icon: Flame,
      color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      decimals: 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-5 bg-surface rounded-2xl border border-border shadow-xs space-y-3 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {item.title}
              </span>
              <div className={`p-2.5 rounded-xl border ${item.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-extrabold text-navy font-mono flex items-baseline gap-1">
                <AnimatedCounter value={item.value} decimals={item.decimals} />
                <span className="text-xs font-semibold text-text-secondary">{item.unit}</span>
              </div>
              <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                {item.sub}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
