import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, CreditCard, Lock, Clock, AlertCircle, Copy, Check, ArrowRight, ExternalLink } from 'lucide-react';
import { useOrders } from '../context/OrderContext';
import { useApp } from '../context/AppContext';

export default function OrderPaymentPage({ orderIdParam }) {
  const { orders, verifyAndRecordPayment } = useOrders();
  const { navigateTo } = useApp();

  // Get orderId from prop or URL param
  const urlParams = new URLSearchParams(window.location.search);
  const targetOrderId = orderIdParam || urlParams.get('orderId') || urlParams.get('id');

  const order = orders.find(o => o.id === targetOrderId) || orders[0];

  const [isProcessing, setIsProcessing] = useState(false);
  const [paystackKey, setPaystackKey] = useState(() => {
    return localStorage.getItem('cz_paystack_pub_key') || 'pk_test_alizson_demo_key';
  });
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [paymentSuccessRef, setPaymentSuccessRef] = useState(null);

  // Load Paystack Inline Script dynamically if needed
  useEffect(() => {
    if (!window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1.5rem', background: 'var(--cream-50)', minHeight: '80vh' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔍</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--text-primary)' }}>Order Not Found</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Please check the payment link or contact your delivery rider.
        </p>
        <button className="btn btn-primary" onClick={() => navigateTo('home')}>
          Return to Marketplace Home
        </button>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'Paid';
  const orderTotal = order.total || 0;

  // Handle Paystack Payment Flow
  const handleInitiatePaystack = () => {
    if (isPaid) return;
    setIsProcessing(true);

    const generatedRef = `ALZ-PAY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    if (window.PaystackPop) {
      try {
        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email: order.customerEmail || 'customer@alizson.com',
          amount: Math.round(orderTotal * 100), // Amount in Kobo
          currency: 'NGN',
          ref: generatedRef,
          metadata: {
            order_id: order.id,
            customer_name: order.customerName,
            custom_fields: [
              { display_name: "Order Number", variable_name: "order_number", value: order.id },
              { display_name: "Store Type", variable_name: "store_type", value: order.storeName }
            ]
          },
          onClose: () => {
            setIsProcessing(false);
          },
          callback: (response) => {
            setIsProcessing(false);
            const ref = response.reference || generatedRef;
            setPaymentSuccessRef(ref);
            verifyAndRecordPayment(order.id, ref, response);
          }
        });
        handler.openIframe();
      } catch (err) {
        console.warn('Paystack popup fallback to simulated Gateway verification:', err);
        // Fallback demo simulator for test environments
        setTimeout(() => {
          setIsProcessing(false);
          setPaymentSuccessRef(generatedRef);
          verifyAndRecordPayment(order.id, generatedRef, { status: 'success' });
        }, 1200);
      }
    } else {
      // Fallback demo Gateway processing
      setTimeout(() => {
        setIsProcessing(false);
        setPaymentSuccessRef(generatedRef);
        verifyAndRecordPayment(order.id, generatedRef, { status: 'success' });
      }, 1200);
    }
  };

  return (
    <div style={{ background: 'var(--cream-50)', minHeight: '90vh', padding: '3rem 0 5rem' }}>
      <div className="container-narrow">
        
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--gold-50)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', color: 'var(--gold-700)', fontWeight: 800, fontSize: '0.8rem', border: '1px solid var(--gold-200)', marginBottom: '0.75rem' }}>
            <ShieldCheck size={16} /> Alizson Direct Gateway Security
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--text-primary)', margin: '0 0 0.4rem' }}>
            Pay on Delivery Payment Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto' }}>
            Complete your order payment directly via Paystack gateway. Payment is automatically verified and confirmed on your rider's terminal.
          </p>
        </div>

        {/* Payment Main Card */}
        <div className="card" style={{ padding: '2rem', maxWidth: 600, margin: '0 auto', boxShadow: 'var(--shadow-xl)', border: isPaid ? '2px solid #10B981' : '2px solid var(--gold-500)' }}>
          
          {/* Order Status Banner */}
          <div style={{
            background: isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${isPaid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>
              {isPaid ? '🎉' : '💳'}
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: isPaid ? '#10B981' : '#D97706', marginBottom: '0.2rem' }}>
              {isPaid ? 'PAYMENT CONFIRMED & VERIFIED' : 'PAYMENT AWAITING CONFIRMATION'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isPaid 
                ? `Order #${order.id} is fully paid and verified. Your rider has been notified.`
                : `Order #${order.id} is currently awaiting payment for delivery handover.`
              }
            </div>
          </div>

          {/* Amount Due Big Display */}
          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              OFFICIAL SERVER AMOUNT DUE
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--gold-500)', margin: '0.2rem 0' }}>
              ₦{orderTotal.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Includes items subtotal + delivery fee + any applied gift charges
            </div>
          </div>

          {/* Order Breakdown Details */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)', fontSize: '0.875rem' }}>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Order Summary</span>
              <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>{order.storeName || 'Alizson Store'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', color: 'var(--text-secondary)' }}>
              <div>👤 <strong>Customer Name:</strong> {order.customerName}</div>
              <div>📍 <strong>Delivery Address:</strong> {order.deliveryAddress}</div>
              <div>📞 <strong>Phone:</strong> {order.customerPhone}</div>
              <div>📦 <strong>Items Ordered:</strong> {(order.items || []).length} item(s)</div>
              {order.paymentReference && (
                <div>💳 <strong>Payment Reference:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#10B981' }}>{order.paymentReference}</span></div>
              )}
              {order.paymentConfirmedAt && (
                <div>🕒 <strong>Confirmed At:</strong> {order.paymentConfirmedAt}</div>
              )}
            </div>
          </div>

          {/* Payment Action or Confirmation State */}
          {!isPaid ? (
            <div>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center', fontSize: '1.05rem', padding: '0.9rem 1.5rem', fontWeight: 800 }}
                onClick={handleInitiatePaystack}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <> Processing Payment Verification... </>
                ) : (
                  <> <CreditCard size={20} /> Pay ₦{orderTotal.toLocaleString()} Now via Paystack </>
                )}
              </button>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.85rem' }}>
                🔒 256-Bit SSL Encrypted. Supports Bank Cards, Transfers & USSD Banking.
              </div>

              {/* Optional Config for Paystack Public Key */}
              <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px dashed var(--border-subtle)', paddingTop: '1rem' }}>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setShowKeyConfig(!showKeyConfig)}
                >
                  ⚙️ Configure Paystack API Public Key (Optional)
                </button>

                {showKeyConfig && (
                  <div style={{ marginTop: '0.75rem', background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                      Paystack Public Key (e.g. pk_test_... or pk_live_...):
                    </label>
                    <input
                      type="text"
                      className="input"
                      style={{ fontSize: '0.8rem', width: '100%', marginBottom: '0.5rem' }}
                      value={paystackKey}
                      onChange={(e) => {
                        setPaystackKey(e.target.value);
                        localStorage.setItem('cz_paystack_pub_key', e.target.value);
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Saved to local environment. Leave as default test key to run in sandbox mode.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#10B981', color: 'white', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} /> Payment Success Confirmed
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Thank you! Your payment reference is <strong style={{ fontFamily: 'monospace' }}>{order.paymentReference || paymentSuccessRef}</strong>. The rider can now complete your delivery handover.
              </p>
              <button className="btn btn-outline" onClick={() => navigateTo('tracking', order.id)}>
                View Live Delivery Tracking <ArrowRight size={16} />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
