import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Home, Zap, Building2, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Logo from '../../../components/common/Logo';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import AuthHeroPanel from '../components/AuthHeroPanel';
import PhoneLoginForm from '../components/PhoneLoginForm';
import MfaChallengeModal from '../components/MfaChallengeModal';
import { useAuth } from '../../../context/AuthContext';
import { APP_NAME, ROUTES, STORAGE_KEYS, USER_ROLES } from '../../../utils/constants';
import { getRoleDashboardRoute } from '../../../routes/ProtectedRoute';
import { cn } from '../../../utils/helpers';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const AUTH_TABS = [
  { id: 'email', label: 'Email Sign In' },
  { id: 'phone', label: 'Phone Sign In' },
];

const PORTAL_TYPES = [
  { id: USER_ROLES.CONSUMER, label: 'Consumer', icon: Home, color: 'hover:border-emerald-500' },
  { id: USER_ROLES.PRODUCER, label: 'Producer', icon: Zap, color: 'hover:border-amber-500' },
  { id: USER_ROLES.BUSINESS, label: 'Business', icon: Building2, color: 'hover:border-cyan-500' },
  { id: USER_ROLES.ADMIN, label: 'Administrator', icon: ShieldCheck, color: 'hover:border-purple-500' },
];

export default function LoginPage() {
  const { login, googleSignIn, authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('email');
  const [targetPortal, setTargetPortal] = useState(USER_ROLES.CONSUMER);
  const [mfaResolver, setMfaResolver] = useState(null);

  const savedEmail = localStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL) || '';

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: savedEmail, rememberMe: !!savedEmail },
  });

  const handlePostLoginRedirect = (user, profile) => {
    const role = profile?.role || targetPortal || 'consumer';
    const destination = getRoleDashboardRoute(role);

    toast.success(`Signed in successfully to ${role.toUpperCase()} Portal!`);
    navigate(destination);
  };

  const handleQuickDemoLogin = async (role) => {
    const email = `${role}@yuga.energy`;
    const result = await login(email, 'password123', role);
    if (result.success) {
      handlePostLoginRedirect(result.data, result.userProfile || { role });
    } else {
      toast.error(result.error);
    }
  };

  const onSubmit = async (data) => {
    if (data.rememberMe) {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, data.email);
    } else {
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
    }

    const result = await login(data.email, data.password, targetPortal);

    if (result.mfaRequired) {
      setMfaResolver(result.resolver);
      return;
    }

    if (result.success) {
      handlePostLoginRedirect(result.data, result.userProfile || { role: targetPortal });
    } else {
      toast.error(result.error);
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await googleSignIn(targetPortal);
    if (result.success) {
      handlePostLoginRedirect(result.data, result.userProfile || { role: targetPortal });
    } else {
      toast.error(result.error);
    }
  };

  const handleMfaSuccess = () => {
    setMfaResolver(null);
    navigate(ROUTES.DASHBOARD);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <AuthHeroPanel />

      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 bg-surface relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md mx-auto space-y-6 relative z-10"
        >
          <div className="space-y-2">
            <Logo size="xl" linkTo={ROUTES.LOGIN} />
            <p className="text-text-secondary">Sign in to your YUGA renewable energy portal</p>
          </div>

          {/* Portal Focus Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Select Portal Sign In Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PORTAL_TYPES.map((p) => {
                const Icon = p.icon;
                const isSelected = targetPortal === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTargetPortal(p.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : `border-border bg-background text-text-secondary ${p.color}`
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-xs">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email vs Phone Authentication Method */}
          <div className="flex p-1 bg-background rounded-2xl border border-border">
            {AUTH_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300',
                  activeTab === tab.id
                    ? 'gradient-yuga text-white shadow-md'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'email' ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <Input label="Email" type="email" icon={Mail} placeholder="you@example.com"
                    error={errors.email?.message} disabled={authLoading}
                    {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } })}
                  />
                  <Input label="Password" type="password" icon={Lock} placeholder="Enter password"
                    error={errors.password?.message} disabled={authLoading}
                    {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded accent-primary" {...register('rememberMe')} />
                      <span className="text-xs text-text-secondary">Remember me</span>
                    </label>
                    <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <Button type="submit" fullWidth loading={authLoading} size="lg">
                    Sign In to {targetPortal.toUpperCase()} Portal
                  </Button>
                </form>
              ) : (
                <PhoneLoginForm disabled={authLoading} />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-surface text-text-secondary">or continue with</span>
            </div>
          </div>

          <Button variant="google" fullWidth size="lg" onClick={handleGoogleSignIn} loading={authLoading}>
            <GoogleIcon />
            Continue with Google
          </Button>

          {/* 1-Click Instant Demo Portals */}
          <div className="p-3 bg-background border border-primary/20 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Instant Demo Access (1-Click)
              </span>
              <span className="text-[10px] text-text-secondary">No password required</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(USER_ROLES.CONSUMER)}
                disabled={authLoading}
                className="py-1.5 px-2 bg-surface hover:bg-emerald-500/10 border border-border hover:border-emerald-500/30 rounded-xl text-xs font-medium text-text-secondary hover:text-emerald-500 transition-all flex items-center justify-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5 text-emerald-500" />
                Consumer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(USER_ROLES.PRODUCER)}
                disabled={authLoading}
                className="py-1.5 px-2 bg-surface hover:bg-amber-500/10 border border-border hover:border-amber-500/30 rounded-xl text-xs font-medium text-text-secondary hover:text-amber-500 transition-all flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Producer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(USER_ROLES.BUSINESS)}
                disabled={authLoading}
                className="py-1.5 px-2 bg-surface hover:bg-cyan-500/10 border border-border hover:border-cyan-500/30 rounded-xl text-xs font-medium text-text-secondary hover:text-cyan-500 transition-all flex items-center justify-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-cyan-500" />
                Business
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(USER_ROLES.ADMIN)}
                disabled={authLoading}
                className="py-1.5 px-2 bg-surface hover:bg-purple-500/10 border border-border hover:border-purple-500/30 rounded-xl text-xs font-medium text-text-secondary hover:text-purple-500 transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                Admin
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link to={`${ROUTES.SIGNUP}?role=${targetPortal}`} className="font-semibold text-primary hover:text-primary-dark transition-colors">
              Sign up as {targetPortal.toUpperCase()}
            </Link>
          </p>

          <footer className="text-center text-xs text-text-secondary pt-3 border-t border-border flex items-center justify-between">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
            <Link to={ROUTES.LANDING} className="text-primary font-medium hover:underline">
              Explore Landing Page →
            </Link>
          </footer>
        </motion.div>
      </div>

      {mfaResolver && (
        <MfaChallengeModal
          resolver={mfaResolver}
          onSuccess={handleMfaSuccess}
          onCancel={() => setMfaResolver(null)}
        />
      )}
    </div>
  );
}
