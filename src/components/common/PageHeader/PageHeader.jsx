import { motion } from 'framer-motion';
import { cn } from '../../../utils/helpers';
import { Sparkles } from 'lucide-react';

export default function PageHeader({
  title,
  subtitle,
  action,
  className,
  badgeText = 'YUGA ENERGY PLATFORM',
  icon: Icon,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('mb-8', className)}
    >
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-[var(--radius-card)] p-6 sm:p-7 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {badgeText && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-emerald-100 mb-2 border border-white/20 shadow-xs">
                {Icon ? <Icon className="w-3.5 h-3.5 text-lime-300" /> : <Sparkles className="w-3.5 h-3.5 text-lime-300" />}
                <span>{badgeText}</span>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    </motion.div>
  );
}
