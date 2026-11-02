import React from 'react';

/**
 * Branded full-screen loader for the admin and rider portals, shown while
 * the saved sign-in is restored. Matches the shop's splash screen.
 */
const PortalLoader = ({ label = 'Loading…' }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 'var(--z-splash)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.1rem',
    background: 'linear-gradient(135deg, #1A1715 0%, #2A1A08 55%, #3D2408 100%)',
    animation: 'fadeIn 0.3s ease'
  }}>
    <img
      src="/logo.jpeg"
      alt="Alizson Logo"
      style={{
        width: 84, height: 84, borderRadius: '50%', objectFit: 'cover',
        border: '3px solid var(--gold-400)', animation: 'pulseGlow 2s ease-in-out infinite'
      }}
    />
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', fontFamily: 'var(--font-sans)' }}>
      <span aria-hidden="true" style={{
        width: 16, height: 16, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'var(--gold-400)',
        animation: 'portalSpin 0.8s linear infinite'
      }} />
      {label}
    </div>
    <style>{'@keyframes portalSpin { to { transform: rotate(360deg); } }'}</style>
  </div>
);

export default PortalLoader;
