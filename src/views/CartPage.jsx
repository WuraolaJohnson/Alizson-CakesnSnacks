import React from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/Common/StatusBadge';

const CartPage = () => {
  const {
    bakeryCart, suppliesCart,
    bakerySubtotal, suppliesSubtotal,
    updateCartQuantity, removeFromCart,
    bakeryItemsCount, suppliesItemsCount,
    activeCartTab, setActiveCartTab,
    giftConfig, toggleGiftService, totalGiftFee
  } = useCart();
  const { navigateTo, openGiftStudio } = useApp();

  const DELIVERY_FEE = 1500;

  const activeCart = activeCartTab === 'bakery' ? bakeryCart : suppliesCart;
  const activeSubtotal = activeCartTab === 'bakery' ? bakerySubtotal : suppliesSubtotal;
  const total = activeSubtotal + (activeCart.length > 0 ? DELIVERY_FEE : 0) + totalGiftFee;

  return (
    <div style={{ background: 'var(--cream-50)', minHeight: '80vh', paddingBottom: '4rem' }}>
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <ShoppingBag size={24} style={{ color: 'var(--gold-600)' }} />
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Your Shopping Cart</h1>
        </div>

        {/* Ogun State Delivery Notice Banner */}
        <div style={{
          background: 'rgba(229,138,19,0.12)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(229,138,19,0.3)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🚚</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--gold-900)' }}>
                Delivery Restricted to Ogun State Only
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Home & office delivery is available across all 20 Ogun State LGAs. Free store pick-up is available at our Abeokuta stores (Hilltop & Kuto).
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-800)', background: 'white', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-300)' }}>
            Ogun Delivery Belt 📍
          </span>
        </div>

        {/* Cart Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', background: 'var(--cream-200)', padding: '4px', borderRadius: 'var(--radius-full)', width: 'fit-content' }}>
          <button
            onClick={() => setActiveCartTab('bakery')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 1.25rem', borderRadius: 'var(--radius-full)', border: 'none',
              background: activeCartTab === 'bakery' ? 'linear-gradient(135deg, var(--gold-500), var(--gold-600))' : 'transparent',
              color: activeCartTab === 'bakery' ? 'white' : 'var(--charcoal-600)',
              fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'all 0.2s',
              boxShadow: activeCartTab === 'bakery' ? '0 4px 12px rgba(229,138,19,0.35)' : 'none'
            }}
          >
            🍰 Bakery Cart
            {bakeryItemsCount > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.25)', padding: '1px 7px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem' }}>
                {bakeryItemsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveCartTab('supplies')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 1.25rem', borderRadius: 'var(--radius-full)', border: 'none',
              background: activeCartTab === 'supplies' ? 'linear-gradient(135deg, var(--burgundy-700), var(--burgundy-800))' : 'transparent',
              color: activeCartTab === 'supplies' ? 'white' : 'var(--charcoal-600)',
              fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'all 0.2s',
              boxShadow: activeCartTab === 'supplies' ? '0 4px 12px rgba(102,16,34,0.35)' : 'none'
            }}
          >
            🧁 Supplies Cart
            {suppliesItemsCount > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.25)', padding: '1px 7px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem' }}>
                {suppliesItemsCount}
              </span>
            )}
          </button>
        </div>

        {activeCart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--cream-200)' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1.25rem' }}>
              {activeCartTab === 'bakery' ? '🍰' : '🧁'}
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Your {activeCartTab === 'bakery' ? 'Bakery' : 'Supplies'} Cart is Empty
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
              {activeCartTab === 'bakery' ? 'Explore our freshly baked treats and find something delicious.' : 'Browse our professional baking supplies and stock up.'}
            </p>
            <button className={`btn ${activeCartTab === 'bakery' ? 'btn-primary' : 'btn-burgundy'} btn-lg`}
              onClick={() => navigateTo(activeCartTab)}>
              {activeCartTab === 'bakery' ? '🍰 Shop Bakery' : '🧁 Shop Supplies'}
            </button>
          </div>
        ) : (
          <div className="cart-page-grid">
            {/* Cart Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card" style={{ overflow: 'visible' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--cream-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.925rem', fontWeight: 700, color: 'var(--charcoal-800)' }}>
                    {activeCartTab === 'bakery' ? '🍰 Bakery Cart' : '🧁 Baking Supplies Cart'}
                  </h3>
                  <StatusBadge status={activeCartTab === 'bakery' ? 'bakery' : 'supplies'} type="store" />
                </div>

                {activeCart.map((item, i) => (
                  <CartItemRow
                    key={item.cartItemId}
                    item={item}
                    store={activeCartTab}
                    onUpdateQty={(id, q) => updateCartQuantity(activeCartTab, id, q)}
                    onRemove={(id) => removeFromCart(activeCartTab, id)}
                    isLast={i === activeCart.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              {/* Gift Service Banner Card */}
              <div 
                style={{
                  background: 'linear-gradient(135deg, #FFFBEB 0%, #FFF5F7 100%)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #FDE68A',
                  padding: '1.25rem',
                  marginBottom: '1rem',
                  boxShadow: '0 2px 8px rgba(198,114,10,0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🎁</span>
                    <strong style={{ fontSize: '0.9rem', color: '#7E152B' }}>
                      Personalized Gift Package
                    </strong>
                  </div>
                  <input
                    type="checkbox"
                    checked={giftConfig.isGift}
                    onChange={(e) => toggleGiftService(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#7E152B' }}
                  />
                </div>

                <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.4 }}>
                  Turn this order into a luxury gift with custom packaging, greeting card, and recipient surprise delivery.
                </p>

                <button
                  onClick={openGiftStudio}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #C6720A',
                    backgroundColor: '#fff',
                    color: '#C6720A',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                >
                  ✨ Configure Gift Package {giftConfig.isGift ? '(Active)' : ''}
                </button>
              </div>

              <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '80px' }}>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                  Order Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <SummaryRow label="Subtotal" value={`₦${activeSubtotal.toLocaleString()}`} />
                  <SummaryRow label="Delivery Fee" value={`₦${DELIVERY_FEE.toLocaleString()}`} />
                  
                  {giftConfig.isGift && totalGiftFee > 0 && (
                    <SummaryRow 
                      label={`Gift Package (${giftConfig.packaging?.name || 'Package'})`} 
                      value={`₦${totalGiftFee.toLocaleString()}`} 
                    />
                  )}

                  <div className="divider" />
                  <SummaryRow
                    label="Total"
                    value={`₦${total.toLocaleString()}`}
                    large
                  />
                </div>

                <button
                  className={`btn ${activeCartTab === 'bakery' ? 'btn-primary' : 'btn-burgundy'} btn-lg`}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigateTo('checkout')}
                >
                  Proceed to Checkout <ArrowRight size={17} />
                </button>

                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '0.6rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}
                  onClick={() => navigateTo(activeCartTab)}>
                  ← Continue Shopping
                </button>

                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: 'var(--status-success)', fontSize: '0.8rem', fontWeight: 600 }}>
                  🔒 Secure Checkout · SSL Encrypted
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CartItemRow = ({ item, store, onUpdateQty, onRemove, isLast }) => (
  <div style={{ padding: '1.1rem 1.25rem', borderBottom: isLast ? 'none' : '1px solid var(--cream-100)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
    <img src={item.image} alt={item.name} style={{ width: 75, height: 75, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0, border: '1px solid var(--cream-200)' }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', fontFamily: 'var(--font-sans)' }}>{item.name}</h4>
      {item.size && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}><strong>Size:</strong> {item.size}</div>}
      {item.flavour && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}><strong>Flavour:</strong> {item.flavour}</div>}
      {item.addOns?.length > 0 && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}><strong>Add-Ons:</strong> {item.addOns.join(', ')}</div>}
      {item.customMessage && <div style={{ fontSize: '0.78rem', color: 'var(--gold-500)', marginBottom: '0.15rem', fontStyle: 'italic' }}><strong>Message:</strong> "{item.customMessage}"</div>}
      {item.brand && <div style={{ fontSize: '0.78rem', color: 'var(--gold-500)', marginBottom: '0.15rem', fontWeight: 700 }}>{item.brand}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        {/* Qty */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', padding: '0.2rem 0.4rem' }}>
          <button onClick={() => onUpdateQty(item.cartItemId, item.quantity - 1)}
            style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Minus size={12} />
          </button>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '1.5rem', textAlign: 'center', color: 'var(--text-primary)' }}>{item.quantity}</span>
          <button onClick={() => onUpdateQty(item.cartItemId, item.quantity + 1)}
            style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Plus size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>₦{(item.unitPrice * item.quantity).toLocaleString()}</span>
          <button onClick={() => onRemove(item.cartItemId)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--status-danger)', padding: '0.25rem', borderRadius: 'var(--radius-sm)',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--status-danger-bg)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const SummaryRow = ({ label, value, large }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: large ? '1rem' : '0.9rem', fontWeight: large ? 700 : 500, color: large ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
    <span style={{ fontSize: large ? '1.2rem' : '0.9rem', fontWeight: 800, color: large ? 'var(--gold-500)' : 'var(--text-primary)' }}>{value}</span>
  </div>
);

export default CartPage;
