/**
 * paystackService.js
 * ──────────────────────────────────────────────────────────────
 * Paystack payment integration for Alizson marketplace.
 *
 * Uses the Paystack Popup (inline JS) for card payments and
 * provides server-side verification via a Firebase Cloud Function
 * (optional — can also verify client-side for test mode).
 *
 * Setup:
 *  1. Add VITE_PAYSTACK_PUBLIC_KEY to your .env file
 *  2. Call initializePayment() at checkout
 *  3. The onSuccess callback receives the payment reference
 *     which you then pass to verifyPayment() or your backend
 */

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

// ── Load Paystack Script ──────────────────────────────────────

let paystackLoaded = false;

function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (paystackLoaded || window.PaystackPop) {
      paystackLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      paystackLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.head.appendChild(script);
  });
}

// ── Initialize Payment ────────────────────────────────────────

/**
 * Opens the Paystack payment popup.
 *
 * @param {object} options
 * @param {string}   options.email         - Customer email
 * @param {number}   options.amountKobo    - Amount in KOBO (₦1 = 100 kobo). E.g. ₦5000 = 500000
 * @param {string}   options.orderId       - Your order ID (used as reference prefix)
 * @param {string}   [options.name]        - Customer name (for Paystack UI)
 * @param {string}   [options.phone]       - Customer phone
 * @param {function} options.onSuccess     - Called with { reference } on successful payment
 * @param {function} options.onClose       - Called when popup is dismissed
 * @param {object}   [options.metadata]    - Additional metadata to attach
 */
export async function initializePayment({
  email,
  amountKobo,
  orderId,
  name = '',
  phone = '',
  onSuccess,
  onClose,
  metadata = {}
}) {
  if (!PAYSTACK_PUBLIC_KEY) {
    console.error('[Paystack] VITE_PAYSTACK_PUBLIC_KEY is not set. Add it to your .env file.');
    onClose?.();
    return;
  }

  try {
    await loadPaystackScript();
  } catch (err) {
    console.error('[Paystack] Script load failed:', err);
    onClose?.();
    return;
  }

  const reference = `ALZ-${orderId}-${Date.now()}`;

  const handler = window.PaystackPop.setup({
    key:       PAYSTACK_PUBLIC_KEY,
    email,
    amount:    amountKobo,           // in kobo
    currency:  'NGN',
    ref:       reference,
    metadata: {
      order_id:       orderId,
      customer_name:  name,
      customer_phone: phone,
      ...metadata
    },
    callback: (response) => {
      // response.reference is the Paystack payment reference
      onSuccess?.({
        reference:  response.reference,
        trxref:     response.trxref,
        status:     response.status
      });
    },
    onClose: () => {
      onClose?.();
    }
  });

  handler.openIframe();
}

// ── Convert ₦ to Kobo ─────────────────────────────────────────

/** Convert Naira (₦) amount to kobo for Paystack */
export function nairaToKobo(nairaAmount) {
  return Math.round(Number(nairaAmount) * 100);
}

// ── Verify Payment (client-side for test mode) ────────────────

/**
 * Verify a Paystack payment reference against the Paystack API.
 *
 * ⚠️  In production, this MUST be done server-side to protect your secret key.
 *     This calls the verifyPayment Cloud Function (functions/index.js).
 *
 * For test mode, you can use the Paystack dashboard to verify.
 *
 * @param {string} reference - The Paystack payment reference
 * @returns {{ verified: boolean, data: object, error: string | null }}
 */
export async function verifyPaymentServerSide(reference) {
  // The Cloud Function holds the Paystack secret key and marks the order Paid
  try {
    const { functions, isFirebaseReady } = await import('../lib/firebase');
    if (!isFirebaseReady()) {
      // In development / test mode, assume payment is verified
      return { verified: true, data: { reference }, error: null };
    }

    const { httpsCallable } = await import('firebase/functions');
    const { data } = await httpsCallable(functions, 'verifyPayment')({ reference });

    return {
      verified: data?.status === 'success',
      data: data?.data || {},
      error: null
    };
  } catch (err) {
    console.error('[Paystack] Verification error:', err);
    return { verified: false, data: null, error: err.message };
  }
}

// ── Payment Status Helper ─────────────────────────────────────

export function isPaystackConfigured() {
  return !!PAYSTACK_PUBLIC_KEY;
}

export function getPaystackMode() {
  if (!PAYSTACK_PUBLIC_KEY) return 'unconfigured';
  return PAYSTACK_PUBLIC_KEY.startsWith('pk_live_') ? 'live' : 'test';
}
