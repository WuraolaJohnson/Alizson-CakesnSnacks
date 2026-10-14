import React, { useState } from 'react';
import { User, Package, Heart, MapPin, MessageCircle, LogOut, ChevronRight, Clock, CheckCircle2, Truck, Box, Star, Printer, Plus, Edit2, Trash2, Check, Phone, Mail, ShieldCheck, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useOrders, ORDER_STATUS_STEPS } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import { StatusBadge } from '../components/Common/StatusBadge';
import { printOrderReceipt } from '../utils/receiptGenerator';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <User size={17} /> },
  { id: 'active-orders', label: 'Orders & Tracking', icon: <Box size={17} /> },
  { id: 'purchase-history', label: 'Purchase History', icon: <Package size={17} /> },
  { id: 'wishlist', label: 'Wishlist', icon: <Heart size={17} /> },
  { id: 'addresses', label: 'Saved Addresses', icon: <MapPin size={17} /> },
  { id: 'feedback', label: 'Feedback', icon: <MessageCircle size={17} /> },
];

const CustomerDashboard = () => {
  const {
    currentUser,
    wishlist,
    logout,
    navigateTo,
    navigateToTracking,
    setIsAuthModalOpen,
    setAuthModalMode,
    dashboardTab,
    setDashboardTab,
    updateUserProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
  } = useApp();

  const { orders } = useOrders();
  const { bakeryProducts, supplyProducts } = useProducts();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const activeTab = dashboardTab || 'overview';
  const setActiveTab = (tab) => setDashboardTab(tab);

  const wishlistProducts = [...bakeryProducts, ...supplyProducts].filter(p => wishlist.includes(p.id));

  if (!currentUser || currentUser.role === 'admin') {
    if (activeTab === 'wishlist') {
      return (
        <div style={{ background: 'var(--cream-50)', minHeight: '85vh', padding: '2rem 0 5rem' }}>
          <div className="container">
            <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'var(--cream-100)', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--charcoal-700)' }}>
                💡 <strong>Sign in</strong> to sync your saved items across your devices and place orders faster!
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}>
                Sign In
              </button>
            </div>
            <WishlistTab products={wishlistProducts} navigateTo={navigateTo} />
          </div>
        </div>
      );
    }
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '1rem' }}>Sign in to view your orders & history</h2>
        <button className="btn btn-primary btn-lg" onClick={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}>Sign In</button>
      </div>
    );
  }

  const matchedUserOrders = orders.filter(o => 
    o.customerEmail?.toLowerCase() === currentUser.email?.toLowerCase() ||
    o.customerName?.toLowerCase() === currentUser.name?.toLowerCase()
  );

  // Fallback to all orders in session if specific email filter returns 0 (e.g., demo account)
  const userOrders = matchedUserOrders.length > 0 ? matchedUserOrders : orders;

  const activeOrders = userOrders.filter(o => o.status !== 'Completed' && o.status !== 'Delivered' && o.status !== 'Cancelled');
  const completedOrders = userOrders.filter(o => o.status === 'Completed' || o.status === 'Delivered' || o.status === 'Cancelled');
  const bakeryOrders = userOrders.filter(o => o.store === 'bakery');
  const supplyOrders = userOrders.filter(o => o.store === 'supplies');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            userOrders={userOrders}
            activeOrders={activeOrders}
            completedOrders={completedOrders}
            bakeryOrders={bakeryOrders}
            supplyOrders={supplyOrders}
            currentUser={currentUser}
            setDashboardTab={setDashboardTab}
            navigateToTracking={navigateToTracking}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
          />
        );
      case 'active-orders':
      case 'orders':
        return (
          <OrdersTab
            orders={activeOrders}
            title="Active Orders & Live Tracking 📦"
            subtitle="Track real-time delivery status, rider updates, and order preparation step-by-step."
            isHistory={false}
            navigateToTracking={navigateToTracking}
          />
        );
      case 'purchase-history':
      case 'bakery-orders':
      case 'supply-orders':
        return (
          <OrdersTab
            orders={completedOrders}
            title="Purchase History 📜"
            subtitle="Your complete purchase history across Bakery cakes & Baking supplies. View receipts and leave reviews."
            isHistory={true}
            onLeaveReview={(orderId) => setDashboardTab('feedback')}
          />
        );
      case 'wishlist':
        return <WishlistTab products={wishlistProducts} navigateTo={navigateTo} />;
      case 'addresses':
        return (
          <AddressesTab
            addresses={currentUser.savedAddresses || []}
            onAddAddress={addAddress}
            onUpdateAddress={updateAddress}
            onDeleteAddress={deleteAddress}
            onSetDefaultAddress={setDefaultAddress}
          />
        );
      case 'feedback':
        return <AccountFeedbackTab userOrders={userOrders} currentUser={currentUser} navigateTo={navigateTo} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ background: 'var(--cream-50)', minHeight: '85vh', padding: '2rem 0 5rem' }}>
      <div className="container">
        <div className="customer-dashboard-grid">
          {/* Sidebar */}
          <div>
            {/* Profile Card */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
              <img src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={currentUser.name}
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--gold-300)', margin: '0 auto 1rem' }}
              />
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{currentUser.email}</div>
              <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                <span className="badge badge-gold">⭐ Customer</span>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
                  onClick={() => setIsEditProfileOpen(true)}
                >
                  <Edit2 size={12} /> Edit
                </button>
              </div>
            </div>

            {/* Nav */}
            <div className="card">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.85rem 1.1rem', border: 'none',
                  background: activeTab === tab.id ? 'var(--gold-50)' : 'transparent',
                  borderLeft: activeTab === tab.id ? '3px solid var(--gold-500)' : '3px solid transparent',
                  color: activeTab === tab.id ? 'var(--gold-600)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left'
                }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--cream-100)' }}>
                <button onClick={logout} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.85rem 1.1rem', border: 'none', background: 'transparent',
                  color: 'var(--status-danger)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem'
                }}>
                  <LogOut size={17} /> Logout
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ minWidth: 0 }}>
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        currentUser={currentUser}
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onUpdateProfile={updateUserProfile}
      />
    </div>
  );
};

const OverviewTab = ({ userOrders, activeOrders, completedOrders, bakeryOrders, supplyOrders, currentUser, setDashboardTab, navigateToTracking, onOpenEditProfile }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 0, color: 'var(--text-primary)' }}>
      Welcome back, {currentUser.name.split(' ')[0]}! 🍰
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      {[
        { label: 'Active Orders', value: activeOrders.length, color: 'var(--gold-500)', emoji: '📦', tab: 'active-orders' },
        { label: 'Purchase History', value: completedOrders.length, color: 'var(--status-success)', emoji: '📜', tab: 'purchase-history' },
      ].map(s => (
        <div
          key={s.label}
          className="card card-interactive"
          onClick={() => setDashboardTab(s.tab)}
          style={{ padding: '1.35rem 1.5rem', textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>{s.emoji}</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
        </div>
      ))}
    </div>

    {/* Account & Delivery Info Overview Card */}
    <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} style={{ color: 'var(--gold-500)' }} /> Account & Delivery Information
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={onOpenEditProfile}>
            <Edit2 size={14} /> Edit Profile Details
          </button>
          <button className="btn btn-outline-gold btn-sm" onClick={() => setDashboardTab('addresses')}>
            <MapPin size={14} /> Saved Addresses ({currentUser.savedAddresses?.length || 0})
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: 'var(--bg-card)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', minWidth: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginTop: '0.35rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {currentUser.name}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', minWidth: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '0.35rem', overflowWrap: 'anywhere', wordBreak: 'break-all' }}>
            {currentUser.email}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', minWidth: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Contact</div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '0.35rem' }}>
            {currentUser.phone || '+234 803 555 0192'}
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', padding: '1.15rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', minWidth: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Default Delivery Address</div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gold-500)', marginTop: '0.35rem', lineHeight: 1.45, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {currentUser.savedAddresses?.find(a => a.isDefault)?.address || currentUser.savedAddresses?.[0]?.address || 'No address saved yet'}
          </div>
        </div>
      </div>
    </div>

    {/* Active Orders Section */}
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          Active Orders in Progress ({activeOrders.length})
        </h3>
        <button className="btn btn-outline btn-sm" onClick={() => setDashboardTab('active-orders')} style={{ fontSize: '0.78rem' }}>
          View All Active Orders →
        </button>
      </div>
      {activeOrders.length === 0 ? (
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No active orders in progress right now.
        </div>
      ) : (
        activeOrders.slice(0, 2).map(o => <OrderCard key={o.id} order={o} isHistory={false} navigateToTracking={navigateToTracking} />)
      )}
    </div>

    {/* Purchase History Section */}
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          Recent Purchase History ({completedOrders.length})
        </h3>
        <button className="btn btn-outline btn-sm" onClick={() => setDashboardTab('purchase-history')} style={{ fontSize: '0.78rem' }}>
          View Full History →
        </button>
      </div>
      {completedOrders.length === 0 ? (
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No past orders in your purchase history.
        </div>
      ) : (
        completedOrders.slice(0, 2).map(o => <OrderCard key={o.id} order={o} isHistory={true} onLeaveReview={() => setDashboardTab('feedback')} />)
      )}
    </div>
  </div>
);

const OrdersTab = ({ orders, title, subtitle, isHistory = false, navigateToTracking, onLeaveReview }) => {
  const [filterStore, setFilterStore] = useState('all');

  const filteredOrders = isHistory && filterStore !== 'all'
    ? orders.filter(o => o.store === filterStore)
    : orders;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>{title}</h2>
          {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{subtitle}</p>}
        </div>

        {isHistory && orders.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${filterStore === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterStore('all')}
            >
              All Purchases ({orders.length})
            </button>
            <button
              className={`btn btn-sm ${filterStore === 'bakery' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterStore('bakery')}
            >
              🍰 Bakery ({orders.filter(o => o.store === 'bakery').length})
            </button>
            <button
              className={`btn btn-sm ${filterStore === 'supplies' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterStore('supplies')}
            >
              🧁 Supplies ({orders.filter(o => o.store === 'supplies').length})
            </button>
          </div>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{isHistory ? '📜' : '📦'}</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {isHistory ? 'No Purchases Found' : 'No Active Orders'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isHistory
              ? 'You have no completed or cancelled orders in this purchase filter.'
              : 'You do not have any orders currently in progress or being delivered.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredOrders.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              expanded={false}
              isHistory={isHistory}
              navigateToTracking={navigateToTracking}
              onLeaveReview={onLeaveReview}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const OrderCard = ({ order, expanded = false, isHistory = false, navigateToTracking, onLeaveReview }) => {
  const [open, setOpen] = useState(expanded);
  const steps = ORDER_STATUS_STEPS;
  const currentStep = order.statusStep || 0;
  const isCancelled = order.status === 'Cancelled';

  const handlePrintReceipt = (e) => {
    e.stopPropagation();
    printOrderReceipt(order);
  };

  return (
    <div className="card" style={{ overflow: 'visible', marginBottom: '0.75rem' }}>
      <div style={{ padding: '1.1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{order.id}</span>
            <StatusBadge status={order.store} type="store" />
            <StatusBadge status={order.status} />
            {order.paymentStatus === 'Paid' ? (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#ECFDF5', color: '#047857', border: '1px solid #10B981', padding: '0.15rem 0.5rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                ✅ Verified Paid
              </span>
            ) : (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#FFFBEB', color: '#B45309', border: '1px solid #F59E0B', padding: '0.15rem 0.5rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                ⏳ Awaiting Payment
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {order.date} at {order.time} · {order.items.length} item(s)
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--gold-600)' }}>₦{order.total.toLocaleString()}</span>
          <ChevronRight size={18} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: '0.2s', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--border-subtle)', animation: 'slideDown 0.2s ease-out' }}>
          
          {/* Active Progress Track (Shown ONLY for active, non-history orders) */}
          {!isHistory && !isCancelled && (
            <div style={{ padding: '1.1rem 0 0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', overflowX: 'auto', gap: '0' }}>
                {steps.map((s, i) => {
                  const isDone = i <= currentStep;
                  const isCurrent = i === currentStep;
                  return (
                    <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 70 }}>
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: 28 }}>
                        <div style={{ flex: i === 0 ? 0 : 1, height: 3, background: i <= currentStep ? 'var(--status-success)' : 'var(--border-subtle)', transition: 'background 0.3s' }} />
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: isDone ? 'var(--status-success)' : 'var(--bg-surface)',
                          border: isDone ? '2px solid var(--status-success)' : '2px solid var(--border-subtle)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: isCurrent ? '0 0 0 4px rgba(34, 197, 94, 0.25)' : 'none',
                          transition: 'all 0.3s'
                        }}>
                          {isDone ? <CheckCircle2 size={16} color="white" /> : <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</span>}
                        </div>
                        <div style={{ flex: i === steps.length - 1 ? 0 : 1, height: 3, background: i < currentStep ? 'var(--status-success)' : 'var(--border-subtle)', transition: 'background 0.3s' }} />
                      </div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: isCurrent ? 'var(--status-success)' : 'var(--text-muted)', textAlign: 'center', marginTop: '0.4rem', maxWidth: 68, lineHeight: 1.25 }}>{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Verification Banner */}
          <div style={{
            margin: '0.75rem 0 1rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: order.paymentStatus === 'Paid' ? '#ECFDF5' : '#FFFBEB',
            border: `1px solid ${order.paymentStatus === 'Paid' ? '#10B981' : '#F59E0B'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: order.paymentStatus === 'Paid' ? '#047857' : '#B45309' }}>
              {order.paymentStatus === 'Paid' ? (
                <>
                  <span>✅ Bank Transfer Verified & Paid</span>
                  {order.bankTransferVerifiedBy && (
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      (Confirmed by {order.bankTransferVerifiedBy})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span>⏳ Awaiting Bank Transfer Verification</span>
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    — Finance team is reviewing your transfer
                  </span>
                </>
              )}
            </div>
            {order.paymentConfirmedAt && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Verified at {order.paymentConfirmedAt}
              </div>
            )}
          </div>

          {/* History Status Header Banner (Shown for completed or cancelled orders) */}
          {isHistory && (
            <div style={{
              margin: '0.85rem 0',
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: isCancelled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              border: `1px solid ${isCancelled ? 'var(--status-danger)' : 'var(--status-success)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: isCancelled ? 'var(--status-danger)' : 'var(--status-success)',
              fontWeight: 600
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isCancelled ? '❌ Order Cancelled' : '✅ Order Successfully Completed & Delivered'}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{order.date}</span>
            </div>
          )}

          {/* Items */}
          {order.items.map(item => (
            <div key={item.id + item.cartItemId} style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <img src={item.image} alt={item.name} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.size && `${item.size} · `}Qty: {item.quantity}
                  {item.customMessage && ` · "${item.customMessage}"`}
                </div>
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>₦{(item.unitPrice * item.quantity).toLocaleString()}</span>
            </div>
          ))}

          {/* Financial Breakdown (Subtotal, Delivery Fee, Total) */}
          {(() => {
            const itemsSubtotal = (order.items || []).reduce((acc, i) => acc + (i.unitPrice || 0) * (i.quantity || 1), 0);
            const giftFee = order.giftFee || 0;
            let deliveryFee = order.fulfillmentType === 'pickup' ? 0 : (order.deliveryFee !== undefined ? order.deliveryFee : 1500);

            if (order.total && itemsSubtotal + deliveryFee + giftFee !== order.total) {
              if (order.total > itemsSubtotal + giftFee) {
                deliveryFee = order.total - itemsSubtotal - giftFee;
              }
            }
            const displayTotal = itemsSubtotal + deliveryFee + giftFee;

            return (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Items Subtotal</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₦{itemsSubtotal.toLocaleString()}</span>
                </div>
                {giftFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Gift Packaging</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₦{giftFee.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Delivery Fee ({order.lga ? order.lga + ', Ogun State' : (order.fulfillmentType === 'pickup' ? 'Store Pick-up' : 'Delivery')})</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {order.fulfillmentType === 'pickup' || deliveryFee === 0 ? 'FREE' : `₦${deliveryFee.toLocaleString()}`}
                  </span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.92rem' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Total Amount Paid</span>
                  <span style={{ color: 'var(--gold-500)' }}>₦{displayTotal.toLocaleString()}</span>
                </div>
              </div>
            );
          })()}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              📍 {order.deliveryAddress}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              {!isHistory ? (
                /* Active Order Actions */
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={handlePrintReceipt}
                  >
                    <Printer size={15} /> Print Receipt
                  </button>
                  {order.fulfillmentType !== 'pickup' ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigateToTracking) navigateToTracking(order.id);
                      }}
                    >
                      🗺️ Track Order Live
                    </button>
                  ) : (
                    <span className="badge badge-gold" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                      🏬 Store Pick-Up Order
                    </span>
                  )}
                </div>
              ) : (
                /* History Actions: Print Receipt & Leave Review */
                <>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={handlePrintReceipt}
                  >
                    <Printer size={15} /> Print Receipt
                  </button>
                  {onLeaveReview && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLeaveReview(order.id);
                      }}
                    >
                      💬 Leave Review
                    </button>
                  )}
                </>
              )}
              <span style={{ fontWeight: 800, color: 'var(--gold-500)', fontSize: '1.05rem', marginLeft: '0.25rem' }}>Total: ₦{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WishlistTab = ({ products, navigateTo }) => (
  <div>
    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>My Wishlist ({products.length})</h2>
    {products.length === 0 ? (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💖</div>
        <p style={{ color: 'var(--text-muted)' }}>Your wishlist is empty. Start adding products you love!</p>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigateTo('home')}>Browse Products</button>
      </div>
    ) : (
      <div className="grid-products">
        {products.map(p => (
          <div key={p.id} className="card card-interactive" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <img src={p.image} alt={p.name} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.category}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{p.name}</div>
              <span className="price-tag" style={{ fontSize: '1rem' }}>
                <span className="price-currency">₦</span>{(p.price || p.basePrice || 0).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const AddressesTab = ({ addresses, onAddAddress, onUpdateAddress, onDeleteAddress, onSetDefaultAddress }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [form, setForm] = useState({
    label: '',
    address: '',
    lga: 'Abeokuta South',
    city: 'Abeokuta',
    state: 'Ogun State',
    phone: '',
    isDefault: false
  });

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setForm({
      label: 'Home',
      address: '',
      lga: 'Abeokuta South',
      city: 'Abeokuta',
      state: 'Ogun State',
      phone: '',
      isDefault: addresses.length === 0
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingAddress(addr);
    setForm({
      label: addr.label || 'Home',
      address: addr.address || '',
      lga: addr.lga || 'Abeokuta South',
      city: addr.city || 'Abeokuta',
      state: addr.state || 'Ogun State',
      phone: addr.phone || '',
      isDefault: !!addr.isDefault
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.address.trim()) return;

    if (editingAddress) {
      onUpdateAddress(editingAddress.id, form);
    } else {
      onAddAddress(form);
    }
    setModalOpen(false);
  };

  const OGUN_LGAS = [
    'Abeokuta South',
    'Abeokuta North',
    'Obafemi Owode',
    'Odeda',
    'Ifo (Sango Ota)',
    'Ado-Odo / Ota',
    'Sagamu',
    'Ijebu Ode',
    'Egbado North / South'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
            Saved Delivery Addresses 📍
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Manage your saved delivery locations across Ogun State & Abeokuta for quick checkout.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📍</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No Saved Delivery Addresses
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 420, margin: '0 auto 1.5rem' }}>
            You haven't saved any delivery locations yet. Add a home or office address to complete orders with a single click.
          </p>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Your First Address
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {addresses.map(a => (
            <div
              key={a.id}
              className="card"
              style={{
                padding: '1.5rem',
                border: a.isDefault ? '2px solid var(--gold-500)' : '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={18} style={{ color: 'var(--gold-500)' }} /> {a.label || 'Saved Location'}
                  </div>
                  {a.isDefault ? (
                    <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                      ⭐ Default Address
                    </span>
                  ) : (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', color: 'var(--gold-500)', padding: '0.2rem 0.5rem' }}
                      onClick={() => onSetDefaultAddress(a.id)}
                    >
                      Make Default
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.6rem' }}>
                  {a.address}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div><strong>LGA / City:</strong> {a.lga || 'Abeokuta South'}, {a.state || 'Ogun State'}</div>
                  {a.phone && <div><strong>Delivery Contact:</strong> {a.phone}</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleOpenEdit(a)}
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--status-danger)', padding: '0.4rem 0.75rem' }}
                  onClick={() => {
                    if (window.confirm(`Delete "${a.label}" address?`)) {
                      onDeleteAddress(a.id);
                    }
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 'var(--z-modal)',
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="card"
            style={{
              padding: '2rem', width: '100%', maxWidth: 480,
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              animation: 'modalIn 0.25s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>
                {editingAddress ? '✏️ Edit Delivery Address' : '📍 Add New Delivery Address'}
              </h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Address Label * (e.g. Home, Office, Mum's House)
                </label>
                <input
                  className="form-input"
                  required
                  placeholder="e.g. Home, Work, Abeokuta Branch"
                  value={form.label}
                  onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Full Street Address *
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  required
                  placeholder="House/Plot No., Street Name, Landmark, Area..."
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Ogun State LGA *
                  </label>
                  <select
                    className="form-select"
                    value={form.lga}
                    onChange={e => setForm(p => ({ ...p, lga: e.target.value }))}
                  >
                    {OGUN_LGAS.map(lga => (
                      <option key={lga} value={lga}>{lga}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Recipient Phone *
                  </label>
                  <input
                    className="form-input"
                    placeholder="0803 555 0192"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="isDefaultAddr"
                  checked={form.isDefault}
                  onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: 'var(--gold-500)', cursor: 'pointer' }}
                />
                <label htmlFor="isDefaultAddr" style={{ fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                  Set as my primary default delivery address
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAddress ? 'Save Changes' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const EditProfileModal = ({ currentUser, isOpen, onClose, onUpdateProfile }) => {
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    avatar: currentUser?.avatar || ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile(form);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-modal)',
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          padding: '2rem', width: '100%', maxWidth: 440,
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          animation: 'modalIn 0.25s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>
            ✏️ Edit Profile & Account Details
          </h3>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Full Name *
            </label>
            <input
              className="form-input"
              required
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Email Address *
            </label>
            <input
              type="email"
              className="form-input"
              required
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Phone Number
            </label>
            <input
              className="form-input"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Avatar Image URL (Optional)
            </label>
            <input
              className="form-input"
              placeholder="https://..."
              value={form.avatar}
              onChange={e => setForm(p => ({ ...p, avatar: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AccountFeedbackTab = ({ userOrders, currentUser, navigateTo }) => {
  const { addFeedback } = useOrders();
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    orderId: userOrders[0]?.id || '',
    store: userOrders[0]?.store || 'bakery',
    title: '',
    comment: ''
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.comment.trim()) return;

    const matchedOrder = userOrders.find(o => o.id === form.orderId);
    const productName = matchedOrder?.items?.[0]?.name || '';

    addFeedback({
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      orderId: form.orderId || (userOrders.length > 0 ? userOrders[0].id : 'ALZ-VERIFIED'),
      productName: productName,
      store: form.store,
      storeName: form.store === 'bakery' ? 'Bakery Store' : 'Baking Supplies Store',
      title: form.title,
      comment: form.comment,
      rating
    });

    setSubmitted(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
            Submit Account Feedback 💬
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            We'd love to hear about your experience! Submit your review directly from your account.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => navigateTo('feedback')}>
          View All Public Reviews →
        </button>
      </div>

      {submitted ? (
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Thank You for Your Feedback!
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            Your review has been successfully recorded. Thank you for helping us improve Alizson Cakes & Snacks!
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSubmitted(false);
              setForm({ orderId: userOrders[0]?.id || '', store: 'bakery', title: '', comment: '' });
              setRating(5);
            }}
          >
            Submit Another Review
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Select Recent Order to Review *
              </label>
              {userOrders.length > 0 ? (
                <select
                  className="form-select"
                  value={form.orderId}
                  onChange={e => {
                    const val = e.target.value;
                    const selectedO = userOrders.find(o => o.id === val);
                    update('orderId', val);
                    if (selectedO) update('store', selectedO.store);
                  }}
                >
                  {userOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.id} — {o.items?.[0]?.name || o.store} ({o.date} · ₦{o.total?.toLocaleString()})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="form-input"
                  placeholder="e.g. ALZ-BAK-1048 or ALZ-SUP-2019"
                  value={form.orderId}
                  onChange={e => update('orderId', e.target.value)}
                />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Store Reviewed
                </label>
                <select className="form-select" value={form.store} onChange={e => update('store', e.target.value)}>
                  <option value="bakery">🍰 Bakery Store (Cakes & Pastries)</option>
                  <option value="supplies">🧁 Baking Supplies</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Star Rating *
                </label>
                <div style={{ marginTop: '0.35rem' }}>
                  <RatingStars rating={rating} size={24} interactive onRate={setRating} />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Headline / Summary Title
              </label>
              <input
                className="form-input"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="e.g. Excellent taste & fast delivery!"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Your Detailed Feedback *
              </label>
              <textarea
                className="form-textarea"
                rows={4}
                required
                value={form.comment}
                onChange={e => update('comment', e.target.value)}
                placeholder="Share your thoughts about your cake, delivery, packaging, or customer service..."
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              <MessageCircle size={17} /> Submit Feedback
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
