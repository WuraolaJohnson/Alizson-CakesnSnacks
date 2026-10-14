import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { 
  PACKAGING_OPTIONS, 
  GREETING_CARD_OPTIONS, 
  GIFT_OCCASIONS, 
  GIFT_ADDONS,
  MONEY_BOUQUET_VARIANTS 
} from '../../data/giftOptions';

export default function GiftStudioModal() {
  const { isGiftStudioOpen, closeGiftStudio, showToast } = useApp();
  const { bakeryCart, suppliesCart, giftConfig, updateGiftConfig, toggleGiftService } = useCart();

  const [activeStep, setActiveStep] = useState(1);
  const [selectedBouquetVariant, setSelectedBouquetVariant] = useState(MONEY_BOUQUET_VARIANTS[1]); // N25k default

  if (!isGiftStudioOpen) return null;

  const allCartItems = [...bakeryCart, ...suppliesCart];

  const handlePackagingSelect = (pkg) => {
    updateGiftConfig({ packaging: pkg, isGift: true });
  };

  const handleCardSelect = (c) => {
    updateGiftConfig({ card: c, isGift: true });
  };

  const handleOccasionSelect = (occ) => {
    updateGiftConfig({ occasion: occ.label, isGift: true });
  };

  const toggleAddon = (addon) => {
    const currentAddons = giftConfig.selectedAddons || [];
    const exists = currentAddons.find(a => a.id === addon.id);

    let updatedAddons;
    if (exists) {
      updatedAddons = currentAddons.filter(a => a.id !== addon.id);
    } else {
      let addonPrice = addon.price || 0;
      let extraLabel = '';
      if (addon.id === 'money-bouquet') {
        addonPrice = selectedBouquetVariant.amount + selectedBouquetVariant.fee;
        extraLabel = ` (${selectedBouquetVariant.label})`;
      }
      updatedAddons = [...currentAddons, {
        id: addon.id,
        name: `${addon.name}${extraLabel}`,
        price: addonPrice,
        variantAmount: addon.id === 'money-bouquet' ? selectedBouquetVariant.amount : null
      }];
    }

    updateGiftConfig({ selectedAddons: updatedAddons, isGift: true });
  };

  const clearAllAddons = () => {
    updateGiftConfig({ selectedAddons: [], isGift: true });
    showToast('Removed all add-ons from gift package.', 'info');
  };

  const handleBouquetChange = (variant) => {
    setSelectedBouquetVariant(variant);
    const currentAddons = giftConfig.selectedAddons || [];
    const bouquetActive = currentAddons.some(a => a.id === 'money-bouquet');

    if (bouquetActive) {
      const updatedAddons = currentAddons.map(a => {
        if (a.id === 'money-bouquet') {
          return {
            ...a,
            name: `Crisp Money Bouquet (${variant.label})`,
            price: variant.amount + variant.fee,
            variantAmount: variant.amount
          };
        }
        return a;
      });
      updateGiftConfig({ selectedAddons: updatedAddons, isGift: true });
    }
  };

  const handleSaveAndApply = () => {
    toggleGiftService(true);
    showToast('Personalized Gift Package applied to your order! 🎁', 'success');
    closeGiftStudio();
  };

  const currentPackaging = giftConfig.packaging || PACKAGING_OPTIONS[0];
  const currentCard = giftConfig.card || GREETING_CARD_OPTIONS[0];
  const currentOccasion = giftConfig.occasion || 'Birthday';
  const selectedAddons = giftConfig.selectedAddons || [];

  const packagingFee = currentPackaging.price || 0;
  const cardFee = currentCard.price || 0;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
  const giftTotal = packagingFee + cardFee + addonsTotal;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '940px',
          maxHeight: '92vh',
          backgroundColor: '#fff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(229, 138, 19, 0.2)'
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #4D0A18 0%, #7E152B 50%, #C6720A 100%)',
            color: '#fff',
            padding: '1.25rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🎁</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                Luxury Gift Studio & Concierge
              </h2>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)' }}>
              Customize your packaging, card, fine wines, chocolates, or money bouquets
            </p>
          </div>

          <button
            onClick={closeGiftStudio}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#fff',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#FFFBEB',
            borderBottom: '1px solid #FDE68A',
            padding: '0.75rem 1.25rem',
            overflowX: 'auto',
            gap: '0.5rem'
          }}
        >
          {[
            { id: 1, label: '1. Packaging 📦' },
            { id: 2, label: '2. Card & Note 💌' },
            { id: 3, label: '3. Extras & Wine 🍷' },
            { id: 4, label: '4. Recipient 👤' },
            { id: 5, label: '5. Preview 🎁' }
          ].map(step => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              style={{
                flex: '1 0 auto',
                padding: '0.55rem 0.85rem',
                borderRadius: '12px',
                border: activeStep === step.id ? 'none' : '1px solid transparent',
                backgroundColor: activeStep === step.id ? '#7E152B' : 'transparent',
                color: activeStep === step.id ? '#ffffff' : '#78350F',
                fontWeight: activeStep === step.id ? 700 : 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: activeStep === step.id ? '0 4px 10px rgba(126, 21, 43, 0.25)' : 'none'
              }}
            >
              {step.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
          
          {/* STEP 1: PACKAGING SELECTION */}
          {activeStep === 1 && (
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.35rem' }}>
                Choose Your Packaging Style
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>
                Select a luxury box or wooden crate to package your items elegantly.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {PACKAGING_OPTIONS.map(pkg => {
                  const isSelected = currentPackaging.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => handlePackagingSelect(pkg)}
                      style={{
                        border: isSelected ? '2px solid #C6720A' : '1px solid #e5e7eb',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: isSelected ? '#FFFBEB' : '#fff',
                        boxShadow: isSelected ? '0 10px 15px -3px rgba(198, 114, 10, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                        position: 'relative'
                      }}
                    >
                      {pkg.badge && (
                        <span 
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: isSelected ? '#C6720A' : '#7E152B',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            zIndex: 2
                          }}
                        >
                          {pkg.badge}
                        </span>
                      )}

                      <img 
                        src={pkg.image} 
                        alt={pkg.name} 
                        style={{ width: '100%', height: '130px', objectFit: 'cover' }}
                      />

                      <div style={{ padding: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                            {pkg.name}
                          </h4>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#C6720A' }}>
                            ₦{pkg.price.toLocaleString()}
                          </span>
                        </div>
                        <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.4 }}>
                          {pkg.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: GREETING CARD & OCCASION */}
          {activeStep === 2 && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
                  Select Celebration Occasion
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {GIFT_OCCASIONS.map(occ => {
                    const isSelected = currentOccasion === occ.label;
                    return (
                      <button
                        key={occ.id}
                        onClick={() => handleOccasionSelect(occ)}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: '999px',
                          border: isSelected ? `2px solid ${occ.color}` : '1px solid #e5e7eb',
                          backgroundColor: isSelected ? `${occ.color}15` : '#fff',
                          color: isSelected ? occ.color : '#374151',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.825rem',
                          cursor: 'pointer'
                        }}
                      >
                        {occ.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
                  Choose Greeting Card Style
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                  {GREETING_CARD_OPTIONS.map(card => {
                    const isSelected = currentCard.id === card.id;
                    return (
                      <div
                        key={card.id}
                        onClick={() => handleCardSelect(card)}
                        style={{
                          border: isSelected ? '2px solid #7E152B' : '1px solid #e5e7eb',
                          borderRadius: '14px',
                          padding: '0.85rem',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#FFF5F7' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}
                      >
                        <img 
                          src={card.image} 
                          alt={card.name} 
                          style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
                            {card.name}
                          </h4>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7E152B' }}>
                            ₦{card.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
                  Write Your Personal Greeting Message
                </h3>
                <textarea
                  value={giftConfig.personalMessage || ''}
                  onChange={(e) => updateGiftConfig({ personalMessage: e.target.value, isGift: true })}
                  placeholder="Dearest Sarah, Wishing you the sweetest birthday filled with love, joy, and delicious treats! With love, Alex ❤️"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '12px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: OPTIONAL ADD-ONS (WINE, CHOCOLATES, MONEY BOUQUET, OR NONE) */}
          {activeStep === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                    Optional Add-ons & Extras (Wine, Chocolates, etc.)
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.2rem 0 0' }}>
                    Select fine wine, chocolates, or money bouquet — or select <strong>NONE</strong> to send packaging & card only.
                  </p>
                </div>

                {selectedAddons.length > 0 && (
                  <button
                    onClick={clearAllAddons}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #EF4444',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    🚫 Remove All Add-ons ({selectedAddons.length})
                  </button>
                )}
              </div>

              {/* Status Banner */}
              <div style={{ background: selectedAddons.length === 0 ? '#F3F4F6' : '#ECFDF5', border: `1px solid ${selectedAddons.length === 0 ? '#D1D5DB' : '#10B981'}`, padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', color: '#374151', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {selectedAddons.length === 0 
                    ? 'ℹ️ No extra add-ons currently selected. (Sending Box + Card only)'
                    : `✨ Selected ${selectedAddons.length} extra(s): ${selectedAddons.map(a => a.name).join(', ')}`
                  }
                </span>
                {selectedAddons.length === 0 && (
                  <span style={{ fontWeight: 800, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    [No Add-ons]
                  </span>
                )}
              </div>

              {/* Add-on Grid (All Add-ons available individually) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {GIFT_ADDONS.map(addon => {
                  const isAdded = selectedAddons.some(a => a.id === addon.id);

                  if (addon.id === 'money-bouquet') {
                    return (
                      <div
                        key={addon.id}
                        style={{
                          border: isAdded ? '2px solid #F5A623' : '1px solid #e5e7eb',
                          borderRadius: '16px',
                          padding: '1rem',
                          backgroundColor: isAdded ? '#FFF9ED' : '#fff',
                          gridColumn: '1 / -1'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <img src={addon.image} alt={addon.name} style={{ width: 48, height: 48, borderRadius: '10px', objectFit: 'cover' }} />
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#592D05' }}>
                                💸 Crisp Cash Money Bouquet (Optional)
                              </h4>
                              <div style={{ fontSize: '0.75rem', color: '#783F06' }}>Custom cash note arrangement</div>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleAddon(addon)}
                            style={{
                              padding: '0.45rem 1rem',
                              borderRadius: '999px',
                              border: 'none',
                              background: isAdded ? '#DC2626' : '#E58A13',
                              color: 'white',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            {isAdded ? '✕ Remove Money Bouquet' : '+ Add Money Bouquet'}
                          </button>
                        </div>

                        {isAdded && (
                          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #F5A623' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#783F06', marginBottom: '0.4rem' }}>Select Cash Variant:</div>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {MONEY_BOUQUET_VARIANTS.map(variant => {
                                const isSelected = selectedBouquetVariant.amount === variant.amount;
                                return (
                                  <button
                                    key={variant.amount}
                                    onClick={() => handleBouquetChange(variant)}
                                    style={{
                                      padding: '0.4rem 0.65rem',
                                      borderRadius: '8px',
                                      border: isSelected ? '2px solid #9E5605' : '1px solid #FFCC6B',
                                      background: isSelected ? '#9E5605' : 'white',
                                      color: isSelected ? 'white' : '#783F06',
                                      fontWeight: 800,
                                      fontSize: '0.78rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {variant.label} (+₦{variant.fee.toLocaleString()})
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      style={{
                        border: isAdded ? '2px solid #10B981' : '1px solid #e5e7eb',
                        borderRadius: '16px',
                        padding: '1rem',
                        cursor: 'pointer',
                        backgroundColor: isAdded ? '#ECFDF5' : '#fff',
                        display: 'flex',
                        gap: '0.85rem',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <img
                        src={addon.image}
                        alt={addon.name}
                        style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
                          {addon.name}
                        </h5>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#C6720A', marginTop: '0.2rem' }}>
                          +₦{addon.price?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isAdded ? '#047857' : '#6B7280', marginTop: '0.2rem', fontWeight: 600 }}>
                          {isAdded ? '✓ Added' : 'Click to add'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: RECIPIENT DETAILS */}
          {activeStep === 4 && (
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
                Recipient & Delivery Details
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>
                Specify who is receiving this surprise gift package.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    value={giftConfig.recipientName || ''}
                    onChange={(e) => updateGiftConfig({ recipientName: e.target.value, isGift: true })}
                    placeholder="e.g. Grace Okafor"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                    Recipient Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={giftConfig.recipientPhone || ''}
                    onChange={(e) => updateGiftConfig({ recipientPhone: e.target.value, isGift: true })}
                    placeholder="e.g. +234 801 234 5678"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Delivery Address *
                </label>
                <textarea
                  value={giftConfig.deliveryAddress || ''}
                  onChange={(e) => updateGiftConfig({ deliveryAddress: e.target.value, isGift: true })}
                  placeholder="e.g. Plot 12 Obasanjo Hilltop, Abeokuta, Ogun State"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 5: LIVE PREVIEW & CONFIRMATION */}
          {activeStep === 5 && (
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
                Live Gift Package Preview
              </h3>

              <div 
                style={{
                  background: 'linear-gradient(135deg, #FFFBEB 0%, #FFF5F7 100%)',
                  borderRadius: '20px',
                  border: '2px solid #FDE68A',
                  padding: '1.5rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1.5rem'
                }}
              >
                {/* Visual Card Side */}
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>💌</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#C6720A' }}>
                      {currentOccasion} Card Preview
                    </span>
                  </div>

                  <div 
                    style={{
                      border: '1px dashed #C6720A',
                      borderRadius: '12px',
                      padding: '1rem',
                      backgroundColor: '#FFFDF9',
                      minHeight: '110px'
                    }}
                  >
                    <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.5 }}>
                      "{giftConfig.personalMessage || 'Your personal greeting message will appear here...'}"
                    </p>
                    {giftConfig.senderName && (
                      <p style={{ margin: '0.75rem 0 0', fontWeight: 700, fontSize: '0.85rem', color: '#7E152B', textAlign: 'right' }}>
                        — {giftConfig.senderName}
                      </p>
                    )}
                  </div>

                  <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                    <strong>Packaging:</strong> {currentPackaging.name} (₦{packagingFee.toLocaleString()})<br />
                    <strong>Card Style:</strong> {currentCard.name} (₦{cardFee.toLocaleString()})<br />
                    <strong>Add-ons ({selectedAddons.length}):</strong> {selectedAddons.length > 0 ? selectedAddons.map(a => a.name).join(', ') : 'None'}
                  </div>
                </div>

                {/* Summary Side */}
                <div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                    Gift Recipient:
                  </h4>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#374151' }}>
                    👤 <strong>{giftConfig.recipientName || 'Not specified yet'}</strong><br />
                    📞 {giftConfig.recipientPhone || 'No phone number'}<br />
                    📍 {giftConfig.deliveryAddress || 'No address specified'}
                  </p>

                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                    Gift Add-ons & Extras:
                  </h4>
                  <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '0.825rem', color: '#4b5563', marginBottom: '1rem' }}>
                    {selectedAddons.length === 0 ? (
                      <em style={{ color: '#9ca3af' }}>No extra add-ons selected (Box + Card only).</em>
                    ) : (
                      selectedAddons.map((addon, idx) => (
                        <div key={idx} style={{ padding: '2px 0' }}>
                          • {addon.name} (+₦{addon.price.toLocaleString()})
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: '#7E152B' }}>
                      <span>Gift Service Total:</span>
                      <span>₦{giftTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div 
          style={{
            padding: '1rem 2rem',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#C6720A' }}>
            Gift Package Total: ₦{giftTotal.toLocaleString()}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {activeStep > 1 && (
              <button
                onClick={() => setActiveStep(prev => prev - 1)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                ← Previous
              </button>
            )}

            {activeStep < 5 ? (
              <button
                onClick={() => setActiveStep(prev => prev + 1)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#7E152B',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {activeStep === 3 && selectedAddons.length === 0 ? 'Skip Extras →' : 'Next Step →'}
              </button>
            ) : (
              <button
                onClick={handleSaveAndApply}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #C6720A 0%, #E58A13 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(198, 114, 10, 0.3)'
                }}
              >
                🎁 Apply Gift Package to Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
