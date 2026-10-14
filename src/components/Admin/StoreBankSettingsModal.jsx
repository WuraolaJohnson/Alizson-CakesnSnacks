import React, { useState, useEffect } from 'react';
import { X, Building2, Save, Check, Copy, AlertCircle, Sparkles } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useApp } from '../../context/AppContext';

const NIGERIAN_BANKS = [
  'Guaranty Trust Bank (GTBank)',
  'Zenith Bank',
  'Access Bank',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Kuda Microfinance Bank',
  'OPay Digital Services',
  'Moniepoint Microfinance Bank',
  'Fidelity Bank',
  'Stanbic IBTC Bank',
  'FCMB (First City Monument Bank)',
  'Sterling Bank',
  'Wema Bank / ALAT',
  'Union Bank',
  'Polaris Bank',
  'Other / Custom Bank'
];

const StoreBankSettingsModal = ({ isOpen, onClose }) => {
  const { storeBankAccount, updateStoreBankAccount } = useOrders();
  const { showToast } = useApp();

  const [form, setForm] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    narrationPrompt: 'Your Full Name or Order ID'
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (storeBankAccount) {
      setForm({
        bankName: storeBankAccount.bankName || 'Guaranty Trust Bank (GTBank)',
        accountNumber: storeBankAccount.accountNumber || '0123456789',
        accountName: storeBankAccount.accountName || 'Alizson Cakes & Baking Supplies',
        narrationPrompt: storeBankAccount.narrationPrompt || 'Your Full Name or Order ID'
      });
    }
  }, [storeBankAccount, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountName.trim()) {
      showToast('Please fill in Bank Name, Account Number, and Account Name.', 'error');
      return;
    }
    updateStoreBankAccount(form);
    onClose();
  };

  const handleCopyAccount = () => {
    if (form.accountNumber) {
      navigator.clipboard.writeText(form.accountNumber);
      setCopied(true);
      showToast('Account number copied to clipboard! 📋', 'success');
      setTimeout(() => setCopied(false), 2000);
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
        padding: '1.25rem'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: 'var(--shadow-2xl)',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'scaleUp 0.25s ease'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--cream-200)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--gold-50)', border: '1px solid var(--gold-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-600)' }}>
                <Building2 size={20} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', margin: 0, color: 'var(--charcoal-900)' }}>
                Store Bank Account Settings
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.35rem 0 0' }}>
              Configure the bank account where customers transfer funds when placing orders.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--charcoal-400)', padding: '0.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Preview Box */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          border: '1.5px dashed var(--gold-400)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-800)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Customer Checkout Preview
            </span>
            <span style={{ fontSize: '0.72rem', background: 'var(--gold-200)', color: 'var(--gold-900)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              Live Reflection
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--charcoal-900)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                {form.accountNumber || '0123456789'}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold-900)' }}>
                {form.bankName || 'Select a Bank'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--charcoal-700)', fontWeight: 600 }}>
                {form.accountName || 'Account Holder Name'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyAccount}
              className="btn btn-sm"
              style={{ background: 'white', border: '1px solid var(--gold-300)', color: 'var(--gold-800)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Bank Name *</label>
            <select
              className="form-select"
              value={form.bankName}
              onChange={e => setForm({ ...form, bankName: e.target.value })}
              style={{ fontWeight: 600 }}
            >
              {NIGERIAN_BANKS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">10-Digit NUBAN Account Number *</label>
            <input
              type="text"
              maxLength={10}
              className="form-input"
              placeholder="e.g. 0123456789"
              value={form.accountNumber}
              onChange={e => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })}
              style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.05em' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Official Account Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Alizson Cakes & Confectionery Ltd."
              value={form.accountName}
              onChange={e => setForm({ ...form, accountName: e.target.value })}
              style={{ fontWeight: 600 }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Transfer Narration / Reference Instruction</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Your Full Name or Order ID"
              value={form.narrationPrompt}
              onChange={e => setForm({ ...form, narrationPrompt: e.target.value })}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Customers will be asked to enter this as their bank transfer narration/remark.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
            >
              <Save size={16} /> Save Bank Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreBankSettingsModal;
