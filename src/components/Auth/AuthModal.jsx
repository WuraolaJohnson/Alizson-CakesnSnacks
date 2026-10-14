import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, Mail, User, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { signIn, signUp } from '../../services/authService';
import { isSupabaseReady } from '../../lib/supabase';
import GoogleSignInButton from './GoogleSignInButton';

const AuthModal = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalMode, setAuthModalMode, login, showToast } = useApp();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const isLogin = authModalMode === 'login';

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      const { user, error: authError } = await signIn(form.email, form.password);
      if (authError) {
        setError(authError);
        setLoading(false);
        return;
      }
      if (user) login(user);
    } else {
      if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
        setError('Please fill in all required fields.');
        setLoading(false);
        return;
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      const { user, error: authError } = await signUp(form.name, form.email, form.password);
      if (authError) {
        setError(authError);
        setLoading(false);
        return;
      }
      if (user) {
        // Update phone if provided
        const userWithPhone = form.phone ? { ...user, phone: form.phone } : user;
        login(userWithPhone);
      }
    }

    setLoading(false);
    setForm({ name: '', email: '', phone: '', password: '' });
  };

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setError('');
    setForm({ name: '', email: '', phone: '', password: '' });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-modal)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(26,23,21,0.7)', backdropFilter: 'blur(8px)',
        padding: '1rem'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)', padding: '2rem 2rem 2.5rem',
          width: '100%', maxWidth: 420, position: 'relative',
          animation: 'modalIn 0.3s cubic-bezier(0.16,1,0.3,1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'var(--cream-100)', border: 'none', cursor: 'pointer',
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)'
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img
            src="/logo.jpeg"
            alt="Alizson Logo"
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--gold-400)',
              boxShadow: '0 4px 14px rgba(229,138,19,0.3)',
              margin: '0 auto 0.75rem'
            }}
          />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isLogin ? 'Sign in to your Alizson account' : 'Join the Alizson community'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)',
            borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--status-danger)'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            {error}
          </div>
        )}

        {isSupabaseReady() && <GoogleSignInButton onError={setError} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text" name="name" placeholder="Full Name *"
                value={form.name} onChange={handleChange}
                className="form-input" style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="email" name="email" placeholder="Email Address *"
              value={form.email} onChange={handleChange}
              className="form-input" style={{ paddingLeft: '2.5rem' }}
              required
            />
          </div>

          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>+234</span>
              <input
                type="tel" name="phone" placeholder="Phone Number"
                value={form.phone} onChange={handleChange}
                className="form-input" style={{ paddingLeft: '3.25rem' }}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password" placeholder="Password *"
              value={form.password} onChange={handleChange}
              className="form-input" style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
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

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: '0.25rem', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setAuthModalMode(isLogin ? 'signup' : 'login'); setError(''); setForm({ name: '', email: '', phone: '', password: '' }); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-gold)', fontWeight: 700, fontFamily: 'var(--font-sans)' }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>


      </div>
    </div>
  );
};

export default AuthModal;
