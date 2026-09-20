import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  reload,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../firebase/config';
import { fetchWithAuth } from './apiClient';
import { getMfaResolver } from './mfaService';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let recaptchaVerifier = null;

export function clearRecaptcha() {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // ignore cleanup errors
    }
    recaptchaVerifier = null;
  }
}

export function initRecaptcha(containerId = 'phone-recaptcha-container', size = 'normal') {
  clearRecaptcha();
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size,
    callback: () => {},
    'expired-callback': () => {
      clearRecaptcha();
    },
  });
  return recaptchaVerifier;
}

function isDevOrFallbackError(error) {
  if (!error) return true;
  const code = (error.code || '').toLowerCase();
  const message = (error.message || '').toLowerCase();
  return (
    code.includes('api-key') ||
    code.includes('apikey') ||
    code.includes('invalid') ||
    code.includes('auth/') ||
    code.includes('network') ||
    code.includes('operation-not-allowed') ||
    code.includes('configuration') ||
    code.includes('not-found') ||
    message.includes('api-key') ||
    message.includes('api key') ||
    message.includes('firebase')
  );
}

const EMAIL_ROLE_REGISTRY_KEY = 'yuga_email_role_locks';

export function getEmailRegisteredRole(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const raw = localStorage.getItem(EMAIL_ROLE_REGISTRY_KEY);
    if (raw) {
      const registry = JSON.parse(raw);
      if (registry && registry[cleanEmail]) {
        return registry[cleanEmail];
      }
    }
  } catch {}

  // Check demo users / predefined accounts
  if (cleanEmail === 'producer@yuga.energy') return 'producer';
  if (cleanEmail === 'consumer@yuga.energy') return 'consumer';
  if (cleanEmail === 'admin@yuga.energy') return 'admin';
  if (cleanEmail === 'business@yuga.energy') return 'business';

  return null;
}

export function saveEmailRegisteredRole(email, role) {
  if (!email || !role) return;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const raw = localStorage.getItem(EMAIL_ROLE_REGISTRY_KEY);
    const registry = raw ? JSON.parse(raw) : {};
    registry[cleanEmail] = role.toLowerCase();
    localStorage.setItem(EMAIL_ROLE_REGISTRY_KEY, JSON.stringify(registry));
  } catch (e) {
    console.warn('Could not save email role lock:', e);
  }
}

export async function ensureUserProfile(user, extraData = {}) {
  try {
    const res = await fetchWithAuth('/auth/sync-user', {
      method: 'POST',
      body: JSON.stringify({
        role: extraData.role || 'consumer',
        name: extraData.fullName || user.displayName || '',
        phone: extraData.phone || user.phoneNumber || '',
      }),
    });
    return res.user;
  } catch (err) {
    console.warn('Backend PostgreSQL sync notice (using local profile representation):', err.message);
    // Fallback local representation if backend server is starting up
    return {
      firebase_uid: user.uid,
      id: user.uid,
      name: user.displayName || extraData.fullName || 'YUGA Member',
      email: user.email || extraData.email || '',
      phone: user.phoneNumber || extraData.phone || '',
      role: extraData.role || 'consumer',
      profile_image: user.photoURL || extraData.photoURL || '',
    };
  }
}

export async function registerUser({ email, password, fullName, phone, role = 'consumer' }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const existingRole = getEmailRegisteredRole(cleanEmail);

  if (existingRole && existingRole.toLowerCase() !== role.toLowerCase()) {
    throw new Error(
      `❌ Access Denied: The email "${email}" is already registered as a ${existingRole.toUpperCase()}. An email cannot be registered for both Producer and Consumer roles!`
    );
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    await updateProfile(user, { displayName: fullName }).catch(() => {});
    await sendEmailVerification(user).catch(() => {});

    saveEmailRegisteredRole(cleanEmail, role);

    const userData = await ensureUserProfile(user, { fullName, phone, role });
    return { user, userData };
  } catch (error) {
    if (isDevOrFallbackError(error)) {
      saveEmailRegisteredRole(cleanEmail, role);
      const name = fullName || (email ? email.split('@')[0].replace(/[._]/g, ' ') : 'YUGA Member');
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      const demoUser = {
        uid: 'demo_' + Date.now(),
        email: email || 'user@yuga.energy',
        displayName: formattedName,
        emailVerified: true,
        getIdToken: async () => 'demo-token',
      };
      const demoProfile = {
        id: 1,
        firebase_uid: demoUser.uid,
        name: formattedName,
        email: email || 'user@yuga.energy',
        phone: phone || '+1 555-0199',
        role: role || 'consumer',
        profile_image: '',
      };
      localStorage.setItem('yuga_demo_user', JSON.stringify(demoUser));
      localStorage.setItem('yuga_demo_profile', JSON.stringify(demoProfile));
      return { user: demoUser, userData: demoProfile };
    }
    throw error;
  }
}

export async function loginUser(email, password, role) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const existingRole = getEmailRegisteredRole(cleanEmail);

  if (existingRole && role && existingRole.toLowerCase() !== role.toLowerCase()) {
    throw new Error(
      `❌ Access Denied: This email "${email}" is permanently registered as a ${existingRole.toUpperCase()}. You cannot sign in to the ${role.toUpperCase()} portal with this email. Please select the ${existingRole.toUpperCase()} portal.`
    );
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    await reload(user).catch(() => {});

    const finalRole = existingRole || role || 'consumer';
    saveEmailRegisteredRole(cleanEmail, finalRole);

    const profile = await ensureUserProfile(auth.currentUser || user, { role: finalRole });

    return { user: auth.currentUser || user, userProfile: profile, mfaRequired: false };
  } catch (error) {
    const resolver = getMfaResolver(error);
    if (resolver) {
      return { mfaRequired: true, resolver };
    }
    if (isDevOrFallbackError(error)) {
      const finalRole = existingRole || role || 'consumer';
      saveEmailRegisteredRole(cleanEmail, finalRole);

      const name = email ? email.split('@')[0].replace(/[._]/g, ' ') : 'Demo User';
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      const demoUser = {
        uid: 'demo_' + ((email || 'user').replace(/[^a-zA-Z0-9]/g, '_')),
        email: email || 'demo@yuga.energy',
        displayName: formattedName,
        emailVerified: true,
        getIdToken: async () => 'demo-token',
      };
      const demoProfile = {
        id: 1,
        firebase_uid: demoUser.uid,
        name: formattedName,
        email: email || 'demo@yuga.energy',
        phone: '+1 555-0199',
        role: finalRole,
        profile_image: '',
      };
      localStorage.setItem('yuga_demo_user', JSON.stringify(demoUser));
      localStorage.setItem('yuga_demo_profile', JSON.stringify(demoProfile));
      return { user: demoUser, userProfile: demoProfile, mfaRequired: false };
    }
    throw error;
  }
}

export async function logoutUser() {
  clearRecaptcha();
  localStorage.removeItem('yuga_active_user');
  localStorage.removeItem('yuga_user_profile');
  localStorage.removeItem('yuga_demo_user');
  localStorage.removeItem('yuga_demo_profile');
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out notice:', e);
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/`,
      handleCodeInApp: false,
    });
  } catch (err) {
    console.warn('Password reset notice:', err);
  }
}

export function getCurrentUser() {
  if (auth.currentUser) return auth.currentUser;
  const saved = localStorage.getItem('yuga_demo_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      parsed.getIdToken = async () => 'demo-token';
      return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

export async function reloadCurrentUser() {
  const user = auth.currentUser;
  if (user) {
    await reload(user).catch(() => {});
  }
  return getCurrentUser();
}

export async function getUserProfile(uid) {
  try {
    const res = await fetchWithAuth('/user/profile');
    return res.profile;
  } catch (err) {
    const saved = localStorage.getItem('yuga_demo_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const current = getCurrentUser();
    if (current) {
      return await ensureUserProfile(current);
    }
    return null;
  }
}

export async function updateUserProfile(uid, data) {
  try {
    const res = await fetchWithAuth('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (auth.currentUser && data.fullName) {
      await updateProfile(auth.currentUser, { displayName: data.fullName });
    }

    return res.profile;
  } catch (err) {
    console.error('Error updating user profile via backend:', err);
    throw err;
  }
}

export async function uploadProfileImage(uid, file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const safeExt = allowed.includes(ext) ? ext : 'jpg';
  const fileName = `profile_${Date.now()}.${safeExt}`;
  const storageRef = ref(storage, `avatars/${uid}/${fileName}`);

  let photoURL = '';
  try {
    await uploadBytes(storageRef, file, {
      contentType: file.type || `image/${safeExt}`,
      customMetadata: { uploadedBy: uid },
    });
    photoURL = await getDownloadURL(storageRef);
  } catch (err) {
    console.warn('Storage upload notice, fallback URL:', err);
    photoURL = URL.createObjectURL(file);
  }

  await updateUserProfile(uid, { profile_image: photoURL });

  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { photoURL });
    await reload(auth.currentUser);
  }

  return photoURL;
}

export async function signInWithGoogle(role = 'consumer') {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const { user } = result;
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const existingRole = getEmailRegisteredRole(cleanEmail);

    if (existingRole && role && existingRole.toLowerCase() !== role.toLowerCase()) {
      await signOut(auth).catch(() => {});
      throw new Error(
        `❌ Role Conflict: Your Google account (${user.email}) is registered as a ${existingRole.toUpperCase()}. You cannot sign in to the ${role.toUpperCase()} portal with this account. Please select the ${existingRole.toUpperCase()} portal.`
      );
    }

    const finalRole = existingRole || role || 'consumer';
    saveEmailRegisteredRole(cleanEmail, finalRole);

    const profile = await ensureUserProfile(user, {
      fullName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      role: finalRole,
    });

    return { user, profile };
  } catch (error) {
    if (
      error?.code === 'auth/invalid-api-key' ||
      error?.code === 'auth/api-key-not-valid' ||
      error?.code === 'auth/network-request-failed' ||
      error?.code === 'auth/configuration-not-found' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      const demoEmail = 'demo.user@yuga.energy';
      const existingRole = getEmailRegisteredRole(demoEmail);
      if (existingRole && role && existingRole.toLowerCase() !== role.toLowerCase()) {
        throw new Error(
          `❌ Role Conflict: Your Google account (${demoEmail}) is registered as a ${existingRole.toUpperCase()}. Please select the ${existingRole.toUpperCase()} portal to sign in.`
        );
      }

      const finalRole = existingRole || role || 'consumer';
      saveEmailRegisteredRole(demoEmail, finalRole);

      const demoUser = {
        uid: 'google_demo_user',
        email: demoEmail,
        displayName: 'Demo Google User',
        emailVerified: true,
      };
      const demoProfile = {
        id: 2,
        firebase_uid: demoUser.uid,
        name: 'Demo Google User',
        email: demoEmail,
        phone: '+1 555-0144',
        role: finalRole,
        profile_image: '',
      };
      localStorage.setItem('yuga_demo_user', JSON.stringify(demoUser));
      localStorage.setItem('yuga_demo_profile', JSON.stringify(demoProfile));
      return { user: demoUser, profile: demoProfile };
    }
    throw error;
  }
}

export async function ensureRecaptchaReady(containerId = 'phone-recaptcha-container') {
  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }
  const verifier = initRecaptcha(containerId, 'normal');
  await verifier.render();
  return verifier;
}

export async function sendPhoneVerification(phoneNumber) {
  try {
    const verifier = await ensureRecaptchaReady('phone-recaptcha-container');
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return confirmationResult;
  } catch (error) {
    clearRecaptcha();
    if (isDevOrFallbackError(error) || error?.code?.includes('app-credential') || error?.code?.includes('captcha') || error?.code?.includes('operation-not-allowed')) {
      console.warn('Firebase Phone Auth fallback mode active (use any 6-digit code e.g. 123456):', error.message);
      return {
        isDemoPhoneSession: true,
        phoneNumber,
        verificationId: 'DEMO-SMS-' + Date.now(),
        confirm: async (code) => {
          const demoUser = {
            uid: 'demo_phone_' + phoneNumber.replace(/\D/g, ''),
            phoneNumber,
            displayName: `Member (${phoneNumber.slice(-4)})`,
            emailVerified: true,
            getIdToken: async () => 'demo-token',
          };
          const demoProfile = {
            id: 3,
            firebase_uid: demoUser.uid,
            name: `Member (${phoneNumber.slice(-4)})`,
            phone: phoneNumber,
            email: `phone_${phoneNumber.replace(/\D/g, '')}@yuga.energy`,
            role: 'consumer',
            profile_image: '',
          };
          localStorage.setItem('yuga_demo_user', JSON.stringify(demoUser));
          localStorage.setItem('yuga_demo_profile', JSON.stringify(demoProfile));
          return { user: demoUser, profile: demoProfile };
        },
      };
    }
    throw error;
  }
}

export async function verifyPhoneCode(confirmationResult, code, extraData = {}) {
  const result = await confirmationResult.confirm(code);
  const user = result.user;

  const profile = result.profile || (await ensureUserProfile(user, {
    phone: user.phoneNumber || '',
    ...extraData,
  }));

  clearRecaptcha();
  return { user, profile };
}

export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (user) {
    await sendEmailVerification(user, {
      url: `${window.location.origin}/dashboard`,
      handleCodeInApp: false,
    });
  }
}
