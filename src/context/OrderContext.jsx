import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initialOrders } from '../data/initialOrders';
import { initialFeedback } from '../data/initialFeedback';
import { checkGeofenceStatus } from '../utils/trackingRouting';
import { OGUN_DELIVERY_LOCATIONS } from '../data/ogunLocations';
import { createOrderInDb, updateOrderStatusInDb, subscribeOrdersForUser } from '../services/orderService';
import { onAuthStateChange, hasRole } from '../services/authService';
import { subscribeBankAccount, saveBankAccount, subscribeDeliveryPrices, saveDeliveryPrices } from '../services/settingsService';
import { subscribeRiders, subscribeOwnRider, saveRiderAvailability, saveRiderProfile } from '../services/riderAccessService';
import { isFirebaseReady } from '../lib/firebase';
import { useProducts } from './ProductContext';

const OrderContext = createContext();

export const DEFAULT_STORE_BANK_ACCOUNT = {
  bankName: 'OPay',
  accountNumber: '7030144746',
  accountName: 'Elizabeth Ajoke Johnson',
  narrationPrompt: 'Your Full Name or Order ID'
};

export const ORDER_STATUS_STEPS = [
  { key: 'Order Confirmed', label: 'Order Confirmed', step: 0, icon: '📋' },
  { key: 'Preparing', label: 'Preparing', step: 1, icon: '👨‍🍳' },
  { key: 'Ready for Dispatch', label: 'Ready for Dispatch', step: 2, icon: '📦' },
  { key: 'Picked Up', label: 'Picked Up', step: 3, icon: '🛵' },
  { key: 'Out for Delivery', label: 'Out for Delivery', step: 4, icon: '🚚' },
  { key: 'Nearby', label: 'Nearby', step: 5, icon: '📍' },
  { key: 'Delivered', label: 'Delivered', step: 6, icon: '🎉' }
];

// New orders wait as 'Pending' until the admin confirms or declines them.
// Neither is a step on the delivery timeline.
export const PRE_CONFIRMATION_STATUSES = ['Pending', 'Declined'];

// Valid status transitions — enforced by updateOrderStatus
export const VALID_TRANSITIONS = {
  'Pending': ['Order Confirmed', 'Declined'],
  'Order Confirmed': ['Preparing', 'Declined'],
  'Preparing': ['Ready for Dispatch', 'Declined'],
  'Declined': [],
  'Ready for Dispatch': ['Picked Up'],
  'Picked Up': ['Out for Delivery'],
  'Out for Delivery': ['Nearby'],
  'Nearby': ['Delivered'],
  'Delivered': []
};

// Sample riders for offline development only (no Firebase project configured)
export const INITIAL_RIDERS = [
  {
    id: 'rdr-001',
    name: 'Segun Adebayo',
    email: 'segun.adebayo@alizson.com',
    phone: '+234 802 111 2233',
    vehicle: 'Yamaha Express Bike (#OG-104-AB)',
    vehicleType: 'Motorcycle',
    licenseNo: 'OG-DRV-882091',
    emergencyContactName: 'Bisi Adebayo (Wife)',
    emergencyContactPhone: '+234 803 999 1122',
    dateJoined: 'January 15, 2025',
    rating: 4.9,
    hub: 'Abeokuta Central Hub',
    accountStatus: 'Active',
    availabilityStatus: 'Available', // 'Available' | 'Busy' | 'Offline' | 'Break'
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    initialLocation: { lat: 7.1450, lng: 3.3280 },
    currentLocation: { lat: 7.1450, lng: 3.3280, timestamp: new Date().toISOString() },
    completedCount: 142,
    todayEarnings: 7500
  },
  {
    id: 'rdr-002',
    name: 'Taiwo Ogunyemi',
    email: 'taiwo.ogunyemi@alizson.com',
    phone: '+234 813 444 5566',
    vehicle: 'Honda Cargo Dispatch (#OG-892-KT)',
    vehicleType: 'Cargo Bike',
    licenseNo: 'OG-DRV-993102',
    emergencyContactName: 'Kehinde Ogunyemi (Brother)',
    emergencyContactPhone: '+234 814 222 3344',
    dateJoined: 'March 01, 2025',
    rating: 4.8,
    hub: 'Ado-Odo/Ota Logistics Hub',
    accountStatus: 'Active',
    availabilityStatus: 'Available',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    initialLocation: { lat: 6.6900, lng: 3.2300 },
    currentLocation: { lat: 6.6900, lng: 3.2300, timestamp: new Date().toISOString() },
    completedCount: 98,
    todayEarnings: 6000
  },
  {
    id: 'rdr-003',
    name: 'Emmanuel Okon',
    email: 'emmanuel.okon@alizson.com',
    phone: '+234 809 777 8899',
    vehicle: 'TVS Super Dispatch (#OG-551-IJ)',
    vehicleType: 'Motorcycle',
    licenseNo: 'OG-DRV-441203',
    emergencyContactName: 'Grace Okon (Sister)',
    emergencyContactPhone: '+234 809 888 9900',
    dateJoined: 'February 10, 2025',
    rating: 4.9,
    hub: 'Ijebu-Ode Depot',
    accountStatus: 'Active',
    availabilityStatus: 'Available',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    initialLocation: { lat: 6.8200, lng: 3.9100 },
    currentLocation: { lat: 6.8200, lng: 3.9100, timestamp: new Date().toISOString() },
    completedCount: 115,
    todayEarnings: 9000
  }
];

export const AVAILABLE_RIDERS = isFirebaseReady() ? [] : INITIAL_RIDERS;

export const OrderProvider = ({ children, showToast = () => {} }) => {
  const { deductStock } = useProducts();
  const sanitizeOrder = (o, idx = 0) => {
    const itemsSubtotal = (o.items || []).reduce((acc, i) => acc + (i.unitPrice || 0) * (i.quantity || 1), 0);
    const giftFee = o.giftFee || 0;
    let deliveryFee = o.fulfillmentType === 'pickup' ? 0 : (o.deliveryFee !== undefined ? o.deliveryFee : 1500);

    if (o.total && itemsSubtotal + deliveryFee + giftFee !== o.total) {
      if (o.total > itemsSubtotal + giftFee) {
        deliveryFee = o.total - itemsSubtotal - giftFee;
      } else {
        deliveryFee = 0;
      }
    }

    const finalTotal = itemsSubtotal + deliveryFee + giftFee;

    // Normalize legacy status names to canonical names
    let resolvedStatus = o.status;
    if (resolvedStatus === 'Ready' || resolvedStatus === 'Ready for Dispatch') resolvedStatus = 'Ready for Dispatch';
    else if (resolvedStatus === 'Completed') resolvedStatus = 'Delivered';
    else if (resolvedStatus === 'Out for Delivery' || resolvedStatus === 'On the Way' || resolvedStatus === 'EN_ROUTE') resolvedStatus = 'Out for Delivery';
    else if (resolvedStatus === 'Confirmed' || resolvedStatus === 'Order Confirmed') resolvedStatus = 'Order Confirmed';
    else if (resolvedStatus === 'Processing' || resolvedStatus === 'Preparing Order' || resolvedStatus === 'Preparing') resolvedStatus = 'Preparing';
    else if (resolvedStatus === 'ACCEPTED' || resolvedStatus === 'PICKED_UP' || resolvedStatus === 'Picked Up') resolvedStatus = 'Picked Up';
    else if (resolvedStatus === 'ARRIVED') resolvedStatus = 'Nearby';

    const matchedStep = ORDER_STATUS_STEPS.find(s => s.key === resolvedStatus);
    const resolvedStep = PRE_CONFIRMATION_STATUSES.includes(resolvedStatus) ? -1
      : matchedStep ? matchedStep.step : (o.statusStep !== undefined ? Math.min(o.statusStep, 6) : 0);
    const isAlreadyAccepted = resolvedStatus === 'Out for Delivery' || resolvedStatus === 'Nearby' || resolvedStatus === 'Picked Up' || resolvedStep >= 3;
    // For Ready for Dispatch orders, reset assignmentState to 'Pending' so riders can see and accept them
    const isReadyForDispatch = resolvedStatus === 'Ready for Dispatch';

    // Do NOT auto-assign a rider — rider is only set when explicitly assigned or accepted
    const assignedRider = o.assignedRider || null;
    const defaultRiderLoc = assignedRider ? (assignedRider.currentLocation || assignedRider.initialLocation || { lat: 7.1450, lng: 3.3280, timestamp: new Date().toISOString() }) : null;

    return {
      ...o,
      subtotal: itemsSubtotal,
      deliveryFee,
      giftFee,
      total: finalTotal,
      status: resolvedStatus,
      statusStep: resolvedStep,
      // Reset assignment fields for Ready for Dispatch so riders can see & accept the order
      assignmentState: isAlreadyAccepted ? 'Accepted' : (isReadyForDispatch ? 'Pending' : (o.assignmentState || 'Unassigned')),
      acceptedByRiderId: isReadyForDispatch ? null : (o.acceptedByRiderId || null),
      acceptedByRiderName: isReadyForDispatch ? null : (o.acceptedByRiderName || null),
      assignedRider: isReadyForDispatch ? null : assignedRider,
      latitude: o.latitude || (7.1475 + (idx * 0.01)),
      longitude: o.longitude || (3.3619 + (idx * 0.01)),
      deliveryPin: o.deliveryPin || String(Math.floor(1000 + Math.random() * 9000)),
      riderLocation: isReadyForDispatch ? null : (o.riderLocation || defaultRiderLoc),
      trackingHistory: o.trackingHistory || [
        { event: 'Order Confirmed & Payment Received', statusStep: 0, timestamp: o.date + ' ' + o.time, actor: 'Customer' }
      ]
    };
  };

  // Admin's delivery fees by LGA, live from Firestore so every customer
  // pays the current price (a local copy is only used offline)
  const [deliveryFees, setDeliveryFees] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cz_delivery_fees') || '{}'); } catch { return {}; }
  });
  useEffect(() => subscribeDeliveryPrices(setDeliveryFees), []);
  useEffect(() => {
    localStorage.setItem('cz_delivery_fees', JSON.stringify(deliveryFees));
  }, [deliveryFees]);

  const deliveryLocations = OGUN_DELIVERY_LOCATIONS.map(loc =>
    deliveryFees[loc.lga] != null ? { ...loc, deliveryFee: Number(deliveryFees[loc.lga]) } : loc);

  /** Admin: save new fees ({ lga: fee }). Resolves to { error }. */
  const updateDeliveryPrices = async (changes) => {
    const next = { ...deliveryFees, ...changes };
    setDeliveryFees(next);
    const { error } = await saveDeliveryPrices(next);
    if (error) showToast(`Could not save delivery prices: ${error}`, 'error');
    return { error };
  };
  const updateDeliveryPrice = (lgaName, newFee) => updateDeliveryPrices({ [lgaName]: Number(newFee) });

  const resetDeliveryPrices = async () => {
    setDeliveryFees({});
    const { error } = await saveDeliveryPrices({});
    if (error) showToast(`Could not reset delivery prices: ${error}`, 'error');
    else showToast('Delivery fees reset to the standard rates.', 'info');
  };

  const [orders, setOrders] = useState(() => {
    const CACHE_VERSION = '4'; // bump when sanitizeOrder logic changes
    const savedVersion = localStorage.getItem('cz_orders_ver');
    const saved = localStorage.getItem('cz_orders');
    if (saved && savedVersion === CACHE_VERSION) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((o, idx) => sanitizeOrder(o, idx));
        }
      } catch (e) {
        console.error('Error loading saved orders:', e);
      }
    }
    // Cache miss, version mismatch, or parse error — seed from initialOrders
    localStorage.setItem('cz_orders_ver', CACHE_VERSION);
    return initialOrders.map((o, idx) => sanitizeOrder(o, idx));
  });

  // Orders come from Firestore for whoever is signed in (admin, rider or
  // customer), so every device sees the same orders and updates live.
  useEffect(() => {
    if (!isFirebaseReady()) return undefined;
    let unsubscribeOrders = () => {};
    let unsubscribeRiders = () => {};
    const unsubscribeAuth = onAuthStateChange((_event, user) => {
      unsubscribeOrders();
      unsubscribeRiders();
      unsubscribeRiders = () => {};
      if (!user) { setOrders([]); return; }
      unsubscribeOrders = subscribeOrdersForUser(user, list => setOrders(list.map((o, idx) => sanitizeOrder(o, idx))));
      // Riders' duty status and details come live from Firestore: every
      // rider for the admin, and the rider's own record for a rider
      if (hasRole(user, 'admin')) {
        unsubscribeRiders = subscribeRiders(setRiders);
      } else if (hasRole(user, 'rider')) {
        unsubscribeRiders = subscribeOwnRider(user.id, own =>
          setRiders(prev => [...prev.filter(r => r.id !== own.id), own]));
      }
    });
    return () => { unsubscribeAuth(); unsubscribeOrders(); unsubscribeRiders(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Order fields saved to Firestore when an action changes them
  const SAVED_ORDER_FIELDS = [
    'status', 'statusStep', 'assignmentState', 'acceptedByRiderId', 'acceptedByRiderName', 'assignedRider',
    'paymentStatus', 'paymentReference', 'riderLocation', 'failureReason', 'bankTransferVerifiedBy',
    'adminPaymentOverride', 'cashPaymentConfirmedByRider', 'paymentConfirmedAt'
  ];
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  /** Applies `updater` to the orders, then saves what changed (and new tracking events). */
  const changeOrders = (updater) => {
    const prev = ordersRef.current;
    const next = updater(prev);
    ordersRef.current = next;
    setOrders(next);
    next.forEach(order => {
      const before = prev.find(o => o.id === order.id);
      if (!before || before === order) return;
      const changes = Object.fromEntries(SAVED_ORDER_FIELDS
        .filter(k => JSON.stringify(order[k]) !== JSON.stringify(before[k]))
        .map(k => [k, order[k] ?? null]));
      const events = (order.trackingHistory || []).slice((before.trackingHistory || []).length);
      if (!Object.keys(changes).length && !events.length) return;
      updateOrderStatusInDb(order.id, changes, events)
        .then(({ error }) => { if (error) showToast(`Could not save order ${order.id}: ${error}`, 'error'); });
    });
  };

  const [feedbackList, setFeedbackList] = useState(() => {
    const saved = localStorage.getItem('cz_feedback_v2');
    return saved ? JSON.parse(saved) : initialFeedback;
  });

  useEffect(() => {
    localStorage.setItem('cz_orders', JSON.stringify(orders));
    localStorage.setItem('cz_orders_ver', '3');
  }, [orders]);

  // Real-time cross-tab & cross-window synchronization listener
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'cz_orders' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            // Always sanitize incoming cross-tab data to normalize legacy statuses
            setOrders(parsed.map((o, idx) => sanitizeOrder(o, idx)));
          }
        } catch (err) {
          console.warn('Error syncing cross-tab order state:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('cz_feedback_v2', JSON.stringify(feedbackList));
  }, [feedbackList]);

  const [storeBankAccount, setStoreBankAccount] = useState(() => {
    try {
      const saved = localStorage.getItem('cz_store_bank_account_v2');
      return saved ? JSON.parse(saved) : DEFAULT_STORE_BANK_ACCOUNT;
    } catch {
      return DEFAULT_STORE_BANK_ACCOUNT;
    }
  });

  // The account lives in Firestore so an admin's change reaches every
  // customer; localStorage only caches it for a fast first paint.
  useEffect(() => subscribeBankAccount((account) => {
    if (!account) return;
    setStoreBankAccount(account);
    try {
      localStorage.setItem('cz_store_bank_account_v2', JSON.stringify(account));
    } catch { /* ignore */ }
  }), []);

  const updateStoreBankAccount = async (newDetails) => {
    const updated = { ...storeBankAccount, ...newDetails };
    const { error } = await saveBankAccount(updated);
    if (error) {
      showToast(`Could not save the bank account: ${error}`, 'error');
      return false;
    }
    setStoreBankAccount(updated);
    try {
      localStorage.setItem('cz_store_bank_account_v2', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    showToast('Store Bank Account updated for all customers! 🏦', 'success');
    return true;
  };

  const confirmBankTransferPayment = (orderId, adminName = 'Admin Finance') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const paidOrder = orders.find(o => o.id === orderId);
    // Paid orders take their items out of stock, once per order
    const deductNow = paidOrder && !paidOrder.stockDeducted;
    if (deductNow) deductStock(paidOrder.items);
    updateOrderStatusInDb(
      orderId,
      { paymentStatus: 'Paid', bankTransferVerifiedBy: adminName, ...(deductNow && { stockDeducted: true }) },
      { event: `🏦 Direct Bank Transfer Verified & Confirmed by ${adminName}`, statusStep: paidOrder?.statusStep ?? 0, timestamp: timeStr, actor: adminName }
    ).catch(err => console.warn('[OrderContext] Firestore confirmPayment failed:', err));
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const eventLog = {
          event: `🏦 Direct Bank Transfer Verified & Confirmed by ${adminName}`,
          statusStep: order.statusStep,
          timestamp: timeStr,
          actor: adminName
        };
        return {
          ...order,
          paymentStatus: 'Paid',
          stockDeducted: true,
          bankTransferVerifiedBy: adminName,
          paymentConfirmedAt: timeStr,
          trackingHistory: [...(order.trackingHistory || []), eventLog]
        };
      }
      return order;
    }));
    showToast(`Bank Transfer payment confirmed for Order #${orderId}! 🏦`, 'success');
  };

  // Create Order with exact formatted date, 4-digit PIN, and tracking history
  const createOrder = (orderPayload) => {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const formattedDate = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes} ${ampm}`;

    const storePrefix = orderPayload.store === 'bakery' ? 'ALZ-BAK' : orderPayload.store === 'mixed' ? 'ALZ-MIX' : 'ALZ-SUP';
    const randomIdNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `${storePrefix}-${randomIdNum}`;

    const pinCode = String(Math.floor(1000 + Math.random() * 9000));

    const isBankTransfer = orderPayload.paymentMethod === 'Bank Transfer' || orderPayload.paymentMethod?.includes('Transfer');
    const isPayOnDelivery = orderPayload.paymentMethod === 'Pay on Delivery' || orderPayload.paymentMethod?.includes('Delivery');

    let initialPaymentStatus = 'Paid';
    if (isBankTransfer) {
      initialPaymentStatus = 'Awaiting Bank Confirmation';
    } else if (isPayOnDelivery) {
      initialPaymentStatus = 'Pending';
    }

    const initialTrackingEvent = {
      event: isBankTransfer
        ? `Order Placed via Bank Transfer (Awaiting confirmation: ₦${(orderPayload.total || 0).toLocaleString()})`
        : 'Order placed, waiting for the store to confirm',
      statusStep: 0,
      timestamp: `${formattedDate} ${formattedTime}`,
      actor: 'Customer'
    };

    const newOrder = {
      ...orderPayload,
      id: orderId,
      date: formattedDate,
      time: formattedTime,
      isoDate: now.toISOString(),
      status: 'Pending',
      statusStep: 0,
      deliveryPin: pinCode,
      paymentStatus: initialPaymentStatus,
      assignedRider: null,
      assignmentState: 'Unassigned',
      acceptedByRiderId: null,
      acceptedByRiderName: null,
      riderLocation: null,
      trackingHistory: [initialTrackingEvent]
    };

    setOrders(prev => [newOrder, ...prev]);

    // Persist to Firestore (non-blocking)
    createOrderInDb(newOrder).catch(err =>
      console.warn('[OrderContext] Firestore createOrder failed (offline?):', err)
    );

    return newOrder;
  };

  // Update Status & Audit Log — with transition validation
  const updateOrderStatus = (orderId, newStatus, actorName = 'Store Operations', forceAdmin = false) => {
    // Normalize legacy status names to canonical
    let resolvedStatus = newStatus;
    if (newStatus === 'Ready' || newStatus === 'Ready for Dispatch') resolvedStatus = 'Ready for Dispatch';
    else if (newStatus === 'Confirmed' || newStatus === 'Order Confirmed') resolvedStatus = 'Order Confirmed';
    else if (newStatus === 'Processing' || newStatus === 'Preparing Order' || newStatus === 'Preparing') resolvedStatus = 'Preparing';
    else if (newStatus === 'Out for Delivery' || newStatus === 'On the Way' || newStatus === 'EN_ROUTE') resolvedStatus = 'Out for Delivery';
    else if (newStatus === 'Completed' || newStatus === 'Delivered') resolvedStatus = 'Delivered';
    else if (newStatus === 'ACCEPTED' || newStatus === 'PICKED_UP') resolvedStatus = 'Picked Up';
    else if (newStatus === 'ARRIVED') resolvedStatus = 'Nearby';

    const matchedStep = ORDER_STATUS_STEPS.find(s => s.key === resolvedStatus || s.label === resolvedStatus);
    const stepNumber = matchedStep ? matchedStep.step : 0;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let transitionBlocked = false;

    // Payment and preparation are separate steps: a bank transfer must be
    // confirmed before the order can start being prepared
    const target = orders.find(o => o.id === orderId);
    const awaitingTransfer = target && target.paymentStatus !== 'Paid'
      && /transfer/i.test(target.paymentMethod || '');
    if (resolvedStatus === 'Preparing' && awaitingTransfer) {
      showToast(`Confirm the bank transfer for order ${orderId} before you start preparing it.`, 'warning');
      return;
    }

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        // Enforce valid status transitions (admin can override with forceAdmin)
        const currentStatus = order.status;
        const validNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
        if (!forceAdmin && !validNextStatuses.includes(resolvedStatus) && currentStatus !== resolvedStatus) {
          transitionBlocked = true;
          return order;
        }

        const eventLog = {
          event: `Status updated to "${resolvedStatus}"`,
          statusStep: stepNumber,
          timestamp: timeStr,
          actor: actorName
        };

        const isReadyForDispatch = resolvedStatus === 'Ready for Dispatch';

        return {
          ...order,
          status: resolvedStatus,
          statusStep: stepNumber,
          assignmentState: isReadyForDispatch ? 'Pending' : order.assignmentState,
          acceptedByRiderId: isReadyForDispatch ? null : order.acceptedByRiderId,
          acceptedByRiderName: isReadyForDispatch ? null : order.acceptedByRiderName,
          assignedRider: isReadyForDispatch ? null : order.assignedRider,
          paymentStatus: resolvedStatus === 'Delivered' ? 'Paid' : order.paymentStatus,
          trackingHistory: [...(order.trackingHistory || []), eventLog]
        };
      }
      return order;
    }));

    if (transitionBlocked) {
      showToast(`⚠️ Invalid transition: Cannot change status to "${resolvedStatus}" from current state.`, 'error');
    } else {
      // Persist status update to Firestore (non-blocking)
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      updateOrderStatusInDb(
        orderId,
        { status: resolvedStatus, statusStep: stepNumber },
        { event: `Status updated to "${resolvedStatus}"`, statusStep: stepNumber, timestamp: timeStr, actor: actorName }
      ).catch(err => console.warn('[OrderContext] Firestore updateStatus failed:', err));
      showToast(`Order ${orderId} updated to "${resolvedStatus}"`, 'success');
    }
  };

  // Assign Rider to Order
  const assignRiderToOrder = (orderId, riderId) => {
    const matchedRider = riders.find(r => r.id === riderId);
    if (!matchedRider) {
      showToast('Choose an approved rider to assign.', 'error');
      return;
    }
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    changeOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const eventLog = {
          event: `Delivery assigned to ${matchedRider.name}`,
          statusStep: Math.max(order.statusStep, 2),
          timestamp: timeStr,
          actor: 'Logistics Manager'
        };

        return {
          ...order,
          assignedRider: matchedRider,
          status: order.statusStep < 2 ? 'Ready for Dispatch' : order.status,
          statusStep: Math.max(order.statusStep, 2),
          trackingHistory: [...(order.trackingHistory || []), eventLog]
        };
      }
      return order;
    }));

    showToast(`Rider "${matchedRider.name}" assigned to Order ${orderId}`, 'success');
  };

  // Rider Live GPS Stream Update
  const updateRiderLocation = (orderId, lat, lng, riderName = 'Delivery Rider', riderId = 'rdr-001', meta = {}) => {
    const nowIso = meta.timestamp || new Date().toISOString();
    const timeStr = new Date(nowIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedRiderLoc = {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      accuracy: meta.accuracy !== undefined ? meta.accuracy : 10,
      heading: meta.heading || 0,
      speed: meta.speed || 0,
      timestamp: nowIso
    };

    // Update single source of truth in riders state (prevent older location updates from overwriting newer ones)
    setRiders(prev => prev.map(r => {
      if (r.id === riderId || r.name === riderName) {
        const currentTS = new Date(r.currentLocation?.timestamp || 0).getTime();
        const newTS = new Date(nowIso).getTime();
        if (newTS >= currentTS) {
          return { ...r, currentLocation: updatedRiderLoc };
        }
      }
      return r;
    }));

    changeOrders(prev => prev.map(order => {
      if (order.id !== orderId && order.acceptedByRiderId !== riderId) return order;

      const currentTS = new Date(order.riderLocation?.timestamp || 0).getTime();
      const newTS = new Date(nowIso).getTime();
      if (newTS < currentTS) return order;

      const destLat = order.latitude || 7.1557;
      const destLng = order.longitude || 3.3458;

      // Geofence check
      const geofenceTransition = checkGeofenceStatus(lat, lng, destLat, destLng, order.status);

      let newStatus = order.status;
      let newStep = order.statusStep;
      let newEvents = [];

      if (geofenceTransition === 'Nearby' && order.status === 'Out for Delivery') {
        newStatus = 'Nearby';
        newStep = 5;
        newEvents.push({
          event: `🛵 Rider is Nearby (${riderName} entered 1.5km geofence)`,
          statusStep: 5,
          timestamp: timeStr,
          actor: riderName
        });
        showToast(`Rider for ${orderId} is Nearby! 📍`, 'info');
      }

      return {
        ...order,
        status: newStatus,
        statusStep: newStep,
        riderLocation: updatedRiderLoc,
        trackingHistory: newEvents.length > 0 ? [...(order.trackingHistory || []), ...newEvents] : (order.trackingHistory || [])
      };
    }));
  };

  // Confirm & Deliver Order with PIN Verification
  const verifyAndDeliverOrder = (orderId, pinCode = '', actorName = 'Rider') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let verified = false;

    changeOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      // PIN check if provided
      if (pinCode && order.deliveryPin && pinCode.trim() !== order.deliveryPin.trim()) {
        showToast('Invalid Delivery PIN. Please double-check with the customer.', 'error');
        return order;
      }

      verified = true;
      const eventLog = {
        event: '🎉 Order Delivered & Handed to Customer',
        statusStep: 6,
        timestamp: timeStr,
        actor: actorName
      };

      return {
        ...order,
        status: 'Delivered',
        statusStep: 6,
        paymentStatus: 'Paid',
        trackingHistory: [...(order.trackingHistory || []), eventLog]
      };
    }));

    if (verified) {
      showToast(`Order ${orderId} marked as Delivered! 🎉`, 'success');
      return true;
    }
    return false;
  };

  const [riders, setRiders] = useState(() => {
    try {
      const saved = localStorage.getItem('cz_riders_v2');
      return saved ? JSON.parse(saved) : AVAILABLE_RIDERS;
    } catch { return AVAILABLE_RIDERS; }
  });

  useEffect(() => {
    localStorage.setItem('cz_riders_v2', JSON.stringify(riders));
  }, [riders]);

  /** Admin: keep `riders` in sync with Firestore. Returns unsubscribe. */
  const watchRiders = () => subscribeRiders(setRiders);

  /**
   * `rider` is the signed-in rider's record: riders only load their own,
   * so it's added to the list if missing, then the change is saved.
   */
  const updateRiderAvailability = async (riderId, newStatus, rider = null) => {
    setRiders(prev => prev.some(r => r.id === riderId)
      ? prev.map(r => r.id === riderId ? { ...r, availabilityStatus: newStatus } : r)
      : rider ? [...prev, { ...rider, availabilityStatus: newStatus }] : prev);
    const { error } = await saveRiderAvailability(riderId, newStatus);
    if (error) showToast(`Could not save duty status: ${error}`, 'error');
    else showToast(`Duty Status updated to ${newStatus} 🛵`, 'info');
  };

  const updateRiderProfile = async (riderId, profileData, rider = null) => {
    setRiders(prev => prev.some(r => r.id === riderId)
      ? prev.map(r => r.id === riderId ? { ...r, ...profileData } : r)
      : rider ? [...prev, { ...rider, ...profileData }] : prev);
    const { error } = await saveRiderProfile(riderId, profileData);
    if (error) showToast(`Could not save your profile: ${error}`, 'error');
    else showToast('Rider profile saved ✨', 'success');
    return { error };
  };

  /** `rider` is the accepting rider's record, so the customer gets their contact details. */
  const acceptRiderAssignment = (orderId, riderName, riderId = null, rider = null) => {
    const effectiveRiderId = riderId || 'rdr-001';
    
    // Single active order check: Ensure rider doesn't already have an active in-progress order
    const existingActive = orders.find(o => 
      (o.acceptedByRiderId === effectiveRiderId || (o.assignedRider?.id === effectiveRiderId && o.assignmentState === 'Accepted')) &&
      o.status !== 'Delivered' && 
      o.status !== 'Failed Delivery' && 
      o.status !== 'Cancelled'
    );

    if (existingActive && existingActive.id !== orderId) {
      showToast(`⚠️ Single Active Order Rule: Complete Order #${existingActive.id} before accepting another delivery.`, 'warning');
      return false;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const source = riders.find(r => r.id === effectiveRiderId) || rider || { id: effectiveRiderId, name: riderName };
    // What the customer sees: who is coming and how to call them
    const riderContact = {
      id: effectiveRiderId, name: source.name || riderName, phone: source.phone || '',
      vehicle: source.vehicle || '', vehicleType: source.vehicleType || '', avatar: source.avatar || '',
      rating: source.rating ?? null
    };
    const acceptEvent = {
      event: `Rider ${riderName} (${effectiveRiderId}) accepted delivery assignment`,
      statusStep: 3, timestamp: timeStr, actor: riderName
    };
    updateOrderStatusInDb(orderId, {
      status: 'Picked Up', statusStep: 3, assignmentState: 'Accepted',
      acceptedByRiderId: effectiveRiderId, acceptedByRiderName: riderName, assignedRider: riderContact
    }, acceptEvent).then(({ error }) => {
      if (error) showToast(`Could not save the acceptance: ${error}`, 'error');
    });
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const matchedRider = { ...source, ...riderContact };
        const eventLog = {
          event: `Rider ${riderName} (${effectiveRiderId}) accepted delivery assignment`,
          statusStep: Math.max(order.statusStep, 2),
          timestamp: timeStr,
          actor: riderName
        };
        return {
          ...order,
          assignmentState: 'Accepted',
          acceptedByRiderId: effectiveRiderId,
          acceptedByRiderName: riderName,
          assignedRider: matchedRider,
          status: 'Picked Up',
          statusStep: 3,
          riderLocation: matchedRider.currentLocation || matchedRider.initialLocation || null,
          trackingHistory: [...(order.trackingHistory || []), eventLog]
        };
      }
      return order;
    }));
    showToast(`Accepted & Picked Up Order ${orderId}! 📦`, 'success');
    return true;
  };

  const confirmCashPayment = (orderId, riderName = 'Delivery Rider') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    changeOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const eventLog = {
          event: `💵 Pay on Delivery Cash Collected & Confirmed by Rider (${riderName})`,
          statusStep: order.statusStep,
          timestamp: timeStr,
          actor: riderName
        };
        return {
          ...order,
          paymentStatus: 'Paid',
          paymentMethod: 'Pay on Delivery (Cash Collected)',
          cashPaymentConfirmedByRider: true,
          paymentConfirmedAt: timeStr,
          trackingHistory: [...(order.trackingHistory || []), eventLog]
        };
      }
      return order;
    }));
    showToast(`Cash payment confirmed for Order #${orderId}! 💵`, 'success');
  };

  const rejectRiderAssignment = (orderId, riderName, reason = 'Rider Unavailable') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    changeOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const eventLog = {
          event: `Rider ${riderName} declined assignment (${reason})`,
          statusStep: 2,
          timestamp: timeStr,
          actor: riderName
        };
        return {
          ...order,
          assignedRider: null,
          assignmentState: 'Pending',
          acceptedByRiderId: null,
          acceptedByRiderName: null,
          status: 'Ready for Dispatch',
          statusStep: 2,
          trackingHistory: [...(order.trackingHistory || []), eventLog]
        };
      }
      return order;
    }));
    showToast(`Assignment declined for Order ${orderId}. Re-assigned to dispatch hub.`, 'info');
  };

  const reportDeliveryFailure = (orderId, riderName, reason = 'Customer unreachable') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    changeOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const eventLog = {
          event: `⚠️ Delivery Failed: ${reason}`,
          statusStep: order.statusStep,
          timestamp: timeStr,
          actor: riderName
        };
        return {
          ...order,
          status: 'Failed Delivery',
          failureReason: reason,
          trackingHistory: [...(order.trackingHistory || []), eventLog]
        };
      }
      return order;
    }));
    showToast(`Reported Delivery Failure for Order ${orderId}`, 'warning');
  };

  // Feedback Actions
  const addFeedback = (feedbackPayload) => {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const formattedDate = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newEntry = {
      ...feedbackPayload,
      id: `fb-${Date.now().toString().slice(-4)}`,
      date: formattedDate,
      time: timeStr,
      status: 'New'
    };

    setFeedbackList(prev => [newEntry, ...prev]);
    showToast('Thank you! Your feedback has been submitted 🍰', 'success');
    return newEntry;
  };

  // Verify and record Gateway Payment (Paystack / Flutterwave callback)
  const verifyAndRecordPayment = (orderId, paymentRef, gatewayResponse = {}) => {
    let updatedOrder = null;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = `${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    const confirmTime = `${formattedDate} ${timeStr}`;

    changeOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        // Idempotency: If order is already paid, do not re-verify or duplicate logs
        if (order.paymentStatus === 'Paid') {
          updatedOrder = order;
          return order;
        }

        const eventLog = {
          event: `💳 Pay on Delivery Payment Confirmed via Gateway (Ref: ${paymentRef})`,
          statusStep: order.statusStep,
          timestamp: confirmTime,
          actor: 'Payment Gateway (Paystack)'
        };

        updatedOrder = {
          ...order,
          paymentStatus: 'Paid',
          paymentReference: paymentRef,
          paymentConfirmedAt: confirmTime,
          trackingHistory: [...(order.trackingHistory || []), eventLog]
        };
        return updatedOrder;
      }
      return order;
    }));

    if (updatedOrder) {
      showToast(`Payment of ₦${(updatedOrder.total || 0).toLocaleString()} confirmed for Order #${orderId}! 💳`, 'success');
    }
    return updatedOrder;
  };

  // Admin Override for Emergency Exception
  const overridePaymentByAdmin = (orderId, adminName = 'Store Manager') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    changeOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const eventLog = {
          event: `🛡️ Admin Payment Override Granted by ${adminName}`,
          statusStep: order.statusStep,
          timestamp: timeStr,
          actor: adminName
        };
        return {
          ...order,
          paymentStatus: 'Paid',
          adminPaymentOverride: true,
          paymentReference: `ADMIN-OVERRIDE-${Date.now().toString().slice(-6)}`,
          paymentConfirmedAt: timeStr,
          trackingHistory: [...(order.trackingHistory || []), eventLog]
        };
      }
      return order;
    }));
    showToast(`Admin Payment Override granted for Order #${orderId}`, 'info');
  };

  const deleteFeedback = (id) => {
    setFeedbackList(prev => prev.filter(f => f.id !== id));
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        riders,
        deliveryLocations,
        updateDeliveryPrices,
        updateDeliveryPrice,
        resetDeliveryPrices,
        updateRiderAvailability,
        updateRiderProfile,
        acceptRiderAssignment,
        confirmCashPayment,
        rejectRiderAssignment,
        reportDeliveryFailure,
        createOrder,
        updateOrderStatus,
        assignRiderToOrder,
        updateRiderLocation,
        verifyAndDeliverOrder,
        verifyAndRecordPayment,
        overridePaymentByAdmin,
        storeBankAccount,
        updateStoreBankAccount,
        watchRiders,
        confirmBankTransferPayment,
        feedbackList,
        addFeedback,
        deleteFeedback
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
