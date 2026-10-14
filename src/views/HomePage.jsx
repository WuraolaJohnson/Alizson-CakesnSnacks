import React, { useMemo, useState, useEffect } from 'react';
import { ChevronRight, CheckCircle2, Flame, Sparkles, LayoutGrid } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useStore } from '../context/StoreContext';
import { useProducts } from '../context/ProductContext';
import ProductCard from '../components/Common/ProductCard';

// Banners stay dark in both themes, so they use fixed colours (not --charcoal-*)
const HERO_SLIDES = [
  {
    title: 'Sweet Creations.\nQuality Ingredients.',
    subtitle: 'Celebration cakes, pastries and snacks baked fresh in Abeokuta — plus everything you need to bake your own.',
    badge: '🍰 Seasonal celebration cakes are here',
    bg: 'linear-gradient(120deg, #1A1715 0%, #2A1A08 55%, #4A2C08 100%)',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=80',
    cta: { label: '🍰 Shop Cakes & Pastries', store: 'bakery' }
  },
  {
    title: 'Bake Better.\nCreate More.',
    subtitle: 'Professional ingredients, decorations, packaging and tools — delivered to your door across Ogun State.',
    badge: '🧁 Pro tools & ingredients in stock',
    bg: 'linear-gradient(120deg, #12100F 0%, #2A0F18 55%, #4D0A18 100%)',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=1000&q=80',
    cta: { label: '🧁 Shop Baking Supplies', store: 'supplies' }
  }
];

// Facts already stated elsewhere on the site (FAQ, checkout, contact)
const TRUST_POINTS = [
  'Baked fresh daily',
  'Delivery across Ogun State',
  'Secure checkout with Paystack',
  'Custom cakes with 48–72h notice',
  'Pick up in Abeokuta'
];

const PAGE_SIZE = 20;

/** Unique categories in product order, each with its first product's photo */
function categoriesOf(products, store) {
  const seen = new Map();
  products.forEach(p => {
    if (p.category && !seen.has(p.category)) {
      seen.set(p.category, { name: p.category, image: p.image, store });
    }
  });
  return [...seen.values()];
}

/** Alternate bakery and supplies so "All" shows a mix */
function interleave(a, b) {
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

const byPopularity = (a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0);

/** Round category photo; shows an emoji if the photo link is broken */
const CategoryThumb = ({ image, fallback }) => {
  const [failed, setFailed] = useState(false);
  return (
    <span className="cat-chip__img">
      {failed || !image
        ? fallback
        : <img src={image} alt="" loading="lazy" onError={() => setFailed(true)} />}
    </span>
  );
};

const HomePage = () => {
  const { navigateTo, openGiftStudio, setActiveCategoryFilter } = useApp();
  const { switchStore } = useStore();
  const { bakeryProducts, supplyProducts } = useProducts();

  const [activeSlide, setActiveSlide] = useState(0);
  const [exploreTab, setExploreTab] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const slide = HERO_SLIDES[activeSlide];

  // Auto-advance the banner
  useEffect(() => {
    const t = setInterval(() => setActiveSlide(s => (s + 1) % HERO_SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [exploreTab]);

  const categories = useMemo(() => [
    ...categoriesOf(bakeryProducts, 'bakery'),
    ...categoriesOf(supplyProducts, 'supplies')
  ], [bakeryProducts, supplyProducts]);

  const bakeryBest = useMemo(() => [...bakeryProducts].sort(byPopularity).slice(0, 10), [bakeryProducts]);
  const suppliesBest = useMemo(() => [...supplyProducts].sort(byPopularity).slice(0, 10), [supplyProducts]);

  const exploreItems = useMemo(() => {
    const bakery = bakeryProducts.map(p => ({ product: p, store: 'bakery' }));
    const supplies = supplyProducts.map(p => ({ product: p, store: 'supplies' }));
    if (exploreTab === 'bakery') return bakery;
    if (exploreTab === 'supplies') return supplies;
    return interleave(bakery, supplies);
  }, [bakeryProducts, supplyProducts, exploreTab]);

  const goToStore = (store, category = 'All') => {
    switchStore(store);
    setActiveCategoryFilter(category);
    navigateTo(store);
  };

  return (
    <div>
      {/* === TRUST BAR === */}
      <div className="trust-bar">
        <div className="trust-bar__inner container">
          {TRUST_POINTS.map(point => (
            <span key={point} className="trust-bar__item">
              <CheckCircle2 size={14} /> {point}
            </span>
          ))}
        </div>
      </div>

      <div className="container">
        {/* === HERO BANNER + STORE TILES === */}
        <section className="shop-hero">
          <div className="shop-banner">
            <div className="shop-banner__bg" style={{ background: slide.bg }} />
            <img className="shop-banner__img" src={slide.image} alt="" />
            <div className="shop-banner__content" key={activeSlide} style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <span className="shop-banner__badge">{slide.badge}</span>
              <h1 className="shop-banner__title">{slide.title}</h1>
              <p className="shop-banner__text">{slide.subtitle}</p>
              <div className="shop-banner__actions">
                <button className="btn btn-primary" onClick={() => goToStore(slide.cta.store)}>
                  {slide.cta.label}
                </button>
                <button className="btn btn-outline-light" onClick={openGiftStudio}>
                  🎁 Build a Gift Package
                </button>
              </div>
            </div>
            <div className="shop-banner__dots">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`shop-banner__dot ${i === activeSlide ? 'is-active' : ''}`}
                  onClick={() => setActiveSlide(i)}
                  aria-label={`Show banner ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="shop-tiles">
            <button className="shop-tile" onClick={() => goToStore('bakery')}>
              <img src="https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=600&q=70" alt="" />
              <span className="shop-tile__eyebrow">Alizson Bakery</span>
              <span className="shop-tile__title">Cakes, pastries & snacks</span>
              <span className="shop-tile__cta">Shop now <ChevronRight size={14} /></span>
            </button>
            <button className="shop-tile shop-tile--supplies" onClick={() => goToStore('supplies')}>
              <img src="https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=600&q=70" alt="" />
              <span className="shop-tile__eyebrow">Alizson Supplies</span>
              <span className="shop-tile__title">Ingredients & baking tools</span>
              <span className="shop-tile__cta">Shop now <ChevronRight size={14} /></span>
            </button>
          </div>
        </section>

        {/* === CATEGORY SHORTCUTS === */}
        <section className="shop-section">
          <div className="shop-section__head">
            <h2 className="shop-section__title"><LayoutGrid size={18} /> Shop by category</h2>
          </div>
          <div className="cat-row">
            {categories.map(cat => (
              <button
                key={`${cat.store}-${cat.name}`}
                className={`cat-chip ${cat.store === 'supplies' ? 'cat-chip--supplies' : ''}`}
                onClick={() => goToStore(cat.store, cat.name)}
              >
                <CategoryThumb image={cat.image} fallback={cat.store === 'supplies' ? '🧁' : '🍰'} />
                <span className="cat-chip__label">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* === BESTSELLER ROWS === */}
        <section className="shop-section">
          <div className="shop-section__head">
            <h2 className="shop-section__title"><Flame size={18} color="var(--gold-500)" /> Bakery bestsellers</h2>
            <button className="shop-link" onClick={() => goToStore('bakery')}>See all <ChevronRight size={15} /></button>
          </div>
          <div className="product-row">
            {bakeryBest.map(p => <ProductCard key={p.id} product={p} store="bakery" compact />)}
          </div>
        </section>

        <section className="shop-section">
          <div className="shop-section__head">
            <h2 className="shop-section__title"><Sparkles size={18} color="var(--burgundy-500)" /> Top baking supplies</h2>
            <button className="shop-link" onClick={() => goToStore('supplies')}>See all <ChevronRight size={15} /></button>
          </div>
          <div className="product-row">
            {suppliesBest.map(p => <ProductCard key={p.id} product={p} store="supplies" compact />)}
          </div>
        </section>

        {/* === EXPLORE GRID === */}
        <section className="shop-section">
          <div className="shop-section__head" style={{ flexWrap: 'wrap' }}>
            <h2 className="shop-section__title">Explore everything</h2>
            <div className="shop-tabs" role="tablist">
              {[
                { id: 'all', label: 'All' },
                { id: 'bakery', label: '🍰 Bakery' },
                { id: 'supplies', label: '🧁 Supplies' }
              ].map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={exploreTab === tab.id}
                  className={`shop-chip ${exploreTab === tab.id ? 'is-active' : ''}`}
                  onClick={() => setExploreTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-shop">
            {exploreItems.slice(0, visibleCount).map(({ product, store }) => (
              <ProductCard key={`${store}-${product.id}`} product={product} store={store} />
            ))}
          </div>

          {visibleCount < exploreItems.length && (
            <div className="see-more">
              <button className="btn btn-outline" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
                See more ({exploreItems.length - visibleCount} left)
              </button>
            </div>
          )}
        </section>
      </div>

      {/* === WHATSAPP TESTIMONIALS === */}
      <section className="section-py" style={{ background: 'var(--bg-surface-soft)', marginTop: '1.5rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
              <div key={i} className="card" style={{
                border: '2px dashed var(--border-medium)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: '300px', gap: '1rem', padding: '2rem'
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: '#25D366',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(37,211,102,0.35)'
                }}>
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="white" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                    📸 {slot.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace', background: 'var(--bg-surface-soft)', borderRadius: '6px', padding: '3px 8px', display: 'inline-block' }}>
                    {slot.hint}
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, maxWidth: '180px', margin: 0 }}>
                  Drop your WhatsApp screenshot here when ready
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
