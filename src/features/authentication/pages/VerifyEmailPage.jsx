import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Logo from '../../../components/common/Logo';
import Button from '../../../components/common/Button';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../utils/constants';

export default function VerifyEmailPage() {
  const { user, isEmailVerified, resendVerification, refreshUser, authLoading } = useAuth();
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isEmailVerified) {
      toast.success('Email verified successfully!');
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isEmailVerified, navigate]);

  const handleResend = async () => {
    const result = await resendVerification();
    if (result.success) {
      toast.success('Verification email sent! Check your inbox.');
    } else {
      toast.error(result.error);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const refreshed = await refreshUser();
      if (refreshed?.emailVerified) {
        toast.success('Email verified! Redirecting...');
        navigate(ROUTES.DASHBOARD, { replace: true });
      } else {
        toast.error('Email not verified yet. Check your inbox and click the link.');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface rounded-[var(--radius-card)] border border-border shadow-[var(--shadow-card)] p-8 text-center space-y-6"
      >
        <Logo size="md" linkTo={ROUTES.DASHBOARD} className="justify-center" />

        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-text-primary">Verify your email</h1>
          <p className="text-sm text-text-secondary">
            We sent a verification link to{' '}
            <span className="font-medium text-text-primary">{user?.email}</span>.
            Click the link in your email, then press the button below.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            fullWidth
            icon={CheckCircle}
            loading={checking}
            onClick={handleCheckVerification}
          >
            I&apos;ve verified my email
          </Button>

          <Button
            variant="outline"
            fullWidth
            icon={RefreshCw}
            loading={authLoading}
            onClick={handleResend}
          >
            Resend verification email
          </Button>
        </div>

        <Link
          to={ROUTES.DASHBOARD}
          className="block text-sm text-primary hover:text-primary-dark transition-colors"
        >
          Continue to dashboard
        </Link>
      </motion.div>
    </div>
  );
}
