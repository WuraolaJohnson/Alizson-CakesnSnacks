import React from 'react';
import { useProducts } from '../context/ProductContext';
import StorePage from '../components/Common/StorePage';

const CATEGORY_EMOJIS = {
  All: '🛍️', 'Dry Ingredients': '🌾', 'Wet Ingredients': '🥛', Decorations: '🎨', Packaging: '📦', Tools: '🔧'
};

// Cheapest variant, matching the "From ₦…" price on the card
const priceOf = p => {
  const prices = (p.variants || []).map(v => Number(v.price) || 0);
  return prices.length ? Math.min(...prices) : Number(p.basePrice ?? p.price ?? 0);
};

const SuppliesStore = () => {
  const { supplyProducts } = useProducts();
  return (
    <StorePage
      store="supplies"
      products={supplyProducts}
      title="🧁 Alizson Baking Supplies"
      subtitle="Ingredients, decorations, packaging and professional tools — delivered across Ogun State."
      categoryEmojis={CATEGORY_EMOJIS}
      priceOf={priceOf}
    />
  );
};

export default SuppliesStore;
