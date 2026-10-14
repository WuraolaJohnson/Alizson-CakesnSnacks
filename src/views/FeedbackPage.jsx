import React, { useState } from 'react';
import { Lock, User, Sparkles, CheckCircle2, MessageCircle, Star, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useOrders } from '../context/OrderContext';
import { useApp } from '../context/AppContext';
import { RatingStars } from '../components/Common/RatingStars';

const FeedbackPage = () => {
  const { addFeedback, feedbackList, orders } = useOrders();
  const { currentUser, setIsAuthModalOpen, setAuthModalMode, showToast } = useApp();

  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  // Filter user's past orders if logged in
  const userOrders = currentUser
    ? orders.filter(o => o.customerEmail?.toLowerCase() === currentUser.email?.toLowerCase())
    : [];

  const [form, setForm] = useState({
    orderId: userOrders[0]?.id || '',
    store: userOrders[0]?.store || 'bakery',
    title: '',
    comment: ''
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to submit feedback.', 'warning');
      setIsAuthModalOpen(true);
      return;
    }

    if (!form.comment.trim() || rating === 0) {
      showToast('Please provide your comments and select a star rating.', 'warning');
      return;
    }

    // Determine product name from selected order if matched
    const matchedOrder = userOrders.find(o => o.id === form.orderId);
    const productName = matchedOrder?.items?.[0]?.name || '';

    addFeedback({
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      orderId: form.orderId || (userOrders.length > 0 ? userOrders[0].id : 'ALZ-VERIFIED'),
      productName: productName,
      store: form.store,
      storeName: form.store === 'bakery' ? 'Bakery Store' : 'Baking Supplies Store',
      title: form.title,
      comment: form.comment,
      rating
    });

    setSubmitted(true);
  };

  const featuredFeedback = feedbackList.slice(0, 8);
  const avgRating = (feedbackList.reduce((acc, f) => acc + (f.rating || 5), 0) / (feedbackList.length || 1)).toFixed(1);

  return (
    <div style={{ background: 'var(--cream-50)', minHeight: '100vh', paddingBottom: '5rem' }}>
      {/* Hero Header */}
      <section style={{
        background: 'linear-gradient(135deg, var(--charcoal-900) 0%, #2A1A08 100%)',
        padding: '4rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(var(--gold-400) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(229,138,19,0.15)', border: '1px solid rgba(229,138,19,0.3)',
            borderRadius: 'var(--radius-full)', padding: '0.35rem 1rem', marginBottom: '1rem',
            color: 'var(--gold-400)', fontSize: '0.82rem', fontWeight: 600
          }}>
            💬 Customer Stories & Reviews
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'white', marginBottom: '0.75rem' }}>
            We Cherish Your Feedback
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', maxWidth: '580px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Every cake baked and ingredient packed has love poured into it. Hear what bakers and sweet-tooth lovers in Nigeria say about Alizson Cakes & Snacks.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.08)', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-full)' }}>
              <div style={{ display: 'flex', color: 'var(--gold-400)' }}>
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill="currentColor" />)}
              </div>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>{avgRating} / 5.0</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>({feedbackList.length} verified reviews)</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingTop: '3.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '2.5rem',
            alignItems: 'start'
          }}
        >
          {/* Left Column: Gated Form or Login Prompt */}
          <div>
            {!currentUser ? (
              <div
                className="card"
                style={{
                  padding: '2.5rem 2rem',
                  textAlign: 'center',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--cream-100)',
                    color: 'var(--gold-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    fontSize: '1.75rem'
                  }}
                >
                  🔒
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
                  Sign in to Leave a Review
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                  To maintain verified and authentic ratings across the marketplace, please log in with your registered account to share feedback and link your order.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '280px', margin: '0 auto' }}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                    }}
                  >
                    🔑 Sign In to Review
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setAuthModalMode('register');
                      setIsAuthModalOpen(true);
                    }}
                  >
                    ✨ Create New Account
                  </button>
                </div>
              </div>
            ) : submitted ? (
              <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
                  Thank You, {currentUser.name}!
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.925rem' }}>
                  Your review has been successfully submitted and helps other bakers and sweet lovers across Alizson Cakes & Snacks!
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ orderId: userOrders[0]?.id || '', store: 'bakery', title: '', comment: '' });
                    setRating(5);
                  }}
                >
                  Write Another Review
                </button>
              </div>
            ) : (
              <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{currentUser.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified Customer · {currentUser.email}</div>
                  </div>
                </div>

                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                  Share Your Experience
                </h2>

                <form onSubmit={handleSubmit}>
                  {/* Order ID Dropdown / Selection */}
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Select Order to Review *
                    </label>
                    {userOrders.length > 0 ? (
                      <select
                        className="form-select"
                        value={form.orderId}
                        onChange={e => {
                          const val = e.target.value;
                          const selectedO = userOrders.find(o => o.id === val);
                          update('orderId', val);
                          if (selectedO) update('store', selectedO.store);
                        }}
                      >
                        {userOrders.map(o => (
                          <option key={o.id} value={o.id}>
                            {o.id} — {o.items?.[0]?.name || o.store} ({o.date} · ₦{o.total?.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="form-input"
                        placeholder="e.g. ALZ-BAK-1048 or ALZ-SUP-2019"
                        value={form.orderId}
                        onChange={e => update('orderId', e.target.value)}
                      />
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Store Reviewed
                      </label>
                      <select
                        className="form-select"
                        value={form.store}
                        onChange={e => update('store', e.target.value)}
                      >
                        <option value="bakery">🍰 Bakery Store (Cakes)</option>
                        <option value="supplies">🧁 Baking Supplies</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Star Rating *
                      </label>
                      <div style={{ marginTop: '0.35rem' }}>
                        <RatingStars rating={rating} size={24} interactive onRate={setRating} />
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Headline / Title
                    </label>
                    <input
                      className="form-input"
                      value={form.title}
                      onChange={e => update('title', e.target.value)}
                      placeholder="e.g. Magnificent Chocolate Birthday Cake!"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Detailed Feedback *
                    </label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      required
                      value={form.comment}
                      onChange={e => update('comment', e.target.value)}
                      placeholder="Tell us what you loved about the taste, packaging, delivery, or ingredients..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <MessageCircle size={17} /> Submit Customer Feedback
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Customer Reviews Feed */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              Verified Buyer Reviews ({feedbackList.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {featuredFeedback.map(fb => (
                <div
                  key={fb.id}
                  className="card"
                  style={{
                    padding: '1.35rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                        {fb.customerName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {fb.date} {fb.time ? `· ${fb.time}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                      <RatingStars rating={fb.rating} size={14} />
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        {currentUser?.role === 'admin' && fb.orderId ? (
                          <span
                            style={{
                              background: 'var(--cream-100)',
                              color: 'var(--charcoal-700)',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)'
                            }}
                          >
                            📦 {fb.orderId}
                          </span>
                        ) : (
                          <span
                            style={{
                              background: 'rgba(16,185,129,0.12)',
                              color: 'var(--status-success)',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid rgba(16,185,129,0.25)'
                            }}
                          >
                            ✓ Verified Purchase
                          </span>
                        )}
                        <span
                          className={`badge ${fb.store === 'bakery' ? 'badge-gold' : 'badge-burgundy'}`}
                          style={{ fontSize: '0.68rem' }}
                        >
                          {fb.store === 'bakery' ? '🍰 Bakery' : '🧁 Supplies'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {fb.title && (
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      {fb.title}
                    </div>
                  )}

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
                    "{fb.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
