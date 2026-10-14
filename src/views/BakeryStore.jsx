import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown, X, Layers, Grid } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { useApp } from '../context/AppContext';
import BakeryProductCard from '../components/Bakery/BakeryProductCard';

const CATEGORIES = ['All', 'Cakes', 'Cupcakes', 'Doughnuts', 'Pastries', 'Cookies', 'Pies', 'Bread', 'Desserts', 'Gift Boxes'];
const SORTS = [
  'Popular',
  'Name: A to Z',
  'Name: Z to A',
  'Category / Type',
  'Price: Low to High',
  'Price: High to Low',
  'Highest Rated',
  'Newest'
];

const CATEGORY_EMOJIS = {
  All: '🛍️', Cakes: '🎂', Cupcakes: '🧁', Doughnuts: '🍩', Pastries: '🥐',
  Cookies: '🍪', Pies: '🥧', Bread: '🍞', Desserts: '🍮', 'Gift Boxes': '🎁'
};

const BakeryStore = () => {
  const { bakeryProducts } = useProducts();
  const { activeCategoryFilter, setActiveCategoryFilter, searchQuery } = useApp();
  const [sort, setSort] = useState('Popular');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [groupByType, setGroupByType] = useState(true);

  const filtered = useMemo(() => {
    let arr = [...bakeryProducts];
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      arr = arr.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (activeCategoryFilter !== 'All') arr = arr.filter(p => p.category === activeCategoryFilter);
    if (showInStock) arr = arr.filter(p => p.inStock);
    arr = arr.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    switch (sort) {
      case 'Name: A to Z': arr.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'Name: Z to A': arr.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'Category / Type': arr.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)); break;
      case 'Price: Low to High': arr.sort((a, b) => a.price - b.price); break;
      case 'Price: High to Low': arr.sort((a, b) => b.price - a.price); break;
      case 'Highest Rated': arr.sort((a, b) => b.rating - a.rating); break;
      case 'Newest': arr.sort((a, b) => b.id.localeCompare(a.id)); break;
      default: arr.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    }
    return arr;
  }, [bakeryProducts, activeCategoryFilter, searchQuery, sort, priceRange, showInStock]);

  const groupedProducts = useMemo(() => {
    if (!groupByType) return null;
    const groups = {};
    filtered.forEach(p => {
      const cat = p.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [filtered, groupByType]);

  return (
    <div>
      {/* Store Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--charcoal-900), #2A1A08)',
        padding: '4rem 1.5rem 3.5rem',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url(https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=1600&q=60) center/cover', opacity: 0.12 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🍰</div>
          <p className="eyebrow" style={{ color: 'var(--gold-400)', marginBottom: '0.5rem' }}>Alizson Cakes & Snacks</p>
          <h1 className="display-title font-serif" style={{ color: 'white', marginBottom: '0.75rem' }}>
            Freshly Baked With Love
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto' }}>
            Artisan celebration cakes, cupcakes, pastries, meat pies, and seasonal snacks — made fresh daily. Experience the taste, refresh your soul.
          </p>
        </div>
      </section>

      {/* Category Pills */}
      <section style={{ background: 'white', borderBottom: '1px solid var(--cream-200)', padding: '0.6rem 0', position: 'sticky', top: 64, zIndex: 90 }}>
        <div className="container" style={{
          overflowX: 'auto',
          display: 'flex',
          gap: '0.6rem',
          paddingTop: '6px',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`pill-tab ${activeCategoryFilter === cat ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter(cat)}
            >
              {CATEGORY_EMOJIS[cat]} {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Products Area */}
      <div className="container section-py-sm">
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <strong style={{ color: 'var(--charcoal-900)' }}>{filtered.length}</strong> products in <strong style={{ color: 'var(--charcoal-900)' }}>{activeCategoryFilter}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Group by Type Toggle */}
            <button
              type="button"
              className={`btn btn-sm ${groupByType ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setGroupByType(!groupByType)}
              title={groupByType ? 'Show flat product grid' : 'Group products by category / type'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
            >
              {groupByType ? <Grid size={15} /> : <Layers size={15} />}
              <span>{groupByType ? 'Grouped by Type' : 'Group by Type'}</span>
            </button>

            {/* Filter Toggle */}
            <button className="btn btn-secondary btn-sm" onClick={() => setFilterOpen(!filterOpen)}>
              <SlidersHorizontal size={15} /> Filters
            </button>

            {/* Sort */}
            <div style={{ position: 'relative', minWidth: 200 }}>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="form-select"
                style={{
                  cursor: 'pointer',
                  paddingRight: '2.2rem',
                  paddingLeft: '0.9rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  height: '40px',
                  lineHeight: '1.4',
                  display: 'block'
                }}
              >
                {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={15} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--charcoal-500)' }} />
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start', animation: 'slideDown 0.2s ease-out' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--charcoal-800)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Availability</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: 'var(--charcoal-700)' }}>
                <input type="checkbox" checked={showInStock} onChange={e => setShowInStock(e.target.checked)} />
                In Stock Only
              </label>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--charcoal-800)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price Range</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="number" value={priceRange[0]} onChange={e => setPriceRange([+e.target.value, priceRange[1]])}
                  style={{ width: 90, padding: '0.4rem 0.6rem', border: '1px solid var(--cream-300)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}
                  placeholder="Min ₦"
                />
                <span style={{ color: 'var(--text-muted)' }}>—</span>
                <input type="number" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], +e.target.value])}
                  style={{ width: 90, padding: '0.4rem 0.6rem', border: '1px solid var(--cream-300)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}
                  placeholder="Max ₦"
                />
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setPriceRange([0, 100000]); setShowInStock(false); setActiveCategoryFilter('All'); }}>
              <X size={14} /> Reset Filters
            </button>
          </div>
        )}

        {/* Grid or Grouped Sections */}
        {filtered.length > 0 ? (
          groupByType ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
              {Object.entries(groupedProducts).map(([cat, items]) => (
                <div key={cat} style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '2px solid var(--cream-200)',
                    paddingBottom: '0.75rem',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.6rem' }}>{CATEGORY_EMOJIS[cat] || '🍰'}</span>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-serif)', color: 'var(--charcoal-900)' }}>
                        {cat}
                      </h2>
                    </div>
                    <span style={{
                      background: 'var(--cream-200)',
                      color: 'var(--charcoal-700)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}>
                      {items.length} {items.length === 1 ? 'product' : 'products'}
                    </span>
                  </div>
                  <div className="grid-products">
                    {items.map(p => <BakeryProductCard key={p.id} product={p} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid-products">
              {filtered.map(p => <BakeryProductCard key={p.id} product={p} />)}
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--charcoal-800)' }}>No products found</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Try adjusting your filters or browse another category.</p>
            <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => { setActiveCategoryFilter('All'); setPriceRange([0, 100000]); setShowInStock(false); }}>
              Show All Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BakeryStore;
