import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Cake, Package, ShoppingBag, Truck, Sparkles, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useStore } from '../../context/StoreContext';

const TOUR_STEPS = [
  {
    title: 'Two Stores, One Marketplace',
    icon: '🍰',
    badge: 'Step 1 of 4 · The Switcher',
    description: 'Alizson Cakes & Snacks houses both an artisanal Bakery Store (freshly made cakes, snacks & pastries) and a Baking Supplies Store (ingredients, tools & pans). Use the top pill switcher anytime to toggle between them!',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    tip: 'Look for the pill buttons at the top of your screen to switch stores.'
  },
  {
    title: 'Custom Cake Builder',
    icon: '🎂',
    badge: 'Step 2 of 4 · Tailored Cakes',
    description: 'Every celebration cake can be customized! Choose your size (6", 8", 10", or multi-tier), gourmet sponge flavour, extra silk frosting, and write a personalised icing inscription on top.',
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80',
    tip: 'Click on any cake to open the interactive Customizer.'
  },
  {
    title: 'Smart Independent Carts',
    icon: '🛒',
    badge: 'Step 3 of 4 · Separate Carts',
    description: 'We keep your Bakery items and Baking Supplies in separate designated carts so kitchen preparation and warehouse dispatch remain crystal clear. You can checkout each cart in seconds.',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80',
    tip: 'Click the shopping bag icon to slide open your Cart Drawer.'
  },
  {
    title: 'Live Order Tracking & Rewards',
    icon: '🚚',
    badge: 'Step 4 of 4 · Dashboard',
    description: 'Track your cake in real time as our master bakers prepare, bake, decorate, and dispatch it to your doorstep. View all orders, receipts, and invoices in your Customer Dashboard.',
    image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=800&q=80',
    tip: 'Check your Account tab for real-time order status updates.'
  }
];

export const OnboardingTourModal = () => {
  const { isTourOpen, setIsTourOpen, tourUserName, navigateTo } = useApp();
  const { switchStore } = useStore();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isTourOpen) return null;

  const step = TOUR_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsTourOpen(false);
      switchStore('bakery');
      navigateTo('bakery');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    setIsTourOpen(false);
    switchStore('bakery');
    navigateTo('bakery');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)',
        background: 'rgba(26, 23, 21, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '620px',
          width: '100%',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-2xl)',
          animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Header Greeting */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, var(--ink), #2A1F18)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>{step.icon}</span>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gold-400)', fontWeight: 700, textTransform: 'uppercase' }}>
                Welcome, {tourUserName || 'Baker'}! 🎉
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'white' }}>
                Quick Platform Tour
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsTourOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Hero Step Image */}
        <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
          <img
            src={step.image}
            alt={step.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)'
            }}
          />
          <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem' }}>
            <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
              {step.badge}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.75rem 1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
            {step.title}
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {step.description}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              background: 'var(--cream-100)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '3px solid var(--gold-500)',
              fontSize: '0.825rem',
              color: 'var(--text-primary)',
              marginBottom: '1.75rem'
            }}
          >
            <Sparkles size={16} color="var(--gold-500)" style={{ flexShrink: 0 }} />
            <span><strong>Pro-Tip:</strong> {step.tip}</span>
          </div>

          {/* Stepper Dots & Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Progress Dots */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  style={{
                    width: idx === currentStep ? 24 : 8,
                    height: 8,
                    borderRadius: 'var(--radius-full)',
                    background: idx === currentStep ? 'var(--gold-action)' : 'var(--cream-300)',
                    cursor: 'pointer',
                    transition: 'all 0.25s'
                  }}
                />
              ))}
            </div>

            {/* Nav Buttons */}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {currentStep > 0 && (
                <button className="btn btn-secondary" onClick={handlePrev} style={{ fontSize: '0.85rem' }}>
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              {currentStep < TOUR_STEPS.length - 1 ? (
                <button className="btn btn-primary" onClick={handleNext} style={{ fontSize: '0.85rem' }}>
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleFinish} style={{ fontSize: '0.85rem' }}>
                  Start Shopping <Check size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTourModal;
