import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChange, signOut as authSignOut, getCurrentUser, getPendingOAuthPortal } from '../services/authService';

const AppContext = createContext();

const DEFAULT_COLORS = {
  gold500: '#E58A13',
  gold600: '#C6720A',
  burgundy700: '#7E152B',
  burgundy900: '#4D0A18'
};

// Apply custom colors to CSS variables
function applyColors(colors) {
  const root = document.documentElement;
  if (!colors) return;
  if (colors.gold500)    root.style.setProperty('--gold-500', colors.gold500);
  if (colors.gold600)    root.style.setProperty('--gold-600', colors.gold600);
  if (colors.burgundy700) root.style.setProperty('--burgundy-700', colors.burgundy700);
  if (colors.burgundy900) root.style.setProperty('--burgundy-900', colors.burgundy900);
}

export const AppProvider = ({ children }) => {
  // ── Navigation ──────────────────────────────────────────────
  const getInitialView = () => {
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    // Returning from Google (?code=… or ?error=…) to the portal it was started from
    const params = new URLSearchParams(window.location.search);
    if (params.has('code') || params.has('error') || params.has('portal')) {
      const portal = getPendingOAuthPortal();
      if (portal === 'admin' || portal === 'rider') return portal;
    }
    if (hash === '#admin' || search.includes('admin') || path.endsWith('/admin')) {
      return 'admin';
    }
    if (hash === '#rider' || search.includes('rider') || path.endsWith('/rider')) {
      return 'rider';
    }
    return 'home';
  };

  const [currentView, setCurrentView] = useState(getInitialView);
  const [currentTrackingOrderId, setCurrentTrackingOrderId] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('overview');

  const navigateTo = useCallback((view, tab = null) => {
    if (view === 'wishlist') {
      setCurrentView('dashboard');
      setDashboardTab('wishlist');
    } else if (view === 'orders' || view === 'active-orders') {
      setCurrentView('dashboard');
      setDashboardTab('active-orders');
    } else if (view === 'purchase-history' || view === 'history') {
      setCurrentView('dashboard');
      setDashboardTab('purchase-history');
    } else if (view === 'dashboard') {
      setCurrentView('dashboard');
      setDashboardTab(tab || 'overview');
    } else {
      setCurrentView(view);
      if (tab) setDashboardTab(tab);
    }

    if (view === 'admin') {
      window.location.hash = 'admin';
    } else if (view === 'rider') {
      window.location.hash = 'rider';
    } else if (window.location.hash === '#admin' || window.location.hash === '#rider') {
      history.pushState("", document.title, window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToTracking = useCallback((orderId) => {
    setCurrentTrackingOrderId(orderId);
    navigateTo('tracking');
  }, [navigateTo]);

  // Listen for hidden URL navigation (#admin, #rider) & secret keyboard shortcuts
  useEffect(() => {
    const handleUrlCheck = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash === '#admin' || search.includes('admin') || path.endsWith('/admin')) {
        setCurrentView('admin');
      } else if (hash === '#rider' || search.includes('rider') || path.endsWith('/rider')) {
        setCurrentView('rider');
      }
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setCurrentView('admin');
        window.location.hash = 'admin';
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setCurrentView('rider');
        window.location.hash = 'rider';
      }
    };

    window.addEventListener('hashchange', handleUrlCheck);
    window.addEventListener('popstate', handleUrlCheck);
    window.addEventListener('keydown', handleKeyDown);

    handleUrlCheck();

    return () => {
      window.removeEventListener('hashchange', handleUrlCheck);
      window.removeEventListener('popstate', handleUrlCheck);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  // ── Toast notifications ──────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Wishlist ─────────────────────────────────────────────────
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('cz_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('cz_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = useCallback((productId) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  // ── Product Quick-View Modal ─────────────────────────────────
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);

  const openProductModal = useCallback((product) => {
    setSelectedProductForModal(product);
    setIsQuickViewOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeProductModal = useCallback(() => {
    setIsQuickViewOpen(false);
    setSelectedProductForModal(null);
    document.body.style.overflow = '';
  }, []);

  // ── Gift Studio Modal ───────────────────────────────────────
  const [isGiftStudioOpen, setIsGiftStudioOpen] = useState(false);

  const openGiftStudio = useCallback(() => {
    setIsGiftStudioOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeGiftStudio = useCallback(() => {
    setIsGiftStudioOpen(false);
    document.body.style.overflow = '';
  }, []);

  // ── Cart Drawer ──────────────────────────────────────────────
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = (isCartDrawerOpen || isGiftStudioOpen) ? 'hidden' : '';
  }, [isCartDrawerOpen, isGiftStudioOpen]);

  // ── Search & Category filter ─────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');

  // ── Auth / Current User ──────────────────────────────────────
  const DEFAULT_SAVED_ADDRESSES = [
    {
      id: 'addr-1',
      label: 'Home (Olusegun Obasanjo Hilltop)',
      address: 'House 14, Presidential Boulevard, Olusegun Obasanjo Hilltop, Abeokuta',
      lga: 'Abeokuta South',
      city: 'Abeokuta',
      state: 'Ogun State',
      phone: '+234 803 555 0192',
      isDefault: true
    },
    {
      id: 'addr-2',
      label: 'Office (Ibara Housing Estate)',
      address: 'Suite 4B, Commerce House, Ibara Housing Estate, Abeokuta',
      lga: 'Abeokuta South',
      city: 'Abeokuta',
      state: 'Ogun State',
      phone: '+234 802 111 2233',
      isDefault: false
    }
  ];

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cz_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.savedAddresses || parsed.savedAddresses.length === 0) {
          parsed.savedAddresses = DEFAULT_SAVED_ADDRESSES;
        }
        return parsed;
      }
      return null;
    } catch { return null; }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup'

  const login = useCallback((userData) => {
    const userWithAddresses = {
      ...userData,
      savedAddresses: userData.savedAddresses && userData.savedAddresses.length > 0 ? userData.savedAddresses : DEFAULT_SAVED_ADDRESSES
    };
    setCurrentUser(userWithAddresses);
    localStorage.setItem('cz_user', JSON.stringify(userWithAddresses));
    setIsAuthModalOpen(false);
    showToast(`Welcome back, ${userData.name}! 🎉`, 'success');
  }, [showToast]);

  // ── Checkout requires an account ─────────────────────────────
  // Guests are asked to sign in first; once they do (email or Google —
  // sessionStorage survives the Google redirect) they continue to checkout.
  const CHECKOUT_AFTER_LOGIN_KEY = 'cz_checkout_after_login';

  const goToCheckout = useCallback(() => {
    if (currentUser) {
      navigateTo('checkout');
      return;
    }
    try { sessionStorage.setItem(CHECKOUT_AFTER_LOGIN_KEY, '1'); } catch { /* ignore */ }
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
    showToast('Please sign in or create an account to place your order.', 'info');
  }, [currentUser, navigateTo, showToast]);

  useEffect(() => {
    if (!currentUser) return;
    let pending = false;
    try { pending = sessionStorage.getItem(CHECKOUT_AFTER_LOGIN_KEY) === '1'; } catch { /* ignore */ }
    if (pending) {
      try { sessionStorage.removeItem(CHECKOUT_AFTER_LOGIN_KEY); } catch { /* ignore */ }
      navigateTo('checkout');
    }
  }, [currentUser, navigateTo]);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    localStorage.removeItem('cz_user');
    await authSignOut();
    navigateTo('home');
    showToast('You have been logged out.', 'info');
  }, [navigateTo, showToast]);

  // ── Supabase Session Sync ────────────────────────────────────
  useEffect(() => {
    // Try to restore session from Supabase on mount
    getCurrentUser().then(user => {
      if (user) {
        setCurrentUser(prev => {
          if (prev) return prev; // localStorage user already present
          localStorage.setItem('cz_user', JSON.stringify(user));
          return user;
        });
      }
    });

    // Subscribe to auth state changes (login/logout in other tabs)
    const unsubscribe = onAuthStateChange((event, user) => {
      if (event === 'SIGNED_IN' && user) {
        setCurrentUser(user);
        localStorage.setItem('cz_user', JSON.stringify(user));
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('cz_user');
      }
    });

    return unsubscribe;
  }, []);

  const updateUserProfile = useCallback((profileData) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...profileData };
      localStorage.setItem('cz_user', JSON.stringify(updated));
      return updated;
    });
    showToast('Profile details updated successfully! ✨', 'success');
  }, [showToast]);

  const addAddress = useCallback((newAddress) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const currentAddresses = prev.savedAddresses && prev.savedAddresses.length > 0 ? prev.savedAddresses : DEFAULT_SAVED_ADDRESSES;
      let updatedAddresses = [...currentAddresses];
      if (newAddress.isDefault) {
        updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
      }
      const addrWithId = {
        ...newAddress,
        id: newAddress.id || `addr-${Date.now()}`,
        isDefault: newAddress.isDefault || updatedAddresses.length === 0
      };
      updatedAddresses.push(addrWithId);
      const updatedUser = { ...prev, savedAddresses: updatedAddresses };
      localStorage.setItem('cz_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
    showToast('New address saved successfully! 📍', 'success');
  }, [showToast]);

  const updateAddress = useCallback((addrId, updatedData) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const currentAddresses = prev.savedAddresses && prev.savedAddresses.length > 0 ? prev.savedAddresses : DEFAULT_SAVED_ADDRESSES;
      let updatedAddresses = currentAddresses.map(a => {
        if (a.id === addrId) {
          return { ...a, ...updatedData };
        }
        if (updatedData.isDefault) {
          return { ...a, isDefault: false };
        }
        return a;
      });
      const updatedUser = { ...prev, savedAddresses: updatedAddresses };
      localStorage.setItem('cz_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
    showToast('Address updated! ✏️', 'success');
  }, [showToast]);

  const deleteAddress = useCallback((addrId) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const currentAddresses = prev.savedAddresses || [];
      const updatedAddresses = currentAddresses.filter(a => a.id !== addrId);
      if (updatedAddresses.length > 0 && !updatedAddresses.some(a => a.isDefault)) {
        updatedAddresses[0].isDefault = true;
      }
      const updatedUser = { ...prev, savedAddresses: updatedAddresses };
      localStorage.setItem('cz_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
    showToast('Address removed. 🗑️', 'info');
  }, [showToast]);

  const setDefaultAddress = useCallback((addrId) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const currentAddresses = prev.savedAddresses && prev.savedAddresses.length > 0 ? prev.savedAddresses : DEFAULT_SAVED_ADDRESSES;
      const updatedAddresses = currentAddresses.map(a => ({
        ...a,
        isDefault: a.id === addrId
      }));
      const updatedUser = { ...prev, savedAddresses: updatedAddresses };
      localStorage.setItem('cz_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
    showToast('Default delivery address updated! ⭐', 'success');
  }, [showToast]);

  // ── Last Placed Order (for confirmation page) ────────────────
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

  // ── Theme ────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cz_theme') || 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('cz_theme', next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ── Custom Color Palette ─────────────────────────────────────
  const [customColors, setCustomColors] = useState(() => {
    try {
      const saved = localStorage.getItem('cz_colors');
      return saved ? JSON.parse(saved) : DEFAULT_COLORS;
    } catch { return DEFAULT_COLORS; }
  });

  useEffect(() => {
    applyColors(customColors);
    localStorage.setItem('cz_colors', JSON.stringify(customColors));
  }, [customColors]);

  const resetCustomColors = useCallback(() => {
    setCustomColors(DEFAULT_COLORS);
    showToast('Colors reset to default!', 'info');
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        // Navigation
        currentView,
        navigateTo,
        goToCheckout,
        dashboardTab,
        setDashboardTab,
        currentTrackingOrderId,
        navigateToTracking,
        // Toasts
        toasts,
        showToast,
        removeToast,
        // Wishlist
        wishlist,
        toggleWishlist,
        // Product modal
        isQuickViewOpen,
        selectedProductForModal,
        openProductModal,
        closeProductModal,
        // Gift Studio modal
        isGiftStudioOpen,
        openGiftStudio,
        closeGiftStudio,
        // Cart drawer
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        // Search & filters
        searchQuery,
        setSearchQuery,
        activeCategoryFilter,
        setActiveCategoryFilter,
        // Auth
        currentUser,
        setCurrentUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        login,
        logout,
        updateUserProfile,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        // Order
        lastPlacedOrder,
        setLastPlacedOrder,
        // Theme
        theme,
        toggleTheme,
        // Colors
        customColors,
        setCustomColors,
        resetCustomColors,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
