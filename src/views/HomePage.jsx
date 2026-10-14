import React, { useState } from 'react';
import { ChevronRight, Star, Award, Leaf, Truck, Clock, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useStore } from '../context/StoreContext';
import { useProducts } from '../context/ProductContext';
import BakeryProductCard from '../components/Bakery/BakeryProductCard';
import SupplyProductCard from '../components/Supplies/SupplyProductCard';

const HERO_SLIDES = [
  {
    title: 'Sweet Creations.\nQuality Ingredients.\nEverything Baking.',
    subtitle: 'Order freshly made artisan treats or shop the finest ingredients and tools to create your own masterpieces.',
    badge: '🍰 New: Seasonal Celebration Cakes are here!',
    bg: 'linear-gradient(135deg, #1A1715 0%, #2A1A08 55%, #3D2408 100%)',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    accent: '#E58A13',
    cta: 'bakery'
  },
  {
    title: 'Bake Better.\nCreate More.\nAchieve Perfection.',
    subtitle: 'Professional ingredients, premium tools, and everything a passionate baker needs — delivered to your door.',
    badge: '🧁 Pro Tools & Ingredients now in stock!',
    bg: 'linear-gradient(135deg, #12100F 0%, #1F0E14 55%, #2E1020 100%)',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80',
    accent: '#8C1D32',
    cta: 'supplies'
  }
];


const HomePage = () => {
  const { navigateTo, openGiftStudio } = useApp();
  const { switchStore } = useStore();
  const { bakeryProducts, supplyProducts } = useProducts();
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = HERO_SLIDES[activeSlide];

  const featuredBakery = bakeryProducts.slice(0, 4);
  const featuredSupplies = supplyProducts.slice(0, 4);

  return (
    <div>
      {/* === HERO === */}
      <section style={{ background: slide.bg, minHeight: '85vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', transition: 'background 0.8s ease' }}>
        {/* Decorative Background Elements */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: `${180 + i * 80}px`, height: `${180 + i * 80}px`,
              border: `1px solid rgba(255,255,255,${0.025 + i * 0.01})`,
              borderRadius: '50%',
              bottom: `${-20 + i * 5}%`, right: `${-5 + i * 3}%`,
              animation: `floatGentle ${6 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }} />
          ))}
        </div>

        <div className="container hero-grid" style={{ padding: '4.5rem 1.5rem' }}>
          {/* Left Text */}
          <div style={{ animation: 'slideUp 0.7s ease-out' }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: `${slide.accent}20`, border: `1px solid ${slide.accent}50`, borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: slide.accent, fontWeight: 700 }}>
              {slide.badge}
            </div>

            <h1 className="display-title-xl font-serif" style={{ color: 'white', whiteSpace: 'pre-line', marginBottom: '1.25rem', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
              {slide.title}
            </h1>

            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '500px' }}>
              {slide.subtitle}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
              <button className="btn btn-primary btn-lg" onClick={() => { switchStore('bakery'); navigateTo('bakery'); }}>
                🍰 Shop Cakes & Pastries
              </button>
              <button className="btn btn-outline-light btn-lg"
                onClick={() => { switchStore('supplies'); navigateTo('supplies'); }}>
                🧁 Shop Baking Supplies
              </button>
              <button 
                className="btn btn-lg"
                onClick={openGiftStudio}
                style={{
                  background: 'linear-gradient(135deg, #C6720A 0%, #E58A13 100%)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(198,114,10,0.4)'
                }}
              >
                🎁 Build Gift Package
              </button>
            </div>
            <button className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}
              onClick={() => navigateTo('about')}>
              Explore Our Story →
            </button>

            {/* Slide Dots */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
              {HERO_SLIDES.map((_, i) => (
                <button key={i} onClick={() => setActiveSlide(i)} style={{
                  width: i === activeSlide ? 24 : 8, height: 8, borderRadius: 'var(--radius-full)',
                  background: i === activeSlide ? slide.accent : 'rgba(255,255,255,0.25)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0
                }} />
              ))}
            </div>
          </div>

          {/* Right Image */}
          <div style={{ display: 'flex', justifyContent: 'center', animation: 'floatGentle 5s ease-in-out infinite' }}>
            <div style={{
              position: 'relative', width: 'min(420px, 100%)', aspectRatio: '1',
            }}>
              <div style={{
                position: 'absolute', inset: '-8px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${slide.accent}30, transparent 70%)`
              }} />
              <img src={slide.image} alt="Featured Alizson Product" style={{
                width: '100%', height: '100%', objectFit: 'cover',
                borderRadius: '50%',
                boxShadow: `0 30px 80px ${slide.accent}40`,
                border: `4px solid ${slide.accent}40`
              }} />
              {/* Floating Stats Card */}
              <div style={{
                position: 'absolute', bottom: '8%', left: '-5%',
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
                borderRadius: 'var(--radius-lg)', padding: '0.75rem 1.1rem',
                boxShadow: 'var(--shadow-xl)', animation: 'floatGentle 3.5s ease-in-out infinite reverse'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--charcoal-900)' }}>4.9⭐</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>From 500+ reviews</div>
              </div>
              <div style={{
                position: 'absolute', top: '10%', right: '-8%',
                background: `${slide.accent}`, borderRadius: 'var(--radius-lg)', padding: '0.65rem 0.9rem',
                boxShadow: 'var(--shadow-lg)', color: 'white', animation: 'floatGentle 4s ease-in-out infinite'
              }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>2,400+</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.85 }}>Happy Customers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === WHY ALIZSON === */}
      <section className="section-py" style={{ background: 'var(--cream-100)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p className="eyebrow">Why Alizson?</p>
            <h2 className="section-title font-serif" style={{ marginTop: '0.5rem' }}>Experience the Taste, Refresh Your Soul</h2>
          </div>
          <div className="grid-4col">
            {[
              { icon: <Award size={28} />, title: 'Artisan Quality', desc: 'Every product handcrafted using premium, carefully sourced ingredients.' },
              { icon: <Leaf size={28} />, title: 'Fresh Daily', desc: 'Baked fresh every morning — never from frozen, always from scratch.' },
              { icon: <Truck size={28} />, title: 'Fast Delivery', desc: 'Express delivery across Ogun State with real-time order tracking.' },
              { icon: <Clock size={28} />, title: 'Custom Orders', desc: 'Personalised cakes and event hampers for every celebration.' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ padding: '2rem 1.5rem', textAlign: 'center', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div style={{ width: 60, height: 60, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--gold-100), var(--gold-200))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--gold-600)', boxShadow: '0 6px 18px rgba(229,138,19,0.2)' }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--charcoal-900)', marginBottom: '0.5rem', fontFamily: 'var(--font-sans)' }}>{item.title}</h3>
                <p className="small-text" style={{ lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === STORE SWITCHER SHOWCASE === */}
      <section className="section-py">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {/* Bakery Store Card */}
            <div style={{
              background: 'linear-gradient(135deg, var(--charcoal-900), #2A1A08)',
              borderRadius: 'var(--radius-xl)', padding: '3rem 2.5rem',
              position: 'relative', overflow: 'hidden', cursor: 'pointer',
              transition: 'transform 0.3s, box-shadow 0.3s',
              boxShadow: 'var(--shadow-xl)'
            }}
              onClick={() => { switchStore('bakery'); navigateTo('bakery'); }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=800&q=80) center/cover', opacity: 0.15 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🍰</div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'white', fontWeight: 700, marginBottom: '0.75rem' }}>Alizson Bakery</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Order freshly baked celebration cakes, cupcakes, artisan pastries, snacks, meat pies, gift boxes and more.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '2rem' }}>
                  {['Cakes', 'Snacks', 'Cupcakes', 'Pastries', 'Pies', 'Cookies', 'Gift Boxes'].map(tag => (
                    <span key={tag} style={{ background: 'rgba(229,138,19,0.2)', border: '1px solid rgba(229,138,19,0.3)', borderRadius: 'var(--radius-full)', padding: '0.2rem 0.65rem', fontSize: '0.75rem', color: 'var(--gold-300)', fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
                <button className="btn btn-primary" style={{ pointerEvents: 'none' }}>
                  Shop Cakes & Snacks <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Supplies Store Card */}
            <div style={{
              background: 'linear-gradient(135deg, var(--charcoal-950), #1F0E14)',
              borderRadius: 'var(--radius-xl)', padding: '3rem 2.5rem',
              position: 'relative', overflow: 'hidden', cursor: 'pointer',
              transition: 'transform 0.3s, box-shadow 0.3s',
              boxShadow: 'var(--shadow-xl)'
            }}
              onClick={() => { switchStore('supplies'); navigateTo('supplies'); }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80) center/cover', opacity: 0.15 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🧁</div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'white', fontWeight: 700, marginBottom: '0.75rem' }}>Alizson Supplies</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Shop premium baking ingredients, professional equipment, decorating tools, and everything in between.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '2rem' }}>
                  {['Butter', 'Chocolate', 'Scales', 'Piping Tips', 'Turntables', 'Cake Boards'].map(tag => (
                    <span key={tag} style={{ background: 'rgba(140,29,50,0.25)', border: '1px solid rgba(140,29,50,0.4)', borderRadius: 'var(--radius-full)', padding: '0.2rem 0.65rem', fontSize: '0.75rem', color: 'var(--burgundy-300)', fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
                <button className="btn btn-burgundy" style={{ pointerEvents: 'none' }}>
                  Shop Baking Supplies <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURED BAKERY PRODUCTS === */}
      <section className="section-py" style={{ background: 'var(--cream-50)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <p className="eyebrow">🍰 Fresh From Our Oven</p>
              <h2 className="section-title font-serif" style={{ marginTop: '0.4rem' }}>Bakery Bestsellers</h2>
            </div>
            <button className="btn btn-outline-gold" onClick={() => { switchStore('bakery'); navigateTo('bakery'); }}>
              View All Bakery Products <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid-products">
            {featuredBakery.map(p => <BakeryProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* === FEATURED SUPPLIES === */}
      <section className="section-py" style={{ background: 'var(--cream-100)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <p className="eyebrow eyebrow-burgundy">🧁 Pro Baker Picks</p>
              <h2 className="section-title font-serif" style={{ marginTop: '0.4rem' }}>Top Baking Supplies</h2>
            </div>
            <button className="btn btn-outline" style={{ borderColor: 'var(--burgundy-500)', color: 'var(--burgundy-700)' }} onClick={() => { switchStore('supplies'); navigateTo('supplies'); }}>
              View All Supplies <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid-products">
            {featuredSupplies.map(p => <SupplyProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* === WHATSAPP TESTIMONIALS === */}
      <section className="section-py" style={{ background: 'var(--cream-100)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p className="eyebrow">Real Customer Messages</p>
            <h2 className="section-title font-serif" style={{ marginTop: '0.4rem' }}>Straight from Their WhatsApp 💬</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>Unfiltered love from our customers — just as they sent it.</p>
          </div>

          <div className="grid-3col">
            {[
              { label: 'Screenshot 1', hint: 'public/whatsapp-1.jpg' },
              { label: 'Screenshot 2', hint: 'public/whatsapp-2.jpg' },
              { label: 'Screenshot 3', hint: 'public/whatsapp-3.jpg' },
            ].map((slot, i) => (
              <div key={i} style={{
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                border: '2px dashed var(--cream-300)',
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '340px',
                gap: '1rem',
                padding: '2rem',
                transition: 'box-shadow 0.2s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'}
              >
                {/* WhatsApp icon */}
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: '#25D366',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
                }}>
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>

                {/* Label */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: 'var(--charcoal-800)', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                    📸 {slot.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--cream-100)', borderRadius: '6px', padding: '3px 8px', display: 'inline-block' }}>
                    {slot.hint}
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, maxWidth: '180px', margin: 0 }}>
                  Drop your WhatsApp screenshot here when ready
                </p>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            📱 Real messages from verified Alizson customers — shared with their permission.
          </p>
        </div>
      </section>

      {/* === BOTTOM CTA BANNER === */}
      <section style={{ background: 'linear-gradient(135deg, var(--charcoal-900), #2A1A08)', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <p className="eyebrow" style={{ color: 'var(--gold-400)' }}>Ready to Order?</p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: 'white', marginTop: '0.5rem', marginBottom: '1rem' }}>
          Start Your Baking Journey Today
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', marginBottom: '2.5rem', maxWidth: 520, margin: '0 auto 2.5rem' }}>
          Choose from our freshly baked selection or stock up on professional baking essentials.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <button className="btn btn-primary btn-lg" onClick={() => { switchStore('bakery'); navigateTo('bakery'); }}>
            🍰 Order Baked Goods
          </button>
          <button className="btn btn-outline-light btn-lg"
            onClick={() => { switchStore('supplies'); navigateTo('supplies'); }}>
            🧁 Shop Supplies
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
