import React, { useEffect, useState } from 'react';

const SplashScreen = ({ onDone }) => {
  const [phase, setPhase] = useState(0); // 0=fade-in, 1=show, 2=fade-out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 1800);
    const t3 = setTimeout(() => onDone(), 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 'var(--z-splash)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1A1715 0%, #2A1A08 55%, #3D2408 100%)',
      opacity: phase === 2 ? 0 : 1,
      transition: 'opacity 0.5s ease',
      pointerEvents: phase === 2 ? 'none' : 'all'
    }}>
      <div style={{
        textAlign: 'center',
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)'
      }}>
        <img
          src="/logo.jpeg"
          alt="Alizson Logo"
          style={{
            display: 'block',
            margin: '0 auto 1rem',
            width: 84,
            height: 84,
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center',
            border: '3px solid var(--gold-400)',
            boxShadow: '0 8px 32px rgba(229,138,19,0.5)',
          }}
        />
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontWeight: 700,
          fontSize: 'clamp(2rem, 5vw, 2.75rem)',
          color: 'white', letterSpacing: '-0.02em', marginBottom: '0.4rem'
        }}>
          Alizson
        </h1>
        <p style={{
          color: 'var(--gold-400)', fontWeight: 600,
          fontSize: '0.9rem', letterSpacing: '0.12em', textTransform: 'uppercase'
        }}>
          Cakes · Pastries · Supplies
        </p>

        {/* Loading dots */}
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7,
              borderRadius: '50%',
              background: 'var(--gold-400)',
              animation: `splashDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              opacity: 0.7
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
