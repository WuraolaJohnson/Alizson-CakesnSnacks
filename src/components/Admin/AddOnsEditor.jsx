import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const inputStyle = {
  width: '100%', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--cream-300)', fontSize: '0.82rem', background: 'var(--bg-surface)'
};

/** Extras a customer can tick on a bakery product, each with its own price. */
const AddOnsEditor = ({ value, onChange }) => {
  const setRow = (i, changes) => onChange(value.map((a, j) => (j === i ? { ...a, ...changes } : a)));

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--charcoal-700)' }}>
        Add-ons &amp; extras
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {value.map((a, i) => (
          <div key={a.id || i} style={{ display: 'flex', gap: '0.45rem' }}>
            <input style={{ ...inputStyle, flex: 2 }} value={a.name} placeholder="e.g. Gold drip glaze"
              onChange={e => setRow(i, { name: e.target.value })} />
            <input style={{ ...inputStyle, flex: 1 }} type="number" min="0" value={a.price} placeholder="Price (₦)"
              onChange={e => setRow(i, { price: e.target.value })} />
            <button type="button" title="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))}
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '0.45rem', cursor: 'pointer', color: 'var(--status-danger)' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}
        onClick={() => onChange([...value, { name: '', price: '' }])}>
        <Plus size={14} /> Add extra
      </button>
    </div>
  );
};

export default AddOnsEditor;
