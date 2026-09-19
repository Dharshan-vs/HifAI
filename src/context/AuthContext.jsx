import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  signInWithGoogle,
  resendVerificationEmail,
  sendPhoneVerification,
  verifyPhoneCode,
  reloadCurrentUser,
} from '../services/authService';
import { getFirebaseErrorMessage } from '../utils/helpers';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const loadUserProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setUserProfile(null);
      return;
    }
    try {
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        setUserProfile(profile);
        localStorage.setItem(`yuga_user_profile_${firebaseUser.uid}`, JSON.stringify(profile));
        localStorage.setItem('yuga_user_profile', JSON.stringify(profile));
      }
    } catch {
      try {
        const cached = localStorage.getItem(`yuga_user_profile_${firebaseUser.uid}`);
        if (cached) setUserProfile(JSON.parse(cached));
      } catch {}
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Check for locally saved active user session (from real login)
    try {
      const savedActiveUser = localStorage.getItem('yuga_active_user');
      const savedProfile = localStorage.getItem('yuga_user_profile');

      if (savedActiveUser) {
        const parsed = JSON.parse(savedActiveUser);
        parsed.getIdToken = async () => 'active-token';
        setUser(parsed);
        if (savedProfile) setUserProfile(JSON.parse(savedProfile));
        setLoading(false);
      }
    } catch (e) {
      console.warn('Session restoration notice:', e);
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!mounted) return;
        if (firebaseUser) {
          setUser(firebaseUser);
          try {
            localStorage.setItem(
              'yuga_active_user',
              JSON.stringify({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
              })
            );
          } catch {}
          await loadUserProfile(firebaseUser);
        } else {
          setUser(null);
          setUserProfile(null);
          localStorage.removeItem('yuga_active_user');
          localStorage.removeItem('yuga_user_profile');
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Firebase onAuthStateChanged notice:', error);
        if (mounted) setLoading(false);
      }
    );

    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [loadUserProfile]);

  const handleAuthAction = useCallback(async (action) => {
    setAuthLoading(true);
    try {
      const result = await action();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: getFirebaseErrorMessage(error) };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signup = useCallback(async (data) => {
    setAuthLoading(true);
    try {
      const result = await registerUser(data);
      if (result.user) setUser(result.user);
      if (result.userData) setUserProfile(result.userData);
      return { success: true, data: result.user, userProfile: result.userData };
    } catch (error) {
      return { success: false, error: getFirebaseErrorMessage(error) };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password, role) => {
    setAuthLoading(true);
    try {
      const result = await loginUser(email, password, role);
      if (result.mfaRequired) {
        return { success: false, mfaRequired: true, resolver: result.resolver };
      }
      if (result.user) setUser(result.user);
      if (result.userProfile) setUserProfile(result.userProfile);
      return { success: true, data: result.user, userProfile: result.userProfile };
    } catch (error) {
      return { success: false, error: getFirebaseErrorMessage(error) };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setUserProfile(null);
      return { success: true };
    } catch {
      setUser(null);
      setUserProfile(null);
      return { success: true };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(
    (email) => handleAuthAction(() => resetPassword(email)),
    [handleAuthAction]
  );

  const googleSignIn = useCallback(async (role) => {
    setAuthLoading(true);
    try {
      const result = await signInWithGoogle(role);
      if (result.user) setUser(result.user);
      if (result.profile) setUserProfile(result.profile);
      return { success: true, data: result.user, userProfile: result.profile };
    } catch (error) {
      return { success: false, error: getFirebaseErrorMessage(error) };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const sendPhoneOTP = useCallback(async (phoneNumber) => {
    setAuthLoading(true);
    try {
      const result = await sendPhoneVerification(phoneNumber);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: getFirebaseErrorMessage(error),
        code: error?.code,
      };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const verifyPhoneOTP = useCallback(
    async (confirmationResult, code, extraData = {}) => {
      setAuthLoading(true);
      try {
        const result = await verifyPhoneCode(confirmationResult, code, extraData);
        if (result.user) setUser(result.user);
        if (result.profile) setUserProfile(result.profile);
        return { success: true, data: result.user, userProfile: result.profile };
      } catch (error) {
        return { success: false, error: getFirebaseErrorMessage(error) };
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  const updateProfile = useCallback(
    async (data) => {
      if (!user) return { success: false, error: 'Not authenticated' };
      setAuthLoading(true);
      try {
        await updateUserProfile(user.uid, data);
        await loadUserProfile(user);
        return { success: true };
      } catch (error) {
        return { success: false, error: getFirebaseErrorMessage(error) };
      } finally {
        setAuthLoading(false);
      }
    },
    [user, loadUserProfile]
  );

  const uploadAvatar = useCallback(
    async (file) => {
      if (!user) return { success: false, error: 'Not authenticated' };
      setAuthLoading(true);
      try {
        const photoURL = await uploadProfileImage(user.uid, file);
        await reloadCurrentUser();
        const refreshed = auth.currentUser;
        setUser(refreshed);
        setUserProfile((prev) => ({ ...prev, photoURL }));
        await loadUserProfile(refreshed);
        return { success: true, data: photoURL };
      } catch (error) {
        return { success: false, error: getFirebaseErrorMessage(error) };
      } finally {
        setAuthLoading(false);
      }
    },
    [user, loadUserProfile]
  );

  const resendVerification = useCallback(
    () => handleAuthAction(() => resendVerificationEmail()),
    [handleAuthAction]
  );

  const refreshUser = useCallback(async () => {
    const refreshed = await reloadCurrentUser();
    setUser(refreshed);
    await loadUserProfile(refreshed);
    return refreshed;
  }, [loadUserProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadUserProfile(user);
  }, [user, loadUserProfile]);

  const value = {
    user,
    userProfile,
    loading,
    authLoading,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified ?? false,
    signup,
    login,
    logout,
    forgotPassword,
    googleSignIn,
    sendPhoneOTP,
    verifyPhoneOTP,
    updateProfile,
    uploadAvatar,
    resendVerification,
    refreshUser,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
