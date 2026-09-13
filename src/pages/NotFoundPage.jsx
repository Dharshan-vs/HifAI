import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';
import { ROUTES } from '../utils/constants';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md space-y-6"
      >
        <div className="space-y-2">
          <p className="text-8xl font-bold text-gradient">404</p>
          <h1 className="text-2xl font-bold text-text-primary">Page not found</h1>
          <p className="text-text-secondary">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link to={ROUTES.DASHBOARD}>
            <Button icon={Home}>Go to Dashboard</Button>
          </Link>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
