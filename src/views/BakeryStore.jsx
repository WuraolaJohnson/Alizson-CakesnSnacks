import React from 'react';
import { useProducts } from '../context/ProductContext';
import StorePage from '../components/Common/StorePage';
import { categoryEmojiMap } from '../data/categories';


// Cheapest option if the admin set options; otherwise the base price
// (larger sizes cost more — see the product's size multipliers)
const priceOf = p => p.variants?.length
  ? Math.min(...p.variants.map(v => Number(v.price) || 0))
  : Number(p.price ?? p.basePrice ?? 0);

const BakeryStore = () => {
  const { bakeryProducts, categories } = useProducts();
  return (
    <StorePage
      store="bakery"
      products={bakeryProducts}
      title="🍰 Alizson Bakery"
      subtitle="Celebration cakes, cupcakes, pastries and snacks — baked fresh daily in Abeokuta."
      categoryEmojis={categoryEmojiMap(categories.bakery)}
      priceOf={priceOf}
    />
  );
};

export default BakeryStore;
