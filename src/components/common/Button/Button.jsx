import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../utils/helpers';

const variants = {
  primary: 'gradient-yuga text-white shadow-md hover:shadow-lg hover:brightness-105',
  secondary: 'bg-secondary text-white hover:bg-secondary-dark shadow-sm hover:shadow-md',
  outline: 'border-2 border-primary text-primary hover:gradient-yuga hover:text-white hover:border-transparent',
  ghost: 'text-text-secondary hover:bg-emerald-50 hover:text-text-primary',
  danger: 'bg-error text-white hover:bg-red-700 shadow-sm',
  google: 'bg-white border border-border text-text-primary hover:bg-gray-50 shadow-sm',
  glass: 'glass text-navy hover:bg-white/90 shadow-sm hover:shadow-md border border-white/60',
  'glass-emerald': 'glass-emerald text-emerald-800 hover:brightness-105 font-bold',
  neu: 'neu-button text-navy font-bold border border-white/60',
  neumorphic: 'neu-button text-navy font-bold border border-white/60',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children, variant = 'primary', size = 'md', loading = false, disabled = false,
  fullWidth = false, icon: Icon, iconPosition = 'left', className, type = 'button', ...props
}) {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled || loading ? 1 : 1.02, y: disabled || loading ? 0 : -1 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-button)]',
        'transition-all duration-200 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        variants[variant], sizes[size], fullWidth && 'w-full', className
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        : Icon && iconPosition === 'left' ? <Icon className="w-4 h-4" aria-hidden="true" /> : null}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" aria-hidden="true" />}
    </motion.button>
  );
}
