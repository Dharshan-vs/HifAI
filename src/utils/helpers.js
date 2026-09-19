export function getFirebaseErrorMessage(error) {
  const code = error?.code || '';

  const messages = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase. Enable Phone under Authentication → Sign-in method.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/popup-blocked-by-browser': 'Pop-up was blocked. Allow pop-ups and try again.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
    'auth/invalid-verification-code': 'Invalid OTP. Please check and try again.',
    'auth/code-expired': 'OTP has expired. Request a new one.',
    'auth/invalid-phone-number': 'Invalid phone number. Include country code (e.g. +91).',
    'auth/missing-phone-number': 'Phone number is required.',
    'auth/quota-exceeded': 'SMS quota exceeded. Try again later or use email login.',
    'auth/captcha-check-failed': 'reCAPTCHA verification failed. Refresh and try again.',
    'auth/requires-recent-login': 'Please sign in again to complete this action.',
    'auth/unauthorized-domain': 'This domain is not authorized in Firebase Console. Please add your domain under Firebase Console → Authentication → Settings → Authorized domains.',
    'storage/unauthorized': 'You do not have permission to upload files.',
    'storage/canceled': 'Upload was cancelled.',
    'storage/unknown': 'An unknown error occurred during upload.',
  };

  return messages[code] || error?.message || 'An unexpected error occurred.';
}

export function formatDate(date, options = {}) {
  if (!date) return '';

  try {
    const d = date instanceof Date
      ? date
      : typeof date?.toDate === 'function'
      ? date.toDate()
      : typeof date?.seconds === 'number'
      ? new Date(date.seconds * 1000)
      : new Date(date);

    if (isNaN(d.getTime())) return '';

    if (Object.keys(options).length > 0) {
      return d.toLocaleString('en-US', options);
    }

    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (err) {
    console.error('Error formatting date:', err);
    return '';
  }
}

export function formatRelativeTime(date) {
  if (!date) return '';

  try {
    const d = date instanceof Date
      ? date
      : typeof date?.toDate === 'function'
      ? date.toDate()
      : typeof date?.seconds === 'number'
      ? new Date(date.seconds * 1000)
      : new Date(date);

    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (err) {
    console.error('Error formatting relative time:', err);
    return '';
  }
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  return errors;
}

/** Normalize phone to E.164 for Firebase (+919876543210) */
export function formatPhoneE164(phone) {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, '');

  if (phone.trim().startsWith('+')) {
    return `+${digits}`;
  }

  // Default India (+91) if 10 digits without country code
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}
