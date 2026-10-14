import React, { useState } from 'react';
import { Sparkles, Heart, ShoppingBag, Check, AlertCircle, Info, Star, ChevronRight, Cake, Package } from 'lucide-react';
import { RatingStars } from '../components/Common/RatingStars';
import { StatusBadge } from '../components/Common/StatusBadge';
import { useApp } from '../context/AppContext';

export const DesignSystemPage = () => {
  const { showToast } = useApp();
  const [activeDemoTab, setActiveDemoTab] = useState('colors');

  const colorPalettes = [
    {
      group: 'Primary Brand Colors',
      colors: [
        { name: 'Warm Cream 50', hex: '#FAF7F2', var: '--cream-50', text: '#2A1F18' },
        { name: 'Warm Cream 100', hex: '#F5EFEB', var: '--cream-100', text: '#2A1F18' },
        { name: 'Warm Cream 200', hex: '#EBE2D8', var: '--cream-200', text: '#2A1F18' },
        { name: 'Royal Gold 400', hex: '#F5A623', var: '--gold-400', text: '#FFFFFF' },
        { name: 'Royal Gold 500', hex: '#E58A13', var: '--gold-500', text: '#FFFFFF' },
        { name: 'Royal Gold 600', hex: '#C6710A', var: '--gold-600', text: '#FFFFFF' },
        { name: 'Burgundy 700', hex: '#80132B', var: '--burgundy-700', text: '#FFFFFF' },
        { name: 'Burgundy 900', hex: '#4D0817', var: '--burgundy-900', text: '#FFFFFF' },
        { name: 'Charcoal 900', hex: '#1A1715', var: '--charcoal-900', text: '#FFFFFF' },
      ]
    },
    {
      group: 'Functional / Semantic Colors',
      colors: [
        { name: 'Success Green', hex: '#10B981', var: '--status-success', text: '#FFFFFF' },
        { name: 'Warning Amber', hex: '#F59E0B', var: '--status-warning', text: '#FFFFFF' },
        { name: 'Danger Red', hex: '#EF4444', var: '--status-danger', text: '#FFFFFF' },
        { name: 'Info Blue', hex: '#3B82F6', var: '--status-info', text: '#FFFFFF' },
      ]
    }
  ];

  return (
    <div style={{ background: 'var(--cream-50)', minHeight: '90vh', padding: '3rem 0 6rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
          <span className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>
            🎨 Design System & UI Specs
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--charcoal-900)', marginBottom: '0.75rem' }}>
            Alizson UI Architecture
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            A curated artisan design language built with warm creams, royal golds, velvety burgundies, and modern typography.
          </p>
        </div>

        {/* Section 1: Color Palette */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--charcoal-900)' }}>
            Color Tokens & Themes
          </h2>

          {colorPalettes.map((grp, gIdx) => (
            <div key={gIdx} style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--charcoal-700)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {grp.group}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                {grp.colors.map(c => (
                  <div
                    key={c.name}
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      border: '1px solid var(--cream-200)',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <div style={{ height: '70px', background: c.hex, display: 'flex', alignItems: 'flex-end', padding: '0.5rem' }}>
                      <span style={{ color: c.text, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: '4px' }}>
                        {c.hex}
                      </span>
                    </div>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-surface)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--charcoal-900)' }}>{c.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>{c.var}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Section 2: Typography */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--charcoal-900)' }}>
            Typography Scale & Fonts
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ borderBottom: '1px solid var(--cream-200)', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display Hero Serif · Playfair Display</span>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--charcoal-900)', margin: '0.3rem 0' }}>
                Freshly Baked Artistry, Delivered with Love
              </h1>
            </div>

            <div style={{ borderBottom: '1px solid var(--cream-200)', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section Heading H2 · Playfair Display</span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', color: 'var(--charcoal-900)', margin: '0.3rem 0' }}>
                Artisanal Cake Collections & Custom Delights
              </h2>
            </div>

            <div style={{ borderBottom: '1px solid var(--cream-200)', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Body Regular & Accents · Plus Jakarta Sans</span>
              <p style={{ fontSize: '1rem', color: 'var(--charcoal-700)', lineHeight: 1.6, margin: '0.3rem 0' }}>
                Alizson Cakes & Snacks brings you the finest gourmet ingredients, custom multi-tier celebration cakes, artisan pastries, and professional baking tools in one unified marketplace.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Interactive Buttons & Badges */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--charcoal-900)' }}>
            Buttons & Interactive Badges
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Button Variants</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn btn-primary" onClick={() => showToast('Primary button clicked! ✨', 'success')}>
                  <Sparkles size={16} /> Primary Gold
                </button>
                <button className="btn btn-burgundy" onClick={() => showToast('Burgundy button clicked! 🧁', 'info')}>
                  <Cake size={16} /> Burgundy Accent
                </button>
                <button className="btn btn-dark" onClick={() => showToast('Dark button clicked!', 'info')}>
                  Dark Charcoal
                </button>
                <button className="btn btn-secondary" onClick={() => showToast('Secondary clicked!', 'info')}>
                  Secondary
                </button>
                <button className="btn btn-outline" onClick={() => showToast('Outline clicked!', 'info')}>
                  Outline Neutral
                </button>
                <button className="btn btn-outline-gold" onClick={() => showToast('Outline Gold clicked!', 'info')}>
                  Outline Gold
                </button>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Status Badges</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge status="Pending" />
                <StatusBadge status="Confirmed" />
                <StatusBadge status="Processing" />
                <StatusBadge status="Ready" />
                <StatusBadge status="Out for Delivery" />
                <StatusBadge status="Completed" />
                <span className="badge badge-gold">⭐ Bestseller</span>
                <span className="badge badge-burgundy">🧁 Artisan Supplies</span>
                <span className="badge badge-sale">🔥 -15% OFF</span>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Interactive Rating Stars</h3>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <RatingStars rating={5.0} count={124} size={18} />
                <RatingStars rating={4.8} count={89} size={18} />
                <RatingStars rating={4.2} count={35} size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Toast Trigger Playground */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--charcoal-900)' }}>
            Notification System (Toasts)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Click the buttons below to preview the responsive floating toast notifications.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => showToast('Order confirmed successfully! 🎂', 'success')}>
              Show Success Toast
            </button>
            <button className="btn btn-secondary" onClick={() => showToast('Switched to Baking Supplies Store 🧁', 'info')}>
              Show Info Toast
            </button>
            <button className="btn btn-outline" onClick={() => showToast('Only 2 items left in stock!', 'warning')}>
              Show Warning Toast
            </button>
            <button className="btn btn-outline" onClick={() => showToast('Unable to process coupon code', 'error')}>
              Show Error Toast
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignSystemPage;
