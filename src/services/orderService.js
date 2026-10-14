/**
 * orderService.js
 * ──────────────────────────────────────────────────────────────
 * Supabase-backed order operations for the Alizson marketplace.
 * Falls back gracefully to localStorage when Supabase is offline.
 */

import { supabase, isSupabaseReady } from '../lib/supabase';

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
    adminPaymentOverride:      row.admin_payment_override,
    cashPaymentConfirmedByRider: row.cash_payment_confirmed_by_rider,
    failureReason:             row.failure_reason,
    trackingHistory:           row.trackingHistory || [],  // joined separately
    items:                     row.items || []              // joined separately
  };
}

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
    status:                     order.status || 'Order Confirmed',
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
    updated_at:                 new Date().toISOString()
  };
}

// ── Fetch All Orders ──────────────────────────────────────────

export async function fetchAllOrders() {
  if (!isSupabaseReady()) return { orders: null, error: 'Supabase not configured' };

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      order_tracking_history(*)
    `)
    .order('iso_date', { ascending: false });

  if (error) return { orders: null, error: error.message };

  const orders = data.map(row => ({
    ...dbToOrder(row),
    items: (row.order_items || []).map(i => ({
      id:            i.product_id || i.id,
      name:          i.name,
      size:          i.size,
      flavour:       i.flavour,
      addOns:        i.add_ons || [],
      customMessage: i.custom_message,
      unitPrice:     Number(i.unit_price),
      quantity:      i.quantity,
      image:         i.image
    })),
    trackingHistory: (row.order_tracking_history || []).map(h => ({
      event:       h.event,
      statusStep:  h.status_step,
      timestamp:   h.timestamp,
      actor:       h.actor
    }))
  }));

  return { orders, error: null };
}

// ── Fetch Orders for a Customer ───────────────────────────────

export async function fetchCustomerOrders(customerId) {
  if (!isSupabaseReady()) return { orders: null, error: null };

  const { data, error } = await supabase
    .from('orders')
    .select(`*, order_items(*), order_tracking_history(*)`)
    .eq('customer_id', customerId)
    .order('iso_date', { ascending: false });

  if (error) return { orders: null, error: error.message };

  const orders = data.map(row => ({
    ...dbToOrder(row),
    items: (row.order_items || []).map(i => ({
      id: i.product_id || i.id,
      name: i.name,
      size: i.size,
      flavour: i.flavour,
      addOns: i.add_ons || [],
      customMessage: i.custom_message,
      unitPrice: Number(i.unit_price),
      quantity: i.quantity,
      image: i.image
    })),
    trackingHistory: (row.order_tracking_history || []).map(h => ({
      event: h.event,
      statusStep: h.status_step,
      timestamp: h.timestamp,
      actor: h.actor
    }))
  }));

  return { orders, error: null };
}

// ── Create Order ──────────────────────────────────────────────

export async function createOrderInDb(order) {
  if (!isSupabaseReady()) return { error: null };

  const row = orderToDb(order);

  // The database refuses orders that arrive already marked Paid — a browser
  // can't be trusted to say a payment succeeded. Card orders are saved as
  // 'Pending Verification' and the verify-payment Edge Function marks them Paid.
  if (row.payment_status === 'Paid') row.payment_status = 'Pending Verification';

  // Insert order
  const { error: orderError } = await supabase
    .from('orders')
    .insert(row);

  if (orderError) {
    console.error('[orderService] insert order error:', orderError);
    return { error: orderError.message };
  }

  // Insert order items
  if (order.items && order.items.length > 0) {
    const itemRows = order.items.map(item => ({
      order_id:       order.id,
      product_id:     item.id,
      name:           item.name,
      size:           item.size || null,
      flavour:        item.flavour || null,
      add_ons:        item.addOns || [],
      custom_message: item.customMessage || null,
      unit_price:     item.unitPrice || 0,
      quantity:       item.quantity || 1,
      image:          item.image || null
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemRows);

    if (itemsError) console.error('[orderService] insert items error:', itemsError);
  }

  // Insert initial tracking event
  if (order.trackingHistory && order.trackingHistory.length > 0) {
    const historyRows = order.trackingHistory.map(h => ({
      order_id:    order.id,
      event:       h.event,
      status_step: h.statusStep,
      timestamp:   h.timestamp,
      actor:       h.actor
    }));

    const { error: histError } = await supabase
      .from('order_tracking_history')
      .insert(historyRows);

    if (histError) console.error('[orderService] insert tracking history error:', histError);
  }

  return { error: null };
}

// ── Update Order Status ───────────────────────────────────────

export async function updateOrderStatusInDb(orderId, updates, trackingEvent) {
  if (!isSupabaseReady()) return { error: null };

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
  if (updates.adminPaymentOverride !== undefined) dbUpdates.admin_payment_override = updates.adminPaymentOverride;
  if (updates.cashPaymentConfirmedByRider !== undefined) dbUpdates.cash_payment_confirmed_by_rider = updates.cashPaymentConfirmedByRider;
  dbUpdates.updated_at = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('orders')
    .update(dbUpdates)
    .eq('id', orderId);

  if (updateError) return { error: updateError.message };

  // Append tracking event
  if (trackingEvent) {
    const { error: histError } = await supabase
      .from('order_tracking_history')
      .insert({
        order_id:    orderId,
        event:       trackingEvent.event,
        status_step: trackingEvent.statusStep,
        timestamp:   trackingEvent.timestamp,
        actor:       trackingEvent.actor
      });

    if (histError) console.error('[orderService] tracking history error:', histError);
  }

  return { error: null };
}

// ── Real-time Subscription ────────────────────────────────────

/**
 * Subscribe to real-time order changes.
 * @param {function} onOrderChange - Called with (event, order) on each change.
 * @returns {function} unsubscribe
 */
export function subscribeToOrders(onOrderChange) {
  if (!isSupabaseReady()) return () => {};

  const channel = supabase
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      async (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        onOrderChange(eventType, newRow ? dbToOrder(newRow) : null, oldRow ? dbToOrder(oldRow) : null);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to real-time changes on a specific order.
 */
export function subscribeToOrder(orderId, onUpdate) {
  if (!isSupabaseReady()) return () => {};

  const channel = supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => {
        if (payload.new) onUpdate(dbToOrder(payload.new));
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'order_tracking_history', filter: `order_id=eq.${orderId}` },
      (payload) => {
        if (payload.new) {
          onUpdate(null, {
            event:      payload.new.event,
            statusStep: payload.new.status_step,
            timestamp:  payload.new.timestamp,
            actor:      payload.new.actor
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
