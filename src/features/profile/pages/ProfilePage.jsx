import { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Camera,
  Mail,
  Phone,
  User,
  Shield,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Calendar,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../../components/common/PageHeader';
import Breadcrumb from '../../../components/common/Breadcrumb';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Avatar from '../../../components/common/Avatar';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/helpers';
import { USER_ROLES } from '../../../utils/constants';

const roleLabels = {
  [USER_ROLES.CONSUMER]: 'Consumer',
  [USER_ROLES.PROSUMER]: 'Prosumer',
  [USER_ROLES.BUSINESS]: 'Business',
};

export default function ProfilePage() {
  const {
    user,
    userProfile,
    updateProfile,
    uploadAvatar,
    resendVerification,
    authLoading,
  } = useAuth();

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewURL, setPreviewURL] = useState(null);
  const [sendingVerification, setSendingVerification] = useState(false);

  const displayPhoto = previewURL || userProfile?.photoURL || user?.photoURL;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: { fullName: '', phone: '' },
  });

  useEffect(() => {
    if (userProfile || user) {
      reset({
        fullName: userProfile?.fullName || user?.displayName || '',
        phone: userProfile?.phone || user?.phoneNumber || '',
      });
    }
  }, [userProfile, user, reset]);

  // Profile Completion Percentage Calculation
  const completionDetails = useMemo(() => {
    const steps = [
      { key: 'name', label: 'Full Name set', weight: 20, done: !!(userProfile?.fullName || user?.displayName) },
      { key: 'email', label: 'Email address added', weight: 15, done: !!user?.email },
      { key: 'emailVerified', label: 'Email verified', weight: 25, done: !!user?.emailVerified },
      { key: 'phone', label: 'Phone number added', weight: 20, done: !!(userProfile?.phone || user?.phoneNumber) },
      { key: 'photo', label: 'Profile picture uploaded', weight: 20, done: !!(displayPhoto) },
    ];

    const score = steps.reduce((acc, step) => (step.done ? acc + step.weight : acc), 0);
    return { score, steps };
  }, [userProfile, user, displayPhoto]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewURL(localPreview);
    setUploading(true);

    const result = await uploadAvatar(file);
    setUploading(false);

    if (result.success) {
      setPreviewURL(result.data);
      toast.success('Profile photo updated successfully!');
    } else {
      setPreviewURL(null);
      toast.error(result.error || 'Failed to upload photo.');
    }

    e.target.value = '';
  };

  const onSubmit = async (data) => {
    const result = await updateProfile(data);
    if (result.success) {
      toast.success('Profile information updated successfully!');
      reset(data);
    } else {
      toast.error(result.error);
    }
  };

  const handleResendEmailVerification = async () => {
    setSendingVerification(true);
    const res = await resendVerification();
    setSendingVerification(false);

    if (res.success) {
      toast.success('Verification email sent! Check your inbox.');
    } else {
      toast.error(res.error || 'Failed to send verification email.');
    }
  };

  const creationDate = user?.metadata?.creationTime || userProfile?.createdAt;
  const lastSignIn = user?.metadata?.lastSignInTime || userProfile?.lastLogin;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Profile' }]} />
      <PageHeader title="Profile Management" subtitle="Manage your account profile, avatar, phone, and security status" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Account Meta */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="text-center overflow-hidden border-border shadow-card">
            <div className="h-28 gradient-yuga -mx-6 -mt-6 mb-0 relative">
              <div className="absolute top-2 right-4 flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold">
                <Shield className="w-3 h-3 text-lime-300" />
                <span>{roleLabels[userProfile?.role] || 'Consumer'}</span>
              </div>
            </div>

            <div className="relative inline-block -mt-14">
              <motion.div whileHover={{ scale: 1.03 }} className="relative">
                <Avatar src={displayPhoto} name={userProfile?.fullName || user?.displayName} size="xl" />
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-navy/60 flex items-center justify-center backdrop-blur-xs">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2.5 gradient-yuga text-white rounded-full shadow-lg disabled:opacity-50 border-2 border-surface"
                aria-label="Upload profile photo"
                title="Change Profile Picture"
              >
                <Camera className="w-4 h-4" />
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
                aria-hidden="true"
              />
            </div>

            <h2 className="text-xl font-bold text-text-primary mt-4">
              {userProfile?.fullName || user?.displayName || 'YUGA Member'}
            </h2>
            <p className="text-sm text-text-secondary font-mono">{user?.email}</p>

            {/* Email Verification Status Badge */}
            <div className="mt-3 flex justify-center">
              {user?.emailVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-bold rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Email Verified
                </span>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 text-xs font-bold rounded-full border border-amber-500/20">
                    <AlertTriangle className="w-3.5 h-3.5" /> Email Unverified
                  </span>
                  <button
                    onClick={handleResendEmailVerification}
                    disabled={sendingVerification}
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {sendingVerification ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Send Verification Email
                  </button>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="mt-6 pt-6 border-t border-border space-y-3 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Account Created
                </span>
                <span className="font-semibold text-text-primary font-mono">
                  {creationDate ? formatDate(creationDate, { dateStyle: 'medium' }) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Last Login
                </span>
                <span className="font-semibold text-text-primary font-mono">
                  {lastSignIn ? formatDate(lastSignIn, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Right Column: Edit Profile & Profile Completion Percentage Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Completion Percentage Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-border shadow-card gradient-dashboard-header text-white relative overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-lime-300 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" /> Account Health Score
                    </div>
                    <h3 className="text-xl font-bold">Profile Completion</h3>
                    <p className="text-xs text-emerald-100/90">
                      Complete all steps to unlock full REOS peer-to-peer trading and withdrawal limits.
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                    <Award className="w-6 h-6 text-lime-300" />
                    <span className="text-2xl font-extrabold font-mono text-lime-300">
                      {completionDetails.score}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden border border-white/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionDetails.score}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-lime-300 rounded-full"
                  />
                </div>

                {/* Step Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs pt-2">
                  {completionDetails.steps.map((step) => (
                    <div
                      key={step.key}
                      className={`flex items-center gap-2 p-2 rounded-xl border backdrop-blur-xs ${
                        step.done
                          ? 'bg-emerald-900/40 border-emerald-400/40 text-emerald-100'
                          : 'bg-white/10 border-white/15 text-white/70'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${step.done ? 'text-lime-300' : 'text-white/40'}`} />
                      <span className="font-medium text-[11px]">{step.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Edit Profile Form Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <Input
                    label="Display / Full Name"
                    icon={User}
                    error={errors.fullName?.message}
                    {...register('fullName', {
                      required: 'Full name is required',
                      minLength: { value: 2, message: 'Minimum 2 characters' },
                    })}
                  />

                  <Input
                    label="Email Address"
                    icon={Mail}
                    value={user?.email || ''}
                    disabled
                    hint="Email address is managed by Firebase Authentication"
                  />

                  <Input
                    label="Mobile Phone Number"
                    icon={Phone}
                    placeholder="+91 9876543210"
                    error={errors.phone?.message}
                    {...register('phone', {
                      pattern: {
                        value: /^[+]?[\d\s-()]{10,15}$/,
                        message: 'Enter a valid phone number',
                      },
                    })}
                  />

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="submit" loading={authLoading} disabled={!isDirty}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
