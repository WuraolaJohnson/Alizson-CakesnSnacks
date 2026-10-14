import React from 'react';
import { useProducts } from '../context/ProductContext';
import StorePage from '../components/Common/StorePage';

const CATEGORY_EMOJIS = {
  All: '🛍️', Cakes: '🎂', Cupcakes: '🧁', Doughnuts: '🍩', Pastries: '🥐',
  Cookies: '🍪', Pies: '🥧', Bread: '🍞', Desserts: '🍮', 'Gift Boxes': '🎁', Snacks: '🥟'
};

// Base price; larger sizes cost more (see the product's size multipliers)
const priceOf = p => Number(p.price ?? p.basePrice ?? 0);

const BakeryStore = () => {
  const { bakeryProducts } = useProducts();
  return (
    <StorePage
      store="bakery"
      products={bakeryProducts}
      title="🍰 Alizson Bakery"
      subtitle="Celebration cakes, cupcakes, pastries and snacks — baked fresh daily in Abeokuta."
      categoryEmojis={CATEGORY_EMOJIS}
      priceOf={priceOf}
    />
  );
};

export default BakeryStore;
