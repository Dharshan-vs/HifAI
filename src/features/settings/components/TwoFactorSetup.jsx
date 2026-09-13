import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import { useAuth } from '../../../context/AuthContext';
import {
  isMfaEnabled,
  getEnrolledFactors,
  startMfaEnrollment,
  completeMfaEnrollment,
  unenrollMfaFactor,
} from '../../../services/mfaService';
import { formatPhoneE164, getFirebaseErrorMessage } from '../../../utils/helpers';

export default function TwoFactorSetup() {
  const { user, userProfile, refreshUser, refreshProfile } = useAuth();
  const [step, setStep] = useState('idle');
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);

  const phoneForm = useForm({ defaultValues: { phone: userProfile?.phone || '' } });
  const otpForm = useForm();

  const mfaActive = user ? isMfaEnabled(user) : false;
  const factors = user ? getEnrolledFactors(user) : [];

  const handleStartEnroll = async ({ phone }) => {
    const formatted = formatPhoneE164(phone);
    if (!formatted) {
      toast.error('Enter a valid phone with country code (e.g. +91 9876543210)');
      return;
    }
    setLoading(true);
    try {
      const vId = await startMfaEnrollment(user, formatted);
      setVerificationId(vId);
      setStep('verify');
      toast.success('OTP sent! Enter the code to enable 2FA.');
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteEnroll = async ({ code }) => {
    setLoading(true);
    try {
      await completeMfaEnrollment(user, verificationId, code);
      await refreshUser();
      await refreshProfile();
      setStep('idle');
      toast.success('Two-factor authentication enabled!');
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!factors.length) return;
    setLoading(true);
    try {
      await unenrollMfaFactor(user, factors[0].uid);
      await refreshUser();
      await refreshProfile();
      toast.success('Two-factor authentication disabled.');
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div id="mfa-recaptcha-container" />
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          Add an extra layer of security with SMS verification on sign-in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${mfaActive ? 'bg-success/5 border-success/20' : 'bg-background border-border'}`}>
          {mfaActive ? (
            <CheckCircle className="w-5 h-5 text-success shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-text-secondary shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {mfaActive ? '2FA is enabled' : '2FA is not enabled'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {mfaActive
                ? `Protected via ${factors[0]?.displayName || 'phone verification'}`
                : 'Secure your account with phone verification on every login'}
            </p>
          </div>
        </div>

        {!mfaActive && step === 'idle' && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={phoneForm.handleSubmit(handleStartEnroll)}
            className="space-y-3"
          >
            <Input
              label="Phone Number for 2FA"
              icon={Smartphone}
              placeholder="+91 9876543210"
              hint="Include country code. This number receives login verification codes."
              {...phoneForm.register('phone', { required: 'Phone number is required' })}
            />
            <Button type="submit" fullWidth icon={Shield} loading={loading}>
              Enable Two-Factor Authentication
            </Button>
          </motion.form>
        )}

        {!mfaActive && step === 'verify' && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={otpForm.handleSubmit(handleCompleteEnroll)}
            className="space-y-3"
          >
            <Input
              label="Verification Code"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              inputMode="numeric"
              {...otpForm.register('code', {
                required: 'Code is required',
                pattern: { value: /^\d{6}$/, message: 'Enter 6-digit code' },
              })}
            />
            <Button type="submit" fullWidth loading={loading}>
              Confirm & Enable 2FA
            </Button>
            <Button variant="ghost" fullWidth type="button" onClick={() => setStep('idle')}>
              Cancel
            </Button>
          </motion.form>
        )}

        {mfaActive && (
          <Button variant="danger" fullWidth loading={loading} onClick={handleDisable}>
            Disable Two-Factor Authentication
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
