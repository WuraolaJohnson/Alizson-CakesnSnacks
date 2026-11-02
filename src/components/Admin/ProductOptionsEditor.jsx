import React from 'react';
import { Plus, Trash2, UploadCloud } from 'lucide-react';
import { compressImage } from '../../utils/imageCompress';

const inputStyle = {
  width: '100%', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--cream-300)', fontSize: '0.82rem', background: 'var(--bg-surface)'
};
const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.2rem', color: 'var(--charcoal-700)' };

export const emptyOption = () => ({ size: '', units: '', price: '', stock: '', image: '' });

/**
 * Editor for a product's options: each has its own name, price, picture and
 * stock. When "sold in sets" is on, each option also says how many units
 * are in that set (e.g. "Box of 6" = 6 pieces).
 *
 * @param {object} value - { soldInSets, unitLabel, options: [...] }
 * @param {function} onChange - receives the next value
 * @param {function} onError - receives a message when a picture can't be used
 */
const ProductOptionsEditor = ({ value, onChange, onError }) => {
  const { soldInSets, unitLabel, options } = value;

  const setOption = (i, changes) =>
    onChange({ ...value, options: options.map((o, j) => (j === i ? { ...o, ...changes } : o)) });

  const handlePicture = async (i, file) => {
    if (!file) return;
    try {
      setOption(i, { image: await compressImage(file, 600) });
    } catch (err) {
      onError?.(err.message);
    }
  };

  return (
    <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)', background: 'var(--cream-50)' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--charcoal-900)' }}>Options, sets &amp; prices</div>
      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.2rem 0 0.75rem' }}>
        Add one row per version of this product (e.g. a size, a pack, a set). Each can have its own price and picture.
        Leave empty to sell the product at the base price only.
      </p>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.6rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={soldInSets} onChange={e => onChange({ ...value, soldInSets: e.target.checked })} />
        This product is sold in sets (e.g. box of 6, box of 12)
      </label>

      {soldInSets && (
        <div style={{ marginBottom: '0.75rem', maxWidth: 220 }}>
          <label style={labelStyle}>What is one unit called?</label>
          <input style={inputStyle} value={unitLabel} placeholder="e.g. pieces, cupcakes, packs"
            onChange={e => onChange({ ...value, unitLabel: e.target.value })} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {options.map((o, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: '0.6rem', padding: '0.6rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-200)' }}>
            <label title="Choose picture" style={{ width: 56, height: 56, borderRadius: 8, border: '1px dashed var(--cream-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: 'var(--cream-100)' }}>
              {o.image
                ? <img src={o.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <UploadCloud size={18} color="var(--charcoal-400)" />}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePicture(i, e.target.files?.[0])} />
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'flex-end' }}>
              <div style={{ flex: '2 1 140px' }}>
                <label style={labelStyle}>{soldInSets ? 'Set name *' : 'Option name *'}</label>
                <input style={inputStyle} value={o.size} placeholder={soldInSets ? 'e.g. Box of 6' : 'e.g. 8 inch, 500g'}
                  onChange={e => setOption(i, { size: e.target.value })} />
              </div>
              {soldInSets && (
                <div style={{ flex: '1 1 80px' }}>
                  <label style={labelStyle}>{unitLabel || 'Units'} per set *</label>
                  <input style={inputStyle} type="number" min="1" value={o.units}
                    onChange={e => setOption(i, { units: e.target.value })} />
                </div>
              )}
              <div style={{ flex: '1 1 80px' }}>
                <label style={labelStyle}>Price (₦) *</label>
                <input style={inputStyle} type="number" min="0" value={o.price}
                  onChange={e => setOption(i, { price: e.target.value })} />
              </div>
              <div style={{ flex: '1 1 80px' }}>
                <label style={labelStyle}>{soldInSets ? 'Sets in stock' : 'In stock'}</label>
                <input style={inputStyle} type="number" min="0" value={o.stock}
                  onChange={e => setOption(i, { stock: e.target.value })} />
              </div>
              <button type="button" title="Remove" onClick={() => onChange({ ...value, options: options.filter((_, j) => j !== i) })}
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '0.45rem', cursor: 'pointer', color: 'var(--status-danger)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.6rem' }}
        onClick={() => onChange({ ...value, options: [...options, emptyOption()] })}>
        <Plus size={14} /> Add {soldInSets ? 'set' : 'option'}
      </button>
    </div>
  );
};

/** Turns editor rows into the `variants` saved on the product. */
export function optionsToVariants(options, soldInSets) {
  return options
    .filter(o => o.size.trim() && o.price !== '')
    .map(o => ({
      size: o.size.trim(),
      price: Number(o.price) || 0,
      ...(soldInSets && { units: Number(o.units) || 1 }),
      ...(o.stock !== '' && { stock: Number(o.stock) || 0 }),
      ...(o.image && { image: o.image })
    }));
}

/** Turns a saved product's `variants` back into editor rows. */
export function variantsToOptions(variants = []) {
  return variants.map(v => ({
    size: v.size || '',
    units: v.units ?? '',
    price: v.price ?? '',
    stock: v.stock ?? '',
    image: v.image || ''
  }));
}

export default ProductOptionsEditor;
