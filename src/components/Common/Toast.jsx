import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

export const Toast = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '90px',
        right: '1.5rem',
        zIndex: 'var(--z-toast)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        pointerEvents: 'none',
        maxWidth: '340px',
        width: '100%'
      }}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const icons = {
    success: '✓',
    info: 'ℹ',
    warning: '⚠',
    error: '✕'
  };

  const colors = {
    success: { bg: '#ECFDF5', border: '#34D399', icon: '#059669', text: '#065F46' },
    info: { bg: '#EFF6FF', border: '#60A5FA', icon: '#2563EB', text: '#1E3A8A' },
    warning: { bg: '#FFFBEB', border: '#FBBF24', icon: '#D97706', text: '#92400E' },
    error: { bg: '#FEF2F2', border: '#F87171', icon: '#DC2626', text: '#7F1D1D' }
  };

  const c = colors[toast.type] || colors.success;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '0.8rem 1rem',
        boxShadow: 'var(--shadow-lg)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'all',
        cursor: 'pointer'
      }}
      onClick={() => onRemove(toast.id)}
    >
      <div style={{
        width: 22, height: 22,
        borderRadius: '50%',
        background: c.icon,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 800,
        flexShrink: 0
      }}>
        {icons[toast.type] || '✓'}
      </div>
      <span style={{
        fontSize: '0.875rem',
        fontWeight: 500,
        color: c.text,
        lineHeight: 1.4,
        flex: 1
      }}>
        {toast.message}
      </span>
    </div>
  );
};
