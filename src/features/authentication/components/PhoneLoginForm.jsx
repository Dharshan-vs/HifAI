import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Phone, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import OTPVerificationModal from './OTPVerificationModal';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../utils/constants';
import { clearRecaptcha } from '../../../services/authService';

const COUNTRY_CODES = [
  { code: '+91', country: 'India (🇮🇳)', flag: '🇮🇳' },
  { code: '+1', country: 'United States / Canada (🇺🇸)', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom (🇬🇧)', flag: '🇬🇧' },
  { code: '+61', country: 'Australia (🇦🇺)', flag: '🇦🇺' },
  { code: '+49', country: 'Germany (🇩🇪)', flag: '🇩🇪' },
  { code: '+33', country: 'France (🇫🇷)', flag: '🇫🇷' },
  { code: '+81', country: 'Japan (🇯🇵)', flag: '🇯🇵' },
  { code: '+971', country: 'UAE (🇦🇪)', flag: '🇦🇪' },
];

export default function PhoneLoginForm() {
  const { sendPhoneOTP, verifyPhoneOTP, authLoading } = useAuth();
  const navigate = useNavigate();

  const [countryCode, setCountryCode] = useState('+91');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [rememberLogin, setRememberLogin] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    return () => {
      clearRecaptcha();
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { phone: '' },
  });

  const handleSendOTP = async (data) => {
    setAuthError(null);
    const fullPhoneNumber = `${countryCode}${data.phone.replace(/\D/g, '')}`;
    setSubmittedPhone(fullPhoneNumber);

    const result = await sendPhoneOTP(fullPhoneNumber);

    if (result.success) {
      setConfirmationResult(result.data);
      setIsOtpModalOpen(true);
      toast.success(`OTP verification code sent via SMS to ${fullPhoneNumber}`);
    } else {
      console.error('Firebase Phone Auth error:', result.error);
      setAuthError(result.error || 'Failed to send OTP SMS code.');
      toast.error(result.error || 'Failed to send OTP code');
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    if (!confirmationResult) {
      toast.error('No active OTP verification session. Please resend code.');
      return { success: false, error: 'No session' };
    }

    const res = await verifyPhoneOTP(confirmationResult, otpCode, {
      authProvider: 'phone',
    });

    if (res.success) {
      toast.success('Phone number verified! Welcome to YUGA.');
      setIsOtpModalOpen(false);
      navigate(ROUTES.DASHBOARD);
      return { success: true };
    } else {
      toast.error(res.error || 'Invalid OTP code. Please check SMS.');
      return { success: false, error: res.error };
    }
  };

  const handleResendOTP = async () => {
    setAuthError(null);
    const result = await sendPhoneOTP(submittedPhone);
    if (result.success) {
      setConfirmationResult(result.data);
      toast.success(`New OTP code sent to ${submittedPhone}`);
    } else {
      toast.error(result.error || 'Failed to resend OTP code');
    }
  };

  return (
    <div className="space-y-6">
      {/* Invisible Recaptcha Container */}
      <div id="phone-recaptcha-container" className="flex justify-center my-1" />

      {authError && (
        <div className="p-3.5 bg-error/10 border border-error/30 rounded-xl text-xs text-error space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="w-4 h-4 text-error" /> Authentication Error
          </div>
          <p className="text-[11px]">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(handleSendOTP)} className="space-y-5" noValidate>
        {/* Country Code & Phone Input */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-text-primary block">Mobile Phone Number</label>
          <div className="flex gap-2">
            {/* Country Code Select */}
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="px-3 py-2.5 bg-surface border border-border rounded-[var(--radius-input)] text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-primary cursor-pointer shrink-0"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>

            {/* Phone Input */}
            <div className="flex-1">
              <Input
                type="tel"
                icon={Phone}
                placeholder="9876543210"
                error={errors.phone?.message}
                {...register('phone', {
                  required: 'Mobile phone number is required',
                  pattern: {
                    value: /^[0-9]{7,12}$/,
                    message: 'Enter a valid phone number (7-12 digits)',
                  },
                })}
              />
            </div>
          </div>
        </div>

        {/* Remember Login Checkbox */}
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-text-secondary select-none">
            <input
              type="checkbox"
              checked={rememberLogin}
              onChange={(e) => setRememberLogin(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary/20"
            />
            <span>Remember login on this browser</span>
          </label>
        </div>

        {/* Submit Button */}
        <Button type="submit" fullWidth loading={authLoading} size="lg">
          Send Verification Code (OTP)
        </Button>
      </form>

      {/* Switch to Email Login Option */}
      <div className="text-center pt-2 border-t border-border">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Sign in with Email &amp; Password
        </Link>
      </div>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        phoneNumber={submittedPhone}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
      />
    </div>
  );
}
