import React from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ownerImg from '../assets/elizabeth-johnson.jpg';

const FOUNDER = {
  name: 'Elizabeth Johnson',
  role: 'Founder, Owner & Master Baker',
  bio: 'With over 6 years of dedicated baking and pastry expertise, Elizabeth Johnson oversees every recipe, handcrafts signature cakes, and personally curates all professional baking supplies and gift packages available at Alizson.',
  quote: 'Every cake I bake and every baking ingredient I stock is chosen with genuine love, precision, and passion for the craft.',
  img: ownerImg
};

const AboutPage = () => {
  const { navigateTo } = useApp();

  return (
    <div style={{ background: 'var(--cream-50)', paddingBottom: '5rem' }}>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--charcoal-900), #3D1A10)',
        padding: '5rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=1600&q=50) center/cover', opacity: 0.12 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🍰</div>
          <p className="eyebrow" style={{ color: 'var(--gold-400)' }}>Our Story</p>
          <h1 className="display-title font-serif" style={{ color: 'white', marginTop: '0.5rem', marginBottom: '1rem' }}>
            Born from a Love of Baking
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 560, margin: '0 auto' }}>
            Alizson Cakes & Snacks started as an artisan bakery in Abeokuta, Ogun State, growing into a premier two-in-one baking and supplies hub.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-py">
        <div className="container-narrow">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div>
              <p className="eyebrow">How It All Began</p>
              <h2 className="section-title font-serif" style={{ marginTop: '0.5rem', marginBottom: '1.25rem', fontSize: '1.9rem' }}>
                6 Years of Artisan Baking Excellence
              </h2>
              <p className="lead-text" style={{ marginBottom: '1rem' }}>
                Elizabeth Johnson began baking celebration cakes and snacks 6 years ago from her kitchen in Abeokuta, Ogun State. What started with custom orders from Olusegun Obasanjo Hilltop and Kuto grew rapidly as customers fell in love with her fresh, handcrafted pastry creations.
              </p>
              <p className="body-text" style={{ marginBottom: '1.25rem' }}>
                Seeing fellow bakers struggle to find authentic, premium-grade ingredients and baking tools locally, she built Alizson — a single destination where dessert lovers can order freshly baked goods and passionate bakers can source top-tier ingredients and equipment.
              </p>
              <p className="body-text">
                Today, Alizson operates dedicated Bakery and Supplies branches in Abeokuta, serving customers across Ogun State with fast delivery and free store pick-up. Every recipe is personally perfected and every supply item tested to professional standards.
              </p>
            </div>
            <div>
              <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=700&q=80"
                alt="Alizson Kitchen" style={{ width: '100%', borderRadius: 'var(--radius-xl)', objectFit: 'cover', maxHeight: 400, boxShadow: 'var(--shadow-xl)', border: '4px solid var(--cream-200)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="section-py" style={{ background: 'var(--cream-100)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p className="eyebrow">Our Mission</p>
            <h2 className="section-title font-serif" style={{ marginTop: '0.5rem' }}>What Drives Us Every Day</h2>
          </div>
          <div className="grid-3col">
            {[
              { emoji: '🌟', title: 'Quality Above All', desc: 'Every ingredient used, every product sold, every cake baked meets the highest standard. No shortcuts. No compromises.' },
              { emoji: '❤️', title: 'Baked with Love', desc: 'We believe food carries emotion. Every creation from our bakery is made with intentional care and genuine craft.' },
              { emoji: '🤝', title: 'Community First', desc: 'We support home bakers and aspiring pastry chefs by making professional-grade supplies accessible and affordable.' }
            ].map((v, i) => (
              <div key={i} className="card" style={{ padding: '2rem', textAlign: 'center', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{v.emoji}</div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--charcoal-900)' }}>{v.title}</h3>
                <p className="body-text">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Founder */}
      <section className="section-py">
        <div className="container-narrow">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <p className="eyebrow">Meet the Founder</p>
            <h2 className="section-title font-serif" style={{ marginTop: '0.5rem' }}>The Heart Behind Alizson</h2>
          </div>

          <div className="card" style={{
            padding: 'clamp(1.5rem, 4vw, 3rem)',
            background: 'white',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--cream-200)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={FOUNDER.img}
                  alt={FOUNDER.name}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid var(--gold-400)',
                    boxShadow: '0 8px 24px rgba(229,138,19,0.3)'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  background: 'var(--gold-500)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 38,
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  👩‍🍳
                </div>
              </div>
            </div>

            <div>
              <span className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>
                Solo Founder & Head Baker
              </span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--charcoal-900)', marginBottom: '0.25rem' }}>
                {FOUNDER.name}
              </h3>
              <div style={{ fontSize: '0.9rem', color: 'var(--gold-700)', fontWeight: 700, marginBottom: '1rem' }}>
                {FOUNDER.role}
              </div>
              <p style={{ color: 'var(--charcoal-700)', lineHeight: 1.65, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                {FOUNDER.bio}
              </p>
              <div style={{
                background: 'var(--cream-100)',
                borderLeft: '3px solid var(--gold-500)',
                padding: '0.75rem 1rem',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                fontStyle: 'italic',
                color: 'var(--charcoal-800)',
                fontSize: '0.9rem'
              }}>
                "{FOUNDER.quote}"
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, var(--charcoal-900), #2A1A08)', padding: '4.5rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'white', marginBottom: '1rem' }}>Ready to Experience Alizson?</h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '2rem' }}>Experience the taste, refresh your soul.. Order freshly baked treats or shop the best baking supplies in Nigeria.</p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigateTo('bakery')}>🍰 Order Now</button>
          <button className="btn btn-outline-light btn-lg" onClick={() => navigateTo('contact')}>📞 Contact Us</button>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
