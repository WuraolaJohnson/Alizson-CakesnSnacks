import React from 'react';
import { Clock, CheckCircle2, Package, Truck, Sparkles, AlertCircle } from 'lucide-react';

export const StatusBadge = ({ status = '', type = 'order' }) => {
  const s = String(status || '').toLowerCase().trim();

  if (type === 'store') {
    if (s.includes('bakery')) {
      return (
        <span className="badge badge-gold" style={{ gap: '5px' }}>
          <span>🍰</span> Bakery Store
        </span>
      );
    }
    return (
      <span className="badge badge-burgundy" style={{ gap: '5px' }}>
        <span>🧁</span> Baking Supplies
      </span>
    );
  }

  if (type === 'stock') {
    if (s === 'true' || s.includes('in stock')) {
      return <span className="badge badge-success">● In Stock</span>;
    }
    if (s.includes('low')) {
      return <span className="badge badge-warning">⚠ Low Stock</span>;
    }
    return <span className="badge badge-danger">✕ Out of Stock</span>;
  }

  // Order statuses: Order Confirmed → Preparing → Ready for Dispatch → Picked Up → Out for Delivery → Nearby → Delivered
  if (s.includes('pending')) {
    return (
      <span className="badge badge-warning" style={{ gap: '4px' }}>
        <Clock size={12} /> Pending
      </span>
    );
  }
  if (s.includes('confirmed')) {
    return (
      <span className="badge badge-info" style={{ gap: '4px', background: 'rgba(59, 130, 246, 0.18)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.35)' }}>
        <CheckCircle2 size={12} /> Order Confirmed
      </span>
    );
  }
  if (s.includes('prepar') || s.includes('process')) {
    return (
      <span className="badge badge-gold" style={{ gap: '4px' }}>
        <Package size={12} /> Preparing
      </span>
    );
  }
  if (s.includes('ready')) {
    return (
      <span className="badge badge-burgundy" style={{ gap: '4px' }}>
        <Sparkles size={12} /> Ready for Dispatch
      </span>
    );
  }
  if (s.includes('picked up')) {
    return (
      <span className="badge badge-info" style={{ gap: '4px', background: 'rgba(168, 85, 247, 0.18)', color: '#C084FC', border: '1px solid rgba(168, 85, 247, 0.35)' }}>
        <Truck size={12} /> Picked Up
      </span>
    );
  }
  if (s.includes('out for delivery')) {
    return (
      <span className="badge badge-gold" style={{ gap: '4px', background: 'var(--gold-500)', color: '#ffffff' }}>
        <Truck size={12} /> Out for Delivery
      </span>
    );
  }
  if (s.includes('nearby')) {
    return (
      <span className="badge" style={{ gap: '4px', background: 'rgba(16, 185, 129, 0.18)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
        <Truck size={12} /> Nearby
      </span>
    );
  }
  if (s.includes('completed') || s.includes('delivered')) {
    return (
      <span className="badge badge-success" style={{ gap: '4px' }}>
        <CheckCircle2 size={12} /> Delivered
      </span>
    );
  }
  if (s.includes('cancel')) {
    return (
      <span className="badge badge-danger" style={{ gap: '4px' }}>
        <AlertCircle size={12} /> Cancelled
      </span>
    );
  }
  if (s.includes('failed')) {
    return (
      <span className="badge badge-danger" style={{ gap: '4px' }}>
        <AlertCircle size={12} /> Failed Delivery
      </span>
    );
  }

  return (
    <span className="badge" style={{ color: 'var(--text-primary)', background: 'var(--cream-200)', border: '1px solid var(--border-subtle)' }}>
      {status}
    </span>
  );
};
