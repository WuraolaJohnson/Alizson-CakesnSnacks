import React from 'react';
import {
  DollarSign, ShoppingBag, Cake, Package, TrendingUp, AlertTriangle,
  Clock, CheckCircle, ArrowRight, Eye, RefreshCw, Star
} from 'lucide-react';
import { useOrders, VALID_TRANSITIONS } from '../../context/OrderContext';
import { useProducts } from '../../context/ProductContext';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/Common/StatusBadge';

const AdminDashboard = ({ setActiveTab }) => {
  const { orders, updateOrderStatus, feedbackList } = useOrders();
  const { bakeryProducts, supplyProducts, toggleAvailability } = useProducts();
  const { navigateTo } = useApp();

  const handleTabNav = (tab) => {
    if (setActiveTab) {
      setActiveTab(tab);
    } else {
      navigateTo(tab);
    }
  };

  // Metrics Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const bakeryOrders = orders.filter(o => o.store === 'bakery');
  const suppliesOrders = orders.filter(o => o.store === 'supplies');

  const bakeryRevenue = bakeryOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const suppliesRevenue = suppliesOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingOrdersCount = orders.filter(o => o.status === 'Order Confirmed' || o.status === 'Preparing').length;
  
  const avgRating = feedbackList.length > 0
    ? (feedbackList.reduce((sum, f) => sum + (f.rating || 5), 0) / feedbackList.length).toFixed(1)
    : '4.9';

  // Low stock items
  const allProducts = [
    ...bakeryProducts.map(p => ({ ...p, storeType: 'bakery' })),
    ...supplyProducts.map(p => ({ ...p, storeType: 'supplies' }))
  ];
  const lowStockItems = allProducts.filter(p => !p.inStock || (p.stockQuantity !== undefined && p.stockQuantity <= 5));

  const recentOrders = orders.slice(0, 6);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', color: 'var(--charcoal-900)', margin: 0 }}>
            Executive Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Real-time analytics for Bakery Orders, Baking Supplies & Marketplace Operations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => handleTabNav('records')}>
            <TrendingUp size={16} /> Reports & Records
          </button>
          <button className="btn btn-primary" onClick={() => handleTabNav('products')}>
            <Package size={16} /> Manage Products
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Total Revenue */}
        <div className="card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gross Revenue</span>
            <div style={{ width: 36, height: 36, borderRadius: '9px', background: 'rgba(229,138,19,0.12)', color: 'var(--text-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--charcoal-900)' }}>
            ₦{totalRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--status-success)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={13} /> +18.4% from last month
          </div>
        </div>

        {/* Bakery Sales */}
        <div className="card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bakery Revenue</span>
            <div style={{ width: 36, height: 36, borderRadius: '9px', background: 'rgba(229,138,19,0.12)', color: 'var(--text-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cake size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-gold)' }}>
            ₦{bakeryRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {bakeryOrders.length} cake & pastry orders
          </div>
        </div>

        {/* Supplies Sales */}
        <div className="card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Supplies Revenue</span>
            <div style={{ width: 36, height: 36, borderRadius: '9px', background: 'rgba(128,19,43,0.12)', color: 'var(--text-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-burgundy)' }}>
            ₦{suppliesRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {suppliesOrders.length} baking supply orders
          </div>
        </div>

        {/* Pending Orders */}
        <div className="card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active / Pending</span>
            <div style={{ width: 36, height: 36, borderRadius: '9px', background: 'rgba(59,130,246,0.12)', color: 'var(--status-info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--charcoal-900)' }}>
            {pendingOrdersCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--status-warning)', marginTop: '0.4rem' }}>
            Needs kitchen/dispatch action
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div className="card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Feedback Score</span>
            <div style={{ width: 36, height: 36, borderRadius: '9px', background: 'rgba(16,185,129,0.12)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--charcoal-900)', display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
            {avgRating} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 5.0</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {feedbackList.length} verified reviews
          </div>
        </div>
      </div>

      {/* Grid: Recent Orders & Stock Alerts */}
      <div className="admin-dashboard-grid">
        {/* Recent Orders Section */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--charcoal-900)', margin: 0 }}>
              Recent Orders
            </h3>
            <button
              onClick={() => handleTabNav('orders')}
              style={{
                background: 'none', border: 'none', color: 'var(--text-gold)',
                fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
              }}
            >
              View All Orders <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cream-200)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Order ID</th>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Store</th>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--cream-100)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--charcoal-900)' }}>
                      {order.id}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--charcoal-900)' }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{order.date}</div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span className={`badge ${order.store === 'bakery' ? 'badge-gold' : 'badge-burgundy'}`} style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                        {order.store === 'bakery' ? '🍰 Bakery' : '🧁 Supplies'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--text-gold)' }}>
                      ₦{order.total?.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      {(() => {
                        const validNext = VALID_TRANSITIONS[order.status] || [];
                        return (
                          <select
                            value={order.status}
                            onChange={e => updateOrderStatus(order.id, e.target.value, 'Admin')}
                            style={{
                              padding: '0.35rem 0.6rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--cream-300)',
                              fontSize: '0.78rem',
                              fontFamily: 'var(--font-sans)',
                              background: 'var(--bg-surface)',
                              cursor: 'pointer'
                            }}
                          >
                            <option value={order.status}>{order.status} (Current)</option>
                            {validNext.map(next => (
                              <option key={next} value={next}>{next}</option>
                            ))}
                          </select>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Warnings & Quick Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertTriangle size={18} color="var(--status-warning)" />
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--charcoal-900)', margin: 0 }}>
                Inventory Alerts
              </h3>
            </div>

            {lowStockItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--status-success)', fontSize: '0.85rem' }}>
                <CheckCircle size={28} style={{ margin: '0 auto 0.5rem' }} />
                All product stocks are healthy!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {lowStockItems.slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem',
                      background: 'var(--cream-50)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--cream-200)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <img src={item.image} alt={item.name} style={{ width: 36, height: 36, borderRadius: '6px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--charcoal-900)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.7rem', color: item.inStock ? 'var(--status-warning)' : 'var(--status-danger)', fontWeight: 600 }}>
                          {item.inStock ? 'Low Stock' : 'Out of Stock'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAvailability(item.storeType, item.id)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.72rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--cream-300)',
                        background: 'var(--bg-surface)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {item.inStock ? 'Set Out' : 'Restock'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--ink) 0%, #2A1F18 100%)', color: 'white' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '0.5rem', color: 'white' }}>
              Quick Navigation
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#C2B9B3', marginBottom: '1.25rem' }}>
              Switch seamlessly between administrator modules.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <button
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(229,138,19,0.5)',
                  background: 'rgba(229,138,19,0.15)',
                  color: 'var(--gold-300)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--gold-action)';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.borderColor = 'var(--gold-500)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(229,138,19,0.15)';
                  e.currentTarget.style.color = 'var(--gold-300)';
                  e.currentTarget.style.borderColor = 'rgba(229,138,19,0.5)';
                }}
                onClick={() => handleTabNav('products')}
              >
                + New Product
              </button>
              <button
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.color = '#1A1715';
                  e.currentTarget.style.borderColor = '#FFFFFF';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onClick={() => handleTabNav('feedback')}
              >
                Customer Feedback
              </button>
              <button
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.color = '#1A1715';
                  e.currentTarget.style.borderColor = '#FFFFFF';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onClick={() => handleTabNav('orders')}
              >
                Orders Center
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
