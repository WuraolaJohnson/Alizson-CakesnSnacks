import React, { useState } from 'react';
import {
  ShoppingCart, Heart, Search, Menu, X,
  Cake, Package, ChevronDown, Sun, Moon, User, LogOut, Gift, Shield, ArrowLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { SearchBar } from '../Common/SearchBar';

const Navbar = () => {
  const {
    navigateTo, currentView,
    isCartDrawerOpen, setIsCartDrawerOpen,
    wishlist,
    currentUser, logout,
    setIsAuthModalOpen, setAuthModalMode,
    theme, toggleTheme,
    openGiftStudio
  } = useApp();
  const { totalItemsCount, giftConfig } = useCart();
  const { activeStore, switchStore } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdminViewingStore = sessionStorage.getItem('cz_admin_viewing_store') === '1';

  const handleBackToAdmin = () => {
    sessionStorage.removeItem('cz_admin_viewing_store');
    navigateTo('admin');
  };

  const handleLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const NAV_LINKS = [
    { id: 'home', label: 'Home' },
    { id: 'bakery', label: '🍰 Bakery', store: 'bakery' },
    { id: 'supplies', label: '🧁 Supplies', store: 'supplies' },
    { id: 'orders', label: '📦 Orders' },
    { id: 'gift', label: '🎁 Gift Studio', isGiftBtn: true },
    { id: 'feedback', label: 'Reviews' },
  ];

  return (
    <>
      {/* Admin "Back to Dashboard" Banner — only visible when admin came from the admin panel */}
      {isAdminViewingStore && (
        <div
          style={{
            background: 'linear-gradient(135deg, #4D0A18 0%, #7E152B 50%, #4D0A18 100%)',
            color: '#FFFFFF',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            position: 'sticky',
            top: 0,
            zIndex: 'calc(var(--z-sticky, 100) + 1)',
            boxShadow: '0 2px 12px rgba(77,10,24,0.35)',
          }}
        >
          <Shield size={15} style={{ opacity: 0.8, flexShrink: 0 }} />
          <span style={{ opacity: 0.85 }}>You're viewing the store as an admin</span>
          <button
            onClick={handleBackToAdmin}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 'var(--radius-full, 20px)',
              color: '#FFFFFF',
              padding: '0.35rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(4px)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
            }}
          >
            <ArrowLeft size={14} />
            Back to Admin Dashboard
          </button>
        </div>
      )}

      <header style={{
        position: 'sticky', top: isAdminViewingStore ? 'auto' : 0, zIndex: 'var(--z-sticky)',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="container" style={{
          display: 'flex', alignItems: 'center',
          gap: '1rem', height: 64
        }}>
          {/* Logo */}
          <button
            onClick={() => navigateTo('home')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'none', border: 'none', cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <img
              src="/logo.jpeg"
              alt="Alizson Logo"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--gold-400)',
                boxShadow: '0 2px 8px rgba(229,138,19,0.25)',
                background: 'white'
              }}
            />
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 700,
              fontSize: '1.25rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em'
            }}>
              Alizson
            </span>
          </button>

          {/* Desktop Nav Links */}
          <nav style={{ display: 'flex', gap: '0.25rem', flex: 1, marginLeft: '1rem' }}
            className="desktop-nav">
            {NAV_LINKS.map(link => (
              <button
                key={link.id}
                onClick={() => {
                  if (link.isGiftBtn) {
                    openGiftStudio();
                  } else {
                    navigateTo(link.id);
                    if (link.store) switchStore(link.store);
                  }
                }}
                style={{
                  cursor: 'pointer',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  color: link.isGiftBtn ? '#7E152B' : (currentView === link.id ? 'var(--gold-600)' : 'var(--text-secondary)'),
                  background: link.isGiftBtn ? '#FFF5F7' : (currentView === link.id ? 'var(--gold-50)' : 'transparent'),
                  border: link.isGiftBtn ? '1px solid #FDE68A' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {/* Search */}
            <button
              className="icon-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              title="Search"
            >
              <Search size={19} />
            </button>

            {/* Theme toggle */}
            <button
              className="icon-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Wishlist */}
            <button
              className="icon-btn"
              onClick={() => navigateTo('wishlist')}
              title="Wishlist"
              style={{ position: 'relative' }}
            >
              <Heart size={19} fill={wishlist.length > 0 ? 'var(--burgundy-700)' : 'none'}
                color={wishlist.length > 0 ? 'var(--burgundy-700)' : 'currentColor'} />
              {wishlist.length > 0 && (
                <span className="badge-count">{wishlist.length > 9 ? '9+' : wishlist.length}</span>
              )}
            </button>

            {/* Cart */}
            <button
              className="icon-btn"
              onClick={() => setIsCartDrawerOpen(true)}
              title="Cart"
              style={{ position: 'relative' }}
            >
              <ShoppingCart size={19} />
              {totalItemsCount > 0 && (
                <span className="badge-count">{totalItemsCount > 9 ? '9+' : totalItemsCount}</span>
              )}
            </button>

            {/* User / Auth */}
            {currentUser ? (
              <div style={{ position: 'relative' }}>
                <button
                  className="icon-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{ gap: '0.35rem', paddingRight: '0.75rem' }}
                >
                  <User size={18} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser.name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={13} />
                </button>
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                    padding: '0.5rem', minWidth: 210, zIndex: 200
                  }}>
                    <button
                      onClick={() => { navigateTo('dashboard'); setUserMenuOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left', whiteSpace: 'nowrap' }}
                    >
                      <User size={15} /> My Account
                    </button>
                    <button
                      onClick={() => { navigateTo('orders'); setUserMenuOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left', whiteSpace: 'nowrap' }}
                    >
                      <Package size={15} /> Active Orders
                    </button>
                    <button
                      onClick={() => { navigateTo('purchase-history'); setUserMenuOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left', whiteSpace: 'nowrap' }}
                    >
                      <Package size={15} /> Purchase History
                    </button>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--status-danger)', textAlign: 'left', whiteSpace: 'nowrap' }}
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={handleLogin}>
                Sign In
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="icon-btn mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search Bar Dropdown */}
        {searchOpen && (
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '0.75rem 1rem',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(18px)'
          }}>
            <div className="container">
              <SearchBar onClose={() => setSearchOpen(false)} />
            </div>
          </div>
        )}

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            padding: '0.75rem 1rem 1rem',
            display: 'flex', flexDirection: 'column', gap: '0.25rem'
          }}>
            {NAV_LINKS.map(link => (
              <button
                key={link.id}
                onClick={() => {
                  navigateTo(link.id);
                  if (link.store) switchStore(link.store);
                  setMobileMenuOpen(false);
                }}
                style={{
                  background: currentView === link.id ? 'var(--gold-50)' : 'none',
                  border: 'none', cursor: 'pointer',
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.925rem', fontWeight: 600,
                  color: currentView === link.id ? 'var(--gold-600)' : 'var(--text-primary)',
                  textAlign: 'left', fontFamily: 'var(--font-sans)'
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
