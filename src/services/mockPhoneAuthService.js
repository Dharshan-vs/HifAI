import { ensureUserProfile } from './authService';

let activeVerificationSession = null;

export async function sendMockPhoneOTP(phoneNumber) {
  const code = '123456';
  activeVerificationSession = {
    phoneNumber,
    code,
    timestamp: Date.now(),
  };

  return {
    verificationId: `mock-verif-${Date.now()}`,
    code,
  };
}

export async function verifyMockPhoneOTP(otpCode, extraData = {}) {
  if (!activeVerificationSession) {
    throw new Error('No OTP session found. Please request OTP again.');
  }

  if (otpCode !== '123456' && otpCode !== activeVerificationSession.code) {
    throw new Error('Invalid verification code. Enter 123456 for testing.');
  }

  const phoneClean = activeVerificationSession.phoneNumber.replace(/[^\d+]/g, '');
  const mockUid = `phone_user_${phoneClean.slice(-10)}`;

  const userMock = {
    uid: mockUid,
    phoneNumber: activeVerificationSession.phoneNumber,
    displayName: extraData.fullName || `YUGA Phone User (${phoneClean.slice(-4)})`,
    email: `${phoneClean.replace(/\+/g, '')}@phone.yuga.io`,
    emailVerified: true,
  };

  const userProfile = await ensureUserProfile(userMock, {
    phone: activeVerificationSession.phoneNumber,
    fullName: extraData.fullName || userMock.displayName,
    role: extraData.role || 'consumer',
    authProvider: 'phone',
  });

  activeVerificationSession = null;

  return {
    user: userMock,
    userProfile,
  };
}
