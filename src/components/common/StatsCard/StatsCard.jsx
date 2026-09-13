import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../Card';
import { useAnimatedCounter } from '../../../hooks/useLocalStorage';
import { cn } from '../../../utils/helpers';

export default function StatsCard({
  title,
  value,
  unit = '',
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
  delay = 0,
  animate = true,
}) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const animatedValue = useAnimatedCounter(animate ? numericValue : 0, 2000);
  const displayValue = animate ? animatedValue : numericValue;

  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
  };

  const iconBg = colorClasses[color] || colorClasses.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay }}
      whileHover={{ y: -5, scale: 1.015 }}
    >
      <Card
        hover
        className="relative overflow-hidden border border-white/60 hover:border-emerald-500/40 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.12)] transition-all duration-300"
      >
        {/* Subtle ambient glass gradient glow in background */}
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-teal-400/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1.5">
            <p className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight font-heading">
                {typeof value === 'string' && isNaN(parseFloat(value))
                  ? value
                  : displayValue.toLocaleString()}
              </span>
              {unit && (
                <span className="text-xs text-emerald-600 font-bold uppercase">{unit}</span>
              )}
            </div>
            {trend && (
              <div className="flex items-center gap-1">
                {trend === 'up' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-error" />
                )}
                <span
                  className={cn(
                    'text-xs font-semibold',
                    trend === 'up' ? 'text-success' : 'text-error'
                  )}
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn('p-3 rounded-2xl border border-white/80 shadow-[4px_4px_10px_rgba(0,0,0,0.05),-4px_-4px_10px_rgba(255,255,255,0.9)] backdrop-blur-md', iconBg)}>
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
