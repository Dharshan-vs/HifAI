import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../utils/constants';

export default function ForgotPasswordForm() {
  const { forgotPassword, authLoading } = useAuth();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const result = await forgotPassword(data.email);
    if (result.success) {
      setSentEmail(data.email);
      setSent(true);
      toast.success('Password reset link sent to your email!');
    } else {
      toast.error(result.error || 'Failed to send password reset email.');
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 py-4"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Check your inbox</h2>
        <p className="text-text-secondary text-sm">
          We&apos;ve sent a password reset email to{' '}
          <span className="font-semibold text-text-primary font-mono">{sentEmail}</span>
        </p>
        <p className="text-xs text-text-secondary">
          Click the link in the email to reset your password. Didn&apos;t receive it? Check your spam folder or try again.
        </p>
        <Button variant="outline" fullWidth onClick={() => setSent(false)} className="mt-2">
          Try another email address
        </Button>
        <div className="pt-2">
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Input
        label="Email address"
        type="email"
        icon={Mail}
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address',
          },
        })}
      />

      <Button type="submit" fullWidth loading={authLoading} size="lg">
        Send Reset Link
      </Button>

      <div className="text-center pt-2">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>
      </div>
    </form>
  );
}
