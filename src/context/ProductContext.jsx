import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { initialBakeryProducts } from '../data/bakeryProducts';
import { initialSupplyProducts } from '../data/supplyProducts';
import { isFirebaseReady } from '../lib/firebase';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { subscribeCategories, saveCategoriesInDb } from '../services/settingsService';
import {
  subscribeToProducts, upsertProduct, updateProduct as updateProductInDb,
  deleteProduct as deleteProductInDb
} from '../services/productService';

const ProductContext = createContext();

// Offline / dev mode only (no Firebase): keep the catalogue in this browser
const OFFLINE_KEY = 'cz_products_offline';
const loadOffline = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(OFFLINE_KEY) || 'null');
    if (Array.isArray(saved)) return saved;
  } catch { /* ignore */ }
  return [...initialBakeryProducts, ...initialSupplyProducts];
};

export const ProductProvider = ({ children }) => {
  const online = isFirebaseReady();
  // Firestore is the single source of truth; every open page gets live updates
  const [products, setProducts] = useState(() => (online ? [] : loadOffline()));
  const [productsLoading, setProductsLoading] = useState(online);

  // Category lists the admin manages; starter lists until she saves her own
  const [categories, setCategories] = useState(() => {
    if (online) return DEFAULT_CATEGORIES;
    try { return JSON.parse(localStorage.getItem('cz_categories_offline')) || DEFAULT_CATEGORIES; }
    catch { return DEFAULT_CATEGORIES; }
  });

  useEffect(() => {
    if (!online) return undefined;
    return subscribeCategories(value => { if (value) setCategories({ ...DEFAULT_CATEGORIES, ...value }); });
  }, [online]);

  useEffect(() => {
    if (!online) return undefined;
    return subscribeToProducts(
      list => { setProducts(list); setProductsLoading(false); },
      () => setProductsLoading(false)
    );
  }, [online]);

  useEffect(() => {
    if (!online) localStorage.setItem(OFFLINE_KEY, JSON.stringify(products));
  }, [online, products]);

  // Admin sees everything; the stores leave out products hidden as drafts
  const allBakeryProducts = products.filter(p => p.store === 'bakery');
  const allSupplyProducts = products.filter(p => p.store === 'supplies');
  const bakeryProducts = allBakeryProducts.filter(p => !p.hidden);
  const supplyProducts = allSupplyProducts.filter(p => !p.hidden);

  // Helper to resolve store & productId regardless of argument order
  const resolveStoreAndId = (arg1, arg2) => {
    if (arg1 === 'bakery' || arg1 === 'supplies') {
      return { store: arg1, id: arg2 };
    }
    return { store: arg2 || 'bakery', id: arg1 };
  };

  // Each write updates the screen at once, then saves; resolves to { error }
  const applyLocal = (fn) => setProducts(prev => fn(prev));

  const updateProduct = useCallback(async (arg1, arg2, changes) => {
    const { id } = resolveStoreAndId(arg1, arg2);
    applyLocal(prev => prev.map(p => (p.id === id ? { ...p, ...changes } : p)));
    return updateProductInDb(id, changes);
  }, []);

  // Toggle in-stock availability (used by admin)
  const toggleAvailability = useCallback((arg1, arg2) => {
    const { id } = resolveStoreAndId(arg1, arg2);
    const current = products.find(p => p.id === id);
    if (!current) return Promise.resolve({ error: null });
    return updateProduct(id, undefined, { inStock: !current.inStock });
  }, [products, updateProduct]);

  /**
   * Takes paid order items out of stock. Options with a stock count go down
   * by themselves; otherwise the product's own count does. Products with no
   * count are left alone. Anything that reaches 0 is marked out of stock.
   */
  const deductStock = useCallback(async (items = []) => {
    const ids = [...new Set(items.map(i => i.id))];
    await Promise.all(ids.map(id => {
      const product = products.find(p => p.id === id);
      if (!product) return null;
      const variants = product.variants?.map(v => ({ ...v }));
      let looseUnits = 0;
      items.filter(i => i.id === id).forEach(item => {
        const variant = variants?.find(v => v.size === item.size && typeof v.stock === 'number');
        if (variant) variant.stock = Math.max(0, variant.stock - (item.quantity || 1));
        else looseUnits += item.quantity || 1;
      });
      const changes = {};
      if (variants?.some((v, i) => v.stock !== product.variants[i].stock)) changes.variants = variants;
      if (looseUnits && typeof product.stockQuantity === 'number') {
        changes.stockQuantity = Math.max(0, product.stockQuantity - looseUnits);
      }
      if (!Object.keys(changes).length) return null;
      if (totalStock({ ...product, ...changes }) === 0) changes.inStock = false;
      return updateProduct(id, undefined, changes);
    }));
  }, [products, updateProduct]);

  /**
   * Saves one store's category list. `renames` ({ from, to }) also moves the
   * products in a renamed category, so none are left in a name that's gone.
   */
  const saveCategories = useCallback(async (store, list, renames = []) => {
    const next = { ...categories, [store]: list };
    setCategories(next);
    if (!online) localStorage.setItem('cz_categories_offline', JSON.stringify(next));
    const { error } = await saveCategoriesInDb(next);
    if (error) return { error };
    const moves = renames.flatMap(({ from, to }) =>
      products.filter(p => p.store === store && p.category === from).map(p => updateProduct(p.id, undefined, { category: to })));
    const failed = (await Promise.all(moves)).filter(r => r?.error);
    return { error: failed.length ? `${failed.length} products could not be moved to the new name.` : null };
  }, [categories, online, products, updateProduct]);

  const addProduct = useCallback(async (arg1, arg2) => {
    const store = (arg1 === 'bakery' || arg1 === 'supplies') ? arg1 : (arg2?.store || 'bakery');
    const product = (arg1 === 'bakery' || arg1 === 'supplies') ? arg2 : arg1;
    const newProduct = {
      ...product,
      store,
      id: product.id || `prod_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    applyLocal(prev => [newProduct, ...prev]);
    return upsertProduct(newProduct);
  }, []);

  const deleteProduct = useCallback(async (arg1, arg2) => {
    const { id } = resolveStoreAndId(arg1, arg2);
    applyLocal(prev => prev.filter(p => p.id !== id));
    return deleteProductInDb(id);
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
        allBakeryProducts,
        allSupplyProducts,
        productsLoading,
        deductStock,
        categories,
        saveCategories,
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

/** Units left (options added up), or null when stock isn't being counted. */
export function totalStock(product) {
  const counted = (product.variants || []).filter(v => typeof v.stock === 'number');
  if (counted.length) return counted.reduce((sum, v) => sum + v.stock, 0);
  return typeof product.stockQuantity === 'number' ? product.stockQuantity : null;
}

export const LOW_STOCK_AT = 5;
