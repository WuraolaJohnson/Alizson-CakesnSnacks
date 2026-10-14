import React, { useState, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';
import { OrderProvider } from './context/OrderContext';

// Navigation & Layout
import Navbar from './components/Navigation/Navbar';
import Footer from './components/Navigation/Footer';
import MobileNav from './components/Navigation/MobileNav';
import { CartDrawer } from './components/Navigation/CartDrawer';

// Overlays
import SplashScreen from './components/Splash/SplashScreen';
import AuthModal from './components/Auth/AuthModal';
import ProductDetailModal from './components/Modals/ProductDetailModal';
import GiftStudioModal from './components/Modals/GiftStudioModal';
import { Toast } from './components/Common/Toast';

// Views – Customer & Tracking
import HomePage from './views/HomePage';
import BakeryStore from './views/BakeryStore';
import SuppliesStore from './views/SuppliesStore';
import CartPage from './views/CartPage';
import CheckoutPage from './views/CheckoutPage';
import OrderConfirmationPage from './views/OrderConfirmationPage';
import CustomerDashboard from './views/CustomerDashboard';
import AboutPage from './views/AboutPage';
import ContactPage from './views/ContactPage';
import FeedbackPage from './views/FeedbackPage';
import DesignSystemPage from './views/DesignSystemPage';
import OrderTrackingPage from './views/OrderTrackingPage';
import FAQPage from './views/FAQPage';

// Views – Standalone Portals
import AdminLayout from './views/admin/AdminLayout';
import RiderLayout from './views/rider/RiderLayout';
import OrderPaymentPage from './views/OrderPaymentPage';

const AppInner = () => {
  const { currentView, currentTrackingOrderId } = useApp();
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  const urlParams = new URLSearchParams(window.location.search);
  const isPayOrderUrl = urlParams.get('view') === 'pay-order';

  // Standalone Admin Portal
  if (currentView === 'admin') {
    return (
      <>
        <AdminLayout />
        <Toast />
      </>
    );
  }

  // Standalone Rider Portal
  if (currentView === 'rider') {
    return (
      <>
        <RiderLayout />
        <Toast />
      </>
    );
  }

  const renderPage = () => {
    if (isPayOrderUrl || currentView === 'pay-order') {
      return <OrderPaymentPage orderIdParam={currentTrackingOrderId} />;
    }

    switch (currentView) {
      case 'home':         return <HomePage />;
      case 'bakery':       return <BakeryStore />;
      case 'supplies':     return <SuppliesStore />;
      case 'cart':         return <CartPage />;
      case 'checkout':     return <CheckoutPage />;
      case 'confirmation': return <OrderConfirmationPage />;
      case 'dashboard':    return <CustomerDashboard />;
      case 'tracking':     return <OrderTrackingPage orderId={currentTrackingOrderId} />;
      case 'about':        return <AboutPage />;
      case 'contact':      return <ContactPage />;
      case 'feedback':     return <FeedbackPage />;
      case 'faq':          return <FAQPage />;
      case 'design':       return <DesignSystemPage />;
      default:             return <HomePage />;
    }
  };

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}

      {/* Main Customer shell */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />

        <main className="customer-shell-main" style={{ flex: 1 }}>
          {renderPage()}
        </main>

        {/* Hide footer on checkout, confirmation, cart, tracking */}
        {!['checkout', 'confirmation', 'cart', 'tracking'].includes(currentView) && <Footer />}

        <MobileNav />
      </div>

      {/* Global Customer Overlays */}
      <CartDrawer />
      <ProductDetailModal />
      <GiftStudioModal />
      <AuthModal />
      <Toast />
    </>
  );
};

// ──────────────────────────────────────────────────────────────
// Root App – wraps all providers
// ──────────────────────────────────────────────────────────────
const App = () => (
  <AppProvider>
    <StoreProvider>
      <ProductProvider>
        <CartProvider>
          <OrderProviderWrapper />
        </CartProvider>
      </ProductProvider>
    </StoreProvider>
  </AppProvider>
);

const OrderProviderWrapper = () => {
  const { showToast } = useApp();
  return (
    <OrderProvider showToast={showToast}>
      <AppInner />
    </OrderProvider>
  );
};

export default App;
