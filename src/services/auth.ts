import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  browserLocalPersistence,
  getIdTokenResult,
  onAuthStateChanged,
  setPersistence,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppPermissions, UserRole } from '../types';

export type { User };

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  operator: 'Nhân viên nhập liệu',
  viewer: 'Chỉ xem'
};

export const ROLE_PERMISSIONS: Record<UserRole, AppPermissions> = {
  admin: {
    canManageCatalog: true,
    canManageTransactions: true,
    canWriteGoogleSheets: true
  },
  operator: {
    canManageCatalog: false,
    canManageTransactions: true,
    canWriteGoogleSheets: true
  },
  viewer: {
    canManageCatalog: false,
    canManageTransactions: false,
    canWriteGoogleSheets: false
  }
};

const provider = new GoogleAuthProvider();
// Workspace scopes requested by user
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

// In-memory token cache (Do NOT store in localStorage)
const TOKEN_KEY = 'nha_khuon_google_access_token';
const TOKEN_EXPIRY_KEY = 'nha_khuon_google_token_expiry';
const TOKEN_LIFETIME_MS = 50 * 60 * 1000;

const readSessionToken = () => {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const expiresAt = Number(sessionStorage.getItem(TOKEN_EXPIRY_KEY) || 0);
    if (!token || !expiresAt || Date.now() >= expiresAt) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
};

const saveSessionToken = (token: string) => {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + TOKEN_LIFETIME_MS));
  } catch {
    // Continue with the in-memory token when session storage is unavailable.
  }
};

const clearSessionToken = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch {
    // ignore
  }
};

let cachedAccessToken: string | null = readSessionToken();
let isSigningIn = false;

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

export const getUserRole = async (user: User): Promise<UserRole> => {
  const token = await getIdTokenResult(user, true);
  const role = token.claims.role;
  if (role === 'admin' || role === 'operator' || role === 'viewer') return role;

  // Existing authenticated staff remain able to enter warehouse data until an
  // administrator assigns an explicit Firebase custom claim.
  return 'operator';
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If logged in via Firebase session but token not cached in memory, prompt or re-auth on action
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không lấy được OAuth Access Token từ Google');
    }

    cachedAccessToken = credential.accessToken;
    saveSessionToken(cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    console.error('Google Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) cachedAccessToken = readSessionToken();
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  clearSessionToken();
};
