import React, { useState } from 'react';
import { Heart, ShoppingCart, Star, Eye, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { RatingStars } from '../Common/RatingStars';
import { StatusBadge } from '../Common/StatusBadge';

const BakeryProductCard = ({ product }) => {
  const { toggleWishlist, wishlist, openProductModal } = useApp();
  const { addToBakeryCart } = useCart();
  const [hovered, setHovered] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  const isWishlisted = wishlist.includes(product.id);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToBakeryCart(product, {
      size: product.sizes?.[0],
      flavour: product.flavours?.[0] || 'Original',
      addOns: [],
      quantity: 1
    });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1800);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div
      className="card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => openProductModal(product)}
      style={{
        cursor: 'pointer',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-xl)' : 'var(--shadow-sm)',
        borderColor: hovered ? 'var(--gold-300)' : 'var(--cream-200)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', aspectRatio: '4/3', background: 'var(--cream-100)' }}>
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: hovered ? 'scale(1.07)' : 'scale(1)',
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          loading="lazy"
        />

        {/* Badge */}
        {product.badge && (
          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
            <span className={`badge ${product.badge === 'Bestseller' ? 'badge-gold' : product.badge === 'Special Offers' ? 'badge-burgundy' : 'badge-success'}`}>
              {product.badge === 'Bestseller' ? '🏆' : product.badge === 'Special Offers' ? '⭐' : '✨'} {product.badge}
            </span>
          </div>
        )}

        {/* Stock */}
        {!product.inStock && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(26,23,21,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="badge badge-danger" style={{ fontSize: '0.85rem' }}>Out of Stock</span>
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          style={{
            position: 'absolute', top: '0.75rem', right: '0.75rem',
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--bg-surface)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
            transform: hovered ? 'scale(1)' : 'scale(0)',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            color: isWishlisted ? 'var(--burgundy-700)' : 'var(--charcoal-400)'
          }}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Quick View */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          padding: '0.5rem',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.25s ease'
        }}>
          <button style={{
            background: 'rgba(26,23,21,0.85)',
            backdropFilter: 'blur(4px)',
            border: 'none', borderRadius: 'var(--radius-full)',
            padding: '0.45rem 1.1rem',
            color: 'white', fontSize: '0.8rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontFamily: 'var(--font-sans)'
          }}>
            <Eye size={13} /> Quick View
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
          {product.category}
        </div>

        <h3 style={{
          fontFamily: 'var(--font-sans)', fontWeight: 700,
          fontSize: '0.975rem', color: 'var(--text-primary)',
          lineHeight: 1.3, marginBottom: '0.4rem',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {product.name}
        </h3>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '0.6rem',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {product.shortDescription}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <RatingStars rating={product.rating} size={13} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({product.reviewsCount})</span>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div>
              <span className="price-tag">
                <span className="price-currency">₦</span>
                {(product?.price ?? product?.basePrice ?? 0).toLocaleString()}
              </span>
              {product?.packQuantity > 1 && (
                <span style={{ fontSize: '0.72rem', color: 'var(--gold-700)', fontWeight: 700, marginLeft: '0.35rem' }}>
                  ({product.packQuantity} pcs per pack)
                </span>
              )}
            </div>
            {product?.sizes && product.sizes.length > 1 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>+ sizes</span>
            )}
          </div>

          <button
            className={`btn ${cartAdded ? 'btn-dark' : 'btn-primary'} w-full`}
            style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center', padding: '0.6rem 1rem', fontSize: '0.875rem' }}
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            <ShoppingCart size={15} />
            {cartAdded ? '✓ Added!' : product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BakeryProductCard;
