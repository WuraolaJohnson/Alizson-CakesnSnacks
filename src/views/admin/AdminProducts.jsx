import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Search, Edit3, Trash2, Check, X, Filter,
  Cake, Package, Image as ImageIcon, Sparkles, Eye, AlertCircle, UploadCloud
} from 'lucide-react';
import { useProducts, totalStock, LOW_STOCK_AT } from '../../context/ProductContext';
import CategoriesModal from '../../components/Admin/CategoriesModal';
import BulkEditBar from '../../components/Admin/BulkEditBar';
import AddOnsEditor from '../../components/Admin/AddOnsEditor';
import { useApp } from '../../context/AppContext';
import { seedCatalogOnce } from '../../services/productService';
import { compressImage } from '../../utils/imageCompress';
import ProductOptionsEditor, { optionsToVariants, variantsToOptions } from '../../components/Admin/ProductOptionsEditor';

const AdminProducts = () => {
  const {
    allBakeryProducts: bakeryProducts,
    allSupplyProducts: supplyProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleAvailability,
    categories: categoryLists
  } = useProducts();
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const { showToast, openProductModal } = useApp();
  const [selectedIds, setSelectedIds] = useState([]);
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // First run only: put the starter catalogue in the database
  useEffect(() => { seedCatalogOnce(); }, []);

  const [activeStoreTab, setActiveStoreTab] = useState('bakery'); // 'bakery' or 'supplies'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State for Add / Edit
  const [form, setForm] = useState({
    name: '',
    category: 'Celebration Cakes',
    price: '',
    shortDescription: '',
    description: '',
    image: '',
    inStock: true,
    stockQuantity: '',
    hidden: false,
    mixFlavours: false,
    addOns: [],
    flavours: 'Belgian Chocolate, Vanilla Bean, Red Velvet',
    sizes: '6 inch (Feeds 6-8):1.0, 8 inch (Feeds 12-16):1.45, 10 inch (Feeds 20-25):1.9',
    packQuantity: 12,
    packLabel: '12 pieces',
    brand: '',
    options: { soldInSets: false, unitLabel: 'pieces', options: [] }
  });

  const handleLocalImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Shrunk so the product fits in the database
      const dataUrl = await compressImage(file);
      setForm(prev => ({ ...prev, image: dataUrl }));
      showToast('Picture added 📸', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const currentProducts = activeStoreTab === 'bakery' ? bakeryProducts : supplyProducts;

  // The list from "Manage categories" — the same one the store shows
  const categoryList = categoryLists[activeStoreTab].map(c => c.name);
  const categories = ['All', ...categoryList];

  const filteredProducts = currentProducts.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      category: categoryList[0] || '',
      price: '',
      shortDescription: '',
      description: '',
      image: '',
      inStock: true,
      stockQuantity: '',
      hidden: false,
      mixFlavours: false,
      addOns: [],
      flavours: 'Belgian Chocolate, Vanilla Bean, Red Velvet',
      sizes: '6 inch (Feeds 6-8):1.0, 8 inch (Feeds 12-16):1.45, 10 inch (Feeds 20-25):1.9',
      packQuantity: 12,
      packLabel: '12 pieces per box',
      brand: '',
      options: { soldInSets: false, unitLabel: 'pieces', options: [] }
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      category: product.category || categoryList[0] || '',
      price: product.price || product.basePrice || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      image: product.image || '',
      inStock: product.inStock !== false,
      stockQuantity: typeof product.stockQuantity === 'number' ? product.stockQuantity : '',
      hidden: !!product.hidden,
      mixFlavours: !!product.mixFlavours,
      addOns: (product.availableAddOns || []).map(a => ({ ...a, price: a.price ?? '' })),
      flavours: product.flavours ? product.flavours.join(', ') : '',
      sizes: product.sizes
        ? product.sizes.map(s => `${s.name}:${s.priceMultiplier || 1.0}`).join(', ')
        : '',
      packQuantity: product.packQuantity || 12,
      packLabel: product.packLabel || (product.packQuantity ? `${product.packQuantity} pieces` : '12 pieces per box'),
      brand: product.brand || '',
      options: {
        soldInSets: !!product.soldInSets,
        unitLabel: product.unitLabel || 'pieces',
        options: variantsToOptions(product.variants)
      }
    });
    setIsModalOpen(true);
  };

  /** Turns the form into a product, or shows what's missing and returns null. */
  const buildPayload = () => {
    const { soldInSets, unitLabel, options } = form.options;
    const variants = optionsToVariants(options, soldInSets);
    if (options.length !== variants.length) {
      showToast('Every option needs a name and a price (or remove the empty row).', 'error');
      return null;
    }
    // With options, the base price is the cheapest option
    const price = variants.length ? Math.min(...variants.map(v => v.price)) : parseFloat(form.price);
    if (!form.name || !price) {
      showToast('Please fill in required fields (Name and Price).', 'error');
      return null;
    }

    // Parse sizes
    let parsedSizes = [];
    if (form.sizes) {
      parsedSizes = form.sizes.split(',').map(item => {
        const [name, multiplier] = item.split(':');
        return {
          name: (name || 'Standard').trim(),
          priceMultiplier: parseFloat(multiplier) || 1.0
        };
      });
    }

    // Parse flavours
    const parsedFlavours = form.flavours
      ? form.flavours.split(',').map(f => f.trim()).filter(Boolean)
      : [];

    const isPastryCategory = form.category === 'Pastries & Tarts' || form.category.toLowerCase().includes('pastr');
    if (isPastryCategory && (!form.packQuantity || parseInt(form.packQuantity) < 1)) {
      showToast('Please specify the required Pack Quantity (e.g. 12 pieces) for Pastry products.', 'error');
      return null;
    }

    const addOns = form.addOns
      .filter(a => a.name.trim())
      .map((a, i) => ({ id: a.id || `addon_${Date.now()}_${i}`, name: a.name.trim(), price: Number(a.price) || 0 }));

    const productPayload = {
      name: form.name,
      category: form.category,
      price,
      basePrice: price,
      shortDescription: form.shortDescription,
      description: form.description || form.shortDescription,
      image: form.image,
      inStock: form.inStock,
      // Empty = stock isn't counted for this product
      stockQuantity: form.stockQuantity === '' ? null : Math.max(0, parseInt(form.stockQuantity) || 0),
      hidden: form.hidden,
      mixFlavours: activeStoreTab === 'bakery' && form.mixFlavours,
      availableAddOns: addOns,
      flavours: parsedFlavours,
      sizes: parsedSizes.length > 0 ? parsedSizes : [{ name: 'Standard', priceMultiplier: 1.0 }],
      // Pack size only applies to pastries sold without sets/options
      packQuantity: isPastryCategory && !variants.length ? parseInt(form.packQuantity) || 12 : 1,
      packLabel: isPastryCategory && !variants.length ? form.packLabel || `${form.packQuantity} pieces` : '',
      brand: form.brand,
      soldInSets,
      unitLabel: soldInSets ? (unitLabel.trim() || 'pieces') : '',
      variants: variants.length ? variants
        // Supplies always sell through a variant; keep a single standard one
        : activeStoreTab === 'supplies' ? [{ size: 'Standard', price }] : []
    };
    // Counted stock decides availability: 0 left = out of stock, restocked = back in
    const left = totalStock(productPayload);
    if (left === 0) productPayload.inStock = false;
    else if (left > 0 && editingProduct && totalStock(editingProduct) === 0) productPayload.inStock = true;

    return productPayload;
  };

  const handlePreview = () => {
    const draft = buildPayload();
    if (draft) openProductModal({ ...draft, id: editingProduct?.id || 'preview', store: activeStoreTab, isSupply: activeStoreTab === 'supplies', isPreview: true });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const productPayload = buildPayload();
    if (!productPayload) return;

    setSaving(true);
    const { error } = editingProduct
      ? await updateProduct(activeStoreTab, editingProduct.id, productPayload)
      : await addProduct(activeStoreTab, productPayload);
    setSaving(false);

    if (error) {
      showToast(`Could not save: ${error}`, 'error');
      return;
    }
    showToast(editingProduct ? 'Changes saved and live on the site' : 'Product added and live on the site', 'success');
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="admin-page-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', color: 'var(--charcoal-900)', margin: 0 }}>
            Product Catalog Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Add, update inventory, toggle in-stock status, and manage product details.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={() => setIsCategoriesOpen(true)}>
          <Filter size={17} /> Manage categories
        </button>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={17} /> Add New {activeStoreTab === 'bakery' ? 'Bakery Item' : 'Supply Product'}
        </button>
        </div>
      </div>

      {/* Store Selector Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => { setActiveStoreTab('bakery'); setCategoryFilter('All'); setSelectedIds([]); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.75rem 1.4rem', borderRadius: 'var(--radius-lg)',
            border: activeStoreTab === 'bakery' ? '2px solid var(--gold-500)' : '1px solid var(--cream-300)',
            background: activeStoreTab === 'bakery' ? 'var(--bg-surface)' : 'var(--cream-100)',
            color: activeStoreTab === 'bakery' ? 'var(--text-gold)' : 'var(--charcoal-600)',
            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
            boxShadow: activeStoreTab === 'bakery' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Cake size={18} color="var(--gold-600)" />
          Bakery Products ({bakeryProducts.length})
        </button>

        <button
          onClick={() => { setActiveStoreTab('supplies'); setCategoryFilter('All'); setSelectedIds([]); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.75rem 1.4rem', borderRadius: 'var(--radius-lg)',
            border: activeStoreTab === 'supplies' ? '2px solid var(--burgundy-700)' : '1px solid var(--cream-300)',
            background: activeStoreTab === 'supplies' ? 'var(--bg-surface)' : 'var(--cream-100)',
            color: activeStoreTab === 'supplies' ? 'var(--text-burgundy)' : 'var(--charcoal-600)',
            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
            boxShadow: activeStoreTab === 'supplies' ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Package size={18} color="var(--burgundy-700)" />
          Baking Supplies ({supplyProducts.length})
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="var(--charcoal-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={`Search ${activeStoreTab === 'bakery' ? 'cakes, pastries...' : 'ingredients, tools...'}`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem 0.6rem 2.2rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--cream-300)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--charcoal-500)" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--cream-300)',
              fontSize: '0.85rem',
              background: 'var(--bg-surface)',
              cursor: 'pointer'
            }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <BulkEditBar
          products={currentProducts.filter(p => selectedIds.includes(p.id))}
          categories={categories.filter(c => c !== 'All')}
          onUpdate={(id, changes) => updateProduct(activeStoreTab, id, changes)}
          onDelete={id => deleteProduct(activeStoreTab, id)}
          onDone={msg => { setSelectedIds([]); if (msg) showToast(msg, 'success'); }}
          onError={msg => showToast(msg, 'error')}
        />
      )}

      {/* Products Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--cream-100)', borderBottom: '1px solid var(--cream-200)', color: 'var(--charcoal-700)' }}>
                <th style={{ padding: '0.85rem 0 0.85rem 1rem', width: 28 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.includes(p.id))}
                    onChange={e => setSelectedIds(e.target.checked ? filteredProducts.map(p => p.id) : [])}
                  />
                </th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Product</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Category</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Price</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Stock Qty</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No products found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} style={{ borderBottom: '1px solid var(--cream-100)', opacity: product.hidden ? 0.6 : 1 }}>
                    <td style={{ padding: '0.85rem 0 0.85rem 1rem' }}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${product.name}`}
                        checked={selectedIds.includes(product.id)}
                        onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, product.id] : prev.filter(id => id !== product.id))}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {product.image
                          ? <img src={product.image} alt={product.name} style={{ width: 44, height: 44, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: 44, height: 44, borderRadius: '8px', flexShrink: 0, background: 'var(--cream-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={18} color="var(--charcoal-400)" /></div>}
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--charcoal-900)' }}>
                            {product.name}
                            {product.hidden && <span className="badge badge-secondary" style={{ fontSize: '0.65rem', marginLeft: '0.4rem' }}>Hidden</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {product.shortDescription}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                        {product.category}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-gold)' }}>
                      ₦{(product.price || product.basePrice || 0).toLocaleString()}
                      {product.variants?.length > 1 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--charcoal-600)', fontWeight: 600 }}>
                          from · {product.variants.length} {product.soldInSets ? 'sets' : 'options'}
                        </div>
                      )}
                      {product.packQuantity > 1 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--charcoal-600)', fontWeight: 600 }}>
                          ({product.packQuantity} pcs per pack)
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {(() => {
                        const left = totalStock(product);
                        if (left === null) return <span style={{ color: 'var(--text-muted)' }}>Not counted</span>;
                        return (
                          <span style={{ fontWeight: 600, color: left <= LOW_STOCK_AT ? 'var(--status-danger)' : undefined }}>
                            {left} left{left > 0 && left <= LOW_STOCK_AT ? ' · low' : ''}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <button
                        onClick={async () => {
                          const { error } = await toggleAvailability(activeStoreTab, product.id);
                          if (error) showToast(`Could not save: ${error}`, 'error');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          background: product.inStock ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: product.inStock ? 'var(--status-success)' : 'var(--status-danger)'
                        }}
                      >
                        {product.inStock ? '✓ In Stock' : '✕ Out of Stock'}
                      </button>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleOpenEdit(product)}
                          style={{
                            background: 'var(--cream-100)',
                            border: '1px solid var(--cream-300)',
                            borderRadius: '6px',
                            padding: '0.4rem',
                            cursor: 'pointer',
                            color: 'var(--charcoal-700)'
                          }}
                          title="Edit Product"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                              deleteProduct(activeStoreTab, product.id).then(({ error }) => {
                                if (error) showToast(`Could not delete: ${error}`, 'error');
                              });
                            }
                          }}
                          style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '6px',
                            padding: '0.4rem',
                            cursor: 'pointer',
                            color: 'var(--status-danger)'
                          }}
                          title="Delete Product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 'var(--z-modal)',
            background: 'rgba(26,23,21,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
              maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
              padding: '2rem', boxShadow: 'var(--shadow-2xl)', animation: 'scaleUp 0.25s ease'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--charcoal-900)', margin: 0 }}>
                {editingProduct ? 'Edit Product' : `Add New ${activeStoreTab === 'bakery' ? 'Bakery Item' : 'Baking Supply'}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--charcoal-400)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--charcoal-700)' }}>
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--charcoal-700)' }}>
                    Category *
                  </label>
                  <select
                    required
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)', fontSize: '0.875rem', background: 'var(--bg-surface)' }}
                  >
                    {/* A product whose category was removed keeps it until changed */}
                    {form.category && !categoryList.includes(form.category) && (
                      <option value={form.category}>{form.category} (not on list)</option>
                    )}
                    {categoryList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsCategoriesOpen(true)}
                    style={{ background: 'none', border: 'none', padding: 0, marginTop: '0.3rem', fontSize: '0.72rem', color: 'var(--text-gold)', fontWeight: 700, cursor: 'pointer' }}>
                    Edit categories list
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--charcoal-700)' }}>
                    Base Price (₦) {form.options.options.length ? '(from options)' : '*'}
                  </label>
                  <input
                    type="number"
                    required={!form.options.options.length}
                    disabled={form.options.options.length > 0}
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--charcoal-700)' }}>
                  Short Description
                </label>
                <input
                  type="text"
                  value={form.shortDescription}
                  onChange={e => setForm({ ...form, shortDescription: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                {!form.options.options.length && (
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--charcoal-700)' }}>
                      Stock quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.stockQuantity}
                      placeholder="Leave empty if you don't count it"
                      onChange={e => setForm({ ...form, stockQuantity: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)', fontSize: '0.875rem' }}
                    />
                  </div>
                )}
                <label style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', paddingBottom: '0.6rem' }}>
                  <input type="checkbox" checked={form.hidden} onChange={e => setForm({ ...form, hidden: e.target.checked })} />
                  Hide from store (draft)
                </label>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '-0.6rem' }}>
                Stock goes down by itself when you confirm an order's payment. Change it here any time, e.g. after an in-shop sale.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--charcoal-700)' }}>
                  Product Picture (Local File or Web URL)
                </label>
                
                {/* Local Upload Area */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleLocalImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.55rem 0.9rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--gold-500)',
                      background: 'rgba(229,138,19,0.1)',
                      color: 'var(--text-gold)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    <UploadCloud size={16} /> Choose Picture from Computer
                  </button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>or paste URL below</span>
                </div>

                <input
                  type="text"
                  placeholder="https://... or choose local file above"
                  value={form.image}
                  onChange={e => setForm({ ...form, image: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)', fontSize: '0.875rem' }}
                />

                {/* Live Preview Thumbnail */}
                {form.image && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.6rem', padding: '0.5rem', background: 'var(--cream-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-200)' }}>
                    <img
                      src={form.image}
                      alt="Preview"
                      style={{ width: 48, height: 48, borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--cream-300)' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--charcoal-900)' }}>Picture Preview</div>
                      <div>This image will be displayed to customers in the catalog.</div>
                    </div>
                  </div>
                )}
              </div>

              {activeStoreTab === 'bakery' && (
                <>
                  {(form.category === 'Pastries & Tarts' || form.category.toLowerCase().includes('pastr')) && (
                    <div style={{ padding: '0.85rem 1rem', background: 'rgba(229,138,19,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(229,138,19,0.3)', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-gold)', marginBottom: '0.35rem' }}>
                        🥐 Pastry Quantity Requirement *
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem', color: 'var(--charcoal-800)' }}>
                            Pieces Per Order (e.g. 12) *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={form.packQuantity}
                            onChange={e => setForm({ ...form, packQuantity: e.target.value })}
                            placeholder="e.g. 12"
                            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem', color: 'var(--charcoal-800)' }}>
                            Pack Label / Description
                          </label>
                          <input
                            type="text"
                            value={form.packLabel}
                            onChange={e => setForm({ ...form, packLabel: e.target.value })}
                            placeholder="e.g. 12 pieces per box"
                            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-gold)', marginTop: '0.4rem', fontWeight: 600 }}>
                        🏷️ Price Display Preview: <strong>{form.packQuantity || 12} pieces for ₦{(parseFloat(form.price) || 0).toLocaleString()}</strong>
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--charcoal-700)' }}>
                      Flavours (comma separated)
                    </label>
                    <input
                      type="text"
                      value={form.flavours}
                      onChange={e => setForm({ ...form, flavours: e.target.value })}
                      placeholder="e.g. Belgian Chocolate, Vanilla Bean, Red Velvet"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)', fontSize: '0.875rem' }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.mixFlavours} onChange={e => setForm({ ...form, mixFlavours: e.target.checked })} />
                      Customers can mix flavours in one order (Mix &amp; Match, e.g. a box of 12 with 3 flavours)
                    </label>
                  </div>

                  <AddOnsEditor value={form.addOns} onChange={addOns => setForm(prev => ({ ...prev, addOns }))} />

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--charcoal-700)' }}>
                      Sizes & Multipliers (Format: Name:Multiplier, ...), ignored when options are set below
                    </label>
                    <input
                      type="text"
                      value={form.sizes}
                      onChange={e => setForm({ ...form, sizes: e.target.value })}
                      placeholder="e.g. 6 inch:1.0, 8 inch:1.45, 10 inch:1.9"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)', fontSize: '0.875rem' }}
                    />
                  </div>
                </>
              )}

              {activeStoreTab === 'supplies' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--charcoal-700)' }}>
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={e => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g. Callebaut, Lurpak, KitchenCraft"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)', fontSize: '0.875rem' }}
                  />
                </div>
              )}

              <ProductOptionsEditor
                value={form.options}
                onChange={options => setForm(prev => ({ ...prev, options }))}
                onError={msg => showToast(msg, 'error')}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-secondary" onClick={handlePreview}>
                  <Eye size={16} /> Preview
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* After the product editor so it opens on top of it */}
      {isCategoriesOpen && (
        <CategoriesModal
          store={activeStoreTab}
          list={categoryLists[activeStoreTab]}
          products={currentProducts}
          onClose={() => setIsCategoriesOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminProducts;
