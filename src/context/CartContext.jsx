import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { DEFAULT_GIFT_CONFIG } from '../data/giftOptions';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { showToast } = useApp();

  // Gift Configuration State
  const [giftConfig, setGiftConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('cz_gift_config');
      return saved ? JSON.parse(saved) : DEFAULT_GIFT_CONFIG;
    } catch {
      return DEFAULT_GIFT_CONFIG;
    }
  });

  useEffect(() => {
    localStorage.setItem('cz_gift_config', JSON.stringify(giftConfig));
  }, [giftConfig]);

  const updateGiftConfig = (updates) => {
    setGiftConfig(prev => ({
      ...prev,
      ...updates
    }));
  };

  const toggleGiftService = (enable) => {
    setGiftConfig(prev => ({
      ...prev,
      isGift: enable !== undefined ? enable : !prev.isGift
    }));
    if (enable !== false) {
      showToast('Personalized Gift Package enabled! 🎁', 'success');
    } else {
      showToast('Personalized Gift Package removed.', 'info');
    }
  };

  const clearGiftConfig = () => {
    setGiftConfig(DEFAULT_GIFT_CONFIG);
  };

  // Distinct Carts
  const [bakeryCart, setBakeryCart] = useState(() => {
    const saved = localStorage.getItem('cz_bakery_cart');
    return saved ? JSON.parse(saved) : [
      {
        cartItemId: 'bak_cart_1',
        id: 'bak-001',
        store: 'bakery',
        name: 'Chocolate Fudge Decadence Cake',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
        size: '8 inch (Feeds 12-16)',
        flavour: 'Belgian Chocolate',
        addOns: ['Extra Silk Frosting'],
        customMessage: 'Happy Birthday Grace!',
        unitPrice: 28325,
        quantity: 1
      }
    ];
  });

  const [suppliesCart, setSuppliesCart] = useState(() => {
    const saved = localStorage.getItem('cz_supplies_cart');
    return saved ? JSON.parse(saved) : [
      {
        cartItemId: 'sup_cart_1',
        id: 'sup-001',
        store: 'supplies',
        name: 'Premium Grass-Fed Bakery Butter',
        brand: 'Lurpak Artisan',
        image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80',
        size: '500g Block',
        unitPrice: 7500,
        quantity: 2
      }
    ];
  });

  // Active Cart Tab in Drawer/Page
  const [activeCartTab, setActiveCartTab] = useState('bakery'); // 'bakery' or 'supplies'

  useEffect(() => {
    localStorage.setItem('cz_bakery_cart', JSON.stringify(bakeryCart));
  }, [bakeryCart]);

  useEffect(() => {
    localStorage.setItem('cz_supplies_cart', JSON.stringify(suppliesCart));
  }, [suppliesCart]);

  // Add Bakery Product to Bakery Cart
  const addToBakeryCart = (product, config = {}) => {
    const sizeName = config.size?.name || product.sizes?.[0]?.name || 'Standard';
    const sizeMultiplier = config.size?.priceMultiplier || 1.0;
    const flavourName = config.flavour || product.flavours?.[0] || 'Original';
    const selectedAddOns = config.addOns || [];
    const customMessage = config.customMessage || '';
    const quantity = config.quantity || 1;

    // Calculate unit price: (basePrice * multiplier) + addOns sum
    const basePrice = product.price;
    const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + (item.price || 0), 0);
    const calculatedUnitPrice = Math.round((basePrice * sizeMultiplier) + addOnsTotal);

    const cartItemId = `bak_${product.id}_${Date.now()}`;

    const newCartItem = {
      cartItemId,
      id: product.id,
      store: 'bakery',
      name: product.name,
      image: product.image,
      size: sizeName,
      flavour: flavourName,
      addOns: selectedAddOns.map(a => a.name),
      customMessage: customMessage.trim(),
      unitPrice: calculatedUnitPrice,
      quantity
    };

    setBakeryCart(prev => [...prev, newCartItem]);
    showToast(`Added "${product.name}" to your Bakery Cart! 🍰`, 'success');
  };

  // Add Supply Product to Supplies Cart
  const addToSuppliesCart = (product, config = {}) => {
    const selectedVariant = config.variant || product.variants?.[0] || { size: 'Standard', price: product.basePrice || product.price };
    const quantity = config.quantity || 1;
    const unitPrice = selectedVariant.price;

    const existingIndex = suppliesCart.findIndex(
      item => item.id === product.id && item.size === selectedVariant.size
    );

    if (existingIndex > -1) {
      setSuppliesCart(prev => {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      });
      showToast(`Updated quantity for "${product.name}" in Supplies Cart! 🧁`, 'success');
    } else {
      const cartItemId = `sup_${product.id}_${Date.now()}`;
      const newCartItem = {
        cartItemId,
        id: product.id,
        store: 'supplies',
        name: product.name,
        brand: product.brand || 'Alizson Supplies',
        image: product.image,
        size: selectedVariant.size,
        unitPrice,
        quantity
      };
      setSuppliesCart(prev => [...prev, newCartItem]);
      showToast(`Added "${product.name}" (${selectedVariant.size}) to Supplies Cart! 🧁`, 'success');
    }
  };

  const updateCartQuantity = (store, cartItemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(store, cartItemId);
      return;
    }
    if (store === 'bakery') {
      setBakeryCart(prev => prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity: newQty } : item));
    } else {
      setSuppliesCart(prev => prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity: newQty } : item));
    }
  };

  const removeFromCart = (store, cartItemId) => {
    if (store === 'bakery') {
      setBakeryCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
      showToast('Item removed from Bakery Cart.', 'info');
    } else {
      setSuppliesCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
      showToast('Item removed from Supplies Cart.', 'info');
    }
  };

  const clearCart = (store) => {
    if (store === 'bakery') {
      setBakeryCart([]);
    } else if (store === 'supplies') {
      setSuppliesCart([]);
    }
  };

  // Calculations
  const bakerySubtotal = bakeryCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const suppliesSubtotal = suppliesCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  const bakeryItemsCount = bakeryCart.reduce((count, item) => count + item.quantity, 0);
  const suppliesItemsCount = suppliesCart.reduce((count, item) => count + item.quantity, 0);
  const totalItemsCount = bakeryItemsCount + suppliesItemsCount;

  // Gift Fees
  const giftPackagingFee = giftConfig.isGift && giftConfig.packaging ? (giftConfig.packaging.price || 0) : 0;
  const giftCardFee = giftConfig.isGift && giftConfig.card ? (giftConfig.card.price || 0) : 0;
  const totalGiftFee = giftPackagingFee + giftCardFee;

  return (
    <CartContext.Provider
      value={{
        bakeryCart,
        suppliesCart,
        addToBakeryCart,
        addToSuppliesCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        bakerySubtotal,
        suppliesSubtotal,
        bakeryItemsCount,
        suppliesItemsCount,
        totalItemsCount,
        activeCartTab,
        setActiveCartTab,
        // Gift Service Exports
        giftConfig,
        updateGiftConfig,
        toggleGiftService,
        clearGiftConfig,
        giftPackagingFee,
        giftCardFee,
        totalGiftFee
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
