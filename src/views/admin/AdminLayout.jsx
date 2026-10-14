import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShoppingBag, Package, ClipboardList,
  MessageSquare, LogOut, ChevronRight, Menu, PanelLeftClose, PanelLeftOpen,
  Cake, Shield, ChevronDown, Layers, Store
} from 'lucide-react';
import AdminLoginPage from './AdminLoginPage';
import AdminDashboard from './AdminDashboard';
import AdminOrders from './AdminOrders';
import AdminProducts from './AdminProducts';
import AdminRecords from './AdminRecords';
import AdminFeedback from './AdminFeedback';
import AdminFleetMap from './AdminFleetMap';
import AdminRiders from './AdminRiders';
import { useApp } from '../../context/AppContext';
import { getStaffUser, onSignedOut, signOut, isReturningFromPortalOAuth, clearPortalOAuthParams, hasSession } from '../../services/authService';
import { OrderProvider } from '../../context/OrderContext';
import { MapPin, Bike } from 'lucide-react';

const NAV_ITEMS_BEFORE = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const NAV_ITEMS_AFTER = [
  { id: 'riders',   label: 'Rider Monitoring', icon: Bike },
  { id: 'fleet',    label: 'Fleet Map',        icon: MapPin },
  { id: 'products', label: 'Products',         icon: Package },
  { id: 'records',  label: 'Records',          icon: ShoppingBag },
  { id: 'feedback', label: 'Reviews',          icon: MessageSquare },
];

const ORDERS_SUB_ITEMS = [
  { filter: 'all',      label: 'All Orders', icon: Layers },
  { filter: 'bakery',   label: 'Bakery',     icon: Cake },
  { filter: 'supplies', label: 'Supplies',   icon: Store },
];

const SIDEBAR_EXPANDED = 230;
const SIDEBAR_COLLAPSED = 64;

const AdminLayout = () => {
  const { showToast, navigateTo } = useApp();
  // 'checking' until the Supabase session has been restored on load
  const [authState, setAuthState]     = useState('checking'); // 'checking' | 'in' | 'out'
  const isLoggedIn = authState === 'in';
  const [loginError, setLoginError]   = useState('');
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);   // mobile overlay
  const [collapsed, setCollapsed]     = useState(false);   // desktop collapse
  const [ordersOpen, setOrdersOpen]   = useState(false);
  const [activeOrdersFilter, setActiveOrdersFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // On return from Google, read any error before the URL is cleaned up
      const oauthError = new URLSearchParams(window.location.search).get('error_description');
      const fromGoogle = isReturningFromPortalOAuth('admin');
      const user = await getStaffUser('admin');
      if (cancelled) return;
      if (fromGoogle) {
        clearPortalOAuthParams('admin');
        if (!user) {
          const signedIn = await hasSession();
          await signOut();
          setLoginError(oauthError || (signedIn
            ? 'That Google account does not have admin access.'
            : 'Google sign-in did not complete. Please try again.'));
        }
      }
      setAuthState(user ? 'in' : 'out');
    })();
    const unsubscribe = onSignedOut(() => setAuthState('out'));
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const handleLogout = async () => {
    await signOut();
    sessionStorage.removeItem('cz_admin_viewing_store');
    setAuthState('out');
    showToast('Signed out from Admin.', 'info');
  };

  if (authState === 'checking') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Checking session…
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AdminLoginPage initialError={loginError} onLogin={() => { setLoginError(''); setAuthState('in'); }} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard setActiveTab={setActiveTab} />;
      case 'orders':    return <AdminOrders setActiveTab={setActiveTab} initialStoreFilter={activeOrdersFilter} />;
      case 'riders':    return <AdminRiders   setActiveTab={setActiveTab} />;
      case 'fleet':     return <AdminFleetMap setActiveTab={setActiveTab} />;
      case 'products':  return <AdminProducts setActiveTab={setActiveTab} />;
      case 'records':   return <AdminRecords  setActiveTab={setActiveTab} />;
      case 'feedback':  return <AdminFeedback setActiveTab={setActiveTab} />;
      default:          return <AdminDashboard setActiveTab={setActiveTab} />;
    }
  };

  const handleOrdersSubItem = (filter) => {
    setActiveOrdersFilter(filter);
    setActiveTab('orders');
    setSidebarOpen(false);
  };

  // Shared nav button style — switches to icon-only when collapsed
  const navBtn = (active, extraStyle = {}) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? 0 : '0.7rem',
    padding: collapsed ? '0.65rem 0' : '0.65rem 0.85rem',
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    cursor: 'pointer',
    background: active ? 'linear-gradient(135deg, var(--gold-50), var(--cream-100))' : 'transparent',
    color: active ? 'var(--gold-700)' : 'var(--text-secondary)',
    fontWeight: active ? 700 : 500,
    fontSize: '0.875rem',
    fontFamily: 'var(--font-sans)',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    borderLeft: collapsed ? 'none' : (active ? '3px solid var(--gold-500)' : '3px solid transparent'),
    position: 'relative',
    ...extraStyle,
  });

  // Tooltip shown on collapsed icons
  const Tooltip = ({ label }) => (
    <span style={{
      position: 'absolute',
      left: 'calc(100% + 10px)',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'var(--charcoal-900)',
      color: '#fff',
      fontSize: '0.75rem',
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      padding: '0.3rem 0.6rem',
      borderRadius: '6px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 9999,
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    }}>
      {label}
      <span style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', borderWidth: 5, borderStyle: 'solid', borderColor: 'transparent var(--charcoal-900) transparent transparent' }} />
    </span>
  );

  // Wrapper that shows tooltip on hover when collapsed
  const NavItemWrapper = ({ children, label }) => {
    const [hover, setHover] = useState(false);
    return (
      <div
        style={{ position: 'relative' }}
        onMouseEnter={() => collapsed && setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {children}
        {collapsed && hover && <Tooltip label={label} />}
      </div>
    );
  };

  const SidebarContent = ({ forMobile = false }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: collapsed && !forMobile ? '1.25rem 0.5rem' : '1.25rem 0.75rem', transition: 'padding 0.25s ease' }}>

      {/* Logo + Collapse Toggle */}
      <div style={{
        display: 'flex',
        flexDirection: collapsed && !forMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: collapsed && !forMobile ? 'center' : 'space-between',
        gap: collapsed && !forMobile ? '0.5rem' : '0.5rem',
        marginBottom: '1.5rem',
        padding: '0 0.25rem',
        transition: 'flex-direction 0s',
      }}>
        {/* Logo row: image + text label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: collapsed && !forMobile ? 0 : '0.6rem', overflow: 'hidden', transition: 'gap 0.25s ease', minWidth: 0 }}>
          {/* Logo circle — only scales uniformly */}
          <div style={{
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: '50%',
            border: '2px solid var(--gold-400)',
            boxShadow: '0 2px 8px rgba(229,138,19,0.3)',
            background: 'white',
            overflow: 'hidden',
          }}>
            <img
              src="/logo.jpeg"
              alt="Alizson Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          {/* Text — fades/slides away when collapsed */}
          <div style={{
            overflow: 'hidden',
            maxWidth: collapsed && !forMobile ? 0 : '140px',
            opacity: collapsed && !forMobile ? 0 : 1,
            transition: 'max-width 0.25s ease, opacity 0.2s ease',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--charcoal-900)' }}>Alizson</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Shield size={10} style={{ color: 'var(--gold-600)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin</span>
            </div>
          </div>
        </div>

        {/* Collapse toggle — sits beside logo when expanded, below when collapsed */}
        {!forMobile && (
          <button
            onClick={() => { setCollapsed(c => !c); setOrdersOpen(false); }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '0.2rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, borderRadius: 4,
            }}
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>

        {/* Items before Orders */}
        {NAV_ITEMS_BEFORE.map(item => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <NavItemWrapper key={item.id} label={item.label}>
              <button
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                style={navBtn(active)}
              >
                <Icon size={17} />
                {(!collapsed || forMobile) && <><span style={{ flex: 1 }}>{item.label}</span>{active && <ChevronRight size={13} />}</>}
              </button>
            </NavItemWrapper>
          );
        })}

        {/* Orders collapsible — hidden in icon-only mode (click goes straight to orders) */}
        {collapsed && !forMobile ? (
          <NavItemWrapper label="Orders">
            <button
              onClick={() => { setActiveTab('orders'); }}
              style={navBtn(activeTab === 'orders')}
            >
              <ClipboardList size={17} />
            </button>
          </NavItemWrapper>
        ) : (
          <div>
            <button
              onClick={() => setOrdersOpen(o => !o)}
              style={{
                ...navBtn(activeTab === 'orders'),
                borderRadius: ordersOpen ? 'var(--radius-sm) var(--radius-sm) 0 0' : 'var(--radius-sm)',
                background: activeTab === 'orders'
                  ? 'linear-gradient(135deg, var(--gold-50), var(--cream-100))'
                  : ordersOpen ? 'rgba(229,138,19,0.05)' : 'transparent',
              }}
            >
              <ClipboardList size={17} />
              <span style={{ flex: 1 }}>Orders</span>
              <ChevronDown
                size={14}
                style={{ transition: 'transform 0.22s ease', transform: ordersOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-muted)', flexShrink: 0 }}
              />
            </button>

            <div
              style={{
                overflow: 'hidden',
                maxHeight: ordersOpen ? '160px' : '0px',
                transition: 'max-height 0.25s ease',
                background: 'rgba(229,138,19,0.03)',
                borderLeft: '3px solid var(--gold-100)',
                borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
              }}
            >
              {ORDERS_SUB_ITEMS.map(sub => {
                const SubIcon = sub.icon;
                const subActive = activeTab === 'orders' && activeOrdersFilter === sub.filter;
                return (
                  <button
                    key={sub.filter}
                    onClick={() => handleOrdersSubItem(sub.filter)}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: '0.55rem',
                      padding: '0.52rem 0.85rem 0.52rem 1.5rem',
                      border: 'none', cursor: 'pointer',
                      background: subActive ? 'rgba(229,138,19,0.13)' : 'transparent',
                      color: subActive ? 'var(--gold-700)' : 'var(--text-muted)',
                      fontWeight: subActive ? 600 : 400,
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-sans)',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)',
                      borderRadius: 0,
                    }}
                  >
                    <SubIcon size={13} />{sub.label}
                    {subActive && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--gold-500)', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Items after Orders */}
        {NAV_ITEMS_AFTER.map(item => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <NavItemWrapper key={item.id} label={item.label}>
              <button
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                style={navBtn(active)}
              >
                <Icon size={17} />
                {(!collapsed || forMobile) && <><span style={{ flex: 1 }}>{item.label}</span>{active && <ChevronRight size={13} />}</>}
              </button>
            </NavItemWrapper>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavItemWrapper label="View Store">
          <button
            onClick={() => { sessionStorage.setItem('cz_admin_viewing_store', '1'); navigateTo('home'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: collapsed && !forMobile ? 0 : '0.6rem',
              justifyContent: collapsed && !forMobile ? 'center' : 'flex-start',
              padding: collapsed && !forMobile ? '0.6rem 0' : '0.6rem 0.85rem',
              borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-secondary)',
              fontSize: '0.85rem', fontWeight: 500, fontFamily: 'var(--font-sans)', textAlign: 'left',
              width: '100%', transition: 'all 0.2s ease',
            }}
          >
            <Cake size={16} />{(!collapsed || forMobile) && ' View Store'}
          </button>
        </NavItemWrapper>

        <NavItemWrapper label="Sign Out">
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: collapsed && !forMobile ? 0 : '0.6rem',
              justifyContent: collapsed && !forMobile ? 'center' : 'flex-start',
              padding: collapsed && !forMobile ? '0.6rem 0' : '0.6rem 0.85rem',
              borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--status-danger)',
              fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-sans)', textAlign: 'left',
              width: '100%', transition: 'all 0.2s ease',
            }}
          >
            <LogOut size={16} />{(!collapsed || forMobile) && ' Sign Out'}
          </button>
        </NavItemWrapper>
      </div>
    </div>
  );

  return (
    <OrderProvider showToast={showToast}>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

        {/* Desktop Sidebar */}
        <aside
          style={{
            width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
            flexShrink: 0,
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)',
            position: 'sticky', top: 0, height: '100vh',
            overflowY: 'auto', overflowX: 'hidden',
            transition: 'width 0.25s ease',
          }}
          className="admin-sidebar-desktop"
        >
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex' }} onClick={() => setSidebarOpen(false)}>
            <div
              style={{ width: 250, background: 'var(--bg-surface)', height: '100vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)' }}
              onClick={e => e.stopPropagation()}
            >
              <SidebarContent forMobile />
            </div>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} />
          </div>
        )}

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Mobile top bar */}
          <div
            style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 100 }}
            className="admin-mobile-topbar"
          >
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><Menu size={22} /></button>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1rem' }}>
              <img src="/logo.jpeg" alt="Logo" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
              Alizson Admin
            </span>
            <div style={{ width: 22 }} />
          </div>

          {/* Page Content */}
          <main className="admin-main-container" style={{ padding: '2rem 1.75rem' }}>{renderContent()}</main>
        </div>
      </div>
    </OrderProvider>
  );
};

export default AdminLayout;
