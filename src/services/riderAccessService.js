/**
 * riderAccessService.js
 * ──────────────────────────────────────────────────────────────
 * Admin approval of rider logins. Signing in on the rider portal without
 * rider access files a request at rider_requests/{uid}; an admin approves it
 * by linking the account to a rider record (profiles.role = 'rider',
 * profiles.rider_id, riders.user_id), rejects it, or later revokes access.
 */

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteField,
  onSnapshot, writeBatch
} from 'firebase/firestore';
import { auth, db, isFirebaseReady } from '../lib/firebase';

/**
 * Files a request for the signed-in user (call before signing them out).
 * @returns {'pending'|'rejected'|null} the request's status
 */
export async function requestRiderAccess() {
  const user = auth?.currentUser;
  if (!isFirebaseReady() || !user) return null;
  const ref = doc(db, 'rider_requests', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data().status;
    await setDoc(ref, {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || (user.email || '').split('@')[0],
      status: 'pending',
      created_at: new Date().toISOString()
    });
    return 'pending';
  } catch (err) {
    console.error('[riderAccess] request failed:', err);
    return null;
  }
}

/** Message shown on the rider portal for a request status. */
export function riderRequestMessage(status) {
  if (status === 'rejected') return 'Your request for rider access was declined. Please contact the admin.';
  if (status === 'pending') return 'Your request for rider access has been sent. You can sign in once an admin approves it.';
  return 'This account does not have rider access. Please contact the admin.';
}

/** Admin: live list of all requests, newest first. Returns unsubscribe. */
export function subscribeRiderRequests(callback) {
  if (!isFirebaseReady()) return () => {};
  return onSnapshot(collection(db, 'rider_requests'), (snap) => {
    callback(snap.docs.map(d => d.data())
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))));
  }, (err) => console.error('[riderAccess] subscribe failed:', err));
}

/** Firestore rider doc → the camelCase shape the admin and rider screens use. */
export function dbToRider(d) {
  const loc = d.current_location || d.initial_location || null;
  return {
    id:                    d.id,
    name:                  d.name || 'Rider',
    email:                 d.email || '',
    phone:                 d.phone || '',
    vehicle:               d.vehicle || '',
    vehicleType:           d.vehicle_type || 'Motorcycle',
    licenseNo:             d.license_no || '',
    emergencyContactName:  d.emergency_contact_name || '',
    emergencyContactPhone: d.emergency_contact_phone || '',
    dateJoined:            d.date_joined || '',
    rating:                d.rating == null ? null : Number(d.rating),
    hub:                   d.hub || '',
    accountStatus:         d.account_status || 'Active',
    availabilityStatus:    d.availability_status || 'Offline',
    avatar:                d.avatar || '/logo.jpeg',
    initialLocation:       d.initial_location || loc,
    currentLocation:       loc,
    completedCount:        d.completed_count ?? 0,
    todayEarnings:         Number(d.today_earnings ?? 0)
  };
}

/** Admin: live list of rider records. Returns unsubscribe. */
export function subscribeRiders(callback) {
  if (!isFirebaseReady()) return () => {};
  return onSnapshot(collection(db, 'riders'),
    (snap) => callback(snap.docs.map(d => dbToRider({ id: d.id, ...d.data() }))),
    (err) => console.error('[riderAccess] riders subscribe failed:', err));
}

/** Admin: rider records from Firestore (id, name, email, user_id). */
export async function fetchRiderRecords() {
  if (!isFirebaseReady()) return [];
  const snap = await getDocs(collection(db, 'riders'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

/**
 * Admin: approve a request, linking it to an existing rider record, or to a
 * new one made from the request's name and email when riderId is null.
 */
export async function approveRiderRequest(request, riderId = null) {
  try {
    const now = new Date().toISOString();
    const batch = writeBatch(db);
    const id = riderId || `RDR-${Date.now().toString(36).toUpperCase()}`;
    const riderRef = doc(db, 'riders', id);

    if (riderId) {
      batch.update(riderRef, { user_id: request.uid, account_status: 'Active', updated_at: now });
    } else {
      batch.set(riderRef, {
        user_id: request.uid,
        name: request.name,
        email: request.email,
        phone: '',
        account_status: 'Active',
        availability_status: 'Offline',
        rating: null,
        completed_count: 0,
        today_earnings: 0,
        date_joined: now.slice(0, 10),
        created_at: now,
        updated_at: now
      });
    }
    batch.update(doc(db, 'profiles', request.uid), { role: 'rider', rider_id: id, updated_at: now });
    batch.update(doc(db, 'rider_requests', request.uid), { status: 'approved', rider_id: id, decided_at: now });
    await batch.commit();
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

/** Admin: decline a request. */
export async function rejectRiderRequest(uid) {
  try {
    await updateDoc(doc(db, 'rider_requests', uid), { status: 'rejected', decided_at: new Date().toISOString() });
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Admin: remove a rider's sign-in access (the rider record and its history
 * stay). Clears the request too, so the person may ask again later.
 */
export async function revokeRiderAccess(rider) {
  try {
    const now = new Date().toISOString();
    const batch = writeBatch(db);
    batch.update(doc(db, 'riders', rider.id), { user_id: null, updated_at: now });
    batch.update(doc(db, 'profiles', rider.user_id), { role: 'customer', rider_id: deleteField(), updated_at: now });
    batch.delete(doc(db, 'rider_requests', rider.user_id));
    await batch.commit();
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}
