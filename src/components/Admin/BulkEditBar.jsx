import React, { useState } from 'react';
import { X } from 'lucide-react';

const fieldStyle = {
  padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)',
  fontSize: '0.82rem', background: 'var(--bg-surface)'
};

// Prices end in a round ₦10
const roundPrice = n => Math.max(0, Math.round(n / 10) * 10);

/**
 * Actions for the products ticked in the admin table: stock status,
 * show/hide, category, price change by % and delete.
 */
const BulkEditBar = ({ products, categories, onUpdate, onDelete, onDone, onError }) => {
  const [percent, setPercent] = useState('');
  const [category, setCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const count = products.length;

  // Runs one change per product; `changesFor` returns that product's changes
  const applyAll = async (changesFor, doneMsg) => {
    setBusy(true);
    const results = await Promise.all(products.map(p => onUpdate(p.id, changesFor(p))));
    setBusy(false);
    const failed = results.filter(r => r?.error).length;
    if (failed) onError(`${failed} of ${count} products could not be saved.`);
    else onDone(doneMsg);
  };

  const changePrices = () => {
    const pct = parseFloat(percent);
    if (!pct) { onError('Enter a percentage, e.g. 10 to raise or -10 to lower.'); return; }
    const factor = 1 + pct / 100;
    applyAll(p => {
      const variants = p.variants?.map(v => ({ ...v, price: roundPrice(v.price * factor) }));
      const price = variants?.length ? Math.min(...variants.map(v => v.price)) : roundPrice((p.price || 0) * factor);
      return { price, basePrice: price, ...(variants?.length && { variants }) };
    }, `Prices ${pct > 0 ? 'raised' : 'lowered'} by ${Math.abs(pct)}% on ${count} products`);
    setPercent('');
  };

  const deleteAll = async () => {
    if (!window.confirm(`Delete ${count} products? This can't be undone.`)) return;
    setBusy(true);
    const results = await Promise.all(products.map(p => onDelete(p.id)));
    setBusy(false);
    const failed = results.filter(r => r?.error).length;
    if (failed) onError(`${failed} of ${count} products could not be deleted.`);
    else onDone(`${count} products deleted`);
  };

  return (
    <div className="card" style={{ padding: '0.85rem 1rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', border: '1.5px solid var(--gold-500)' }}>
      <strong style={{ fontSize: '0.85rem', marginRight: '0.25rem' }}>{count} selected</strong>

      <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => applyAll(() => ({ inStock: true }), `${count} products marked in stock`)}>In stock</button>
      <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => applyAll(() => ({ inStock: false }), `${count} products marked out of stock`)}>Out of stock</button>
      <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => applyAll(() => ({ hidden: true }), `${count} products hidden`)}>Hide</button>
      <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => applyAll(() => ({ hidden: false }), `${count} products shown in store`)}>Show</button>

      <span style={{ display: 'inline-flex', gap: '0.3rem' }}>
        <select style={fieldStyle} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Move to category…</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" disabled={busy || !category}
          onClick={() => { applyAll(() => ({ category }), `${count} products moved to ${category}`); setCategory(''); }}>Move</button>
      </span>

      <span style={{ display: 'inline-flex', gap: '0.3rem' }}>
        <input style={{ ...fieldStyle, width: 90 }} type="number" value={percent} placeholder="% e.g. 10"
          onChange={e => setPercent(e.target.value)} />
        <button className="btn btn-secondary btn-sm" disabled={busy} onClick={changePrices}>Change prices</button>
      </span>

      <button className="btn btn-sm" disabled={busy} onClick={deleteAll}
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--status-danger)' }}>Delete</button>

      <button aria-label="Clear selection" onClick={() => onDone()} disabled={busy}
        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--charcoal-500)' }}>
        <X size={18} />
      </button>
    </div>
  );
};

export default BulkEditBar;
