import {
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  getMultiFactorResolver,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { initRecaptcha, clearRecaptcha } from './authService';

export function isMfaEnabled(user) {
  return multiFactor(user).enrolledFactors.length > 0;
}

export function getEnrolledFactors(user) {
  return multiFactor(user).enrolledFactors;
}

export async function startMfaEnrollment(user, phoneNumber) {
  const session = await multiFactor(user).getSession();
  const phoneInfoOptions = { phoneNumber, session };
  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const verifier = initRecaptcha('mfa-recaptcha-container');
  await verifier.render();
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, verifier);
  return verificationId;
}

export async function completeMfaEnrollment(user, verificationId, verificationCode, displayName = 'Phone') {
  const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  await multiFactor(user).enroll(assertion, displayName);
  clearRecaptcha();
}

export async function unenrollMfaFactor(user, factorUid) {
  const factor = multiFactor(user).enrolledFactors.find((f) => f.uid === factorUid);
  if (factor) {
    await multiFactor(user).unenroll(factor);
  }
}

export function getMfaResolver(error) {
  if (error?.code === 'auth/multi-factor-auth-required') {
    return getMultiFactorResolver(auth, error);
  }
  return null;
}

export async function sendMfaSignInCode(resolver, hintIndex = 0) {
  const hint = resolver.hints[hintIndex];
  const verifier = initRecaptcha('mfa-recaptcha-container');
  await verifier.render();
  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(
    { multiFactorHint: hint, session: resolver.session },
    verifier
  );
  return { verificationId, hint };
}

export async function resolveMfaSignIn(resolver, verificationId, verificationCode) {
  const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  const userCredential = await resolver.resolveSignIn(assertion);
  clearRecaptcha();
  return userCredential.user;
}
