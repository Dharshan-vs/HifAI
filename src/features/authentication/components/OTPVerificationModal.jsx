import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import Button from '../../../components/common/Button';

export default function OTPVerificationModal({
  isOpen,
  onClose,
  phoneNumber,
  onVerify,
  onResend,
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRefs = useRef([]);

  // Countdown Timer effect
  useEffect(() => {
    let interval = null;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, timer]);

  // Reset OTP state on modal open
  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setTimer(60);
      setCanResend(false);
      setErrorMsg('');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    setErrorMsg('');
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setErrorMsg('Please enter all 6 digits of the OTP verification code');
      return;
    }

    setVerifying(true);
    setErrorMsg('');
    const res = await onVerify(fullOtp);
    setVerifying(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to verify OTP code. Try again.');
    }
  };

  const handleResendClick = async () => {
    if (!canResend) return;
    setTimer(60);
    setCanResend(false);
    setErrorMsg('');
    await onResend();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">OTP Verification</h3>
                <p className="text-xs text-text-secondary">Enter 6-digit code sent to phone</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-background transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtitle phone info */}
          <div className="p-3 bg-background rounded-xl border border-border text-center text-xs space-y-0.5">
            <span className="text-text-secondary">Verification code sent to</span>
            <div className="font-mono font-bold text-navy text-sm">{phoneNumber || 'Your Phone Number'}</div>
          </div>

          {/* Form */}
          <form onSubmit={handleVerifySubmit} className="space-y-6">
            {/* 6 Digit Input Boxes */}
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 text-center font-mono font-extrabold text-xl bg-background border-2 border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                />
              ))}
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-rose-500 text-center animate-shake">
                {errorMsg}
              </p>
            )}

            {/* Countdown / Resend Section */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-text-secondary">Didn&apos;t receive code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendClick}
                  className="font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                </button>
              ) : (
                <span className="font-mono font-semibold text-text-primary bg-background px-2.5 py-1 rounded-md border border-border">
                  Resend in 00:{timer < 10 ? `0${timer}` : timer}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              loading={verifying}
              size="lg"
              className="gradient-yuga text-white font-bold"
            >
              Verify OTP & Sign In
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
