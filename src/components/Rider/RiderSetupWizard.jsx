import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Avatar from '../Common/Avatar';
import { compressImage } from '../../utils/imageCompress';

const label = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' };
const field = { marginBottom: '1rem' };

// Each step: its title, a short why, and the fields it must have before moving on
const STEPS = [
  { title: 'Your photo & contact', why: 'So the admin and customers know who is delivering.', fields: ['avatar', 'name', 'phone'] },
  { title: 'Your vehicle', why: 'So customers can recognise you on arrival.', fields: ['vehicle', 'vehicleType', 'licenseNo'] },
  { title: 'Emergency contact', why: 'Someone we can reach if anything happens on the road.', fields: ['emergencyContactName', 'emergencyContactPhone'] },
  { title: 'Payout bank account', why: 'Your delivery allowances are paid here. Use an account in your own name.', fields: ['bankName', 'bankAccountNumber', 'bankAccountName'] }
];

/**
 * First-time rider registration, one short step at a time. The rider's
 * portal stays closed until every step is done and saved.
 */
const RiderSetupWizard = ({ rider, onSave }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    avatar: rider.avatar || '', name: rider.name || '', phone: rider.phone || '',
    vehicle: rider.vehicle || '', vehicleType: rider.vehicleType || '', licenseNo: rider.licenseNo || '',
    emergencyContactName: rider.emergencyContactName || '', emergencyContactPhone: rider.emergencyContactPhone || '',
    bankName: rider.bankName || '', bankAccountNumber: rider.bankAccountNumber || '', bankAccountName: rider.bankAccountName || ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => { setForm(p => ({ ...p, [key]: e.target.value })); setError(''); };
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handlePhoto = async (file) => {
    if (!file) return;
    try {
      setError('');
      const avatar = await compressImage(file, 300, 0.8);
      setForm(p => ({ ...p, avatar }));
    } catch (err) {
      setError(err.message);
    }
  };

  // Checks this step's fields; returns a message, or '' when it's fine
  const problem = () => {
    if (current.fields.includes('avatar') && !form.avatar) return 'Please add a clear photo of your face.';
    if (current.fields.some(k => !String(form[k]).trim())) return 'Please fill in every field on this step.';
    if (current.fields.includes('bankAccountNumber') && !/^\d{10}$/.test(form.bankAccountNumber)) return 'Account number must be 10 digits.';
    return '';
  };

  const next = async (e) => {
    e.preventDefault();
    const msg = problem();
    if (msg) { setError(msg); return; }
    if (!isLast) { setStep(s => s + 1); window.scrollTo(0, 0); return; }
    setSaving(true);
    const { error: saveError } = await onSave(form) || {};
    setSaving(false);
    if (saveError) setError(saveError);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page, var(--cream-50))', padding: '2rem 1rem 3rem' }}>
      <div className="card" style={{ maxWidth: 480, margin: '0 auto', padding: '1.75rem 1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Rider registration · Step {step + 1} of {STEPS.length}
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '0.35rem', margin: '0.6rem 0 1.25rem' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= step ? 'var(--gold-500)' : 'var(--cream-200, #e5e5e5)' }} />
          ))}
        </div>

        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', margin: 0, color: 'var(--text-primary)' }}>{current.title}</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.3rem 0 1.25rem' }}>{current.why}</p>

        <form onSubmit={next}>
          {step === 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <Avatar src={form.avatar} name={form.name} size={72} />
                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                  {form.avatar ? 'Change photo' : 'Add your photo *'}
                  <input type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={e => handlePhoto(e.target.files?.[0])} />
                </label>
              </div>
              <div style={field}>
                <label style={label}>Full name *</label>
                <input className="form-input" value={form.name} onChange={set('name')} />
              </div>
              <div style={field}>
                <label style={label}>Phone number *</label>
                <input className="form-input" type="tel" inputMode="tel" placeholder="e.g. 0803 123 4567" value={form.phone} onChange={set('phone')} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div style={field}>
                <label style={label}>Vehicle type *</label>
                <select className="form-input" value={form.vehicleType} onChange={set('vehicleType')}>
                  <option value="">Choose…</option>
                  <option>Motorcycle</option>
                  <option>Tricycle (Keke)</option>
                  <option>Car</option>
                  <option>Bicycle</option>
                </select>
              </div>
              <div style={field}>
                <label style={label}>Vehicle description *</label>
                <input className="form-input" placeholder="e.g. Red Bajaj Boxer, plate ABC-123-XY" value={form.vehicle} onChange={set('vehicle')} />
              </div>
              <div style={field}>
                <label style={label}>Driver's licence number *</label>
                <input className="form-input" value={form.licenseNo} onChange={set('licenseNo')} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={field}>
                <label style={label}>Contact name *</label>
                <input className="form-input" placeholder="e.g. a parent or spouse" value={form.emergencyContactName} onChange={set('emergencyContactName')} />
              </div>
              <div style={field}>
                <label style={label}>Contact phone *</label>
                <input className="form-input" type="tel" inputMode="tel" value={form.emergencyContactPhone} onChange={set('emergencyContactPhone')} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={field}>
                <label style={label}>Bank name *</label>
                <input className="form-input" placeholder="e.g. OPay, GTBank, Access" value={form.bankName} onChange={set('bankName')} />
              </div>
              <div style={field}>
                <label style={label}>Account number *</label>
                <input className="form-input" inputMode="numeric" maxLength={10} placeholder="10 digits" value={form.bankAccountNumber}
                  onChange={e => { setForm(p => ({ ...p, bankAccountNumber: e.target.value.replace(/\D/g, '') })); setError(''); }} />
              </div>
              <div style={field}>
                <label style={label}>Account name *</label>
                <input className="form-input" value={form.bankAccountName} onChange={set('bankAccountName')} />
              </div>
            </>
          )}

          {error && <div style={{ color: 'var(--status-danger)', fontSize: '0.82rem', marginBottom: '0.9rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            {step > 0 ? (
              <button type="button" className="btn btn-ghost" onClick={() => { setStep(s => s - 1); setError(''); }}>
                <ArrowLeft size={16} /> Back
              </button>
            ) : <span />}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isLast ? <><Check size={16} /> Finish registration</> : <>Next <ArrowRight size={16} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RiderSetupWizard;
