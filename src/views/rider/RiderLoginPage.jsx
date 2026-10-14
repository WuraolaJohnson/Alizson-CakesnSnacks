import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Navigation, AlertCircle, Mail } from 'lucide-react';
import { AVAILABLE_RIDERS } from '../../context/OrderContext';
import { signInAsRole, getRiderForUser, signOut } from '../../services/authService';
import { isSupabaseReady } from '../../lib/supabase';
import GoogleSignInButton from '../../components/Auth/GoogleSignInButton';

// Local development without a Supabase project: pick a demo rider instead
// of signing in. import.meta.env.DEV is false in production builds.
const OFFLINE_DEV_MODE = import.meta.env.DEV && !isSupabaseReady();

/**
 * Signs a rider in and resolves their rider record.
 * onLogin(rider) receives the rider record linked to the account.
 */
export default function RiderLoginPage({ onLogin, initialError = '' }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [devRiderId, setDevRiderId] = useState(AVAILABLE_RIDERS[0].id);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (OFFLINE_DEV_MODE) {
      onLogin(AVAILABLE_RIDERS.find(r => r.id === devRiderId));
      return;
    }

    const { user, error: authError } = await signInAsRole(form.email.trim(), form.password, 'rider');
    if (!user) {
      setError(authError || 'Invalid email or password.');
      setLoading(false);
      return;
    }

    const { rider, error: riderError } = await getRiderForUser(user.id);
    if (!rider || rider.accountStatus !== 'Active') {
      await signOut();
      setError(riderError
        ? `Could not load your rider profile: ${riderError}`
        : rider
          ? `Your rider account is ${rider.accountStatus}. Please contact the admin.`
          : 'This login is not linked to a rider profile yet. Please contact the admin.');
      setLoading(false);
      return;
    }

    onLogin(rider);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #111827 0%, #1F2937 50%, #1E120B 100%)',
      padding: '1.5rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: 420,
        border: '1px solid rgba(229,138,19,0.2)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/logo.jpeg"
            alt="Alizson Logo"
            style={{
              width: 62,
              height: 62,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--gold-500)',
              boxShadow: '0 6px 20px rgba(229,138,19,0.4)',
              margin: '0 auto 0.85rem'
            }}
          />
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--gold-50)',
            border: '1px solid var(--gold-300)',
            borderRadius: 'var(--radius-full)',
            padding: '0.35rem 0.9rem',
            marginBottom: '0.85rem'
          }}>
            <Navigation size={14} style={{ color: 'var(--gold-600)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-800)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Dedicated Delivery Rider Portal
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: '1.65rem', color: 'var(--charcoal-900)', marginBottom: '0.35rem' }}>
            Rider Authentication
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Sign in to access assigned Ogun State deliveries & GPS dispatch
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            color: '#991B1B',
            fontWeight: 600
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!OFFLINE_DEV_MODE && <GoogleSignInButton portal="rider" onError={setError} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {OFFLINE_DEV_MODE ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--charcoal-800)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Demo Rider (offline dev mode)
              </label>
              <select
                className="form-select"
                value={devRiderId}
                onChange={e => setDevRiderId(e.target.value)}
                style={{ fontWeight: 700 }}
              >
                {AVAILABLE_RIDERS.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.hub})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--charcoal-800)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Rider Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    autoComplete="username"
                    value={form.email}
                    onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setError(''); }}
                    placeholder="you@example.com"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--charcoal-800)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setError(''); }}
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.95rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating Rider...' : '🔓 Sign In to Rider Terminal'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--cream-200)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Authorized Ogun Delivery Staff Only
        </div>
      </div>
    </div>
  );
}
