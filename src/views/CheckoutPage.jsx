import React, { useState } from 'react';
import { Check, ChevronRight, CreditCard, Truck, User, ClipboardList, Sparkles, MapPin, Store, ShieldAlert, Navigation, Building2, Copy } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useApp } from '../context/AppContext';
import { OGUN_DELIVERY_LOCATIONS, ALIZSON_OFFICIAL_CONTACTS } from '../data/ogunLocations';
import OgunLocationMapPicker from '../components/Common/OgunLocationMapPicker';
import { initializePayment, nairaToKobo, isPaystackConfigured } from '../services/paystackService';

const STEPS = ['Customer Info', 'Order Method', 'Review Order', 'Payment', 'Confirmation'];

const PAYMENT_METHODS = [
  { id: 'transfer', label: 'Direct Bank Transfer', icon: '🏦' },
  { id: 'card', label: 'Debit / Credit Card', icon: '💳' },
  { id: 'ussd', label: 'USSD Banking', icon: '📱' },
  { id: 'cod', label: 'Pay on Delivery', icon: '💵' },
];

const CheckoutPage = () => {
  const { 
    bakeryCart, suppliesCart, 
    bakerySubtotal, suppliesSubtotal, 
    activeCartTab, clearCart,
    giftConfig, totalGiftFee
  } = useCart();
  const { createOrder, deliveryLocations, storeBankAccount } = useOrders();
  const { navigateTo, currentUser, setLastPlacedOrder, showToast } = useApp();

  const locationsList = deliveryLocations && deliveryLocations.length > 0 ? deliveryLocations : OGUN_DELIVERY_LOCATIONS;

  const [step, setStep] = useState(0);
  const [fulfillmentType, setFulfillmentType] = useState('delivery'); // 'delivery' or 'pickup'
  const [pickupBranch, setPickupBranch] = useState(
    activeCartTab === 'bakery' ? 'bakery' : 'supplies'
  );
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const activeCart = activeCartTab === 'bakery' ? bakeryCart : suppliesCart;
  const activeSubtotal = activeCartTab === 'bakery' ? bakerySubtotal : suppliesSubtotal;

  const [selectedOgunLocation, setSelectedOgunLocation] = useState(locationsList[0]);

  const [form, setForm] = useState({
    name: giftConfig.isGift && giftConfig.recipientName ? giftConfig.recipientName : (currentUser?.name || ''),
    email: currentUser?.email || '',
    phone: giftConfig.isGift && giftConfig.recipientPhone ? giftConfig.recipientPhone : (currentUser?.phone || ''),
    address: giftConfig.isGift && giftConfig.deliveryAddress ? giftConfig.deliveryAddress : (currentUser?.savedAddresses?.[0]?.address || 'Abeokuta South, Ogun State'),
    lga: 'Abeokuta South',
    city: 'Kuto & Ibara Central Hub',
    state: 'Ogun State',
    latitude: 7.1557,
    longitude: 3.3458,
    placeInfo: null,
    deliverySlot: 'Standard Delivery (24-48 hours)',
    instructions: giftConfig.isGift && giftConfig.specialInstructions ? giftConfig.specialInstructions : '',
    paymentMethod: 'transfer',
    senderName: '',
    transferRef: ''
  });

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  // Delivery Fee & Total calculation
  const DELIVERY_FEE = fulfillmentType === 'pickup' ? 0 : (selectedOgunLocation?.deliveryFee || 1500);
  const giftFee = giftConfig?.isGift ? totalGiftFee : 0;
  const TOTAL = activeSubtotal + DELIVERY_FEE + giftFee;

  const handleSelectOgunFromMap = (locationData) => {
    update('state', 'Ogun State');
    update('lga', locationData.lga);
    update('city', locationData.city || locationData.town || 'Abeokuta');
    update('address', locationData.fullAddress);
    update('latitude', locationData.latitude || 7.1557);
    update('longitude', locationData.longitude || 3.3458);
    update('placeInfo', locationData.placeInfo || null);

    const matchedZone = OGUN_DELIVERY_LOCATIONS.find(l => l.lga.toLowerCase() === locationData.lga.toLowerCase()) || selectedOgunLocation;
    setSelectedOgunLocation(matchedZone);
  };

  const handleCopyAccount = () => {
    const acc = storeBankAccount?.accountNumber || '0123456789';
    navigator.clipboard.writeText(acc);
    setCopiedAccount(true);
    showToast('Store Account Number copied to clipboard! 📋', 'success');
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handlePlaceOrder = (paystackRef = null) => {
    if (form.paymentMethod === 'transfer' && !form.senderName.trim()) {
      showToast('Please enter your Sender Name & Bank for transfer verification.', 'error');
      return;
    }

    const finalAddress =
      fulfillmentType === 'pickup'
        ? `STORE PICK-UP: ${ALIZSON_OFFICIAL_CONTACTS.branches[pickupBranch].name} (${ALIZSON_OFFICIAL_CONTACTS.branches[pickupBranch].address})`
        : form.address.includes('Ogun State') ? form.address : `${form.address}, ${form.lga}, Ogun State`;

    const selectedPmObj = PAYMENT_METHODS.find(pm => pm.id === form.paymentMethod);
    const resolvedPmLabel = paystackRef
      ? `Debit/Credit Card (Paystack Ref: ${paystackRef})`
      : (selectedPmObj ? selectedPmObj.label : 'Direct Bank Transfer');

    const order = createOrder({
      store: activeCartTab,
      storeName: activeCartTab === 'bakery' ? 'Bakery Store' : 'Baking Supply Store',
      customerName: form.name,
      customerEmail: form.email,
      customerPhone: form.phone,
      customerId: currentUser?.id || null,
      items: activeCart,
      subtotal: activeSubtotal,
      deliveryFee: DELIVERY_FEE,
      giftFee,
      giftConfig: giftConfig.isGift ? giftConfig : null,
      total: TOTAL,
      fulfillmentType,
      deliveryAddress: finalAddress,
      lga: form.lga,
      city: form.city,
      state: 'Ogun State',
      latitude: form.latitude,
      longitude: form.longitude,
      placeInfo: form.placeInfo,
      deliverySlot: fulfillmentType === 'pickup' ? 'Store Pickup (Branch Hours)' : form.deliverySlot,
      specialInstructions: form.instructions,
      paymentMethod: resolvedPmLabel,
      paymentReference: paystackRef || null,
      transferSenderName: form.senderName || form.name,
      transferRef: form.transferRef || null,
      storeBankAccountUsed: storeBankAccount || null
    });
    setLastPlacedOrder(order);
    clearCart(activeCartTab);
    setStep(4);
  };

  // Card payment via Paystack popup
  const handleCardPayment = () => {
    if (!form.name || !form.email) {
      showToast('Please fill in your name and email before paying.', 'error');
      return;
    }

    if (!isPaystackConfigured()) {
      // Paystack not configured — treat as simulated payment in dev
      showToast('Paystack not configured. Processing as test payment...', 'info');
      handlePlaceOrder('TEST-REF-' + Date.now());
      return;
    }

    initializePayment({
      email:      form.email,
      amountKobo: nairaToKobo(TOTAL),
      orderId:    `ALZ-${Date.now()}`,
      name:       form.name,
      phone:      form.phone,
      metadata:   { store: activeCartTab, lga: form.lga },
      onSuccess: ({ reference }) => {
        showToast('Payment successful! Processing your order... 🎉', 'success');
        handlePlaceOrder(reference);
      },
      onClose: () => {
        showToast('Payment cancelled. You can try again.', 'info');
      }
    });
  };


  if (activeCart.length === 0 && step !== 4) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '1rem' }}>Your cart is empty</h2>
        <button className="btn btn-primary btn-lg" onClick={() => navigateTo('bakery')}>Shop Now</button>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--cream-50)', minHeight: '85vh', padding: '2.5rem 0 5rem' }}>
      <div className="container-narrow">
        {/* Step Indicator */}
        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            {STEPS.slice(0, 4).map((label, i) => (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: i < step ? 'var(--status-success)' : i === step ? 'var(--gold-500)' : 'var(--cream-300)',
                    color: i <= step ? 'white' : 'var(--charcoal-500)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.85rem',
                    transition: 'all 0.3s'
                  }}>
                    {i < step ? <Check size={16} /> : i + 1}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: i === step ? 'var(--gold-600)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
                {i < 3 && <div style={{ width: 40, height: 2, background: i < step ? 'var(--status-success)' : 'var(--cream-300)', borderRadius: 'var(--radius-full)', alignSelf: 'center', marginBottom: '1.2rem', transition: 'all 0.3s' }} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Step 0 — Customer Info */}
        {step === 0 && (
          <StepCard title="Customer Information" icon="👤">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number (For Order Tracking) *</label>
              <input className="form-input" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+234 703 014 4746" />
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              onClick={() => setStep(1)} disabled={!form.name || !form.email}>
              Continue to Order Method <ChevronRight size={17} />
            </button>
          </StepCard>
        )}

        {/* Step 1 — Order Method (Delivery vs Pick-Up) */}
        {step === 1 && (
          <StepCard title="Delivery or Pick-Up Selection" icon="🚚">
            {/* Fulfillment Selector Toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setFulfillmentType('delivery')}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${fulfillmentType === 'delivery' ? 'var(--gold-500)' : 'var(--cream-300)'}`,
                  background: fulfillmentType === 'delivery' ? 'var(--gold-50)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem', color: fulfillmentType === 'delivery' ? 'var(--gold-800)' : 'var(--charcoal-800)', marginBottom: '0.3rem' }}>
                  <Truck size={18} /> Home / Office Delivery
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Dispatched strictly within <strong>Ogun State</strong>.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('pickup')}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${fulfillmentType === 'pickup' ? 'var(--burgundy-700)' : 'var(--cream-300)'}`,
                  background: fulfillmentType === 'pickup' ? 'var(--burgundy-50)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem', color: fulfillmentType === 'pickup' ? 'var(--burgundy-800)' : 'var(--charcoal-800)', marginBottom: '0.3rem' }}>
                  <Store size={18} /> Store Pick-Up (Free)
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Pick up directly at our Abeokuta branches.
                </div>
              </button>
            </div>

            {/* If Store Pick-Up Selected */}
            {fulfillmentType === 'pickup' && (
              <div style={{ padding: '1.25rem', background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cream-300)', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--charcoal-900)', marginBottom: '0.75rem' }}>
                  Choose Pickup Branch in Abeokuta:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Bakery Branch */}
                  <label
                    style={{
                      display: 'flex', gap: '0.75rem', padding: '0.85rem', borderRadius: 'var(--radius-md)',
                      background: pickupBranch === 'bakery' ? 'white' : 'transparent',
                      border: `1.5px solid ${pickupBranch === 'bakery' ? 'var(--gold-500)' : 'var(--cream-300)'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="pickupBranch"
                      checked={pickupBranch === 'bakery'}
                      onChange={() => setPickupBranch('bakery')}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--charcoal-900)' }}>
                        🍰 {ALIZSON_OFFICIAL_CONTACTS.branches.bakery.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        📍 {ALIZSON_OFFICIAL_CONTACTS.branches.bakery.address}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gold-700)', fontWeight: 600, marginTop: '0.25rem' }}>
                        🕒 {ALIZSON_OFFICIAL_CONTACTS.branches.bakery.hours}
                      </div>
                    </div>
                  </label>

                  {/* Supplies Branch */}
                  <label
                    style={{
                      display: 'flex', gap: '0.75rem', padding: '0.85rem', borderRadius: 'var(--radius-md)',
                      background: pickupBranch === 'supplies' ? 'white' : 'transparent',
                      border: `1.5px solid ${pickupBranch === 'supplies' ? 'var(--burgundy-700)' : 'var(--cream-300)'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="pickupBranch"
                      checked={pickupBranch === 'supplies'}
                      onChange={() => setPickupBranch('supplies')}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--charcoal-900)' }}>
                        🧁 {ALIZSON_OFFICIAL_CONTACTS.branches.supplies.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        📍 {ALIZSON_OFFICIAL_CONTACTS.branches.supplies.address}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--burgundy-700)', fontWeight: 600, marginTop: '0.25rem' }}>
                        🕒 {ALIZSON_OFFICIAL_CONTACTS.branches.supplies.hours}
                      </div>
                    </div>
                  </label>
                </div>

                <div style={{ marginTop: '1rem', padding: '0.65rem 0.85rem', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--status-success)', fontWeight: 700 }}>
                  ✓ Delivery Fee: FREE (Store Pick-Up)
                </div>
              </div>
            )}

            {/* If Home Delivery Selected */}
            {fulfillmentType === 'delivery' && (
              <>
                {/* Ogun Delivery Notice Banner */}
                <div style={{ padding: '0.85rem 1rem', background: 'rgba(229,138,19,0.12)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(229,138,19,0.3)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldAlert size={20} color="var(--gold-700)" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--gold-900)' }}>
                      📍 Ogun State Delivery Restriction Notice
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Delivery is available strictly across Ogun State LGAs & towns.
                    </div>
                  </div>
                </div>

                {/* State & Ogun LGA Dropdowns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">State / Region *</label>
                    <select
                      className="form-select"
                      value={form.state}
                      onChange={e => update('state', e.target.value)}
                      style={{ background: 'var(--cream-100)', fontWeight: 700 }}
                    >
                      <option value="Ogun State">Ogun State (Strict Delivery Belt)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ogun Local Govt Area (LGA) *</label>
                    <select
                      className="form-select"
                      value={selectedOgunLocation.lga}
                      onChange={e => {
                        const matched = locationsList.find(l => l.lga === e.target.value);
                        if (matched) {
                          setSelectedOgunLocation(matched);
                          update('lga', matched.lga);
                          update('city', matched.hubName);
                        }
                      }}
                    >
                      {locationsList.map(loc => (
                        <option key={loc.lga} value={loc.lga}>
                          {loc.lga} — ₦{loc.deliveryFee.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Open Interactive Map Button */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px dashed var(--gold-500)',
                      background: 'rgba(229,138,19,0.08)',
                      color: 'var(--gold-800)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Navigation size={16} /> 🗺️ Pick Exact Delivery Point on Ogun Interactive Map
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Street Address & Landmark *</label>
                  <input
                    className="form-input"
                    value={form.address}
                    onChange={e => update('address', e.target.value)}
                    placeholder={`e.g. Near ${selectedOgunLocation.towns[0]}, Opp. Central Junction`}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Towns served in this zone: {selectedOgunLocation.towns.join(', ')}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Address Location Type</label>
                    <select className="form-select" value={form.locationType || 'Residential Home'} onChange={e => update('locationType', e.target.value)}>
                      <option value="Residential Home">🏡 Residential Home / Flat</option>
                      <option value="Office / Corporate">🏢 Office / Corporate Building</option>
                      <option value="Event Center / Hall">🎉 Event Venue / Party Hall</option>
                      <option value="School / Church">🏫 School / University / Church</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preferred Delivery Slot</label>
                    <select className="form-select" value={form.deliverySlot} onChange={e => update('deliverySlot', e.target.value)}>
                      <option value="Morning (8:00 AM – 12:00 PM)">🌅 Morning (8:00 AM – 12:00 PM)</option>
                      <option value="Afternoon (12:00 PM – 4:00 PM)">☀️ Afternoon (12:00 PM – 4:00 PM)</option>
                      <option value="Evening (4:00 PM – 8:00 PM)">🌆 Evening (4:00 PM – 8:00 PM)</option>
                      <option value="Express Delivery (Within 3 Hours)">⚡ Express Delivery (Within 3 Hours)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Special Delivery Instructions</label>
                  <textarea className="form-textarea" rows={3} value={form.instructions} onChange={e => update('instructions', e.target.value)} placeholder="e.g. Please call before arrival, keep cake level during transport, fragile decorations..." />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setStep(2)}
                disabled={fulfillmentType === 'delivery' && !form.address}
              >
                Review Order <ChevronRight size={17} />
              </button>
            </div>
          </StepCard>
        )}

        {/* Step 2 — Review */}
        {step === 2 && (
          <StepCard title="Review Your Order" icon="📋">
            <div style={{ background: 'var(--cream-50)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', border: '1px solid var(--cream-200)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: activeCartTab === 'bakery' ? 'var(--gold-600)' : 'var(--burgundy-700)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                {activeCartTab === 'bakery' ? '🍰 Bakery Order' : '🧁 Baking Supplies Order'}
              </div>
              {activeCart.map(item => (
                <div key={item.cartItemId} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--cream-200)' }}>
                  <img src={item.image} alt={item.name} style={{ width: 55, height: 55, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--charcoal-900)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {item.size}{item.flavour ? ` · ${item.flavour}` : ''} · Qty: {item.quantity}
                    </div>
                    {item.customMessage && <div style={{ fontSize: '0.75rem', color: 'var(--gold-700)', fontStyle: 'italic' }}>"{item.customMessage}"</div>}
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>₦{(item.unitPrice * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                  <span>₦{activeSubtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fulfillment Mode</span>
                  <span style={{ fontWeight: 700 }}>
                    {fulfillmentType === 'pickup' ? '🏬 Store Pick-Up (Free)' : `🚚 Ogun Delivery (${selectedOgunLocation.lga})`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Delivery Fee</span>
                  <span>{fulfillmentType === 'pickup' ? 'FREE' : `₦${DELIVERY_FEE.toLocaleString()}`}</span>
                </div>
                {giftConfig?.isGift && totalGiftFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#7E152B', fontWeight: 600 }}>
                    <span>🎁 Personalized Gift Package ({giftConfig.packaging?.name || 'Gift Packaging'})</span>
                    <span>₦{totalGiftFee.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, paddingTop: '0.5rem', borderTop: '1px solid var(--cream-200)' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--gold-600)' }}>₦{TOTAL.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(3)}>
                Proceed to Payment <ChevronRight size={17} />
              </button>
            </div>
          </StepCard>
        )}

        {/* Step 3 — Payment */}
        {step === 3 && (
          <StepCard title="Payment Method" icon="💳">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.id} onClick={() => update('paymentMethod', pm.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: '0.9rem 1.1rem', border: `1.5px solid ${form.paymentMethod === pm.id ? 'var(--gold-500)' : 'var(--cream-300)'}`,
                  borderRadius: 'var(--radius-md)', background: form.paymentMethod === pm.id ? 'var(--gold-50)' : 'white',
                  cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'var(--font-sans)', transition: 'all 0.15s'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{pm.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: form.paymentMethod === pm.id ? 'var(--gold-800)' : 'var(--charcoal-800)' }}>
                      {pm.label}
                    </div>
                    {pm.id === 'transfer' && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Pay directly to store verified bank account · Instant verification
                      </div>
                    )}
                  </div>
                  {form.paymentMethod === pm.id && <Check size={17} style={{ marginLeft: 'auto', color: 'var(--gold-600)' }} />}
                </button>
              ))}
            </div>

            {/* Bank Transfer Details Box */}
            {form.paymentMethod === 'transfer' && (
              <div style={{
                background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                border: '1.5px solid var(--gold-400)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                animation: 'slideDown 0.25s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <Building2 size={18} color="var(--gold-800)" />
                  <strong style={{ fontSize: '0.925rem', color: 'var(--gold-900)' }}>
                    Store Official Bank Account Details
                  </strong>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--charcoal-700)', margin: '0 0 1rem', lineHeight: 1.45 }}>
                  Please transfer exactly <strong>₦{TOTAL.toLocaleString()}</strong> to the account below, then enter your sender name for verification.
                </p>

                <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-200)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Bank Name</span>
                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--charcoal-900)' }}>
                      {storeBankAccount?.bankName || 'Guaranty Trust Bank (GTBank)'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Account Number</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--gold-800)', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                        {storeBankAccount?.accountNumber || '0123456789'}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        style={{
                          background: 'var(--gold-50)',
                          border: '1px solid var(--gold-300)',
                          borderRadius: '4px',
                          padding: '0.2rem 0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--gold-900)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {copiedAccount ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                        {copiedAccount ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Account Name</span>
                    <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--charcoal-800)' }}>
                      {storeBankAccount?.accountName || 'Alizson Cakes & Baking Supplies'}
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Sender Name & Bank (Who made the transfer?) *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Adewale Adeleke (Access Bank)"
                    value={form.senderName}
                    onChange={e => update('senderName', e.target.value)}
                    style={{ background: 'white' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Transfer Narration / Reference (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`e.g. ${form.name || 'Your Name'} - Bakery Order`}
                    value={form.transferRef}
                    onChange={e => update('transferRef', e.target.value)}
                    style={{ background: 'white' }}
                  />
                </div>
              </div>
            )}

            <div style={{ padding: '1rem', background: 'var(--cream-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-200)', display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>Order Total to Pay</span>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--gold-600)' }}>₦{TOTAL.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={form.paymentMethod === 'card' ? handleCardPayment : handlePlaceOrder}
              >
                {form.paymentMethod === 'card' ? '💳 Pay with Card via Paystack' : '🔒 Place Order Now'}
              </button>
            </div>
          </StepCard>
        )}

        {/* Step 4 — Confirmation */}
        {step === 4 && <OrderConfirmationStep navigateTo={navigateTo} />}
      </div>

      {/* Ogun Interactive Location Map Picker Modal */}
      {isMapModalOpen && (
        <OgunLocationMapPicker
          selectedLocation={selectedOgunLocation}
          onSelectLocation={handleSelectOgunFromMap}
          onClose={() => setIsMapModalOpen(false)}
        />
      )}
    </div>
  );
};

const OrderConfirmationStep = ({ navigateTo }) => {
  const { lastPlacedOrder } = useApp();
  const { storeBankAccount } = useOrders();
  const order = lastPlacedOrder;

  const isBankTransfer = order?.paymentMethod === 'Direct Bank Transfer' || order?.paymentMethod?.includes('Transfer');

  return (
    <div style={{ textAlign: 'center', animation: 'slideUp 0.5s ease-out' }}>
      <div style={{
        width: 90, height: 90, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--status-success), #059669)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.25rem', fontSize: '2.5rem',
        boxShadow: '0 0 40px rgba(16,185,129,0.4)'
      }}>✓</div>

      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.1rem', color: 'var(--charcoal-900)', marginBottom: '0.4rem' }}>
        Order Placed Successfully! 🎉
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
        Thank you for your order! We're preparing it with love.
      </p>

      {/* Bank Transfer Notice Box */}
      {isBankTransfer && (
        order?.paymentStatus === 'Paid' ? (
          <div style={{
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            border: '2px solid #10B981',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            maxWidth: 500,
            margin: '0 auto 1.5rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#047857', marginBottom: '0.4rem', fontSize: '1.05rem' }}>
              ✅ Bank Transfer Verified & Confirmed
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--charcoal-800)', margin: 0, lineHeight: 1.45 }}>
              Your bank transfer payment of <strong>₦{(order?.total || 0).toLocaleString()}</strong> has been verified by our finance team{order?.bankTransferVerifiedBy ? ` (${order.bankTransferVerifiedBy})` : ''}. We are actively preparing your order!
            </p>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '2px solid #F59E0B',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            maxWidth: 500,
            margin: '0 auto 1.5rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#D97706', marginBottom: '0.5rem' }}>
              ⏳ Awaiting Bank Transfer Verification
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--charcoal-800)', margin: '0 0 0.75rem', lineHeight: 1.45 }}>
              If you haven't transferred yet, please transfer <strong>₦{(order?.total || 0).toLocaleString()}</strong> to:
            </p>
            <div style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #FDE68A', fontSize: '0.85rem' }}>
              <div>🏦 <strong>{storeBankAccount?.bankName || 'Guaranty Trust Bank (GTBank)'}</strong></div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--gold-800)', margin: '0.2rem 0', fontFamily: 'monospace' }}>
                {storeBankAccount?.accountNumber || '0123456789'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{storeBankAccount?.accountName || 'Alizson Cakes & Baking Supplies'}</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
              Sender: <strong>{order?.transferSenderName || order?.customerName}</strong> · Our finance team confirms received transfers promptly.
            </div>
          </div>
        )
      )}

      {order && (
        <div className="card" style={{ padding: '1.75rem', maxWidth: 500, margin: '0 auto 2rem', textAlign: 'left', border: '2px solid var(--status-success-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--cream-200)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order ID</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-700)', fontFamily: 'var(--font-sans)' }}>{order.id}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--charcoal-900)' }}>{order.date}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.time}</div>
            </div>
          </div>

          {[
            { label: 'Store', value: order.storeName },
            { label: 'Customer', value: order.customerName },
            { label: 'Fulfillment', value: order.deliveryAddress },
            { label: 'Payment Method', value: order.paymentMethod },
            { label: 'Payment Status', value: order.paymentStatus === 'Paid' ? '✅ Paid & Verified' : (order.paymentStatus || 'Awaiting Confirmation') },
            { label: 'Total Amount', value: `₦${order.total.toLocaleString()}`, highlight: true }
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem', gap: '1rem' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: row.highlight ? 800 : 600, color: row.highlight ? 'var(--gold-600)' : 'var(--charcoal-800)', textAlign: 'right' }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn btn-primary btn-lg" onClick={() => navigateTo('dashboard')}>
          📦 Track My Order
        </button>
        <button className="btn btn-outline btn-lg" onClick={() => navigateTo('home')}>
          ← Continue Shopping
        </button>
      </div>
    </div>
  );
};

const StepCard = ({ title, icon, children }) => (
  <div className="card" style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
    <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--charcoal-900)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span> {title}
    </h2>
    {children}
  </div>
);

export default CheckoutPage;
