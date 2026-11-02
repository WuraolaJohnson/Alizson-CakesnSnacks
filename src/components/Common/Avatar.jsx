import React from 'react';

/** Profile picture, or the person's initials when they haven't added one. */
const Avatar = ({ src, name = '', size = 54, style = {} }) => {
  const box = { width: size, height: size, borderRadius: '50%', flexShrink: 0, border: '2px solid var(--gold-500)', ...style };
  if (src) return <img src={src} alt={name} style={{ ...box, objectFit: 'cover' }} />;
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
  return (
    <div aria-label={name} style={{
      ...box, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--ink, #1A1715)', color: 'var(--gold-400, #F5A623)',
      fontWeight: 800, fontSize: size * 0.38, fontFamily: 'var(--font-sans)'
    }}>
      {initials}
    </div>
  );
};

export default Avatar;
