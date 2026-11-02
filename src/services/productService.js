/**
 * productService.js
 * ──────────────────────────────────────────────────────────────
 * CRUD operations for products in Firestore (`products` collection).
 * Falls back to the local static data arrays when Firebase is
 * not configured (i.e. during offline / development mode).
 */

import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, writeBatch, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';
import { initialBakeryProducts } from '../data/bakeryProducts';
import { initialSupplyProducts } from '../data/supplyProducts';

// ── Helpers ───────────────────────────────────────────────────

// Older documents were written with snake_case keys; new ones store the
// product exactly as the app uses it, so options, sets and supply variants
// are never dropped on save.
const LEGACY_KEYS = {
  reviews_count: 'reviewsCount', short_description: 'shortDescription',
  in_stock: 'inStock', stock_quantity: 'stockQuantity',
  available_add_ons: 'availableAddOns', prep_time: 'prepTime',
  created_at: 'createdAt', updated_at: 'updatedAt'
};

/** Firestore document → app product */
function dbToProduct(row) {
  const product = {};
  for (const [key, value] of Object.entries(row)) product[LEGACY_KEYS[key] || key] = value;
  return {
    ...product,
    price:        Number(product.price ?? product.basePrice) || 0,
    rating:       Number(product.rating) || 0,
    reviewsCount: product.reviewsCount || 0,
    inStock:      product.inStock !== false,
    gallery:      product.gallery || [],
    sizes:        product.sizes || [],
    flavours:     product.flavours || [],
    dietary:      product.dietary || []
  };
}

/** App product → Firestore document (undefined values dropped, even nested) */
function productToDb(product) {
  return JSON.parse(JSON.stringify({
    ...product,
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

const productsCol = () => collection(db, 'products');

// ── Fetch Products ────────────────────────────────────────────

/** Fetch all products for a given store ('bakery' | 'supplies') */
export async function fetchProducts(store) {
  if (!isFirebaseReady()) {
    // Offline: return static local data
    const data = store === 'bakery' ? initialBakeryProducts : initialSupplyProducts;
    return { products: data, error: null };
  }

  let data, error = null;
  try {
    const snap = await getDocs(query(productsCol(), where('store', '==', store)));
    data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .map(dbToProduct)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  } catch (err) {
    error = err;
  }

  if (error) {
    console.error('[productService] fetchProducts error:', error);
    // Fallback to static data on error
    const fallback = store === 'bakery' ? initialBakeryProducts : initialSupplyProducts;
    return { products: fallback, error: error.message };
  }

  return { products: data, error: null };
}

/** Seed products from local data arrays into Firestore (one-time setup) */
export async function seedProducts(store) {
  if (!isFirebaseReady()) return { error: 'Firebase not configured' };

  const source = store === 'bakery' ? initialBakeryProducts : initialSupplyProducts;

  const rows = source.map(productToDb);

  try {
    const batch = writeBatch(db);
    rows.forEach(row => batch.set(doc(db, 'products', String(row.id)), row, { merge: true }));
    await batch.commit();
    return { error: null };
  } catch (err) {
    console.error('[productService] seedProducts error:', err);
    return { error: err.message };
  }
}

/**
 * First-run setup: copies the starter catalogue into Firestore once (admin only).
 * A marker in store_settings stops it from ever running again, so products the
 * admin deletes stay deleted.
 */
export async function seedCatalogOnce() {
  if (!isFirebaseReady()) return;
  const marker = doc(db, 'store_settings', 'catalog');
  try {
    if ((await getDoc(marker)).exists()) return;
    if (!(await getDocs(productsCol())).empty) {
      await setDoc(marker, { seeded: true, at: new Date().toISOString() });
      return;
    }
    await seedProducts('bakery');
    await seedProducts('supplies');
    await setDoc(marker, { seeded: true, at: new Date().toISOString() });
  } catch (err) {
    console.error('[productService] seedCatalogOnce error:', err);
  }
}

// ── Upsert / Update ───────────────────────────────────────────

export async function upsertProduct(product) {
  if (!isFirebaseReady()) return { product, error: null };

  const row = productToDb(product);
  try {
    await setDoc(doc(db, 'products', String(row.id)), row);
    return { product: dbToProduct(row), error: null };
  } catch (err) {
    return { product: null, error: err.message };
  }
}

export async function updateProduct(productId, changes) {
  if (!isFirebaseReady()) return { error: null };
  try {
    await updateDoc(doc(db, 'products', String(productId)),
      JSON.parse(JSON.stringify({ ...changes, updatedAt: new Date().toISOString() })));
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

// ── Live updates ──────────────────────────────────────────────

/**
 * Calls onChange(products) now and whenever any product changes in Firestore,
 * so admin edits show on every open storefront. Returns the unsubscribe fn.
 */
export function subscribeToProducts(onChange, onError) {
  return onSnapshot(productsCol(),
    snap => onChange(snap.docs.map(d => dbToProduct({ id: d.id, ...d.data() }))),
    err => { console.error('[productService] subscribe error:', err); onError?.(err); });
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteProduct(productId) {
  if (!isFirebaseReady()) return { error: null };

  try {
    await deleteDoc(doc(db, 'products', String(productId)));
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

// ── Search ────────────────────────────────────────────────────

export async function searchProducts(query) {
  if (!isFirebaseReady()) {
    const q = query.toLowerCase();
    const matchFn = (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.shortDescription?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q);
    return {
      bakery: initialBakeryProducts.filter(matchFn),
      supplies: initialSupplyProducts.filter(matchFn),
      error: null
    };
  }

  // Firestore has no substring search; the catalogue is small, so filter here
  let products;
  try {
    const snap = await getDocs(productsCol());
    products = snap.docs.map(d => dbToProduct({ id: d.id, ...d.data() }));
  } catch (err) {
    return { bakery: [], supplies: [], error: err.message };
  }
  const q = query.toLowerCase();
  products = products.filter(p =>
    [p.name, p.category, p.shortDescription, p.brand].some(v => v?.toLowerCase().includes(q)));
  return {
    bakery:   products.filter(p => p.store === 'bakery'),
    supplies: products.filter(p => p.store === 'supplies'),
    error: null
  };
}
