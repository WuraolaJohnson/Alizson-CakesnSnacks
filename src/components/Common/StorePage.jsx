import React, { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ProductCard from './ProductCard';

const SORTS = [
  { id: 'popular', label: 'Popular' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Top Rated' },
  { id: 'newest', label: 'Newest' },
  { id: 'name', label: 'A – Z' }
];

const PAGE_SIZE = 30;

/**
 * Marketplace-style listing shared by the Bakery and Supplies stores:
 * slim header, sticky category + sort chips, dense grid, "See more".
 *
 * @param {'bakery'|'supplies'} store
 * @param {object[]} products
 * @param {string} title
 * @param {string} subtitle
 * @param {Record<string,string>} categoryEmojis - optional emoji per category
 * @param {(p: object) => number} priceOf - lowest price of a product
 */
const StorePage = ({ store, products, title, subtitle, categoryEmojis = {}, priceOf }) => {
  const { activeCategoryFilter, setActiveCategoryFilter, searchQuery, setSearchQuery } = useApp();
  const [sort, setSort] = useState('popular');
  const [filterOpen, setFilterOpen] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Only categories that actually have products
  const categories = useMemo(() => {
    const names = [];
    products.forEach(p => { if (p.category && !names.includes(p.category)) names.push(p.category); });
    return ['All', ...names];
  }, [products]);

  // A category chosen in the other store may not exist here
  const activeCategory = categories.includes(activeCategoryFilter) ? activeCategoryFilter : 'All';

  const filtered = useMemo(() => {
    let arr = [...products];
    const q = (searchQuery || '').toLowerCase().trim();
    if (q) {
      arr = arr.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'All') arr = arr.filter(p => p.category === activeCategory);
    if (inStockOnly) arr = arr.filter(p => p.inStock);
    if (minPrice !== '') arr = arr.filter(p => priceOf(p) >= Number(minPrice));
    if (maxPrice !== '') arr = arr.filter(p => priceOf(p) <= Number(maxPrice));

    switch (sort) {
      case 'price-asc': arr.sort((a, b) => priceOf(a) - priceOf(b)); break;
      case 'price-desc': arr.sort((a, b) => priceOf(b) - priceOf(a)); break;
      case 'rating': arr.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest': arr.sort((a, b) => String(b.id).localeCompare(String(a.id))); break;
      case 'name': arr.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: arr.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    }
    return arr;
  }, [products, searchQuery, activeCategory, inStockOnly, minPrice, maxPrice, sort, priceOf]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [activeCategory, sort, searchQuery, inStockOnly, minPrice, maxPrice]);

  const filtersActive = inStockOnly || minPrice !== '' || maxPrice !== '';

  const resetAll = () => {
    setActiveCategoryFilter('All');
    setInStockOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setSearchQuery?.('');
  };

  const priceInputStyle = {
    width: 110, padding: '0.45rem 0.65rem', fontSize: '0.875rem',
    border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-surface)', color: 'var(--text-primary)'
  };

  return (
    <div>
      {/* Slim header */}
      <div className="container store-header">
        <h1 className="store-header__title">{title}</h1>
        <p className="store-header__sub">{subtitle}</p>
      </div>

      {/* Sticky categories + sort */}
      <div className="store-bar">
        <div className="container store-bar__inner">
          <div className="shop-tabs" role="tablist" aria-label="Categories">
            {categories.map(cat => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeCategory === cat}
                className={`shop-chip ${activeCategory === cat ? 'is-active' : ''}`}
                onClick={() => setActiveCategoryFilter(cat)}
              >
                {categoryEmojis[cat] ? `${categoryEmojis[cat]} ` : ''}{cat}
              </button>
            ))}
          </div>

          <div className="shop-tabs" aria-label="Sort">
            <button
              className={`shop-chip ${filterOpen || filtersActive ? 'is-active' : ''}`}
              onClick={() => setFilterOpen(o => !o)}
              aria-expanded={filterOpen}
            >
              <SlidersHorizontal size={14} /> Filters{filtersActive ? ' •' : ''}
            </button>
            {SORTS.map(s => (
              <button
                key={s.id}
                className={`shop-chip ${sort === s.id ? 'is-active' : ''}`}
                onClick={() => setSort(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '1rem', paddingBottom: '2.5rem' }}>
        {filterOpen && (
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} />
              In stock only
            </label>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price (₦)</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="number" min="0" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} style={priceInputStyle} />
                <span style={{ color: 'var(--text-muted)' }}>–</span>
                <input type="number" min="0" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={priceInputStyle} />
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={resetAll}>
              <X size={14} /> Reset
            </button>
          </div>
        )}

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> {filtered.length === 1 ? 'product' : 'products'}
          {activeCategory !== 'All' && <> in <strong style={{ color: 'var(--text-primary)' }}>{activeCategory}</strong></>}
          {searchQuery?.trim() && <> matching “<strong style={{ color: 'var(--text-primary)' }}>{searchQuery.trim()}</strong>”</>}
        </p>

        {filtered.length > 0 ? (
          <>
            <div className="grid-shop">
              {filtered.slice(0, visibleCount).map(p => (
                <ProductCard key={p.id} product={p} store={store} />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="see-more">
                <button className="btn btn-outline" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
                  See more ({filtered.length - visibleCount} left)
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <Search size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>No products found</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Try another category or clear your filters.</p>
            <button className={`btn ${store === 'supplies' ? 'btn-burgundy' : 'btn-primary'}`} style={{ marginTop: '1.25rem' }} onClick={resetAll}>
              Show all products
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorePage;
