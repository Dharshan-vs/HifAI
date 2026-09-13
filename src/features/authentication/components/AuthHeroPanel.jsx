import { motion } from 'framer-motion';
import { Zap, Globe, Shield, TrendingUp } from 'lucide-react';
import { APP_TAGLINE, APP_LOGO } from '../../../utils/constants';

const features = [
  { icon: Zap, label: 'Smart Energy Grid' },
  { icon: Globe, label: 'Community Trading' },
  { icon: Shield, label: 'Secure Platform' },
  { icon: TrendingUp, label: 'Real-time Analytics' },
];

function Orb({ className, delay = 0 }) {
  return (
    <motion.div
      className={cn('absolute rounded-full blur-3xl', className)}
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 5, repeat: Infinity, delay }}
    />
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AuthHeroPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-center overflow-hidden gradient-auth min-h-screen">
      {/* Animated background orbs */}
      <Orb className="w-96 h-96 bg-lime/30 -top-20 -left-20" delay={0} />
      <Orb className="w-80 h-80 bg-secondary/25 top-1/3 right-0" delay={1.5} />
      <Orb className="w-72 h-72 bg-primary/20 bottom-0 left-1/3" delay={3} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(163,230,53,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(163,230,53,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-lime/60"
          style={{ left: `${8 + i * 8}%`, top: `${10 + (i % 5) * 18}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 4 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center justify-center px-12 py-16 text-center">
        {/* Logo showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mb-10"
        >
          <div className="absolute inset-0 gradient-yuga rounded-full blur-3xl opacity-30 animate-pulse-glow scale-150" />
          <motion.img
            src={APP_LOGO}
            alt="YUGA"
            className="relative h-32 w-auto object-contain drop-shadow-2xl animate-float"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-4 max-w-md"
        >
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
            Power Your Future
          </h2>
          <p className="text-lime/90 text-sm font-semibold tracking-[0.25em] uppercase">
            {APP_TAGLINE}
          </p>
          <p className="text-white/60 text-base leading-relaxed">
            Monitor, manage, and trade renewable energy within your community.
            Building a greener future, together.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 grid grid-cols-2 gap-3 w-full max-w-sm"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              whileHover={{ scale: 1.04, y: -2 }}
              className="glass-dark rounded-2xl px-4 py-3 flex items-center gap-2.5 text-left"
            >
              <div className="p-2 rounded-xl gradient-yuga shrink-0">
                <feature.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-white/80 text-xs font-medium">{feature.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-12 flex items-center gap-8"
        >
          {[
            { value: '2.4K+', label: 'Communities' },
            { value: '18MW', label: 'Energy Traded' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-8">
              {i > 0 && <div className="w-px h-8 bg-white/20" />}
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-white/50 text-xs mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
