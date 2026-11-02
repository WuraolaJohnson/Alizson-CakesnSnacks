// Revenue counts only money actually received: orders whose payment the
// admin has confirmed (or a rider collected), and that weren't declined.
export const isPaidOrder = (o) => o.paymentStatus === 'Paid' && o.status !== 'Declined';

const lineTotal = (i) => (i.unitPrice || 0) * (i.quantity || 1);

/** Total of all paid orders, delivery and gift fees included. */
export const grossRevenue = (orders) =>
  orders.filter(isPaidOrder).reduce((sum, o) => sum + (o.total || 0), 0);

/**
 * One store's paid revenue. A single-store order counts in full; an order
 * from both stores counts only that store's items (its delivery fee stays
 * in the gross total only).
 */
export const storeRevenue = (orders, store) =>
  orders.filter(isPaidOrder).reduce((sum, o) => {
    if (o.store === store) return sum + (o.total || 0);
    if (o.store !== 'mixed') return sum;
    return sum + (o.items || []).filter(i => i.store === store).reduce((s, i) => s + lineTotal(i), 0);
  }, 0);
