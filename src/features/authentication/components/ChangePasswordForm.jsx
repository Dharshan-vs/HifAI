import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff, ShieldCheck, Key } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import toast from 'react-hot-toast';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { auth } from '../../../firebase/config';
import { useAuth } from '../../../context/AuthContext';
import { getFirebaseErrorMessage } from '../../../utils/helpers';

export default function ChangePasswordForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPasswordValue = watch('newPassword', '');

  const onSubmit = async (data) => {
    if (!auth.currentUser || !user) {
      toast.error('You must be signed in to change your password');
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, data.newPassword);

      toast.success('Password updated successfully!');
      reset();
    } catch (error) {
      console.error('Error changing password:', error);
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        toast.error('Current password is incorrect.');
      } else {
        toast.error(getFirebaseErrorMessage(error) || 'Failed to update password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Current Password Field */}
      <div className="relative">
        <Input
          label="Current Password"
          type={showCurrent ? 'text' : 'password'}
          icon={Key}
          placeholder="Enter current password"
          error={errors.currentPassword?.message}
          {...register('currentPassword', {
            required: 'Current password is required',
          })}
        />
        <button
          type="button"
          onClick={() => setShowCurrent(!showCurrent)}
          className="absolute right-3 top-[38px] text-text-secondary hover:text-text-primary focus:outline-none"
        >
          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* New Password Field */}
      <div className="relative">
        <Input
          label="New Password"
          type={showNew ? 'text' : 'password'}
          icon={Lock}
          placeholder="Enter new strong password"
          error={errors.newPassword?.message}
          {...register('newPassword', {
            required: 'New password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters long',
            },
            validate: {
              hasUpper: (v) => /[A-Z]/.test(v) || 'Must contain at least one uppercase letter',
              hasLower: (v) => /[a-z]/.test(v) || 'Must contain at least one lowercase letter',
              hasNumber: (v) => /\d/.test(v) || 'Must contain at least one number',
            },
          })}
        />
        <button
          type="button"
          onClick={() => setShowNew(!showNew)}
          className="absolute right-3 top-[38px] text-text-secondary hover:text-text-primary focus:outline-none"
        >
          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Password Strength Meter */}
      <PasswordStrengthMeter password={newPasswordValue} />

      {/* Confirm Password Field */}
      <div className="relative">
        <Input
          label="Confirm New Password"
          type={showConfirm ? 'text' : 'password'}
          icon={ShieldCheck}
          placeholder="Re-enter new password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your new password',
            validate: (value) => value === newPasswordValue || 'Passwords do not match',
          })}
        />
        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-3 top-[38px] text-text-secondary hover:text-text-primary focus:outline-none"
        >
          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button type="submit" loading={loading} fullWidth size="lg">
          Update Password
        </Button>
      </div>
    </form>
  );
}
