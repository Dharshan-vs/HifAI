import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { sendMfaSignInCode, resolveMfaSignIn } from '../../../services/mfaService';
import { ensureUserProfile } from '../../../services/authService';
import { getFirebaseErrorMessage } from '../../../utils/helpers';

export default function MfaChallengeModal({ resolver, onSuccess, onCancel }) {
  const [step, setStep] = useState('send');
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleSendCode = async () => {
    setLoading(true);
    try {
      const result = await sendMfaSignInCode(resolver);
      setVerificationId(result.verificationId);
      setStep('verify');
      toast.success('Verification code sent to your phone');
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async ({ code }) => {
    setLoading(true);
    try {
      const user = await resolveMfaSignIn(resolver, verificationId, code);
      await ensureUserProfile(user);
      toast.success('Two-factor verification successful!');
      onSuccess(user);
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
          onClick={onCancel}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-surface rounded-[var(--radius-card)] border border-border shadow-[var(--shadow-elevated)] p-8 space-y-6"
        >
          <div id="mfa-recaptcha-container" />

          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl gradient-yuga flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">Two-Factor Authentication</h2>
            <p className="text-sm text-text-secondary">
              {step === 'send'
                ? 'A verification code will be sent to your registered phone number.'
                : 'Enter the 6-digit code sent to your phone.'}
            </p>
          </div>

          {step === 'send' ? (
            <div className="space-y-3">
              <Button fullWidth size="lg" loading={loading} onClick={handleSendCode}>
                Send Verification Code
              </Button>
              <Button variant="ghost" fullWidth onClick={onCancel}>
                Cancel
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(handleVerify)} className="space-y-4">
              <Input
                label="Verification Code"
                placeholder="Enter 6-digit code"
                maxLength={6}
                inputMode="numeric"
                icon={ShieldCheck}
                error={errors.code?.message}
                {...register('code', {
                  required: 'Code is required',
                  pattern: { value: /^\d{6}$/, message: 'Enter 6-digit code' },
                })}
              />
              <Button type="submit" fullWidth size="lg" loading={loading}>
                Verify & Sign In
              </Button>
              <Button variant="ghost" fullWidth type="button" onClick={() => setStep('send')}>
                Resend Code
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
