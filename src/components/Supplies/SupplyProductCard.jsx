import React from 'react';
import ProductCard from '../Common/ProductCard';

/** Baking-supplies product card — see components/Common/ProductCard.jsx */
const SupplyProductCard = ({ product, compact }) => (
  <ProductCard product={product} store="supplies" compact={compact} />
);

export default SupplyProductCard;
