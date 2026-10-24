'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { LoadingScreen } from '../src/components/LoadingScreen';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'unregistered';

export interface UserProfile {
  name?: string;
  businessName: string;
  email?: string;
  role: 'admin' | 'user';
  approvalStatus: ApprovalStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
  submittedAt?: unknown;
  reviewedBy?: string;
  reviewedAt?: unknown;
}

export interface RegisterAccountParams {
  name: string;
  businessName: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  approvalStatus: ApprovalStatus;
  approvalStatusVerified: boolean;
  loading: boolean;
  authError: string | null;
  authNotice: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  registerAccount: (params: RegisterAccountParams | string, maybePassword?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearAuthNotice: () => void;
  saveBusinessName: (businessName: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  submitPendingRequest: (name?: string, businessName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isAdmin: false,
  approvalStatus: 'unregistered',
  approvalStatusVerified: false,
  loading: true,
  authError: null,
  authNotice: null,
  signIn: async () => {
    throw new Error('Authentication is required to sign in.');
  },
  registerAccount: async () => {
    throw new Error('Authentication is required to register.');
  },
  logout: async () => {
    throw new Error('Authentication is not initialized.');
  },
  clearAuthNotice: () => undefined,
  saveBusinessName: async () => {
    throw new Error('Authentication is required to save a business name.');
  },
  refreshProfile: async () => undefined,
  submitPendingRequest: async () => undefined
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('unregistered');
  const [approvalStatusVerified, setApprovalStatusVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeRole: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setLoading(true);
      unsubscribeProfile?.();
      unsubscribeRole?.();
      unsubscribeProfile = undefined;
      unsubscribeRole = undefined;
      setUser(currentUser);
      setProfile(null);
      setIsAdmin(false);
      setApprovalStatus('unregistered');
      setApprovalStatusVerified(false);
      setAuthError(null);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      let profileLoaded = false;
      let roleLoaded = false;
      const finishLoading = () => {
        if (profileLoaded && roleLoaded) setLoading(false);
      };

      unsubscribeProfile = onSnapshot(
        doc(db, 'users', currentUser.uid),
        (profileSnapshot) => {
          const data = profileSnapshot.data() || {};
          const rawStatus = data?.approvalStatus;
          const status: ApprovalStatus = !profileSnapshot.exists()
            ? 'unregistered'
            : rawStatus === 'pending' || rawStatus === 'rejected'
              ? rawStatus
              : 'approved';

          setApprovalStatus(status);
          if (!profileSnapshot.metadata.fromCache) setApprovalStatusVerified(true);
          setProfile(profileSnapshot.exists()
            ? {
                name: typeof data.name === 'string' ? data.name : currentUser.displayName || undefined,
                businessName: typeof data.businessName === 'string' ? data.businessName : '',
                email: typeof data.email === 'string' ? data.email : currentUser.email || undefined,
                role: data.role === 'admin' ? 'admin' : 'user',
                approvalStatus: status,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                submittedAt: data.submittedAt,
                reviewedBy: typeof data.reviewedBy === 'string' ? data.reviewedBy : undefined,
                reviewedAt: data.reviewedAt
              }
            : null);
          profileLoaded = true;
          finishLoading();
        },
        (error) => {
          console.error('Failed to load business profile', error);
          const isPerm = error?.message?.includes('Missing or insufficient permissions') || (error as any)?.code === 'permission-denied';
          setAuthError(
            isPerm
              ? 'Firestore security rules in your connected Firebase project are blocking access. Please open Firebase Console → Firestore Database → Rules, paste the security rules, and click Publish.'
              : 'Your business profile could not be loaded. Check your internet connection and Firestore rules.'
          );
          profileLoaded = true;
          finishLoading();
        }
      );

      unsubscribeRole = onSnapshot(
        doc(db, 'userRoles', currentUser.uid),
        (roleSnapshot) => {
          const isUserAdmin = roleSnapshot.data()?.role === 'admin';
          setIsAdmin(isUserAdmin);
          if (isUserAdmin) {
            setApprovalStatus('approved');
            setApprovalStatusVerified(true);
          }
          roleLoaded = true;
          finishLoading();
        },
        (error) => {
          console.error('Failed to load account role', error);
          const isPerm = error?.message?.includes('Missing or insufficient permissions') || (error as any)?.code === 'permission-denied';
          if (isPerm) {
            setAuthError(
              'Firestore security rules in your connected Firebase project are blocking access. Please open Firebase Console → Firestore Database → Rules, paste the security rules, and click Publish.'
            );
          }
          roleLoaded = true;
          finishLoading();
        }
      );
    }, (error) => {
      console.error('Failed to initialize Firebase Authentication', error);
      setAuthError('Authentication could not be initialized. Please refresh and try again.');
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
      unsubscribeRole?.();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthNotice(null);
    setAuthError(null);
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const submitPendingRequest = useCallback(async (customName?: string, customBusiness?: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be signed in to submit an approval request.');

    const name = customName?.trim() || currentUser.displayName || '';
    const businessName = customBusiness?.trim() || '';
    const email = currentUser.email || '';
    const timestamp = serverTimestamp();
    const docRef = doc(db, 'users', currentUser.uid);

    try {
      await setDoc(docRef, {
        name,
        businessName,
        email,
        role: 'user',
        approvalStatus: 'pending',
        submittedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    } catch (firstErr) {
      console.warn('Full registration request failed, retrying legacy format:', firstErr);
      await setDoc(docRef, {
        businessName: '',
        email,
        role: 'user',
        approvalStatus: 'pending',
        submittedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    setApprovalStatus('pending');
    setProfile({
      name: name || undefined,
      businessName,
      email,
      role: 'user',
      approvalStatus: 'pending',
      submittedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }, []);

  const registerAccount = useCallback(async (
    params: RegisterAccountParams | string,
    maybePassword?: string
  ) => {
    setAuthNotice(null);
    setAuthError(null);

    let name = '';
    let businessName = '';
    let email = '';
    let password = '';

    if (typeof params === 'object') {
      name = params.name.trim();
      businessName = params.businessName.trim();
      email = params.email.trim();
      password = params.password;
    } else {
      email = params.trim();
      password = maybePassword || '';
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password);

    if (name) {
      try {
        await updateProfile(credential.user, { displayName: name });
      } catch (err) {
        console.warn('Failed to set Firebase Auth display name', err);
      }
    }

    const timestamp = serverTimestamp();
    const docRef = doc(db, 'users', credential.user.uid);

    try {
      // 1. Try full modern schema
      await setDoc(docRef, {
        name,
        businessName,
        email: credential.user.email || email,
        role: 'user',
        approvalStatus: 'pending',
        submittedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    } catch (firstError) {
      console.warn('Failed with modern schema, attempting fallback schema:', firstError);
      try {
        // 2. Fallback schema for legacy firestore.rules deployed in Firebase Console
        await setDoc(docRef, {
          businessName: '',
          email: credential.user.email || email,
          role: 'user',
          approvalStatus: 'pending',
          submittedAt: timestamp,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      } catch (fallbackError) {
        console.error('Failed to save registration request with both schemas', firstError, fallbackError);
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error('Failed to sign out after registration failure', signOutError);
        }
        throw new Error(
          'Your account was created in authentication, but saving registration to Firestore was denied by security rules. Please update and publish firestore.rules in your Firebase Console.'
        );
      }
    }

    setApprovalStatus('pending');
    setProfile({
      name: name || undefined,
      businessName,
      email: credential.user.email || email,
      role: 'user',
      approvalStatus: 'pending',
      submittedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    setAuthNotice('Your registration request was submitted and is pending administrator approval.');
  }, []);

  const logout = useCallback(async () => {
    setAuthNotice(null);
    setAuthError(null);
    await signOut(auth);
  }, []);

  const clearAuthNotice = useCallback(() => setAuthNotice(null), []);

  const refreshProfile = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const profileSnapshot = await getDoc(doc(db, 'users', currentUser.uid));
      if (profileSnapshot.exists()) {
        const data = profileSnapshot.data();
        const rawStatus = data?.approvalStatus;
        const status: ApprovalStatus = rawStatus === 'pending' || rawStatus === 'rejected'
          ? rawStatus
          : 'approved';
        setApprovalStatus(status);
        setApprovalStatusVerified(true);
        setProfile({
          name: typeof data.name === 'string' ? data.name : currentUser.displayName || undefined,
          businessName: typeof data.businessName === 'string' ? data.businessName : '',
          email: typeof data.email === 'string' ? data.email : currentUser.email || undefined,
          role: data.role === 'admin' ? 'admin' : 'user',
          approvalStatus: status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          submittedAt: data.submittedAt,
          reviewedBy: typeof data.reviewedBy === 'string' ? data.reviewedBy : undefined,
          reviewedAt: data.reviewedAt
        });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  }, []);

  const saveBusinessName = useCallback(async (businessName: string) => {
    const currentUser = auth.currentUser;
    const normalizedName = businessName.trim();
    if (!currentUser) throw new Error('You must be signed in to save a business name.');
    if (!normalizedName) throw new Error('Enter your Business Name to continue.');

    const profileRef = doc(db, 'users', currentUser.uid);
    const existingProfile = await getDoc(profileRef);
    if (existingProfile.exists()) {
      await updateDoc(profileRef, {
        businessName: normalizedName,
        updatedAt: serverTimestamp()
      });
    } else if (isAdmin) {
      const timestamp = serverTimestamp();
      await setDoc(profileRef, {
        businessName: normalizedName,
        email: currentUser.email || '',
        role: 'admin',
        approvalStatus: 'approved',
        createdAt: timestamp,
        updatedAt: timestamp
      });
    } else {
      throw new Error('A registration request must be approved before creating a business profile.');
    }

    setProfile((currentProfile) => ({
      name: currentProfile?.name || currentUser.displayName || undefined,
      businessName: normalizedName,
      email: currentProfile?.email || currentUser.email || undefined,
      role: currentProfile?.role || (isAdmin ? 'admin' : 'user'),
      approvalStatus: 'approved',
      createdAt: currentProfile?.createdAt,
      updatedAt: currentProfile?.updatedAt
    }));
  }, [isAdmin]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAdmin,
      approvalStatus,
      approvalStatusVerified,
      loading,
      authError,
      authNotice,
      signIn,
      registerAccount,
      logout,
      clearAuthNotice,
      saveBusinessName,
      refreshProfile,
      submitPendingRequest
    }}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
