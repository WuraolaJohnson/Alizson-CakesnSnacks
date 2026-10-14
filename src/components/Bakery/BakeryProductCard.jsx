import React from 'react';
import ProductCard from '../Common/ProductCard';

/** Bakery product card — see components/Common/ProductCard.jsx */
const BakeryProductCard = ({ product, compact }) => (
  <ProductCard product={product} store="bakery" compact={compact} />
);

export default BakeryProductCard;
