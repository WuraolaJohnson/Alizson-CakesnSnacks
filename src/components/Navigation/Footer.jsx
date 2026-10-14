import React from 'react';
import { MessageCircle, Heart, Mail, Phone, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TikTokIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.81 4.5 6.27 6.27 0 0 0 1.86-4.5V9.07a8.28 8.28 0 0 0 4.92 1.62V7.25a4.78 4.78 0 0 1-1-.56z" />
  </svg>
);

const Footer = () => {
  const { navigateTo, openGiftStudio } = useApp();

  const columns = [
    {
      title: 'Alizson',
      links: [
        { label: 'About Us', id: 'about' },
        { label: 'Our Story & Kitchen', id: 'about' },
        { label: 'Contact Us', id: 'contact' },
        { label: 'Customer Reviews', id: 'feedback' },
      ]
    },
    {
      title: '🍰 Bakery',
      links: [
        { label: 'Cakes & Celebration', id: 'bakery' },
        { label: 'Pastries & Croissants', id: 'bakery' },
        { label: 'Cupcakes & Treats', id: 'bakery' },
        { label: 'Doughnuts', id: 'bakery' },
        { label: 'Special Offers', id: 'bakery' },
      ]
    },
    {
      title: '🧁 Baking Supplies',
      links: [
        { label: 'Ingredients', id: 'supplies' },
        { label: 'Baking Equipment', id: 'supplies' },
        { label: 'Cake Decoration', id: 'supplies' },
        { label: 'Tools & Utensils', id: 'supplies' },
        { label: 'Gift Studio', id: 'gift-studio' },
      ]
    },
    {
      title: 'Customer Service',
      links: [
        { label: 'My Account', id: 'dashboard' },
        { label: 'Active Orders', id: 'orders' },
        { label: 'Purchase History', id: 'purchase-history' },
        { label: 'Delivery Info', id: 'contact' },
        { label: 'FAQs', id: 'faq' },
        { label: 'Returns Policy', id: 'contact' },
      ]
    }
  ];

  const social = [
    { icon: <InstagramIcon size={18} />, label: 'Instagram', color: '#E1306C', url: 'https://www.instagram.com/alizson_cakesnsnacks/' },
    { icon: <FacebookIcon size={18} />, label: 'Facebook', color: '#1877F2', url: 'https://www.facebook.com/share/1K42FeYn9D/' },
    { icon: <TikTokIcon size={18} />, label: 'TikTok', color: '#000000', url: 'https://www.instagram.com/alizson_cakesnsnacks/' },
    { icon: <MessageCircle size={18} />, label: 'WhatsApp', color: '#25D366', url: 'https://wa.link/avijal' },
  ];

  return (
    <footer style={{
      background: 'var(--charcoal-950)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      paddingTop: '4rem',
      marginTop: '5rem'
    }}>
      <div className="container">
        {/* Top — Brand + Links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
          gap: '2.5rem',
          paddingBottom: '3rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}>
          {/* Brand Column */}
          <div style={{ gridColumn: 'span 1' }}>
            <button onClick={() => navigateTo('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', textAlign: 'left' }}>
              <img
                src="/logo.jpeg"
                alt="Alizson Logo"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--gold-400)',
                  boxShadow: '0 4px 14px rgba(229,138,19,0.3)',
                  background: 'white'
                }}
              />
              <div>
                <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: '1.35rem', color: 'white', display: 'block', lineHeight: 1.1 }}>
                  Aliz<span style={{ color: 'var(--gold-400)' }}>son</span>
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--cream-300)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Cakes & Snacks
                </span>
              </div>
            </button>
            <p style={{ fontSize: '0.85rem', color: 'var(--gold-300)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
              "Experience the taste, refresh your soul.."
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--charcoal-400)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Everything baking in one place. Freshly baked artisan cakes, snacks, and professional baking supplies.
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {social.map(s => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" title={s.label} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--charcoal-300)', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = s.color; e.currentTarget.style.borderColor = s.color; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'var(--charcoal-300)'; }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {columns.map(col => (
            <div key={col.title}>
              <h4 style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.1rem', fontFamily: 'var(--font-sans)' }}>
                {col.title}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {col.links.map(link => (
                  <li key={link.label}>
                    <button onClick={() => link.id === 'gift-studio' ? openGiftStudio() : navigateTo(link.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--charcoal-400)', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', fontWeight: 500,
                      textAlign: 'left', transition: 'color 0.15s', padding: 0
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--gold-300)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--charcoal-400)'}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Strip */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '1.5rem',
          padding: '1.5rem 0',
          borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}>
          {[
            { icon: <Phone size={15} />, text: '+234 703 014 4746' },
            { icon: <Mail size={15} />, text: 'alizsoncakes2@gmail.com' },
            { icon: <MapPin size={15} />, text: 'Bakery: Obasanjo Hilltop | Supplies: Kuto, Abeokuta, Ogun State' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--charcoal-400)', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--gold-500)' }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
          padding: '1.25rem 0',
          fontSize: '0.8rem', color: 'var(--charcoal-500)'
        }}>
          <span>© 2026 Alizson Cakes & Snacks. All Rights Reserved. Made with <Heart size={12} style={{ display: 'inline', color: 'var(--burgundy-500)', verticalAlign: 'middle' }} /> in Abeokuta, Ogun State, Nigeria.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {/* Standalone pages in public/ (also linked from the Google sign-in screen) */}
            {[
              { label: 'Privacy Policy', href: '/privacy.html' },
              { label: 'Terms of Service', href: '/terms.html' }
            ].map(({ label, href }) => (
              <a key={href} href={href} style={{ color: 'inherit', textDecoration: 'none', fontFamily: 'var(--font-sans)', fontSize: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--gold-400)'}
                onMouseLeave={e => e.currentTarget.style.color = ''}
              >{label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
