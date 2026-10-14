import React, { useEffect } from 'react';
import { CheckCircle2, Clock, MapPin, Phone, Mail, ShoppingBag, ArrowRight, Printer, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { useOrders, ORDER_STATUS_STEPS } from '../context/OrderContext';
import { StatusBadge } from '../components/Common/StatusBadge';

export const OrderConfirmationPage = () => {
  const { lastPlacedOrder, navigateTo, navigateToTracking } = useApp();
  const { orders } = useOrders();

  // Find latest placed order or fallback to most recent in state
  const currentOrder = lastPlacedOrder || orders[0];

  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Confetti fallback
    }
  }, []);

  if (!currentOrder) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1.5rem', background: 'var(--cream-50)', minHeight: '80vh' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '0.75rem' }}>No recent order found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Start by browsing our bakery or baking supplies catalogs.</p>
        <button className="btn btn-primary" onClick={() => navigateTo('bakery')}>Browse Bakery</button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ background: 'var(--cream-50)', minHeight: '90vh', padding: '3rem 0 6rem' }}>
      <div className="container-narrow">
        {/* Celebration Banner */}
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            marginBottom: '2rem',
            background: 'linear-gradient(180deg, #FFFFFF 0%, var(--cream-50) 100%)',
            border: '1px solid var(--cream-200)'
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--gold-400), var(--gold-600))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 24px rgba(229,138,19,0.35)'
            }}
          >
            <CheckCircle2 size={44} />
          </div>

          <span className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>
            🎉 Order Placed Successfully
          </span>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
            Thank You for Your Order!
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto 1.5rem' }}>
            We've received your order and our artisan bakers are preparing it with care. A confirmation email has been dispatched to <strong>{currentOrder.customerEmail}</strong>.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1rem',
              background: 'var(--bg-surface)',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Order ID:</span>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--gold-500)', letterSpacing: '0.04em' }}>
              {currentOrder.id}
            </span>
            {currentOrder.fulfillmentType !== 'pickup' ? (
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                onClick={() => navigateToTracking(currentOrder.id)}
              >
                🗺️ Track Delivery Live on Map
              </button>
            ) : (
              <span className="badge badge-gold" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
                🏬 Store Pick-Up Order
              </span>
            )}
          </div>
        </div>

        {/* Live Order Status Stepper */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
              Live Order Tracking
            </h3>
            <StatusBadge status={currentOrder.status} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', padding: '1rem 0' }}>
            {ORDER_STATUS_STEPS.map((stepItem, idx) => {
              const isPassed = (currentOrder.statusStep || 1) >= stepItem.step;
              const isCurrent = (currentOrder.statusStep || 1) === stepItem.step;

              return (
                <div
                  key={stepItem.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flex: 1,
                    minWidth: '70px',
                    position: 'relative',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isCurrent ? 'var(--gold-500)' : isPassed ? 'var(--status-success)' : 'var(--bg-surface)',
                      color: isPassed ? 'white' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      zIndex: 2,
                      boxShadow: isCurrent ? '0 0 0 4px rgba(229,138,19,0.2)' : 'none'
                    }}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: isCurrent ? 800 : isPassed ? 600 : 500,
                      color: isCurrent ? 'var(--gold-500)' : isPassed ? 'var(--text-primary)' : 'var(--text-muted)',
                      lineHeight: 1.2
                    }}
                  >
                    {stepItem.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details & Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Order Items */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              Ordered Items ({currentOrder.items?.length || 0})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {currentOrder.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Qty: {item.quantity} {item.size ? `· ${item.size}` : ''} {item.flavour ? `· ${item.flavour}` : ''}
                    </div>
                    {item.customMessage && (
                      <div style={{ fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--gold-500)' }}>
                        "{item.customMessage}"
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gold-500)', flexShrink: 0 }}>
                    ₦{((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Financials */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                <span>Subtotal</span>
                <span>₦{(currentOrder.subtotal || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                <span>Delivery Fee</span>
                <span>{currentOrder.fulfillmentType === 'pickup' || currentOrder.deliveryFee === 0 ? 'FREE' : `₦${(currentOrder.deliveryFee ?? 1500).toLocaleString()}`}</span>
              </div>
              {currentOrder.giftConfig?.isGift && (currentOrder.giftFee > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--gold-500)', fontWeight: 600, marginBottom: '0.75rem' }}>
                  <span>🎁 Gift Package ({currentOrder.giftConfig.packaging?.name || 'Gift Package'})</span>
                  <span>₦{(currentOrder.giftFee || 0).toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', paddingTop: '0.6rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span>Total Paid / Due</span>
                <span style={{ color: 'var(--gold-500)' }}>₦{(currentOrder.total || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Gift Package Details Badge */}
            {currentOrder.giftConfig && (
              <div 
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--gold-500)', marginBottom: '0.35rem' }}>
                  <span>🎁 Personalized Gift Service Active</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong>Packaging:</strong> {currentOrder.giftConfig.packaging?.name}<br />
                  <strong>Card Style:</strong> {currentOrder.giftConfig.card?.name}<br />
                  <strong>Occasion:</strong> {currentOrder.giftConfig.occasion}<br />
                  {currentOrder.giftConfig.personalMessage && (
                    <div style={{ marginTop: '0.35rem', fontStyle: 'italic', color: 'var(--gold-500)' }}>
                      "{currentOrder.giftConfig.personalMessage}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Delivery & Customer Info */}
          <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Delivery Information
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <MapPin size={16} color="var(--gold-500)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{currentOrder.deliveryAddress || 'Olusegun Obasanjo Hilltop, Abeokuta, Ogun State'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="var(--gold-500)" style={{ flexShrink: 0 }} />
                  <span>{currentOrder.deliverySlot || 'Standard Delivery (24-48 hours)'}</span>
                </div>

                {currentOrder.latitude && currentOrder.longitude && (
                  <div style={{ marginTop: '0.4rem', background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 800, color: 'var(--gold-500)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      📍 Map Pin Coordinates Saved
                    </div>
                    <div style={{ marginTop: '0.2rem', fontFamily: 'monospace', fontWeight: 600 }}>
                      Lat: {currentOrder.latitude}, Lng: {currentOrder.longitude}
                    </div>
                    <div style={{ marginTop: '0.1rem', color: 'var(--text-secondary)' }}>
                      LGA: {currentOrder.lga || 'Abeokuta South'}, Ogun State
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Recipient Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div><strong>Name:</strong> {currentOrder.customerName}</div>
                <div><strong>Email:</strong> {currentOrder.customerEmail}</div>
                <div><strong>Phone:</strong> {currentOrder.customerPhone || '+234 803 555 0192'}</div>
                <div><strong>Payment Method:</strong> {currentOrder.paymentMethod}</div>
              </div>
            </div>

            {currentOrder.specialInstructions && (
              <div style={{ background: 'var(--bg-surface)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--gold-500)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Special Instructions:</div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{currentOrder.specialInstructions}"</div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigateTo('dashboard')}>
            View in Customer Dashboard <ArrowRight size={17} />
          </button>
          <button className="btn btn-outline" onClick={handlePrint}>
            <Printer size={17} /> Print Receipt
          </button>
          <button className="btn btn-secondary" onClick={() => navigateTo('bakery')}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
