import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useProducts } from '../../context/ProductContext';
import { useStore } from '../../context/StoreContext';

export const SearchBar = ({ inline = false, onClose }) => {
  const { searchQuery, setSearchQuery, navigateTo, setActiveCategoryFilter, openProductModal, currentView } = useApp();
  const { switchStore } = useStore();
  const { searchAllProducts } = useProducts();
  const [query, setQuery] = useState(searchQuery);
  const [results, setResults] = useState({ bakery: [], supplies: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    if (inline) inputRef.current?.focus();
  }, [inline]);

  useEffect(() => {
    if (query.trim().length > 1) {
      const r = searchAllProducts(query);
      setResults(r);
      setShowDropdown(true);
    } else {
      setResults({ bakery: [], supplies: [] });
      setShowDropdown(false);
    }
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchQuery(query.trim());
    setShowDropdown(false);
    onClose?.();

    // Determine target store based on search results
    const r = searchAllProducts(query);
    if (r.supplies.length > 0 && r.bakery.length === 0) {
      switchStore('supplies');
      navigateTo('supplies');
    } else {
      switchStore('bakery');
      navigateTo('bakery');
    }
    setActiveCategoryFilter('All');
  };

  const handleResultClick = (product) => {
    const store = product.store === 'bakery' ? 'bakery' : 'supplies';
    // Navigate only if not already on the target view
    if (store !== currentView) {
      switchStore(store);
      navigateTo(store);
    }
    setActiveCategoryFilter(product.category);
    setShowDropdown(false);
    setQuery('');
    setSearchQuery('');
    onClose?.();
    openProductModal({ ...product, isSupply: store === 'supplies' });
  };

  const allResults = [...results.bakery.slice(0, 3), ...results.supplies.slice(0, 3)];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: inline ? 'var(--cream-100)' : 'white',
          border: '1.5px solid',
          borderColor: inline ? 'var(--cream-300)' : 'rgba(255,255,255,0.2)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          height: '46px',
          transition: 'all 0.2s ease'
        }}>
          <Search size={18} style={{ marginLeft: '1rem', color: 'var(--charcoal-400)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search cakes, ingredients, tools..."
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: '0 1rem',
              fontSize: '0.9rem',
              color: inline ? 'var(--charcoal-900)' : 'inherit',
              outline: 'none',
              height: '100%'
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setShowDropdown(false); }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 0.75rem', color: 'var(--charcoal-400)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {showDropdown && allResults.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--cream-200)',
          zIndex: 500,
          overflow: 'hidden',
          animation: 'slideDown 0.2s ease-out'
        }}>
          {allResults.map(p => (
            <div
              key={p.id}
              onClick={() => handleResultClick(p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                borderBottom: '1px solid var(--cream-100)',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <img
                src={p.image}
                alt={p.name}
                style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--charcoal-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {p.store === 'bakery' ? '🍰 Bakery' : '🧁 Supplies'} · {p.category}
                </div>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gold-600)', flexShrink: 0 }}>
                ₦{(p.price || p.basePrice || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
