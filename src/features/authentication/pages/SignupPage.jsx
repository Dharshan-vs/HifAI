import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Logo from '../../../components/common/Logo';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import AuthHeroPanel from '../components/AuthHeroPanel';
import { useAuth } from '../../../context/AuthContext';
import { getRoleDashboardRoute } from '../../../routes/ProtectedRoute';
import { APP_TAGLINE, APP_NAME, ROUTES, USER_ROLES, VALIDATION } from '../../../utils/constants';

const roleOptions = [
  { value: USER_ROLES.CONSUMER, label: 'Consumer', description: 'Household energy user' },
  { value: USER_ROLES.PRODUCER, label: 'Producer', description: 'Generate solar & wind energy' },
  { value: USER_ROLES.BUSINESS, label: 'Business', description: 'Commercial & ESG enterprise' },
  { value: USER_ROLES.ADMIN, label: 'Administrator', description: 'System Admin & Audit Overseer' },
];

export default function SignupPage() {
  const { signup, googleSignIn, authLoading } = useAuth();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(window.location.search);
  const initialRole = searchParams.get('role') || USER_ROLES.CONSUMER;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: initialRole,
    },
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    if (!data.terms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    const result = await signup({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
      role: data.role,
    });

    if (result.success) {
      toast.success(`Account created! Welcome to the ${data.role.toUpperCase()} Portal.`);
      navigate(getRoleDashboardRoute(data.role));
    } else {
      toast.error(result.error);
    }
  };

  const handleGoogleSignUp = async () => {
    const result = await googleSignIn();
    if (result.success) {
      toast.success('Account created with Google!');
      navigate(ROUTES.DASHBOARD);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <AuthHeroPanel />

      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 bg-surface overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime/5 rounded-full blur-3xl pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto space-y-6"
        >
          <div className="space-y-2">
            <Logo size="xl" linkTo={ROUTES.LOGIN} />
            <h1 className="text-2xl font-bold text-navy mt-4">Create your account</h1>
            <p className="text-text-secondary">Join the renewable energy community</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Full Name"
              icon={User}
              placeholder="John Doe"
              error={errors.fullName?.message}
              {...register('fullName', {
                required: 'Full name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />

            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address',
                },
              })}
            />

            <Input
              label="Phone Number"
              type="tel"
              icon={Phone}
              placeholder="+1 (555) 000-0000"
              error={errors.phone?.message}
              {...register('phone', {
                pattern: {
                  value: VALIDATION.PHONE_PATTERN,
                  message: 'Enter a valid phone number',
                },
              })}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {roleOptions.map((role) => (
                  <label
                    key={role.value}
                    className="relative flex flex-col items-center p-3 border border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      value={role.value}
                      className="sr-only"
                      {...register('role', { required: 'Please select a role' })}
                    />
                    <span className="text-sm font-medium text-text-primary">{role.label}</span>
                    <span className="text-[10px] text-text-secondary text-center mt-0.5">{role.description}</span>
                  </label>
                ))}
              </div>
              {errors.role && (
                <p className="text-xs text-error">{errors.role.message}</p>
              )}
            </div>

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="Create a strong password"
              error={errors.password?.message}
              hint="At least 8 characters with uppercase, lowercase, and number"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: VALIDATION.PASSWORD_MIN_LENGTH, message: 'Minimum 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Must include uppercase, lowercase, and number',
                },
              })}
            />

            <Input
              label="Confirm Password"
              type="password"
              icon={Lock}
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
            />

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                {...register('terms', { required: true })}
              />
              <span className="text-sm text-text-secondary">
                I agree to the{' '}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </span>
            </label>

            <Button type="submit" fullWidth loading={authLoading} size="lg">
              Create Account
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-text-secondary">or continue with</span>
            </div>
          </div>

          <Button
            variant="google"
            fullWidth
            size="lg"
            onClick={handleGoogleSignUp}
            loading={authLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
