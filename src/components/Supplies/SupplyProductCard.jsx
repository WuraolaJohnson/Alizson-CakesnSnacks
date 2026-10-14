import React, { useState } from 'react';
import { ShoppingCart, Eye, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { RatingStars } from '../Common/RatingStars';

const SupplyProductCard = ({ product }) => {
  const { openProductModal, showToast } = useApp();
  const { addToSuppliesCart } = useCart();
  const [hovered, setHovered] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [cartAdded, setCartAdded] = useState(false);

  const selectedVariant = product.variants?.[selectedVariantIndex] || { size: 'Standard', price: product.basePrice };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToSuppliesCart(product, { variant: selectedVariant, quantity: 1 });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1800);
  };

  return (
    <div
      className="card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-xl)' : 'var(--shadow-sm)',
        borderColor: hovered ? 'var(--burgundy-300)' : 'var(--cream-200)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={() => openProductModal({ ...product, isSupply: true })}
    >
      {/* Image */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', aspectRatio: '4/3', background: 'var(--cream-100)' }}>
        <img
          src={product.image} alt={product.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.5s ease'
          }}
          loading="lazy"
        />
        {product.badge && (
          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
            <span className={`badge ${product.badge === 'Essential' ? 'badge-gold' : product.badge === 'Top Rated' || product.badge === 'Pro Choice' ? 'badge-burgundy' : 'badge-success'}`}>
              {product.badge}
            </span>
          </div>
        )}
        {!product.inStock && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,23,21,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="badge badge-danger">Out of Stock</span>
          </div>
        )}
        {/* Quick view overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', padding: '0.5rem',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.2s ease'
        }}>
          <span style={{
            background: 'rgba(26,23,21,0.85)', backdropFilter: 'blur(4px)',
            borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem',
            color: 'white', fontSize: '0.78rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            <Eye size={12} /> View Details
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>
          {product.category}
        </div>
        {product.brand && (
          <div style={{ fontSize: '0.78rem', color: 'var(--burgundy-700)', fontWeight: 700, marginBottom: '0.3rem' }}>{product.brand}</div>
        )}
        <h3 style={{
          fontFamily: 'var(--font-sans)', fontWeight: 700,
          fontSize: '0.925rem', color: 'var(--text-primary)',
          lineHeight: 1.3, marginBottom: '0.4rem',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {product.name}
        </h3>
        <p style={{
          fontSize: '0.785rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '0.65rem',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {product.shortDescription}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <RatingStars rating={product.rating} size={12} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({product.reviewsCount})</span>
        </div>

        {/* Variant Selector */}
        {product.variants && product.variants.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }} onClick={e => e.stopPropagation()}>
            {product.variants.map((v, i) => (
              <button key={i}
                onClick={() => setSelectedVariantIndex(i)}
                style={{
                  padding: '0.28rem 0.65rem', borderRadius: 'var(--radius-full)',
                  border: `1px solid ${selectedVariantIndex === i ? 'var(--burgundy-700)' : 'var(--cream-300)'}`,
                  background: selectedVariantIndex === i ? 'var(--burgundy-100)' : 'transparent',
                  color: selectedVariantIndex === i ? 'var(--burgundy-800)' : 'var(--charcoal-600)',
                  fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                  whiteSpace: 'nowrap'
                }}
              >
                {v.size}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto' }}>
          <span className="price-tag">
            <span className="price-currency">₦</span>
            {(selectedVariant?.price ?? product?.basePrice ?? product?.price ?? 0).toLocaleString()}
          </span>

          <button
            className={`btn ${cartAdded ? 'btn-dark' : 'btn-burgundy'}`}
            style={{ marginTop: '0.65rem', width: '100%', justifyContent: 'center', padding: '0.55rem 1rem', fontSize: '0.85rem' }}
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            <Package size={14} />
            {cartAdded ? '✓ Added!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplyProductCard;
