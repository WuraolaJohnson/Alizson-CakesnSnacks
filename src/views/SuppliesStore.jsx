import React from 'react';
import { useProducts } from '../context/ProductContext';
import StorePage from '../components/Common/StorePage';
import { categoryEmojiMap } from '../data/categories';


// Cheapest variant, matching the "From ₦…" price on the card
const priceOf = p => {
  const prices = (p.variants || []).map(v => Number(v.price) || 0);
  return prices.length ? Math.min(...prices) : Number(p.basePrice ?? p.price ?? 0);
};

const SuppliesStore = () => {
  const { supplyProducts, categories } = useProducts();
  return (
    <StorePage
      store="supplies"
      products={supplyProducts}
      title="🧁 Alizson Baking Supplies"
      subtitle="Ingredients, decorations, packaging and professional tools — delivered across Ogun State."
      categoryEmojis={categoryEmojiMap(categories.supplies)}
      priceOf={priceOf}
    />
  );
};

export default SuppliesStore;
