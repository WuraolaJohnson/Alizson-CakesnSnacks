import React from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Cake, Package, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';
import { useStore } from '../../context/StoreContext';

export const CartDrawer = () => {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    navigateTo,
    goToCheckout
  } = useApp();

  const {
    bakeryCart,
    suppliesCart,
    activeCartTab,
    setActiveCartTab,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    bakerySubtotal,
    suppliesSubtotal,
    bakeryItemsCount,
    suppliesItemsCount,
    totalItemsCount
  } = useCart();

  const { switchStore } = useStore();

  if (!isCartDrawerOpen) return null;

  const currentCart = activeCartTab === 'bakery' ? bakeryCart : suppliesCart;
  const currentSubtotal = activeCartTab === 'bakery' ? bakerySubtotal : suppliesSubtotal;
  const otherCartCount = activeCartTab === 'bakery' ? suppliesItemsCount : bakeryItemsCount;

  const handleCheckout = () => {
    setIsCartDrawerOpen(false);
    goToCheckout();
  };

  const handleViewFullCart = () => {
    setIsCartDrawerOpen(false);
    navigateTo('cart');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)',
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(26, 23, 21, 0.65)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.25s ease'
      }}
      onClick={() => setIsCartDrawerOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-2xl)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--cream-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--cream-50)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: activeCartTab === 'bakery' ? 'var(--gold-100)' : 'var(--burgundy-100)',
                color: activeCartTab === 'bakery' ? 'var(--text-gold)' : 'var(--text-burgundy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}
            >
              {activeCartTab === 'bakery' ? '🍰' : '🧁'}
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--charcoal-900)', margin: 0 }}>
                Shopping Cart
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {totalItemsCount} total item{totalItemsCount !== 1 ? 's' : ''} across stores
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--charcoal-400)',
              padding: '0.4rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Store Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid var(--cream-200)',
            background: 'var(--cream-100)',
            padding: '0.4rem',
            gap: '0.4rem'
          }}
        >
          <button
            onClick={() => setActiveCartTab('bakery')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-sans)',
              background: activeCartTab === 'bakery' ? 'var(--bg-surface)' : 'transparent',
              color: activeCartTab === 'bakery' ? 'var(--text-gold)' : 'var(--charcoal-600)',
              boxShadow: activeCartTab === 'bakery' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Cake size={16} color={activeCartTab === 'bakery' ? 'var(--gold-600)' : 'currentColor'} />
            Bakery Cart
            {bakeryItemsCount > 0 && (
              <span
                style={{
                  background: 'var(--gold-action)',
                  color: 'white',
                  borderRadius: 'var(--radius-full)',
                  padding: '1px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}
              >
                {bakeryItemsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveCartTab('supplies')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-sans)',
              background: activeCartTab === 'supplies' ? 'var(--bg-surface)' : 'transparent',
              color: activeCartTab === 'supplies' ? 'var(--text-burgundy)' : 'var(--charcoal-600)',
              boxShadow: activeCartTab === 'supplies' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Package size={16} color={activeCartTab === 'supplies' ? 'var(--burgundy-700)' : 'currentColor'} />
            Supplies Cart
            {suppliesItemsCount > 0 && (
              <span
                style={{
                  background: 'var(--burgundy-700)',
                  color: 'white',
                  borderRadius: 'var(--radius-full)',
                  padding: '1px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}
              >
                {suppliesItemsCount}
              </span>
            )}
          </button>
        </div>

        {/* Other Store Alert Banner */}
        {otherCartCount > 0 && (
          <div
            style={{
              padding: '0.6rem 1rem',
              background: activeCartTab === 'bakery' ? 'var(--burgundy-50)' : 'var(--gold-50)',
              borderBottom: '1px solid var(--cream-200)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'var(--text-primary)'
            }}
          >
            <span>
              You also have <strong>{otherCartCount}</strong> item{otherCartCount > 1 ? 's' : ''} in your {activeCartTab === 'bakery' ? 'Supplies' : 'Bakery'} Cart.
            </span>
            <button
              onClick={() => setActiveCartTab(activeCartTab === 'bakery' ? 'supplies' : 'bakery')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '0 0.2rem'
              }}
            >
              Switch
            </button>
          </div>
        )}

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {currentCart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  background: 'var(--cream-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  margin: '0 auto 1.25rem'
                }}
              >
                {activeCartTab === 'bakery' ? '🎂' : '🧁'}
              </div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--charcoal-900)', marginBottom: '0.5rem' }}>
                Your {activeCartTab === 'bakery' ? 'Bakery' : 'Supplies'} Cart is Empty
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                {activeCartTab === 'bakery'
                  ? 'Explore our freshly baked artisanal cakes and sweet treats.'
                  : 'Shop professional baking ingredients, tools, and decorations.'}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  switchStore(activeCartTab);
                  navigateTo(activeCartTab);
                }}
              >
                Explore {activeCartTab === 'bakery' ? 'Bakery' : 'Supplies'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentCart.map(item => (
                <div
                  key={item.cartItemId}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '0.9rem',
                    background: 'var(--cream-50)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--cream-200)',
                    position: 'relative'
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'cover',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <h4
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: 'var(--charcoal-900)',
                          margin: 0,
                          lineHeight: 1.3
                        }}
                      >
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.store, item.cartItemId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--charcoal-400)',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.15s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--status-danger)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--charcoal-400)')}
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Variant & Customization Info */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--charcoal-500)', marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      {item.size && <span><strong>Size:</strong> {item.size}</span>}
                      {item.flavour && <span><strong>Flavour:</strong> {item.flavour}</span>}
                      {item.addOns && item.addOns.length > 0 && (
                        <span><strong>Add-ons:</strong> {item.addOns.join(', ')}</span>
                      )}
                      {item.customMessage && (
                        <span style={{ fontStyle: 'italic', color: 'var(--text-gold)' }}>
                          "{item.customMessage}"
                        </span>
                      )}
                    </div>

                    {/* Price & Quantity Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '0.75rem'
                      }}
                    >
                      <span style={{ fontWeight: 800, color: 'var(--text-gold)', fontSize: '0.95rem' }}>
                        ₦{(item.unitPrice * item.quantity).toLocaleString()}
                      </span>

                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-full)',
                          border: '1px solid var(--cream-300)',
                          overflow: 'hidden'
                        }}
                      >
                        <button
                          onClick={() => updateCartQuantity(item.store, item.cartItemId, item.quantity - 1)}
                          style={{
                            padding: '3px 8px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--charcoal-600)',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ padding: '0 6px', fontSize: '0.8rem', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.store, item.cartItemId, item.quantity + 1)}
                          style={{
                            padding: '3px 8px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--charcoal-600)',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {currentCart.length > 0 && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid var(--cream-200)',
              background: 'var(--bg-surface)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Subtotal</span>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--charcoal-900)' }}>
                ₦{currentSubtotal.toLocaleString()}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Shipping and taxes calculated at checkout.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                className={`btn ${activeCartTab === 'bakery' ? 'btn-primary' : 'btn-burgundy'}`}
                style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem' }}
                onClick={handleCheckout}
              >
                Proceed to Checkout <ArrowRight size={17} />
              </button>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.85rem' }}
                onClick={handleViewFullCart}
              >
                View Full Cart Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
