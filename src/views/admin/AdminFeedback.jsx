import React, { useState } from 'react';
import {
  MessageCircle, Star, Filter, Search, CheckCircle2,
  Reply, Sparkles, User, Cake, Package, Award
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useApp } from '../../context/AppContext';
import { RatingStars } from '../../components/Common/RatingStars';

const AdminFeedback = () => {
  const { feedbackList, addFeedback } = useOrders();
  const { showToast } = useApp();

  const [ratingFilter, setRatingFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const filteredFeedback = feedbackList.filter(item => {
    const matchesRating = ratingFilter === 'all' || item.rating === parseInt(ratingFilter);
    const matchesStore = storeFilter === 'all' || item.store === storeFilter;
    const matchesSearch =
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.comment.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRating && matchesStore && matchesSearch;
  });

  const avgRating = feedbackList.length > 0
    ? (feedbackList.reduce((sum, f) => sum + (f.rating || 5), 0) / feedbackList.length).toFixed(1)
    : '4.9';

  const handleSendReply = (feedbackId) => {
    if (!replyText.trim()) return;
    showToast(`Reply sent to customer for review #${feedbackId}! 💌`, 'success');
    setReplyingId(null);
    setReplyText('');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', color: 'var(--charcoal-900)', margin: 0 }}>
            Customer Feedback & Reviews
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Monitor customer satisfaction, ratings, and respond to buyer reviews.
          </p>
        </div>
      </div>

      {/* Ratings Summary Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', marginBottom: '2rem', alignItems: 'stretch' }}>
        <div className="card" style={{ padding: '1.75rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--charcoal-900)', lineHeight: 1 }}>
            {avgRating}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '0.6rem 0' }}>
            <RatingStars rating={parseFloat(avgRating)} size={20} />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Based on {feedbackList.length} verified reviews
          </div>
        </div>

        <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
          {[5, 4, 3, 2, 1].map(stars => {
            const count = feedbackList.filter(f => f.rating === stars).length;
            const pct = feedbackList.length > 0 ? (count / feedbackList.length) * 100 : 0;
            return (
              <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.825rem' }}>
                <span style={{ width: 45, fontWeight: 700, color: 'var(--charcoal-700)' }}>{stars} Stars</span>
                <div style={{ flex: 1, height: 8, background: 'var(--cream-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gold-action)', borderRadius: 'var(--radius-full)' }} />
                </div>
                <span style={{ width: 35, textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="var(--charcoal-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search reviews by customer name or keywords..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem 0.6rem 2.2rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--cream-300)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={ratingFilter}
            onChange={e => setRatingFilter(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--cream-300)',
              fontSize: '0.85rem',
              background: 'var(--bg-surface)',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={storeFilter}
            onChange={e => setStoreFilter(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--cream-300)',
              fontSize: '0.85rem',
              background: 'var(--bg-surface)',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Stores</option>
            <option value="bakery">🍰 Bakery</option>
            <option value="supplies">🧁 Supplies</option>
          </select>
        </div>
      </div>

      {/* Feedback Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredFeedback.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No reviews match the selected filters.
          </div>
        ) : (
          filteredFeedback.map(item => (
            <div key={item.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--gold-action), var(--gold-action-strong))',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.95rem'
                    }}
                  >
                    {item.customerName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--charcoal-900)', fontSize: '0.95rem' }}>
                      {item.customerName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.date} {item.time ? `· ${item.time}` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {item.orderId && (
                    <span style={{ background: 'var(--cream-100)', color: 'var(--charcoal-800)', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--cream-300)' }}>
                      📦 {item.orderId}
                    </span>
                  )}
                  <span className={`badge ${item.store === 'bakery' ? 'badge-gold' : 'badge-burgundy'}`} style={{ fontSize: '0.72rem' }}>
                    {item.store === 'bakery' ? '🍰 Bakery Review' : '🧁 Supplies Review'}
                  </span>
                  <RatingStars rating={item.rating} size={15} />
                </div>
              </div>

              {item.productName && (
                <div style={{ fontSize: '0.8rem', color: 'var(--charcoal-600)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Product / Item: <span style={{ color: 'var(--text-gold)' }}>{item.productName}</span>
                </div>
              )}

              <p style={{ color: 'var(--charcoal-800)', fontSize: '0.925rem', lineHeight: 1.5, margin: '0 0 1rem' }}>
                "{item.comment}"
              </p>

              {/* Reply Section */}
              {replyingId === item.id ? (
                <div style={{ background: 'var(--cream-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-200)' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--charcoal-700)' }}>
                    Reply as Alizson Support:
                  </label>
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a warm note or answer to the customer..."
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--cream-300)', fontSize: '0.85rem', marginBottom: '0.5rem', fontFamily: 'var(--font-sans)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => setReplyingId(null)}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => handleSendReply(item.id)}>
                      Send Reply
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setReplyingId(item.id); setReplyText(''); }}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-gold)',
                      cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem'
                    }}
                  >
                    <Reply size={14} /> Respond to Customer
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;
