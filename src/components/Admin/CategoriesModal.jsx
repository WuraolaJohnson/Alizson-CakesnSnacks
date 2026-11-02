import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { useApp } from '../../context/AppContext';

const inputStyle = {
  padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)',
  fontSize: '0.85rem', background: 'var(--bg-surface)'
};
const iconBtn = {
  background: 'var(--cream-100)', border: '1px solid var(--cream-300)', borderRadius: 6,
  padding: '0.4rem', cursor: 'pointer', color: 'var(--charcoal-700)', display: 'inline-flex'
};

/**
 * Admin: add, rename, reorder and remove one store's categories.
 * Renaming moves that category's products to the new name. A category
 * that still has products can't be removed.
 */
const CategoriesModal = ({ store, list, products, onClose }) => {
  const { saveCategories } = useProducts();
  const { showToast } = useApp();
  // `original` remembers each row's saved name so renames can be detected
  const [rows, setRows] = useState(() => list.map(c => ({ ...c, original: c.name })));
  const [saving, setSaving] = useState(false);

  const countIn = name => products.filter(p => p.category === name).length;
  const setRow = (i, changes) => setRows(prev => prev.map((r, j) => (j === i ? { ...r, ...changes } : r)));
  const move = (i, dir) => setRows(prev => {
    const next = [...prev];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    return next;
  });

  const handleSave = async () => {
    const cleaned = rows.map(r => ({ ...r, name: r.name.trim(), emoji: (r.emoji || '').trim() }));
    if (cleaned.some(r => !r.name)) { showToast('Every category needs a name (or remove the empty row).', 'error'); return; }
    const names = cleaned.map(r => r.name.toLowerCase());
    if (new Set(names).size !== names.length) { showToast('Two categories have the same name.', 'error'); return; }

    const renames = cleaned
      .filter(r => r.original && r.original !== r.name)
      .map(r => ({ from: r.original, to: r.name }));

    setSaving(true);
    const { error } = await saveCategories(store, cleaned.map(({ name, emoji }) => ({ name, emoji })), renames);
    setSaving(false);
    if (error) { showToast(`Could not save: ${error}`, 'error'); return; }
    showToast('Categories saved and live on the store', 'success');
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', background: 'rgba(26,23,21,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', boxShadow: 'var(--shadow-2xl)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', margin: 0 }}>
            {store === 'bakery' ? 'Bakery' : 'Supplies'} categories
          </h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--charcoal-400)' }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
          The store shows them in this order. Renaming one moves its products to the new name.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {rows.map((r, i) => {
            const count = r.original ? countIn(r.original) : 0;
            return (
              <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input style={{ ...inputStyle, width: 48, textAlign: 'center' }} value={r.emoji || ''} placeholder="🙂"
                  aria-label="Emoji" onChange={e => setRow(i, { emoji: e.target.value })} />
                <input style={{ ...inputStyle, flex: 1, minWidth: 0 }} value={r.name} placeholder="Category name"
                  onChange={e => setRow(i, { name: e.target.value })} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{count} items</span>
                <button type="button" style={iconBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp size={14} /></button>
                <button type="button" style={iconBtn} disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown size={14} /></button>
                <button
                  type="button"
                  aria-label="Remove"
                  title={count ? 'Move its products to another category first' : 'Remove'}
                  disabled={count > 0}
                  onClick={() => setRows(prev => prev.filter((_, j) => j !== i))}
                  style={{ ...iconBtn, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--status-danger)', opacity: count ? 0.4 : 1 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}
          onClick={() => setRows(prev => [...prev, { name: '', emoji: '' }])}>
          <Plus size={14} /> Add category
        </button>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.25rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save categories'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoriesModal;
