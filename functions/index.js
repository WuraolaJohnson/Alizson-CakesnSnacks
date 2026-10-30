/**
 * verifyPayment — callable Cloud Function (replaces Supabase's verify-payment).
 * Checks a Paystack reference with the secret key and, if the amount covers
 * the order total, marks the order Paid. Browsers can't mark orders Paid
 * themselves (see firestore.rules).
 *
 * Set the key once:  firebase functions:secrets:set PAYSTACK_SECRET_KEY
 * Deploy:            firebase deploy --only functions
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();
const PAYSTACK_SECRET_KEY = defineSecret('PAYSTACK_SECRET_KEY');

export const verifyPayment = onCall({ secrets: [PAYSTACK_SECRET_KEY] }, async (request) => {
  const reference = request.data?.reference;
  if (!reference || typeof reference !== 'string') {
    throw new HttpsError('invalid-argument', 'A payment reference is required.');
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY.value()}` }
  });
  const body = await res.json();
  const tx = body?.data;
  if (!res.ok || tx?.status !== 'success') {
    return { status: tx?.status || 'failed', data: tx || null };
  }

  const orderId = tx.metadata?.order_id;
  if (!orderId) throw new HttpsError('failed-precondition', 'Payment has no order attached.');

  const ref = getFirestore().collection('orders').doc(String(orderId));
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Order not found.');

  const order = snap.data();
  if (tx.currency !== 'NGN' || tx.amount < Math.round(Number(order.total) * 100)) {
    throw new HttpsError('failed-precondition', 'Amount paid does not cover the order total.');
  }

  const now = new Date().toISOString();
  await ref.update({
    payment_status: 'Paid',
    payment_reference: reference,
    payment_confirmed_at: now,
    updated_at: now
  });

  return { status: 'success', data: { reference, amount: tx.amount, order_id: orderId } };
});
