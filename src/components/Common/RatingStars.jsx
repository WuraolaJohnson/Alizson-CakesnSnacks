import React from 'react';
import { Star } from 'lucide-react';

export const RatingStars = ({ rating = 5, total = 5, size = 16, interactive = false, onRate, count }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        {[...Array(total)].map((_, i) => {
          const filled = i < Math.floor(rating);
          const half = i === Math.floor(rating) && rating % 1 >= 0.5;
          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate && onRate(i + 1)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '1px',
                cursor: interactive ? 'pointer' : 'default',
                color: filled || half ? 'var(--gold-400)' : 'var(--cream-300)',
                display: 'inline-flex',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => interactive && (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={(e) => interactive && (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Star
                size={size}
                fill={filled || half ? 'var(--gold-400)' : 'none'}
                strokeWidth={filled || half ? 0 : 1.5}
              />
            </button>
          );
        })}
      </div>
      {count !== undefined && (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '2px' }}>
          ({count})
        </span>
      )}
    </div>
  );
};
