import { motion } from 'framer-motion';
import { Award, Leaf } from 'lucide-react';
import Card, { CardContent } from '../../../../components/common/Card';

export default function CircularProgressCard({
  score = 0,
  grade = 'N/A',
  monthlyProgressPercent = 0,
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="border-border shadow-card bg-surface overflow-hidden text-center relative">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <CardContent className="p-6 space-y-4 relative z-10 flex flex-col items-center justify-center">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-bold rounded-full border border-emerald-500/20">
          <Award className="w-3.5 h-3.5" />
          <span>ESG Environmental Rating</span>
        </div>

        {/* Circular SVG Ring */}
        <div className="relative w-40 h-40 flex items-center justify-center my-2">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background Track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="text-border"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Animated Score Bar */}
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              stroke="url(#gradient-green)"
              strokeWidth="10"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              strokeLinecap="round"
              fill="transparent"
            />
            <defs>
              <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-navy font-mono">{score}</span>
            <span className="text-[10px] uppercase font-bold text-text-secondary">Out of 100</span>
            <span className="mt-1 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-md shadow-xs">
              Grade {grade}
            </span>
          </div>
        </div>

        {/* Status description & Monthly target progress */}
        <div className="space-y-2 w-full pt-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-text-secondary flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" /> Monthly RE Target
            </span>
            <span className="text-emerald-600 font-bold">{monthlyProgressPercent}% Achieved</span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${monthlyProgressPercent}%` }}
              transition={{ duration: 1 }}
              className="h-full gradient-yuga rounded-full"
            />
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed pt-1">
            Top 5% Eco Performance in community microgrids!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
