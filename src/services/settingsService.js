/**
 * settingsService.js
 * ──────────────────────────────────────────────────────────────
 * Store-wide settings in Firestore (`store_settings` collection).
 * Everyone can read them; only admins can write (see firestore.rules).
 */

import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';

const bankAccountRef = () => doc(db, 'store_settings', 'bank_account');

/** Live store bank account; calls back with null until an admin has saved one. */
export function subscribeBankAccount(callback) {
  if (!isFirebaseReady()) return () => {};
  return onSnapshot(bankAccountRef(),
    (snap) => callback(snap.exists() ? snap.data().value : null),
    (err) => console.error('[settings] bank account subscribe failed:', err));
}

/** Admin: save the store bank account shown to every customer at checkout. */
export async function saveBankAccount(account) {
  if (!isFirebaseReady()) return { error: null };
  try {
    await setDoc(bankAccountRef(), { value: account, updated_at: new Date().toISOString() });
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}
