import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { signInAsRole } from '../../services/authService';
import { isSupabaseReady } from '../../lib/supabase';
import GoogleSignInButton from '../../components/Auth/GoogleSignInButton';

// Local development without a Supabase project: allow entering the portal
// without an account. import.meta.env.DEV is false in production builds.
const OFFLINE_DEV_MODE = import.meta.env.DEV && !isSupabaseReady();

const AdminLoginPage = ({ onLogin, initialError = '' }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { user, error: authError } = await signInAsRole(form.email.trim(), form.password, 'admin');

    if (user) {
      onLogin(user);
    } else {
      setError(authError || 'Invalid admin credentials. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--ink-deep), #2A1A08)',
      padding: '1.5rem'
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)', padding: '2.5rem 2rem',
        width: '100%', maxWidth: 400
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/logo.jpeg"
            alt="Alizson Logo"
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--gold-400)',
              boxShadow: '0 4px 16px rgba(229,138,19,0.35)',
              margin: '0 auto 0.75rem'
            }}
          />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--gold-50)', border: '1px solid var(--gold-200)', borderRadius: 'var(--radius-full)', padding: '0.3rem 0.9rem', marginBottom: '1rem' }}>
            <ShieldCheck size={13} style={{ color: 'var(--text-gold)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin Portal</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Alizson Admin
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Sign in to manage your store
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)',
            borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--status-danger)'
          }}>
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {!OFFLINE_DEV_MODE && <GoogleSignInButton portal="admin" onError={setError} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Admin Email
            </label>
            <input
              type="email" value={form.email}
              onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setError(''); }}
              placeholder="you@example.com"
              className="form-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
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

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: '0.5rem', justifyContent: 'center', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In to Admin'}
          </button>
        </form>

        {OFFLINE_DEV_MODE && (
          <button
            type="button"
            className="btn btn-outline w-full"
            style={{ marginTop: '1rem', justifyContent: 'center' }}
            onClick={() => onLogin({ name: 'Dev Admin', role: 'admin' })}
          >
            Continue in offline dev mode (Supabase not configured)
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminLoginPage;
