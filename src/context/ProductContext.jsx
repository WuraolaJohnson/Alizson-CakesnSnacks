import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { initialBakeryProducts } from '../data/bakeryProducts';
import { initialSupplyProducts } from '../data/supplyProducts';
import { seedAllProducts, updateProduct as updateProductInDb, deleteProduct as deleteProductInDb, upsertProduct } from '../services/productService';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [bakeryProducts, setBakeryProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('cz_bakery_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length < initialBakeryProducts.length) {
          localStorage.setItem('cz_bakery_products', JSON.stringify(initialBakeryProducts));
          return initialBakeryProducts;
        }
        return parsed;
      }
      return initialBakeryProducts;
    } catch { return initialBakeryProducts; }
  });

  const [supplyProducts, setSupplyProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('cz_supply_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length !== initialSupplyProducts.length) {
          localStorage.setItem('cz_supply_products', JSON.stringify(initialSupplyProducts));
          return initialSupplyProducts;
        }
        return parsed;
      }
      return initialSupplyProducts;
    } catch { return initialSupplyProducts; }
  });

  // Helper to resolve store & productId regardless of argument order
  const resolveStoreAndId = (arg1, arg2) => {
    if (arg1 === 'bakery' || arg1 === 'supplies') {
      return { store: arg1, id: arg2 };
    }
    return { store: arg2 || 'bakery', id: arg1 };
  };

  // Toggle in-stock availability (used by admin)
  const toggleAvailability = useCallback((arg1, arg2) => {
    const { store, id } = resolveStoreAndId(arg1, arg2);
    if (store === 'bakery') {
      setBakeryProducts(prev => {
        const updated = prev.map(p =>
          p.id === id ? { ...p, inStock: !p.inStock } : p
        );
        localStorage.setItem('cz_bakery_products', JSON.stringify(updated));
        const changed = updated.find(p => p.id === id);
        if (changed) updateProductInDb(id, { inStock: changed.inStock }).catch(() => {});
        return updated;
      });
    } else {
      setSupplyProducts(prev => {
        const updated = prev.map(p =>
          p.id === id ? { ...p, inStock: !p.inStock } : p
        );
        localStorage.setItem('cz_supply_products', JSON.stringify(updated));
        const changed = updated.find(p => p.id === id);
        if (changed) updateProductInDb(id, { inStock: changed.inStock }).catch(() => {});
        return updated;
      });
    }
  }, []);

  // Update product (used by AdminProducts)
  const updateProduct = useCallback((arg1, arg2, changes) => {
    const { store, id } = resolveStoreAndId(arg1, arg2);
    if (store === 'bakery') {
      setBakeryProducts(prev => {
        const updated = prev.map(p =>
          p.id === id ? { ...p, ...changes } : p
        );
        localStorage.setItem('cz_bakery_products', JSON.stringify(updated));
        updateProductInDb(id, changes).catch(() => {});
        return updated;
      });
    } else {
      setSupplyProducts(prev => {
        const updated = prev.map(p =>
          p.id === id ? { ...p, ...changes } : p
        );
        localStorage.setItem('cz_supply_products', JSON.stringify(updated));
        updateProductInDb(id, changes).catch(() => {});
        return updated;
      });
    }
  }, []);

  // Add product
  const addProduct = useCallback((arg1, arg2) => {
    const store = (arg1 === 'bakery' || arg1 === 'supplies') ? arg1 : (arg2?.store || 'bakery');
    const product = (arg1 === 'bakery' || arg1 === 'supplies') ? arg2 : arg1;
    const pWithStore = { ...product, store, id: product.id || `prod_${Date.now()}` };

    if (store === 'bakery') {
      setBakeryProducts(prev => {
        const updated = [pWithStore, ...prev];
        localStorage.setItem('cz_bakery_products', JSON.stringify(updated));
        return updated;
      });
    } else {
      setSupplyProducts(prev => {
        const updated = [pWithStore, ...prev];
        localStorage.setItem('cz_supply_products', JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  // Delete product
  const deleteProduct = useCallback((arg1, arg2) => {
    const { store, id } = resolveStoreAndId(arg1, arg2);
    if (store === 'bakery') {
      setBakeryProducts(prev => {
        const updated = prev.filter(p => p.id !== id);
        localStorage.setItem('cz_bakery_products', JSON.stringify(updated));
        deleteProductInDb(id).catch(() => {});
        return updated;
      });
    } else {
      setSupplyProducts(prev => {
        const updated = prev.filter(p => p.id !== id);
        localStorage.setItem('cz_supply_products', JSON.stringify(updated));
        deleteProductInDb(id).catch(() => {});
        return updated;
      });
    }
  }, []);

  // Search across both product arrays
  const searchAllProducts = useCallback((query) => {
    const q = query.toLowerCase().trim();
    if (!q) return { bakery: [], supplies: [] };
    const match = (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.shortDescription?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q);
    return {
      bakery: bakeryProducts.filter(match),
      supplies: supplyProducts.filter(match),
    };
  }, [bakeryProducts, supplyProducts]);

  return (
    <ProductContext.Provider
      value={{
        bakeryProducts,
        supplyProducts,
        toggleAvailability,
        updateProduct,
        addProduct,
        deleteProduct,
        searchAllProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => useContext(ProductContext);
