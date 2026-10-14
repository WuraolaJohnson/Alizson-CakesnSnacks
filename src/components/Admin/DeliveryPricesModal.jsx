import React, { useState } from 'react';
import { X, Search, Save, RotateCcw, Truck, Check, AlertCircle } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useApp } from '../../context/AppContext';

const DeliveryPricesModal = ({ isOpen, onClose }) => {
  const { deliveryLocations, updateDeliveryPrice, resetDeliveryPrices } = useOrders();
  const { showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [editedPrices, setEditedPrices] = useState({});

  if (!isOpen) return null;

  const filteredLocations = deliveryLocations.filter(loc =>
    loc.lga.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.hubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.towns.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleFeeChange = (lgaName, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setEditedPrices(prev => ({
      ...prev,
      [lgaName]: num
    }));
  };

  const handleSaveAll = () => {
    let changeCount = 0;
    Object.entries(editedPrices).forEach(([lgaName, newFee]) => {
      updateDeliveryPrice(lgaName, newFee);
      changeCount++;
    });
    if (changeCount > 0) {
      showToast(`Successfully updated delivery prices for ${changeCount} LGA(s)! 🚚`, 'success');
      setEditedPrices({});
    } else {
      showToast('No delivery price changes to save.', 'info');
    }
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all delivery prices to default rates?')) {
      resetDeliveryPrices();
      setEditedPrices({});
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(26,23,21,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-2xl)',
          overflow: 'hidden',
          animation: 'scaleUp 0.2s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, var(--charcoal-900), #2A1F18)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '9px', background: 'rgba(229,138,19,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-400)' }}>
              <Truck size={20} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'white', margin: 0 }}>
                Manage Ogun State Delivery Prices
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--charcoal-300)', margin: '0.1rem 0 0' }}>
                Set custom shipping tariffs per LGA across Ogun State. Changes reflect immediately at checkout.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--charcoal-300)', cursor: 'pointer', padding: '0.4rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div style={{ padding: '1rem 1.5rem', background: 'var(--cream-50)', borderBottom: '1px solid var(--cream-200)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} color="var(--charcoal-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by LGA name or town (e.g., Abeokuta, Sagamu, Mowe)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.8rem 0.55rem 2.2rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--cream-300)',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <button
            className="btn btn-outline"
            onClick={handleReset}
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>
        </div>

        {/* Locations Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--cream-200)', color: 'var(--charcoal-700)' }}>
                <th style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>LGA Name</th>
                <th style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>Logistics Hub</th>
                <th style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>Est. Time</th>
                <th style={{ padding: '0.6rem 0.5rem', fontWeight: 700, textAlign: 'right' }}>Delivery Fee (₦)</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map(loc => {
                const currentFee = editedPrices[loc.lga] !== undefined ? editedPrices[loc.lga] : loc.deliveryFee;
                const isModified = editedPrices[loc.lga] !== undefined && editedPrices[loc.lga] !== loc.deliveryFee;

                return (
                  <tr key={loc.lga} style={{ borderBottom: '1px solid var(--cream-100)', background: isModified ? 'var(--gold-50)' : 'transparent' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--charcoal-900)' }}>{loc.lga}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {loc.towns.join(', ')}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--charcoal-700)', fontSize: '0.8rem' }}>
                      {loc.hubName}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      ⏱️ {loc.estimatedTime}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--charcoal-600)' }}>₦</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={currentFee}
                          onChange={e => handleFeeChange(loc.lga, e.target.value)}
                          style={{
                            width: '100px',
                            padding: '0.4rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            border: `1.5px solid ${isModified ? 'var(--gold-500)' : 'var(--cream-300)'}`,
                            fontWeight: 800,
                            fontSize: '0.875rem',
                            color: 'var(--gold-700)',
                            textAlign: 'right',
                            background: isModified ? 'white' : 'var(--cream-50)'
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '1rem 1.5rem', background: 'var(--cream-100)', borderTop: '1px solid var(--cream-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total <strong>{deliveryLocations.length}</strong> Ogun State LGAs configured.
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveAll}>
              <Save size={16} /> Save Delivery Prices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPricesModal;
