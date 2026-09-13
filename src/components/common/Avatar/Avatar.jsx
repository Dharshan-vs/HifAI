import { cn, getInitials } from '../../../utils/helpers';

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

export default function Avatar({ src, name, size = 'md', className, status }) {
  const statusColors = {
    online: 'bg-success',
    offline: 'bg-gray-400',
    away: 'bg-warning',
  };

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name ? `${name}'s avatar` : 'User avatar'}
          className={cn(
            'rounded-full object-cover ring-2 ring-white',
            sizes[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full gradient-yuga',
            'flex items-center justify-center font-semibold text-white ring-2 ring-white',
            sizes[size]
          )}
          aria-hidden={!name}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white',
            statusColors[status]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}
