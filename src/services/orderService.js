/**
 * orderService.js
 * ──────────────────────────────────────────────────────────────
 * Firestore-backed order operations for the Alizson marketplace.
 * Each orders/{id} doc embeds its `items` and `tracking_history` arrays.
 * Falls back gracefully to localStorage when Firebase is not configured.
 */

import {
  collection, doc, getDocs, setDoc, updateDoc, onSnapshot, query, where, orderBy, arrayUnion
} from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';

// ── Helpers ───────────────────────────────────────────────────

/** Map DB row → camelCase app order object */
export function dbToOrder(row) {
  return {
    id:                        row.id,
    store:                     row.store,
    storeName:                 row.store_name,
    customerId:                row.customer_id,
    customerName:              row.customer_name,
    customerEmail:             row.customer_email,
    customerPhone:             row.customer_phone,
    date:                      row.date,
    time:                      row.time,
    isoDate:                   row.iso_date,
    status:                    row.status,
    statusStep:                row.status_step || 0,
    paymentMethod:             row.payment_method,
    paymentStatus:             row.payment_status,
    paymentReference:          row.payment_reference,
    paymentConfirmedAt:        row.payment_confirmed_at,
    subtotal:                  Number(row.subtotal) || 0,
    deliveryFee:               Number(row.delivery_fee) || 0,
    giftFee:                   Number(row.gift_fee) || 0,
    total:                     Number(row.total) || 0,
    deliveryAddress:           row.delivery_address,
    lga:                       row.lga,
    state:                     row.state,
    latitude:                  Number(row.latitude) || 0,
    longitude:                 Number(row.longitude) || 0,
    deliverySlot:              row.delivery_slot,
    specialInstructions:       row.special_instructions,
    fulfillmentType:           row.fulfillment_type || 'delivery',
    deliveryPin:               row.delivery_pin,
    assignedRider:             row.assigned_rider,
    assignmentState:           row.assignment_state || 'Unassigned',
    acceptedByRiderId:         row.accepted_by_rider_id,
    acceptedByRiderName:       row.accepted_by_rider_name,
    riderLocation:             row.rider_location,
    giftOptions:               row.gift_options,
    bankTransferVerifiedBy:    row.bank_transfer_verified_by,
    stockDeducted:             row.stock_deducted === true,
    adminPaymentOverride:      row.admin_payment_override,
    cashPaymentConfirmedByRider: row.cash_payment_confirmed_by_rider,
    failureReason:             row.failure_reason,
    trackingHistory:           (row.tracking_history || []).map(dbToTracking),
    items:                     (row.items || []).map(dbToItem)
  };
}

function dbToItem(i) {
  return {
    id:            i.product_id || i.id,
    name:          i.name,
    size:          i.size,
    flavour:       i.flavour,
    addOns:        i.add_ons || [],
    customMessage: i.custom_message,
    unitPrice:     Number(i.unit_price),
    quantity:      i.quantity,
    image:         i.image
  };
}

function dbToTracking(h) {
  return { event: h.event, statusStep: h.status_step, timestamp: h.timestamp, actor: h.actor };
}

function trackingToDb(h) {
  return {
    event:       h.event,
    status_step: h.statusStep ?? null,
    timestamp:   h.timestamp ?? null,
    actor:       h.actor ?? null,
    created_at:  new Date().toISOString()
  };
}

const snapToOrders = (snap) => snap.docs.map(d => dbToOrder({ id: d.id, ...d.data() }));

/** Map camelCase app order → DB row */
function orderToDb(order) {
  return {
    id:                         order.id,
    store:                      order.store,
    store_name:                 order.storeName,
    customer_id:                order.customerId || null,
    customer_name:              order.customerName,
    customer_email:             order.customerEmail,
    customer_phone:             order.customerPhone,
    date:                       order.date,
    time:                       order.time,
    iso_date:                   order.isoDate || new Date().toISOString(),
    status:                     order.status || 'Pending',
    status_step:                order.statusStep || 0,
    payment_method:             order.paymentMethod,
    payment_status:             order.paymentStatus || 'Pending',
    payment_reference:          order.paymentReference || null,
    payment_confirmed_at:       order.paymentConfirmedAt || null,
    subtotal:                   order.subtotal || 0,
    delivery_fee:               order.deliveryFee || 0,
    gift_fee:                   order.giftFee || 0,
    total:                      order.total || 0,
    delivery_address:           order.deliveryAddress,
    lga:                        order.lga,
    state:                      order.state,
    latitude:                   order.latitude || null,
    longitude:                  order.longitude || null,
    delivery_slot:              order.deliverySlot,
    special_instructions:       order.specialInstructions,
    fulfillment_type:           order.fulfillmentType || 'delivery',
    delivery_pin:               order.deliveryPin,
    assigned_rider:             order.assignedRider || null,
    assignment_state:           order.assignmentState || 'Unassigned',
    accepted_by_rider_id:       order.acceptedByRiderId || null,
    accepted_by_rider_name:     order.acceptedByRiderName || null,
    rider_location:             order.riderLocation || null,
    gift_options:               order.giftOptions || null,
    bank_transfer_verified_by:  order.bankTransferVerifiedBy || null,
    admin_payment_override:     order.adminPaymentOverride || false,
    cash_payment_confirmed_by_rider: order.cashPaymentConfirmedByRider || false,
    failure_reason:             order.failureReason || null,
    created_at:                 new Date().toISOString(),
    updated_at:                 new Date().toISOString()
  };
}

// ── Fetch All Orders ──────────────────────────────────────────

export async function fetchAllOrders() {
  if (!isFirebaseReady()) return { orders: null, error: 'Firebase not configured' };

  try {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('iso_date', 'desc')));
    return { orders: snapToOrders(snap), error: null };
  } catch (err) {
    return { orders: null, error: err.message };
  }
}

// ── Fetch Orders for a Customer ───────────────────────────────

export async function fetchCustomerOrders(customerId) {
  if (!isFirebaseReady()) return { orders: null, error: null };

  try {
    const snap = await getDocs(query(
      collection(db, 'orders'),
      where('customer_id', '==', customerId),
      orderBy('iso_date', 'desc')
    ));
    return { orders: snapToOrders(snap), error: null };
  } catch (err) {
    return { orders: null, error: err.message };
  }
}

// ── Create Order ──────────────────────────────────────────────

export async function createOrderInDb(order) {
  if (!isFirebaseReady()) return { error: null };

  const row = orderToDb(order);

  // Security rules refuse orders that arrive already marked Paid — a browser
  // can't be trusted to say a payment succeeded. Card orders are saved as
  // 'Pending Verification' and the verifyPayment Cloud Function marks them Paid.
  if (row.payment_status === 'Paid') row.payment_status = 'Pending Verification';

  row.items = (order.items || []).map(item => ({
    product_id:     item.id ?? null,
    name:           item.name ?? null,
    size:           item.size || null,
    flavour:        item.flavour || null,
    add_ons:        item.addOns || [],
    custom_message: item.customMessage || null,
    unit_price:     item.unitPrice || 0,
    quantity:       item.quantity || 1,
    image:          item.image || null
  }));
  row.tracking_history = (order.trackingHistory || []).map(trackingToDb);

  try {
    await setDoc(doc(db, 'orders', String(order.id)), JSON.parse(JSON.stringify(row)));
    return { error: null };
  } catch (err) {
    console.error('[orderService] create order error:', err);
    return { error: err.message };
  }
}

// ── Update Order Status ───────────────────────────────────────

export async function updateOrderStatusInDb(orderId, updates, trackingEvent) {
  if (!isFirebaseReady()) return { error: null };

  const dbUpdates = {};
  if (updates.status !== undefined)              dbUpdates.status = updates.status;
  if (updates.statusStep !== undefined)          dbUpdates.status_step = updates.statusStep;
  if (updates.assignmentState !== undefined)     dbUpdates.assignment_state = updates.assignmentState;
  if (updates.acceptedByRiderId !== undefined)   dbUpdates.accepted_by_rider_id = updates.acceptedByRiderId;
  if (updates.acceptedByRiderName !== undefined) dbUpdates.accepted_by_rider_name = updates.acceptedByRiderName;
  if (updates.assignedRider !== undefined)       dbUpdates.assigned_rider = updates.assignedRider;
  if (updates.paymentStatus !== undefined)       dbUpdates.payment_status = updates.paymentStatus;
  if (updates.paymentReference !== undefined)    dbUpdates.payment_reference = updates.paymentReference;
  if (updates.riderLocation !== undefined)       dbUpdates.rider_location = updates.riderLocation;
  if (updates.failureReason !== undefined)       dbUpdates.failure_reason = updates.failureReason;
  if (updates.bankTransferVerifiedBy !== undefined) dbUpdates.bank_transfer_verified_by = updates.bankTransferVerifiedBy;
  if (updates.stockDeducted !== undefined)       dbUpdates.stock_deducted = updates.stockDeducted;
  if (updates.paymentConfirmedAt !== undefined)  dbUpdates.payment_confirmed_at = updates.paymentConfirmedAt;
  if (updates.adminPaymentOverride !== undefined) dbUpdates.admin_payment_override = updates.adminPaymentOverride;
  if (updates.cashPaymentConfirmedByRider !== undefined) dbUpdates.cash_payment_confirmed_by_rider = updates.cashPaymentConfirmedByRider;
  dbUpdates.updated_at = new Date().toISOString();

  const events = [].concat(trackingEvent || []);
  if (events.length) dbUpdates.tracking_history = arrayUnion(...events.map(trackingToDb));
  // Firestore rejects undefined, even inside objects like assigned_rider
  Object.assign(dbUpdates, JSON.parse(JSON.stringify({ ...dbUpdates, tracking_history: undefined })));

  try {
    await updateDoc(doc(db, 'orders', String(orderId)), dbUpdates);
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

// ── Real-time Subscription ────────────────────────────────────

/**
 * Subscribe to real-time order changes.
 * @param {function} onOrderChange - Called with (event, order) on each change.
 * @returns {function} unsubscribe
 */
export function subscribeToOrders(onOrderChange) {
  if (!isFirebaseReady()) return () => {};

  const typeMap = { added: 'INSERT', modified: 'UPDATE', removed: 'DELETE' };
  let initial = true;
  return onSnapshot(collection(db, 'orders'), (snap) => {
    // Skip the first snapshot: it lists existing orders, not changes
    if (initial) { initial = false; return; }
    snap.docChanges().forEach(({ type, doc: d }) => {
      const order = dbToOrder({ id: d.id, ...d.data() });
      onOrderChange(typeMap[type], type === 'removed' ? null : order, type === 'removed' ? order : null);
    });
  }, (err) => console.error('[orderService] subscribeToOrders error:', err));
}

/**
 * Live orders for the signed-in user, as the security rules allow: everything
 * for an admin; for a rider, orders waiting for a rider plus their own; for a
 * customer, their own. Calls onOrders(list) on every change. Returns unsubscribe.
 */
export function subscribeOrdersForUser(user, onOrders) {
  if (!isFirebaseReady() || !user) return () => {};
  const col = collection(db, 'orders');
  const roles = user.roles || [user.role];
  let queries;
  if (roles.includes('admin')) {
    queries = [col];
  } else {
    // Everyone is a customer; a rider also sees deliveries
    queries = [query(col, where('customer_id', '==', user.id))];
    if (roles.includes('rider') && user.riderId) {
      queries.push(
        query(col, where('assignment_state', '==', 'Pending'), where('accepted_by_rider_id', '==', null)),
        query(col, where('accepted_by_rider_id', '==', user.riderId)),
        query(col, where('assigned_rider.id', '==', user.riderId))
      );
    }
  }

  const results = queries.map(() => []);
  const emit = () => {
    const byId = new Map();
    results.flat().forEach(o => byId.set(o.id, o));
    onOrders([...byId.values()].sort((a, b) => String(b.isoDate || '').localeCompare(String(a.isoDate || ''))));
  };
  const unsubs = queries.map((q, i) => onSnapshot(q,
    (snap) => { results[i] = snapToOrders(snap); emit(); },
    (err) => console.error('[orderService] orders subscribe error:', err)));
  return () => unsubs.forEach(u => u());
}

/**
 * Subscribe to real-time changes on a specific order.
 */
export function subscribeToOrder(orderId, onUpdate) {
  if (!isFirebaseReady()) return () => {};

  // Tracking history is embedded, so the updated order carries any new events
  return onSnapshot(doc(db, 'orders', String(orderId)), (d) => {
    if (d.exists()) onUpdate(dbToOrder({ id: d.id, ...d.data() }));
  }, (err) => console.error('[orderService] subscribeToOrder error:', err));
}
