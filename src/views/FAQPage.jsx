import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle, Phone, Mail, MessageCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

const FAQ_CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'ordering', label: '🍰 Ordering & Custom Cakes' },
  { id: 'delivery', label: '🛵 Delivery & Live Tracking' },
  { id: 'payment', label: '💳 Pay on Delivery & Payment' },
  { id: 'supplies', label: '🧁 Baking Supplies' },
  { id: 'gifts', label: '🎁 Gift Studio & Packages' }
];

const FAQS = [
  {
    category: 'ordering',
    question: 'How far in advance should I place an order for a custom celebration cake?',
    answer: 'We recommend placing custom celebration cake orders at least 48 to 72 hours in advance. For intricate multi-tiered wedding cakes or large event orders, 1 to 2 weeks advance notice is preferred to guarantee date availability and custom flavor preparations.'
  },
  {
    category: 'ordering',
    question: 'Do you offer same-day bakery orders or quick pickups?',
    answer: 'Yes! Our daily baked pastries, cupcakes, doughnuts, and ready-to-go birthday cakes are available for same-day delivery or instant store pick-up at our Abeokuta store locations (Obasanjo Hilltop and Kuto).'
  },
  {
    category: 'ordering',
    question: 'Can I customize cake flavors, fillings, and sugar inscriptions?',
    answer: 'Absolutely! During checkout or via our WhatsApp concierge, you can specify flavor combinations (Red Velvet, Chocolate Fudge, Vanilla Sponge, Caramel, Carrot Cake), icing preference, dietary notes, and custom chocolate/sugar lettering.'
  },
  {
    category: 'delivery',
    question: 'What locations do you deliver to in Ogun State?',
    answer: 'We provide direct doorstep delivery across Abeokuta (Abeokuta South & North, Olusegun Obasanjo Hilltop, Kuto, Ibara, Oke-Mosan, Idi-Aba, Adigbe) and express delivery to Sagamu, Ijebu-Ode, and Ado-Odo/Ota LGA hubs.'
  },
  {
    category: 'delivery',
    question: 'How does live delivery tracking work?',
    answer: 'Once your order is dispatched from our kitchen or warehouse, you receive a real-time GPS tracking link. You can track your assigned rider on our interactive map and see estimated arrival time live on your phone screen.'
  },
  {
    category: 'payment',
    question: 'How does "Pay on Delivery" work? Do I pay cash to the rider?',
    answer: 'For safety and security, customers do NOT pay cash or transfer money directly to riders. When your rider arrives at your doorstep, you complete your payment online using the secure payment link on your phone screen (via Paystack card or bank transfer). Once payment completes, enter your 4-digit Security PIN with the rider to receive your package.'
  },
  {
    category: 'payment',
    question: 'What online payment methods are accepted on the website?',
    answer: 'We accept all major debit cards (Mastercard, Visa, Verve), direct Bank Transfers, USSD, and Paystack Wallet online payment methods.'
  },
  {
    category: 'supplies',
    question: 'Are your baking ingredients and tools suitable for professional bakers?',
    answer: 'Yes! All baking supplies listed on Alizson — including whipping creams, fondant, chocolate blocks, nozzles, cake boards, turn tables, and silicone molds — are authentic, professional-grade tools curated and tested by our master baker Elizabeth Johnson.'
  },
  {
    category: 'gifts',
    question: 'What items can I include in a custom Gift Studio package?',
    answer: 'Our Gift Studio allows you to build luxurious gift boxes containing Money Bouquets (with real cash variants from ₦10,000 to ₦200,000), fine wines & champagne, Ferrero Rocher & Belgian chocolates, giant teddy bears, scented soy candles, and hand-written calligraphy greeting cards.'
  },
  {
    category: 'ordering',
    question: 'What if I have severe allergies (e.g. nuts, eggs, gluten)?',
    answer: 'Please indicate any dietary restrictions in the order notes at checkout. We maintain strict hygiene and allergen segregation in our bakery, and we also offer nut-free and eggless cake variations upon request.'
  }
];

export default function FAQPage() {
  const { navigateTo, openGiftStudio } = useApp();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState(0);

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ background: 'var(--cream-50)', minHeight: '90vh', paddingBottom: '5rem' }}>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--charcoal-900) 0%, #3D1A10 100%)',
        color: 'white',
        padding: '4.5rem 1.5rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="container-tight">
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>❓</div>
          <span style={{ color: 'var(--gold-400)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Help & Knowledge Base
          </span>
          <h1 className="display-title font-serif" style={{ color: 'white', marginTop: '0.4rem', marginBottom: '1rem' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem', maxWidth: 580, margin: '0 auto 2rem' }}>
            Everything you need to know about ordering celebration cakes, live delivery tracking, pay-on-delivery policy, and professional baking supplies.
          </p>

          {/* Search Box */}
          <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--charcoal-400)' }} />
            <input
              type="text"
              placeholder="Search questions (e.g. pay on delivery, custom cake lead time, LGA delivery)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem 0.85rem 2.75rem',
                borderRadius: 'var(--radius-full)',
                border: '2px solid var(--gold-500)',
                fontSize: '0.95rem',
                background: 'white',
                color: 'var(--charcoal-900)',
                boxShadow: 'var(--shadow-lg)'
              }}
            />
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <div className="container-tight" style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2.5rem' }}>
          {FAQ_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`btn ${activeCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.85rem', borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem' }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredFaqs.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <HelpCircle size={48} style={{ color: 'var(--gold-500)', marginBottom: '1rem' }} />
              <h3>No questions found matching "{searchTerm}"</h3>
              <p style={{ marginTop: '0.5rem' }}>Try searching with a different keyword or contact our support team below.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    border: `1.5px solid ${isOpen ? 'var(--gold-500)' : 'var(--cream-200)'}`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.5rem',
                      background: isOpen ? 'var(--gold-50)' : 'var(--bg-surface)',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--charcoal-900)', fontFamily: 'var(--font-serif)' }}>
                      {faq.question}
                    </span>
                    {isOpen ? <ChevronUp size={20} color="var(--gold-600)" /> : <ChevronDown size={20} color="var(--charcoal-400)" />}
                  </button>

                  {isOpen && (
                    <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--cream-200)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.925rem' }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Support CTA Card */}
        <div
          className="card"
          style={{
            marginTop: '3.5rem',
            padding: '2.5rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, var(--gold-50), var(--cream-100))',
            border: '2px dashed var(--gold-400)'
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--charcoal-900)', margin: '0 0 0.5rem' }}>
            Still Have Questions?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 460, margin: '0 auto 1.5rem' }}>
            Our customer care and baking concierge team is available to assist you via call, email, or live WhatsApp chat.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigateTo('contact')}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Mail size={16} /> Contact Support
            </button>
            <a
              href="https://wa.link/avijal"
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#10B981', borderColor: '#10B981' }}
            >
              <MessageCircle size={16} /> WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
