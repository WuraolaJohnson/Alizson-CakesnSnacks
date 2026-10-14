import React, { useState } from 'react';
import { Heart, ShoppingCart, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { RatingStars } from './RatingStars';

/**
 * Compact marketplace product card used by both stores.
 * Everything (wishlist, cart button, price) is always visible — hover only
 * adds emphasis — so it works the same on touch screens. Styles: shop.css.
 *
 * @param {object} product
 * @param {'bakery'|'supplies'} store
 * @param {boolean} [compact] - fixed-width version for horizontal rows
 */
const ProductCard = ({ product, store, compact = false }) => {
  const { toggleWishlist, wishlist, openProductModal, showToast } = useApp();
  const { addToBakeryCart, addToSuppliesCart } = useCart();
  const [cartAdded, setCartAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const isSupply = store === 'supplies';
  const isWishlisted = wishlist.includes(product.id);

  // Price and whether the shopper must pick options (size, flavour, variant)
  let price;
  let hasOptions;
  let priceVaries;
  if (isSupply) {
    const variants = product.variants?.length ? product.variants : [{ size: 'Standard', price: product.basePrice ?? product.price ?? 0 }];
    const prices = variants.map(v => Number(v.price) || 0);
    price = Math.min(...prices);
    hasOptions = variants.length > 1;
    priceVaries = new Set(prices).size > 1;
  } else {
    price = product.price ?? product.basePrice ?? 0;
    hasOptions = (product.sizes?.length || 0) > 1 || (product.flavours?.length || 0) > 1;
    priceVaries = (product.sizes?.length || 0) > 1;
  }

  const openDetails = () => openProductModal(isSupply ? { ...product, isSupply: true } : product);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!product.inStock) return;

    // Products with choices open the detail view so the shopper picks them
    if (hasOptions) {
      openDetails();
      return;
    }

    if (isSupply) {
      const variant = product.variants?.[0] || { size: 'Standard', price };
      addToSuppliesCart(product, { variant, quantity: 1 });
    } else {
      addToBakeryCart(product, {
        size: product.sizes?.[0],
        flavour: product.flavours?.[0] || 'Original',
        addOns: [],
        quantity: 1
      });
    }
    showToast?.(`${product.name} added to cart`, 'success');
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1600);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article
      className={`shop-card ${isSupply ? 'shop-card--supplies' : ''} ${compact ? 'shop-card--compact' : ''}`}
      onClick={openDetails}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') openDetails(); }}
      aria-label={`${product.name}, ₦${price.toLocaleString()}`}
    >
      <div className="shop-card__media">
        {imgFailed || !product.image ? (
          <div className="shop-card__placeholder" aria-hidden="true">{isSupply ? '🧁' : '🍰'}</div>
        ) : (
          <img src={product.image} alt={product.name} loading="lazy" onError={() => setImgFailed(true)} />
        )}

        {product.badge && <span className="shop-card__badge">{product.badge}</span>}

        <button
          type="button"
          className={`shop-card__wish ${isWishlisted ? 'is-active' : ''}`}
          onClick={handleWishlist}
          aria-pressed={isWishlisted}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {!product.inStock && <div className="shop-card__soldout">Out of stock</div>}
      </div>

      <div className="shop-card__body">
        <h3 className="shop-card__title">{product.name}</h3>

        {product.reviewsCount > 0 && (
          <div className="shop-card__rating">
            <RatingStars rating={product.rating} size={11} />
            <span>({product.reviewsCount})</span>
          </div>
        )}

        <div className="shop-card__footer">
          <div className="shop-card__price">
            {priceVaries && <span className="shop-card__from">From</span>}
            <span className="shop-card__currency">₦</span>
            <span className="shop-card__amount">{price.toLocaleString()}</span>
          </div>

          <button
            type="button"
            className={`shop-card__cart ${cartAdded ? 'is-added' : ''}`}
            onClick={handleAdd}
            disabled={!product.inStock}
            title={!product.inStock ? 'Out of stock' : hasOptions ? 'Choose options' : 'Add to cart'}
            aria-label={!product.inStock ? 'Out of stock' : hasOptions ? `Choose options for ${product.name}` : `Add ${product.name} to cart`}
          >
            {cartAdded ? <Check size={17} /> : <ShoppingCart size={17} />}
          </button>
        </div>

        {hasOptions && product.inStock && (
          <div className="shop-card__options">
            {isSupply ? `${product.variants.length} sizes` : 'Choose size & flavour'}
          </div>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
