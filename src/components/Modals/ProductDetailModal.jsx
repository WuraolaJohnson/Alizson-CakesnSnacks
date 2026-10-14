import React, { useState } from 'react';
import { X, Heart, ShoppingCart, ChevronLeft, ChevronRight, Minus, Plus, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { RatingStars } from '../Common/RatingStars';
import { StatusBadge } from '../Common/StatusBadge';

const ProductDetailModal = () => {
  const { isQuickViewOpen, selectedProductForModal, closeProductModal, toggleWishlist, wishlist, showToast } = useApp();
  const { addToBakeryCart, addToSuppliesCart } = useCart();

  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedFlavour, setSelectedFlavour] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [mixFlavors, setMixFlavors] = useState(['Red Velvet', 'Vanilla']);
  const [cartAdded, setCartAdded] = useState(false);

  const product = selectedProductForModal;
  const isSupply = product?.isSupply || product?.store === 'supplies';

  if (!isQuickViewOpen || !product) return null;

  const isWishlisted = wishlist.includes(product.id);
  const gallery = product.gallery?.length ? product.gallery : [product.image];

  const initSize = product.sizes?.[0] || null;
  const initFlavour = product.flavours?.[0] || null;
  const initVariant = product.variants?.[0] || null;
  const activeSize = selectedSize ?? initSize;
  const activeFlavour = selectedFlavour ?? initFlavour;
  const activeVariant = selectedVariant ?? initVariant;

  // Dynamic Price Calculation
  const calculatePrice = () => {
    if (isSupply) {
      return (activeVariant?.price || product.basePrice || product.price || 0) * quantity;
    }
    const basePrice = product.price || 0;
    const sizeMultiplier = activeSize?.priceMultiplier || 1.0;
    const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + (a.price || 0), 0);
    return Math.round((basePrice * sizeMultiplier) + addOnsTotal) * quantity;
  };

  const toggleAddOn = (addOn) => {
    setSelectedAddOns(prev => {
      const exists = prev.find(a => a.id === addOn.id);
      if (exists) return prev.filter(a => a.id !== addOn.id);
      return [...prev, addOn];
    });
  };

  const toggleMixFlavor = (flv) => {
    setMixFlavors(prev => {
      if (prev.includes(flv)) {
        return prev.filter(f => f !== flv);
      } else {
        return [...prev, flv];
      }
    });
  };

  const handleAddToCart = () => {
    if (isSupply) {
      addToSuppliesCart(product, { variant: activeVariant, quantity });
    } else {
      let finalFlavour = activeFlavour;
      if (activeFlavour?.includes('Mix')) {
        if (mixFlavors.length < 2) {
          showToast('Please select 2 or more flavors for Mix & Match!', 'warning');
          return;
        }
        finalFlavour = `Mix & Match (${mixFlavors.join(' + ')})`;
      }

      addToBakeryCart(product, {
        size: activeSize,
        flavour: finalFlavour,
        addOns: selectedAddOns,
        customMessage,
        quantity
      });
    }
    setCartAdded(true);
    setTimeout(() => { setCartAdded(false); closeProductModal(); }, 1800);
  };

  return (
    <div className="modal-backdrop" onClick={closeProductModal}>
      <div className="modal-card modal-card-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Close Button */}
        <button onClick={closeProductModal} style={{
          position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--charcoal-100)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--charcoal-700)'
        }}>
          <X size={16} />
        </button>

        <div className="product-detail-grid" style={{ overflowY: 'auto' }}>
          {/* Left — Image Gallery */}
          <div style={{ background: 'var(--cream-100)', padding: '1.25rem' }}>
            <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: 'var(--radius-lg)', background: 'var(--cream-200)' }}>
              <img src={gallery[activeImg]} alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {gallery.length > 1 && (
                <>
                  <button onClick={() => setActiveImg(p => (p - 1 + gallery.length) % gallery.length)}
                    style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setActiveImg(p => (p + 1) % gallery.length)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto' }}>
                {gallery.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} style={{
                    flexShrink: 0, width: 60, height: 60, borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden', border: `2px solid ${activeImg === i ? 'var(--gold-500)' : 'transparent'}`,
                    cursor: 'pointer', padding: 0, background: 'none'
                  }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Details */}
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <StatusBadge status={product.store || 'bakery'} type="store" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{product.category}</span>
                {product.badge && <span className={`badge badge-gold`}>{product.badge}</span>}
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.2rem, 2vw, 1.6rem)', fontWeight: 700, color: 'var(--charcoal-900)', margin: '0 0 0.35rem' }}>
                {product.name}
              </h2>
              {product.brand && (
                <div style={{ fontSize: '0.85rem', color: 'var(--burgundy-700)', fontWeight: 700, marginBottom: '0.35rem' }}>by {product.brand}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <RatingStars rating={product.rating} count={product.reviewsCount} size={15} />
              </div>
              {product.packQuantity > 1 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="badge badge-gold" style={{ fontSize: '0.8rem' }}>
                    🥐 Pack Size: {product.packQuantity} pieces ({product.packLabel || `${product.packQuantity} pcs per pack`})
                  </span>
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              {product.description}
            </p>

            {/* Size Selector (Bakery) */}
            {!isSupply && product.sizes && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--charcoal-800)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Size</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {product.sizes.map((s, i) => (
                    <button key={i} onClick={() => setSelectedSize(s)} style={{
                      padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                      border: `1.5px solid ${activeSize?.name === s.name ? 'var(--gold-500)' : 'var(--cream-300)'}`,
                      background: activeSize?.name === s.name ? 'var(--gold-50)' : 'transparent',
                      color: activeSize?.name === s.name ? 'var(--gold-700)' : 'var(--charcoal-700)',
                      fontSize: '0.825rem', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', transition: 'all 0.15s'
                    }}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Flavour Selector */}
            {!isSupply && product.flavours && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Flavour</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: activeFlavour?.includes('Mix') ? '0.75rem' : 0 }}>
                  {product.flavours.map((f, i) => (
                    <button key={i} onClick={() => setSelectedFlavour(f)} style={{
                      padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                      border: `1.5px solid ${activeFlavour === f ? 'var(--burgundy-700)' : 'var(--cream-300)'}`,
                      background: activeFlavour === f ? 'var(--burgundy-100)' : 'transparent',
                      color: activeFlavour === f ? 'var(--burgundy-800)' : 'var(--text-secondary)',
                      fontSize: '0.825rem', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', transition: 'all 0.15s'
                    }}>
                      {f}
                    </button>
                  ))}
                </div>

                {/* If Mix & Match selected, allow selecting 2 or more flavors */}
                {activeFlavour?.includes('Mix') && (
                  <div style={{ padding: '0.85rem 1rem', background: 'var(--cream-100)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-300)', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gold-900)', marginBottom: '0.5rem' }}>
                      🍰 Select 2 or more flavors for your Mix & Match Parfait:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                      {(product.flavorOptions || ['Red Velvet', 'Vanilla', 'Chocolate']).map(flv => {
                        const isSelected = mixFlavors.includes(flv);
                        return (
                          <button
                            key={flv}
                            type="button"
                            onClick={() => toggleMixFlavor(flv)}
                            style={{
                              padding: '0.35rem 0.85rem',
                              borderRadius: 'var(--radius-sm)',
                              border: `1.5px solid ${isSelected ? 'var(--gold-500)' : 'var(--cream-300)'}`,
                              background: isSelected ? 'var(--gold-500)' : 'var(--bg-surface)',
                              color: isSelected ? 'white' : 'var(--text-primary)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'all 0.15s'
                            }}
                          >
                            {isSelected ? '✓ ' : '+ '} {flv}
                          </button>
                        );
                      })}
                    </div>
                    {mixFlavors.length < 2 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--status-danger)', fontWeight: 700, marginTop: '0.4rem' }}>
                        ⚠️ Select at least 2 flavors (Currently selected: {mixFlavors.length})
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Variant Selector (Supply) */}
            {isSupply && product.variants && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--charcoal-800)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Size / Weight</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {product.variants.map((v, i) => (
                    <button key={i} onClick={() => setSelectedVariant(v)} style={{
                      padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                      border: `1.5px solid ${activeVariant?.size === v.size ? 'var(--burgundy-700)' : 'var(--cream-300)'}`,
                      background: activeVariant?.size === v.size ? 'var(--burgundy-100)' : 'transparent',
                      color: activeVariant?.size === v.size ? 'var(--burgundy-800)' : 'var(--charcoal-700)',
                      fontSize: '0.825rem', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                      whiteSpace: 'nowrap'
                    }}>
                      {v.size} — ₦{v.price.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add-Ons */}
            {!isSupply && product.availableAddOns?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--charcoal-800)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add-Ons & Extras</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {product.availableAddOns.map(addon => {
                    const selected = selectedAddOns.find(a => a.id === addon.id);
                    return (
                      <button key={addon.id} onClick={() => toggleAddOn(addon)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: '0.75rem', padding: '0.6rem 0.85rem',
                        border: `1.5px solid ${selected ? 'var(--gold-500)' : 'var(--cream-300)'}`,
                        borderRadius: 'var(--radius-md)', background: selected ? 'var(--gold-50)' : 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', fontFamily: 'var(--font-sans)'
                      }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: selected ? 'var(--gold-800)' : 'var(--charcoal-700)' }}>{addon.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--gold-600)' }}>+₦{addon.price.toLocaleString()}</span>
                          {selected && <Check size={15} style={{ color: 'var(--gold-600)' }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Message */}
            {!isSupply && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--charcoal-800)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Custom Message / Inscription (Optional)
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  maxLength={60}
                  placeholder='e.g., "Happy Birthday Chidi! 🎂"'
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>{customMessage.length}/60</div>
              </div>
            )}

            {/* Quantity & Price */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', padding: '1rem', background: 'var(--cream-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-200)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Quantity</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--cream-300)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Minus size={14} />
                  </button>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: '2rem', textAlign: 'center' }}>{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--cream-300)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Total Price</div>
                <span className="price-tag" style={{ fontSize: '1.6rem' }}>
                  <span className="price-currency">₦</span>
                  {calculatePrice().toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className={`btn ${cartAdded ? 'btn-dark' : isSupply ? 'btn-burgundy' : 'btn-primary'} btn-lg`}
                style={{ flex: 1, justifyContent: 'center', minWidth: '160px' }}
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingCart size={18} />
                {cartAdded ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className="btn btn-outline"
                style={{ padding: '0.75rem 1rem', color: isWishlisted ? 'var(--burgundy-700)' : undefined, borderColor: isWishlisted ? 'var(--burgundy-500)' : undefined }}
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                {isWishlisted ? 'Saved' : 'Save'}
              </button>
            </div>

            {/* Ingredients / Specs */}
            {product.ingredients && (
              <div style={{ padding: '0.85rem', background: 'var(--cream-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-200)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--charcoal-800)' }}>Ingredients: </strong>{product.ingredients}
              </div>
            )}

            {product.prepTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--status-success)' }}>
                <span>⏰</span> {product.prepTime}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
