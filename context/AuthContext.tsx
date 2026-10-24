'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
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
  registerAccount: (
    emailOrParams: string | RegisterAccountParams,
    possiblePassword?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearAuthNotice: () => void;
  saveBusinessName: (businessName: string) => Promise<void>;
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
  }
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
          const status: ApprovalStatus = !profileSnapshot.exists()
            ? 'unregistered'
            : data?.approvalStatus === 'pending' || data?.approvalStatus === 'rejected'
              ? data.approvalStatus
              : 'approved';

          setApprovalStatus(status);
          if (!profileSnapshot.metadata.fromCache) setApprovalStatusVerified(true);
          setProfile(profileSnapshot.exists()
            ? {
                name: typeof data.name === 'string' ? data.name : undefined,
                businessName: typeof data.businessName === 'string' ? data.businessName : '',
                email: typeof data.email === 'string' ? data.email : undefined,
                role: data.role === 'admin' ? 'admin' : 'user',
                approvalStatus: status,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
              }
            : null);
          profileLoaded = true;
          finishLoading();

          if (!profileSnapshot.metadata.fromCache && (status === 'pending' || status === 'rejected')) {
            setAuthNotice(status === 'pending'
              ? 'Your registration is pending administrator approval.'
              : 'Your registration request was not approved. You cannot access the system.');
          }
        },
        (error) => {
          console.error('Failed to load business profile', error);
          setAuthError('Your business profile could not be loaded. Check your connection and Firestore rules.');
          profileLoaded = true;
          finishLoading();
        }
      );

      unsubscribeRole = onSnapshot(
        doc(db, 'userRoles', currentUser.uid),
        (roleSnapshot) => {
          setIsAdmin(roleSnapshot.data()?.role === 'admin');
          roleLoaded = true;
          finishLoading();
        },
        (error) => {
          console.error('Failed to load account role', error);
          setAuthError('Your account access could not be loaded. Check your connection and Firestore rules.');
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
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const registerAccount = useCallback(async (
    emailOrParams: string | RegisterAccountParams,
    possiblePassword?: string
  ) => {
    setAuthNotice(null);
    let name = '';
    let businessName = '';
    let email = '';
    let password = '';

    if (typeof emailOrParams === 'object' && emailOrParams !== null) {
      name = emailOrParams.name.trim();
      businessName = emailOrParams.businessName.trim();
      email = emailOrParams.email.trim();
      password = emailOrParams.password;
    } else {
      email = String(emailOrParams).trim();
      password = possiblePassword || '';
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const timestamp = serverTimestamp();

    try {
      const payload: Record<string, any> = {
        name,
        businessName,
        email: credential.user.email || email,
        role: 'user',
        approvalStatus: 'pending',
        submittedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await setDoc(doc(db, 'users', credential.user.uid), payload);
    } catch (error) {
      console.error('Failed to save registration request', error);
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error('Failed to sign out after registration could not be saved', signOutError);
        setAuthError('Your registration request could not be saved, and this account could not be signed out. Contact an administrator.');
      }
      throw new Error('Your account was created, but the registration request could not be saved. Please contact an administrator.');
    }

    setAuthNotice('Your registration request was submitted. You will be able to access the system once an administrator approves your account.');
  }, []);

  const logout = useCallback(async () => {
    setAuthNotice(null);
    await signOut(auth);
  }, []);

  const clearAuthNotice = useCallback(() => setAuthNotice(null), []);

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
        name: currentUser.displayName || '',
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
      saveBusinessName
    }}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
