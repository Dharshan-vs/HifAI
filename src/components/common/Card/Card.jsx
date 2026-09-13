import { motion } from 'framer-motion';
import { cn } from '../../../utils/helpers';

export default function Card({
  children,
  className,
  variant = 'default',
  hover = false,
  padding = true,
  onClick,
  ...props
}) {
  const Component = onClick ? motion.button : motion.div;

  const variantClasses = {
    default: 'bg-surface/95 backdrop-blur-md rounded-[var(--radius-card)] border border-border/80 shadow-[var(--shadow-card)]',
    glass: 'glass rounded-[var(--radius-card)]',
    'glass-card': 'glass-card rounded-[var(--radius-card)]',
    'glass-emerald': 'glass-emerald rounded-[var(--radius-card)]',
    neumorphic: 'neu-flat rounded-[var(--radius-card)]',
    'neu-inset': 'neu-pressed rounded-[var(--radius-card)]',
  };

  return (
    <Component
      whileHover={hover ? { y: -4, scale: 1.008 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={onClick}
      className={cn(
        variantClasses[variant] || variantClasses.default,
        'transition-all duration-300',
        hover && 'card-hover cursor-pointer hover:border-emerald-500/40 hover:shadow-xl',
        padding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-lg font-extrabold text-navy font-heading tracking-tight', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }) {
  return (
    <p className={cn('text-xs text-text-secondary mt-1', className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className }) {
  return <div className={cn(className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-border/60', className)}>
      {children}
    </div>
  );
}
