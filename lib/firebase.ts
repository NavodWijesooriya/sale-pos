import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export const STORAGE_KEY_CUSTOM_FIREBASE = 'custom_dealership_firebase_config';

export const defaultFirebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export function getStoredFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_FIREBASE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.apiKey && parsed.projectId) {
      return parsed as FirebaseConfig;
    }
  } catch (err) {
    console.warn('Failed to parse custom Firebase configuration from storage:', err);
  }
  return null;
}

export function saveCustomFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(STORAGE_KEY_CUSTOM_FIREBASE, JSON.stringify(config));
}

export function clearCustomFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_CUSTOM_FIREBASE);
}

export function isUsingCustomFirebase(): boolean {
  return getStoredFirebaseConfig() !== null;
}

export function getActiveFirebaseConfig(): { config: FirebaseConfig; isCustom: boolean } {
  const custom = getStoredFirebaseConfig();
  if (custom) {
    return { config: custom, isCustom: true };
  }
  return { config: defaultFirebaseConfig, isCustom: false };
}

export function parseFirebaseConfigSnippet(snippet: string): FirebaseConfig | null {
  if (!snippet || typeof snippet !== 'string') return null;

  // 1. Try parsing directly as JSON
  try {
    const trimmed = snippet.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      if (parsed.apiKey && parsed.projectId) {
        return {
          apiKey: String(parsed.apiKey).trim(),
          authDomain: String(parsed.authDomain || '').trim(),
          projectId: String(parsed.projectId).trim(),
          storageBucket: String(parsed.storageBucket || '').trim(),
          messagingSenderId: String(parsed.messagingSenderId || '').trim(),
          appId: String(parsed.appId || '').trim(),
        };
      }
    }
  } catch {
    // Ignore JSON parse failure and proceed to regex extraction
  }

  // 2. Extract using regex from JavaScript object syntax (e.g. const firebaseConfig = { apiKey: "...", ... })
  const extractField = (fieldName: string): string => {
    const patterns = [
      new RegExp(`${fieldName}\\s*:\\s*["'\`]([^"'\`]+)["'\`]`, 'i'),
      new RegExp(`["']${fieldName}["']\\s*:\\s*["'\`]([^"'\`]+)["'\`]`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = snippet.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return '';
  };

  const apiKey = extractField('apiKey');
  const projectId = extractField('projectId');
  const authDomain = extractField('authDomain') || (projectId ? `${projectId}.firebaseapp.com` : '');
  const storageBucket = extractField('storageBucket') || (projectId ? `${projectId}.firebasestorage.app` : '');
  const messagingSenderId = extractField('messagingSenderId');
  const appId = extractField('appId');

  if (apiKey && projectId) {
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    };
  }

  return null;
}

// Initialize Firebase with active (custom or default) configuration
const active = getActiveFirebaseConfig();
const app = getApps().length === 0 ? initializeApp(active.config as FirebaseOptions) : getApps()[0];

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
export const storage = getStorage(app);
