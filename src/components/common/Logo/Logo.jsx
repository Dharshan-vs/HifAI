import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/helpers';
import { APP_NAME, APP_TAGLINE, APP_LOGO } from '../../../utils/constants';

export default function Logo({ size = 'md', showText = false, showTagline = false, className, linkTo = '/' }) {
  const sizes = {
    sm: { img: 'h-8', text: 'text-lg', tagline: 'text-[9px]' },
    md: { img: 'h-10', text: 'text-xl', tagline: 'text-[10px]' },
    lg: { img: 'h-14', text: 'text-2xl', tagline: 'text-xs' },
    xl: { img: 'h-24', text: 'text-3xl', tagline: 'text-sm' },
  };

  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      <motion.img
        src={APP_LOGO}
        alt={`${APP_NAME} logo`}
        className={cn('object-contain drop-shadow-sm', sizes[size].img)}
        whileHover={{ scale: 1.03, rotate: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-extrabold tracking-tight text-navy leading-none', sizes[size].text)}>
            {APP_NAME}
          </span>
          {showTagline && (
            <span className={cn('font-medium tracking-[0.2em] text-lime-dark uppercase mt-0.5', sizes[size].tagline)}>
              {APP_TAGLINE}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-lg"
      >
        {content}
      </Link>
    );
  }

  return content;
}
