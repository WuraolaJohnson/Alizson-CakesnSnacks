/**
 * authService.js
 * ──────────────────────────────────────────────────────────────
 * Wraps Supabase Auth for the Alizson marketplace.
 * Falls back to localStorage-only simulation when Supabase is
 * not configured (i.e. during development without .env vars).
 */

import { supabase, isSupabaseReady } from '../lib/supabase';

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
 * Converts a Supabase profile row → app user shape
 */
function profileToUser(profile) {
  return {
    id: profile.id,
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    role: profile.role || 'customer',
    avatarUrl: profile.avatar_url || null,
    savedAddresses:
      profile.saved_addresses && profile.saved_addresses.length > 0
        ? profile.saved_addresses
        : DEFAULT_ADDRESSES
  };
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
  if (!isSupabaseReady()) {
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      // Send the confirmation link back to this site, not Supabase's default
      emailRedirectTo: window.location.origin
    }
  });

  if (error) return { user: null, error: error.message };

  // Profile is created by the database trigger (handle_new_user)
  // but we can patch the name in immediately
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      name,
      email,
      role: 'customer'
    });
  }

  const user = data.user
    ? profileToUser({ id: data.user.id, name, email, role: 'customer', saved_addresses: DEFAULT_ADDRESSES })
    : null;

  return { user, error: null };
}

// ── Sign In ───────────────────────────────────────────────────

/**
 * Sign in with email + password.
 * @returns {{ user, error }}
 */
export async function signIn(email, password) {
  if (!isSupabaseReady()) {
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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };

  // Fetch full profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  const user = profile ? profileToUser(profile) : null;
  return { user, error: null };
}

// ── Admin / Rider Sign In ─────────────────────────────────────

/**
 * Admin and rider sign in. Requires Supabase — there is no offline
 * fallback for staff, so a misconfigured deploy can't be logged into.
 * The role comes from the profiles table, which users cannot edit.
 */
export async function signInAsRole(email, password, expectedRole) {
  if (!isSupabaseReady()) {
    return { user: null, error: 'Sign-in is unavailable: Supabase is not configured.' };
  }

  const { user, error } = await signIn(email, password);
  if (error) return { user: null, error };

  if (!user || user.role !== expectedRole) {
    // Don't leave a non-staff account signed in from the staff portal
    await supabase.auth.signOut();
    return { user: null, error: `This account does not have ${expectedRole} access.` };
  }

  return { user, error: null };
}

/**
 * Returns the signed-in user if their profile has the given role,
 * otherwise null. Used to restore admin/rider sessions on reload.
 */
export async function getStaffUser(expectedRole) {
  if (!isSupabaseReady()) return null;
  const user = await getCurrentUser();
  return user && user.role === expectedRole ? user : null;
}

/**
 * Calls `callback` when the session ends (sign-out here or in another
 * tab, or an expired refresh token). Returns an unsubscribe function.
 */
export function onSignedOut(callback) {
  if (!isSupabaseReady()) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') callback();
  });
  return () => subscription.unsubscribe();
}

/**
 * Fetch the rider record linked to a login account (riders.user_id).
 * RLS only lets a rider read their own record.
 */
export async function getRiderForUser(userId) {
  if (!isSupabaseReady()) return { rider: null, error: 'Supabase not configured' };

  const { data, error } = await supabase
    .from('riders')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { rider: null, error: error.message };
  if (!data) return { rider: null, error: null };

  return {
    rider: {
      id:                    data.id,
      name:                  data.name,
      email:                 data.email,
      phone:                 data.phone,
      vehicle:               data.vehicle,
      vehicleType:           data.vehicle_type,
      licenseNo:             data.license_no,
      emergencyContactName:  data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      dateJoined:            data.date_joined,
      rating:                Number(data.rating ?? 5),
      hub:                   data.hub,
      accountStatus:         data.account_status,
      availabilityStatus:    data.availability_status,
      avatar:                data.avatar,
      initialLocation:       data.initial_location,
      currentLocation:       data.current_location,
      completedCount:        data.completed_count ?? 0,
      todayEarnings:         Number(data.today_earnings ?? 0)
    },
    error: null
  };
}

// ── Google Sign In ────────────────────────────────────────────

/**
 * Redirects to Google. After approval Google returns to this site and
 * the Supabase client finishes the sign-in automatically (?code=…).
 *
 * The return address is always the bare site URL, so it only has to match
 * the Supabase Redirect URLs allow-list. Which staff portal to reopen is
 * remembered in sessionStorage (survives the round trip in the same tab).
 *
 * @param {'admin'|'rider'|null} portal - staff portal to return to
 * @returns {{ error }} only if the redirect could not be started.
 */
export async function signInWithGoogle(portal = null) {
  if (!isSupabaseReady()) {
    return { error: 'Google sign-in is unavailable: Supabase is not configured.' };
  }

  try {
    if (portal) {
      sessionStorage.setItem(OAUTH_PORTAL_KEY, JSON.stringify({ portal, at: Date.now() }));
    } else {
      sessionStorage.removeItem(OAUTH_PORTAL_KEY);
    }
  } catch { /* storage blocked — user lands on the storefront instead */ }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/' }
  });

  return { error: error?.message || null };
}

const OAUTH_PORTAL_KEY = 'cz_oauth_portal';
const OAUTH_PORTAL_MAX_AGE_MS = 10 * 60 * 1000;

/**
 * The staff portal ('admin' | 'rider') a Google sign-in was started from,
 * if it was started in this tab in the last 10 minutes; otherwise null.
 */
export function getPendingOAuthPortal() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(OAUTH_PORTAL_KEY) || 'null');
    if (saved && Date.now() - saved.at < OAUTH_PORTAL_MAX_AGE_MS) return saved.portal;
  } catch { /* ignore */ }
  return null;
}

/** True when any Supabase session exists (regardless of role). */
export async function hasSession() {
  if (!isSupabaseReady()) return false;
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/** True when this page load is the return from a Google sign-in for `portal`. */
export function isReturningFromPortalOAuth(portal) {
  return getPendingOAuthPortal() === portal;
}

/** Forget the pending portal and leave the address bar on #admin / #rider. */
export function clearPortalOAuthParams(hash) {
  try { sessionStorage.removeItem(OAUTH_PORTAL_KEY); } catch { /* ignore */ }
  window.history.replaceState(null, '', window.location.pathname + '#' + hash);
}

// ── Sign Out ──────────────────────────────────────────────────

export async function signOut() {
  if (!isSupabaseReady()) {
    localStorage.removeItem('cz_user');
    return { error: null };
  }
  const { error } = await supabase.auth.signOut();
  return { error: error?.message || null };
}

// ── Get Current Session ───────────────────────────────────────

/**
 * Returns the current user from an active Supabase session,
 * or from localStorage in offline mode.
 */
export async function getCurrentUser() {
  if (!isSupabaseReady()) {
    try {
      const stored = localStorage.getItem('cz_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return profile ? profileToUser(profile) : null;
}

// ── Update Profile ────────────────────────────────────────────

export async function updateProfile(userId, updates) {
  if (!isSupabaseReady()) {
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

  const { error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId);

  if (error) return { user: null, error: error.message };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { user: profile ? profileToUser(profile) : null, error: null };
}

// ── Auth State Listener ───────────────────────────────────────

/**
 * Subscribe to auth state changes (sign in / sign out).
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseReady()) return () => {};

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (!session?.user) {
        callback(event, null);
        return;
      }
      // Supabase calls made directly inside this callback can deadlock the
      // auth client (e.g. while it finishes a Google sign-in), so defer.
      setTimeout(async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        callback(event, profile ? profileToUser(profile) : null);
      }, 0);
    }
  );

  return () => subscription.unsubscribe();
}
