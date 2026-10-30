/**
 * One-off copy of all Supabase data into Firebase.
 *
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   node scripts/migrate-supabase-to-firebase.mjs
 *
 * - Auth users keep the same uid, so profiles and orders still line up.
 *   Google users keep signing in with Google. Passwords can't be exported,
 *   so email/password users must use "Forgot password" once.
 * - order_items and order_tracking_history are embedded in each order doc.
 * - riders.user_id is copied onto profiles/{uid}.rider_id for security rules.
 * Safe to re-run: every write is an upsert by id.
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const { SUPABASE_SERVICE_ROLE_KEY } = process.env;
// Accept the URL with or without a trailing /rest/v1/ (as the Data API page shows it)
const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (and GOOGLE_APPLICATION_CREDENTIALS).');
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const headers = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` };

async function getJson(path) {
  const res = await fetch(`${SUPABASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

/** All rows of a table, 1000 at a time. */
async function rows(table) {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await getJson(`/rest/v1/${table}?select=*&limit=1000&offset=${offset}`);
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

async function writeAll(collection, docs) {
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    docs.slice(i, i + 400).forEach(([id, data]) =>
      batch.set(db.collection(collection).doc(String(id)), data, { merge: true }));
    await batch.commit();
  }
  console.log(`${collection}: ${docs.length}`);
}

const withoutId = ({ id, ...rest }) => rest;

// ── Auth users ───────────────────────────────────────────────
const users = [];
for (let page = 1; ; page++) {
  const { users: batch = [] } = await getJson(`/auth/v1/admin/users?page=${page}&per_page=1000`);
  users.push(...batch);
  if (batch.length < 1000) break;
}
for (let i = 0; i < users.length; i += 1000) {
  const result = await getAuth().importUsers(users.slice(i, i + 1000).map(u => ({
    uid: u.id,
    email: u.email || undefined,
    emailVerified: !!u.email_confirmed_at,
    displayName: u.user_metadata?.full_name || u.user_metadata?.name || undefined,
    photoURL: u.user_metadata?.avatar_url || undefined,
    providerData: (u.identities || [])
      .filter(id => id.provider === 'google')
      .map(id => ({ uid: id.identity_data?.sub || id.id, providerId: 'google.com', email: u.email }))
  })));
  result.errors.forEach(e => console.warn(`user ${users[i + e.index].email}: ${e.error.message}`));
}
console.log(`auth users: ${users.length}`);

// ── Tables ───────────────────────────────────────────────────
const riders = await rows('riders');
const riderByUser = Object.fromEntries(riders.filter(r => r.user_id).map(r => [r.user_id, r.id]));

const profiles = await rows('profiles');
await writeAll('profiles', profiles.map(p => [p.id, {
  ...withoutId(p),
  ...(riderByUser[p.id] ? { rider_id: riderByUser[p.id] } : {})
}]));

await writeAll('riders', riders.map(r => [r.id, withoutId(r)]));
await writeAll('products', (await rows('products')).map(p => [p.id, withoutId(p)]));

const [orders, items, history] = await Promise.all(
  ['orders', 'order_items', 'order_tracking_history'].map(rows));
const byOrder = (list) => list.reduce((m, r) => ((m[r.order_id] ||= []).push(r), m), {});
const itemsBy = byOrder(items);
const historyBy = byOrder(history);
const byCreated = (a, b) => String(a.created_at || '').localeCompare(String(b.created_at || ''));
await writeAll('orders', orders.map(o => [o.id, {
  ...withoutId(o),
  items: (itemsBy[o.id] || []).sort(byCreated).map(({ id, order_id, ...i }) => i),
  tracking_history: (historyBy[o.id] || []).sort(byCreated).map(({ id, order_id, ...h }) => h)
}]));

await writeAll('feedback', (await rows('feedback')).map(f => [f.id, withoutId(f)]));
await writeAll('delivery_locations', (await rows('delivery_locations')).map(d => [d.id, withoutId(d)]));
await writeAll('store_settings', (await rows('store_settings')).map(({ key, ...s }) => [key, s]));

console.log('Done.');
