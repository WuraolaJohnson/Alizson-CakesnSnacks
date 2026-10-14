import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';

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
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.81 4.5 6.27 6.27 0 0 0 1.86-4.5V9.07a8.28 8.28 0 0 0 4.92 1.62V7.25a4.78 4.78 0 0 1-1-.56z"/>
  </svg>
);

const ContactPage = () => {
  const { showToast } = useApp();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', store: 'bakery' });
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast('Message received! We\'ll get back to you within 24 hours. 📩', 'success');
    setForm({ name: '', email: '', subject: '', message: '', store: 'bakery' });
  };

  return (
    <div style={{ background: 'var(--cream-50)', paddingBottom: '5rem' }}>
      {/* Header */}
      <section style={{
        background: 'linear-gradient(135deg, var(--charcoal-900), #2A1A08)',
        padding: '4rem 1.5rem', textAlign: 'center'
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📞</div>
        <h1 className="display-title font-serif" style={{ color: 'white', marginBottom: '0.75rem' }}>Get in Touch</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', maxWidth: 480, margin: '0 auto' }}>
          We're here to help. Whether it's a custom cake inquiry, a supply order, or just a hello — reach out!
        </p>
      </section>

      <div className="container" style={{ paddingTop: '3.5rem' }}>
        {/* Contact Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '3.5rem' }}>
          {[
            { icon: <Phone size={22} />, label: 'Official Phone Hotline', value: '+234 703 014 4746', sub: 'Call or WhatsApp Support', color: 'var(--gold-500)' },
            { icon: <Mail size={22} />, label: 'Email Enquiries', value: 'alizsoncakes2@gmail.com', sub: 'Direct Customer Support', color: 'var(--burgundy-700)' },
            { icon: <MapPin size={22} />, label: 'Bakery Headquarters', value: 'Obasanjo Hilltop', sub: 'Adefunke Shodunke St, Abeokuta', color: 'var(--status-info)' },
            { icon: <MapPin size={22} />, label: 'Baking Supplies Store', value: 'Iyana Oja, Kuto', sub: 'Kuto Market Area, Abeokuta', color: 'var(--gold-600)' },
          ].map((c, i) => (
            <div key={i} className="card" style={{ padding: '1.5rem', textAlign: 'center', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: c.color, border: `1.5px solid ${c.color}30` }}>
                {c.icon}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>{c.label}</div>
              <div style={{ fontWeight: 700, color: 'var(--charcoal-900)', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{c.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Form + Map */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
          {/* Contact Form */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>Send us a Message</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Your Name *</label>
                  <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Full name" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="your@email.com" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Related to</label>
                <select className="form-select" value={form.store} onChange={e => update('store', e.target.value)}>
                  <option value="bakery">🍰 Bakery & Snacks Order</option>
                  <option value="supplies">🧁 Baking Supplies</option>
                  <option value="general">General Inquiry</option>
                  <option value="wholesale">Wholesale / Bulk</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-input" value={form.subject} onChange={e => update('subject', e.target.value)} placeholder="How can we help?" />
              </div>
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea className="form-textarea" rows={4} value={form.message} onChange={e => update('message', e.target.value)} placeholder="Tell us more about your enquiry..." required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                📨 Send Message
              </button>
            </form>
          </div>

          {/* Map + Social */}
          <div>
            {/* Map Placeholder */}
            <div style={{
              background: 'linear-gradient(135deg, var(--charcoal-900), #2A1A08)',
              borderRadius: 'var(--radius-xl)', aspectRatio: '4/3',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.5rem', overflow: 'hidden', position: 'relative'
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=700&q=60) center/cover', opacity: 0.3 }} />
              <div style={{ position: 'relative', textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍</div>
                <div style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.2rem' }}>Abeokuta Main Branches</div>
                <div style={{ color: 'var(--gold-300)', fontSize: '0.85rem', fontWeight: 700 }}>🍰 Bakery: Adefunke Shodunke St, Obasanjo Hilltop</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginTop: '0.2rem' }}>🧁 Supplies: Iyana Oja, Kuto, Abeokuta, Ogun State</div>
                <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                  onClick={() => window.open('https://www.google.com/maps?q=Obasanjo+Hilltop+Abeokuta+Ogun+State', '_blank')}>
                  🗺️ Get Directions in Abeokuta
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, marginBottom: '1rem', color: 'var(--charcoal-900)' }}>Follow & Connect</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { icon: <InstagramIcon size={18} />, label: '@alizson_cakesnsnacks', platform: 'Instagram', color: '#E1306C', bg: '#FDE', url: 'https://www.instagram.com/alizson_cakesnsnacks/' },
                  { icon: <FacebookIcon size={18} />, label: 'Alizson Cakes & Snacks', platform: 'Facebook', color: '#1877F2', bg: '#EBF4FF', url: 'https://www.facebook.com/share/1K42FeYn9D/' },
                  { icon: <TikTokIcon size={18} />, label: '@alizson_cakesnsnacks', platform: 'TikTok', color: '#000', bg: '#F3F4F6', url: 'https://www.instagram.com/alizson_cakesnsnacks/' },
                  { icon: <MessageCircle size={18} />, label: '+234 703 014 4746', platform: 'WhatsApp', color: '#25D366', bg: '#ECFDF5', url: 'https://wa.link/avijal' },
                ].map(s => (
                  <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem', background: s.bg, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <span style={{ color: s.color }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.platform}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--charcoal-900)' }}>{s.label}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
