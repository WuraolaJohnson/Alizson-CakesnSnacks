/**
 * authService.js
 * ──────────────────────────────────────────────────────────────
 * Wraps Firebase Auth + the Firestore `profiles` collection.
 * Falls back to localStorage-only simulation when Firebase is
 * not configured (i.e. during development without .env vars).
 */

import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup,
  GoogleAuthProvider, signOut as fbSignOut, onAuthStateChanged,
  updateProfile as fbUpdateProfile, sendEmailVerification, sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { auth, db, isFirebaseReady } from '../lib/firebase';
import { requestRiderAccess, riderRequestMessage, dbToRider } from './riderAccessService';

// ── Helpers ───────────────────────────────────────────────────

const DEFAULT_ADDRESSES = [
  {
    id: 'addr-default-1',
    label: 'Home',
    address: '',
    lga: '',
    city: 'Abeokuta',
    state: 'Ogun State',
    phone: '',
    isDefault: true
  }
];

/**
 * Converts a Firestore profile doc → app user shape
 */
/**
 * An account's roles: everyone is a customer, plus any of 'rider' / 'admin'.
 * Older profiles only have the single `role` field, so it counts too.
 */
export function rolesOf(profile) {
  return [...new Set(['customer', ...(profile?.roles || []), profile?.role].filter(Boolean))];
}

/** True when the user (or profile) has the role. */
export const hasRole = (user, role) => !!user && rolesOf(user).includes(role);

function profileToUser(profile) {
  const roles = rolesOf(profile);
  return {
    id: profile.id,
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    roles,
    // Main role, for older code: admin, else rider, else customer
    role: roles.includes('admin') ? 'admin' : roles.includes('rider') ? 'rider' : 'customer',
    riderId: profile.rider_id || null,
    avatarUrl: profile.avatar_url || null,
    savedAddresses:
      profile.saved_addresses && profile.saved_addresses.length > 0
        ? profile.saved_addresses
        : DEFAULT_ADDRESSES
  };
}

/**
 * Reads profiles/{uid}. On a first sign-in (no doc yet) creates it as a
 * customer — the job Supabase's handle_new_user trigger used to do.
 * Security rules only allow creating your own profile with role 'customer'.
 */
async function loadProfile(fbUser, extra = {}) {
  const ref = doc(db, 'profiles', fbUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: fbUser.uid, ...snap.data() };
  const now = new Date().toISOString();
  const profile = {
    email: fbUser.email || '',
    name: extra.name || fbUser.displayName || (fbUser.email || '').split('@')[0],
    avatar_url: fbUser.photoURL || null,
    phone: '',
    role: 'customer',
    saved_addresses: [],
    created_at: now,
    updated_at: now
  };
  await setDoc(ref, profile);
  return { id: fbUser.uid, ...profile };
}

/** Turns a Firebase error code into a readable message. */
function authMessage(err) {
  const map = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/user-not-found': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/operation-not-allowed': 'This sign-in method is turned off in Firebase (Authentication → Sign-in method).'
  };
  return map[err?.code] || err?.message || 'Something went wrong.';
}

// ── Sign Up ───────────────────────────────────────────────────

/**
 * Register a new customer account.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {{ user, error }}
 */
export async function signUp(name, email, password) {
  if (!isFirebaseReady()) {
    // Offline fallback — simulate registration in localStorage
    const fakeUser = {
      id: `local-${Date.now()}`,
      name,
      email,
      phone: '',
      role: 'customer',
      savedAddresses: DEFAULT_ADDRESSES
    };
    localStorage.setItem('cz_user', JSON.stringify(fakeUser));
    return { user: fakeUser, error: null };
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await fbUpdateProfile(cred.user, { displayName: name });
    sendEmailVerification(cred.user).catch(() => {});
    const profile = await loadProfile(cred.user, { name });
    return { user: profileToUser(profile), error: null };
  } catch (err) {
    return { user: null, error: authMessage(err) };
  }
}

// ── Sign In ───────────────────────────────────────────────────

/**
 * Sign in with email + password.
 * @returns {{ user, error }}
 */
export async function signIn(email, password) {
  if (!isFirebaseReady()) {
    // Offline fallback — check localStorage
    try {
      const stored = localStorage.getItem('cz_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email === email) {
          return { user: parsed, error: null };
        }
      }
    } catch { /* ignore */ }
    // Simulate successful login for dev
    const fakeUser = {
      id: `local-${Date.now()}`,
      name: email.split('@')[0],
      email,
      phone: '',
      role: 'customer',
      savedAddresses: DEFAULT_ADDRESSES
    };
    return { user: fakeUser, error: null };
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await loadProfile(cred.user);
    return { user: profileToUser(profile), error: null };
  } catch (err) {
    return { user: null, error: authMessage(err) };
  }
}

// ── Admin / Rider Sign In ─────────────────────────────────────

/**
 * Admin and rider sign in. Requires Firebase — there is no offline
 * fallback for staff, so a misconfigured deploy can't be logged into.
 * The role comes from the profiles collection, which users cannot edit.
 */
export async function signInAsRole(email, password, expectedRole) {
  if (!isFirebaseReady()) {
    return { user: null, error: 'Sign-in is unavailable: Firebase is not configured.' };
  }

  const { user, error } = await signIn(email, password);
  if (error) return { user: null, error };

  if (!hasRole(user, expectedRole)) {
    // Rider portal: ask an admin for access instead of just refusing
    const message = expectedRole === 'rider'
      ? riderRequestMessage(await requestRiderAccess())
      : `This account does not have ${expectedRole} access.`;
    // Don't leave a non-staff account signed in from the staff portal
    await fbSignOut(auth);
    return { user: null, error: message };
  }

  return { user, error: null };
}

/**
 * Returns the signed-in user if their profile has the given role,
 * otherwise null. Used to restore admin/rider sessions on reload.
 */
export async function getStaffUser(expectedRole) {
  if (!isFirebaseReady()) return null;
  const user = await getCurrentUser();
  return hasRole(user, expectedRole) ? user : null;
}

/**
 * Calls `callback` when the session ends (sign-out here or in another
 * tab, or an expired refresh token). Returns an unsubscribe function.
 */
export function onSignedOut(callback) {
  if (!isFirebaseReady()) return () => {};
  let wasSignedIn = !!auth.currentUser;
  return onAuthStateChanged(auth, (fbUser) => {
    if (wasSignedIn && !fbUser) callback();
    wasSignedIn = !!fbUser;
  });
}

/**
 * Fetch the rider record linked to a login account (riders.user_id).
 * Security rules only let a rider read their own record.
 */
export async function getRiderForUser(userId) {
  if (!isFirebaseReady()) return { rider: null, error: 'Firebase not configured' };

  let snap;
  try {
    snap = await getDocs(query(collection(db, 'riders'), where('user_id', '==', userId), limit(1)));
  } catch (err) {
    return { rider: null, error: err.message };
  }
  if (snap.empty) return { rider: null, error: null };
  const data = { id: snap.docs[0].id, ...snap.docs[0].data() };

  return {
    rider: dbToRider(data),
    error: null
  };
}

// ── Google Sign In ────────────────────────────────────────────

/**
 * Opens the Google sign-in popup. A popup (rather than a redirect) works on
 * browsers that block third-party storage, which breaks Firebase redirects.
 *
 * For a staff portal, the page then reloads at /?portal=admin|rider (and a
 * short-lived note is kept in localStorage), so the portal's existing
 * "returning from Google" logic runs just as it did with the redirect flow.
 *
 * @param {'admin'|'rider'|null} portal - staff portal to return to
 * @returns {{ user, error }}
 */
export async function signInWithGoogle(portal = null) {
  if (!isFirebaseReady()) {
    return { error: 'Google sign-in is unavailable: Firebase is not configured.' };
  }

  let user = null;
  try {
    if (portal) {
      localStorage.setItem(OAUTH_PORTAL_KEY, JSON.stringify({ portal, at: Date.now() }));
    } else {
      localStorage.removeItem(OAUTH_PORTAL_KEY);
    }
  } catch { /* storage blocked — the ?portal= parameter still works */ }

  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    user = await loadProfile(cred.user);
  } catch (err) {
    return { error: authMessage(err) };
  }

  if (portal) window.location.assign(window.location.origin + `/?portal=${portal}`);
  return { user, error: null };
}

const OAUTH_PORTAL_KEY = 'cz_oauth_portal';
const OAUTH_PORTAL_MAX_AGE_MS = 10 * 60 * 1000;
const PORTALS = ['admin', 'rider'];

/**
 * The staff portal ('admin' | 'rider') a Google sign-in was started from:
 * from the ?portal= URL parameter, or a note saved in the last 10 minutes.
 */
export function getPendingOAuthPortal() {
  const fromUrl = new URLSearchParams(window.location.search).get('portal');
  if (PORTALS.includes(fromUrl)) return fromUrl;
  try {
    const saved = JSON.parse(localStorage.getItem(OAUTH_PORTAL_KEY) || 'null');
    if (saved && PORTALS.includes(saved.portal) && Date.now() - saved.at < OAUTH_PORTAL_MAX_AGE_MS) {
      return saved.portal;
    }
  } catch { /* ignore */ }
  return null;
}

/** True when any Firebase session exists (regardless of role). */
export async function hasSession() {
  if (!isFirebaseReady()) return false;
  await auth.authStateReady();
  return !!auth.currentUser;
}

/** True when this page load is the return from a Google sign-in for `portal`. */
export function isReturningFromPortalOAuth(portal) {
  return getPendingOAuthPortal() === portal;
}

/** Forget the pending portal and leave the address bar on #admin / #rider. */
export function clearPortalOAuthParams(hash) {
  try { localStorage.removeItem(OAUTH_PORTAL_KEY); } catch { /* ignore */ }
  window.history.replaceState(null, '', window.location.pathname + '#' + hash);
}

// ── Password Reset ────────────────────────────────────────────

/** Emails a reset link. Also how users moved from Supabase set a password. */
export async function sendPasswordReset(email) {
  if (!isFirebaseReady()) return { error: 'Password reset is unavailable: Firebase is not configured.' };
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (err) {
    // Don't reveal whether an account exists
    if (err?.code === 'auth/user-not-found') return { error: null };
    return { error: authMessage(err) };
  }
}

// ── Sign Out ──────────────────────────────────────────────────

export async function signOut() {
  if (!isFirebaseReady()) {
    localStorage.removeItem('cz_user');
    return { error: null };
  }
  try {
    await fbSignOut(auth);
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

// ── Get Current Session ───────────────────────────────────────

/**
 * Returns the current user from an active Firebase session,
 * or from localStorage in offline mode.
 */
export async function getCurrentUser() {
  if (!isFirebaseReady()) {
    try {
      const stored = localStorage.getItem('cz_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }

  await auth.authStateReady();
  if (!auth.currentUser) return null;
  try {
    return profileToUser(await loadProfile(auth.currentUser));
  } catch {
    return null;
  }
}

// ── Update Profile ────────────────────────────────────────────

export async function updateProfile(userId, updates) {
  if (!isFirebaseReady()) {
    try {
      const stored = localStorage.getItem('cz_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = { ...parsed, ...updates };
        localStorage.setItem('cz_user', JSON.stringify(updated));
        return { user: updated, error: null };
      }
    } catch { /* ignore */ }
    return { user: null, error: 'Not found' };
  }

  // Map camelCase app fields → snake_case DB columns
  const dbUpdates = {};
  if (updates.name !== undefined)           dbUpdates.name = updates.name;
  if (updates.phone !== undefined)          dbUpdates.phone = updates.phone;
  if (updates.avatarUrl !== undefined)      dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.savedAddresses !== undefined) dbUpdates.saved_addresses = updates.savedAddresses;
  dbUpdates.updated_at = new Date().toISOString();

  try {
    const ref = doc(db, 'profiles', userId);
    await updateDoc(ref, dbUpdates);
    const snap = await getDoc(ref);
    return { user: snap.exists() ? profileToUser({ id: userId, ...snap.data() }) : null, error: null };
  } catch (err) {
    return { user: null, error: err.message };
  }
}

// ── Auth State Listener ───────────────────────────────────────

/**
 * Subscribe to auth state changes (sign in / sign out).
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  if (!isFirebaseReady()) return () => {};

  // Like Supabase, report the first (page-load) state as INITIAL_SESSION
  let first = true;
  return onAuthStateChanged(auth, async (fbUser) => {
    const wasFirst = first;
    first = false;
    if (!fbUser) {
      callback(wasFirst ? 'INITIAL_SESSION' : 'SIGNED_OUT', null);
      return;
    }
    try {
      callback('SIGNED_IN', profileToUser(await loadProfile(fbUser)));
    } catch {
      callback('SIGNED_IN', null);
    }
  });
}
