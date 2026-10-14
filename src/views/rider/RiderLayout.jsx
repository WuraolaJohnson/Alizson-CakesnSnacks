import React, { useState, useEffect } from 'react';
import { LogOut, Navigation, UserCheck, Shield, Compass } from 'lucide-react';
import RiderLoginPage from './RiderLoginPage';
import RiderPortal from '../RiderPortal';
import { useApp } from '../../context/AppContext';
import { getStaffUser, getRiderForUser, onSignedOut, signOut, isReturningFromPortalOAuth, clearPortalOAuthParams } from '../../services/authService';

export default function RiderLayout() {
  const { showToast } = useApp();
  // The rider record linked to the signed-in account. undefined = still
  // restoring the session, null = signed out.
  const [rider, setRider] = useState(undefined);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // On return from Google, read any error before the URL is cleaned up
      const oauthError = new URLSearchParams(window.location.search).get('error_description');
      const fromGoogle = isReturningFromPortalOAuth();
      const user = await getStaffUser('rider');
      const { rider: record } = user ? await getRiderForUser(user.id) : { rider: null };
      if (cancelled) return;
      const active = record?.accountStatus === 'Active' ? record : null;
      if (fromGoogle) {
        clearPortalOAuthParams('rider');
        if (!active) {
          await signOut();
          setLoginError(oauthError || (record
            ? `Your rider account is ${record.accountStatus}. Please contact the admin.`
            : 'That Google account is not linked to a rider profile. Please contact the admin.'));
        }
      }
      setRider(active);
    })();
    const unsubscribe = onSignedOut(() => setRider(null));
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const handleLogout = async () => {
    await signOut();
    setRider(null);
    showToast('Signed out from Rider Terminal.', 'info');
  };

  if (rider === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Checking session…
      </div>
    );
  }

  if (!rider) {
    return <RiderLoginPage initialError={loginError} onLogin={(r) => { setLoginError(''); setRider(r); }} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--cream-50)' }}>
      {/* Standalone Rider Navigation Bar */}
      <header style={{
        background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
        color: 'white',
        padding: '0.85rem 1.5rem',
        borderBottom: '2px solid var(--gold-500)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <img
            src="/logo.jpeg"
            alt="Alizson Logo"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--gold-500)'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: '1.15rem', color: 'white' }}>
                Alizson
              </span>
              <span style={{
                background: 'var(--gold-500)',
                color: 'white',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.15rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                textTransform: 'uppercase'
              }}>
                Rider Portal
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--cream-300)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Compass size={12} /> Ogun Dispatch Belt
            </div>
          </div>
        </div>

        {/* Right Side Actions: Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white',
              fontSize: '0.78rem',
              padding: '0.4rem 0.85rem'
            }}
          >
            <LogOut size={15} /> Sign Out Rider
          </button>
        </div>
      </header>

      {/* Main Rider Terminal Content */}
      <main style={{ flex: 1 }}>
        <RiderPortal authRider={rider} />
      </main>
    </div>
  );
}
