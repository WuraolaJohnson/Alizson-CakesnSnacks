/**
 * productService.js
 * ──────────────────────────────────────────────────────────────
 * CRUD operations for products against Supabase.
 * Falls back to the local static data arrays when Supabase is
 * not configured (i.e. during offline / development mode).
 */

import { supabase, isSupabaseReady } from '../lib/supabase';
import { initialBakeryProducts } from '../data/bakeryProducts';
import { initialSupplyProducts } from '../data/supplyProducts';

// ── Helpers ───────────────────────────────────────────────────

/** Map snake_case DB row → camelCase app object */
function dbToProduct(row) {
  return {
    id:                row.id,
    store:             row.store,
    name:              row.name,
    slug:              row.slug,
    category:          row.category,
    price:             Number(row.price) || 0,
    rating:            Number(row.rating) || 0,
    reviewsCount:      row.reviews_count || 0,
    badge:             row.badge,
    shortDescription:  row.short_description,
    description:       row.description,
    image:             row.image,
    gallery:           row.gallery || [],
    sku:               row.sku,
    inStock:           row.in_stock !== false,
    stockQuantity:     row.stock_quantity || 0,
    sizes:             row.sizes || [],
    flavours:          row.flavours || [],
    availableAddOns:   row.available_add_ons || [],
    ingredients:       row.ingredients,
    prepTime:          row.prep_time,
    dietary:           row.dietary || [],
    brand:             row.brand,
    weight:            row.weight,
    dimensions:        row.dimensions,
    material:          row.material,
    createdAt:         row.created_at,
    updatedAt:         row.updated_at
  };
}

/** Map camelCase app object → snake_case DB row */
function productToDb(product) {
  return {
    id:                 product.id,
    store:              product.store,
    name:               product.name,
    slug:               product.slug,
    category:           product.category,
    price:              product.price,
    rating:             product.rating,
    reviews_count:      product.reviewsCount,
    badge:              product.badge,
    short_description:  product.shortDescription,
    description:        product.description,
    image:              product.image,
    gallery:            product.gallery,
    sku:                product.sku,
    in_stock:           product.inStock !== false,
    stock_quantity:     product.stockQuantity,
    sizes:              product.sizes,
    flavours:           product.flavours,
    available_add_ons:  product.availableAddOns,
    ingredients:        product.ingredients,
    prep_time:          product.prepTime,
    dietary:            product.dietary,
    brand:              product.brand,
    weight:             product.weight,
    dimensions:         product.dimensions,
    material:           product.material,
    updated_at:         new Date().toISOString()
  };
}

// ── Fetch Products ────────────────────────────────────────────

/** Fetch all products for a given store ('bakery' | 'supplies') */
export async function fetchProducts(store) {
  if (!isSupabaseReady()) {
    // Offline: return static local data
    const data = store === 'bakery' ? initialBakeryProducts : initialSupplyProducts;
    return { products: data, error: null };
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store', store)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[productService] fetchProducts error:', error);
    // Fallback to static data on error
    const fallback = store === 'bakery' ? initialBakeryProducts : initialSupplyProducts;
    return { products: fallback, error: error.message };
  }

  // If no products seeded yet, seed from local data
  if (!data || data.length === 0) {
    await seedProducts(store);
    const fallback = store === 'bakery' ? initialBakeryProducts : initialSupplyProducts;
    return { products: fallback, error: null };
  }

  return { products: data.map(dbToProduct), error: null };
}

/** Seed products from local data arrays into Supabase (one-time setup) */
export async function seedProducts(store) {
  if (!isSupabaseReady()) return { error: 'Supabase not configured' };

  const source = store === 'bakery' ? initialBakeryProducts : initialSupplyProducts;

  const rows = source.map(productToDb);

  const { error } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('[productService] seedProducts error:', error);
  }
  return { error: error?.message || null };
}

/** Seed ALL products (bakery + supplies) */
export async function seedAllProducts() {
  await seedProducts('bakery');
  await seedProducts('supplies');
}

// ── Upsert / Update ───────────────────────────────────────────

export async function upsertProduct(product) {
  if (!isSupabaseReady()) return { product, error: null };

  const row = productToDb(product);
  const { data, error } = await supabase
    .from('products')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { product: null, error: error.message };
  return { product: dbToProduct(data), error: null };
}

export async function updateProduct(productId, changes) {
  if (!isSupabaseReady()) return { error: null };

  // Map camelCase to snake_case
  const dbChanges = {};
  if (changes.name !== undefined)             dbChanges.name = changes.name;
  if (changes.price !== undefined)            dbChanges.price = changes.price;
  if (changes.inStock !== undefined)          dbChanges.in_stock = changes.inStock;
  if (changes.stockQuantity !== undefined)    dbChanges.stock_quantity = changes.stockQuantity;
  if (changes.shortDescription !== undefined) dbChanges.short_description = changes.shortDescription;
  if (changes.description !== undefined)      dbChanges.description = changes.description;
  if (changes.image !== undefined)            dbChanges.image = changes.image;
  if (changes.gallery !== undefined)          dbChanges.gallery = changes.gallery;
  if (changes.badge !== undefined)            dbChanges.badge = changes.badge;
  if (changes.rating !== undefined)           dbChanges.rating = changes.rating;
  if (changes.reviewsCount !== undefined)     dbChanges.reviews_count = changes.reviewsCount;
  if (changes.sizes !== undefined)            dbChanges.sizes = changes.sizes;
  if (changes.flavours !== undefined)         dbChanges.flavours = changes.flavours;
  if (changes.availableAddOns !== undefined)  dbChanges.available_add_ons = changes.availableAddOns;
  dbChanges.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('products')
    .update(dbChanges)
    .eq('id', productId);

  return { error: error?.message || null };
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteProduct(productId) {
  if (!isSupabaseReady()) return { error: null };

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  return { error: error?.message || null };
}

// ── Search ────────────────────────────────────────────────────

export async function searchProducts(query) {
  if (!isSupabaseReady()) {
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

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,category.ilike.%${query}%,short_description.ilike.%${query}%,brand.ilike.%${query}%`);

  if (error) return { bakery: [], supplies: [], error: error.message };

  const products = data.map(dbToProduct);
  return {
    bakery:   products.filter(p => p.store === 'bakery'),
    supplies: products.filter(p => p.store === 'supplies'),
    error: null
  };
}
