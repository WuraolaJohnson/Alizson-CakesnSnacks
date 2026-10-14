import React from 'react';
import { Home, Grid3X3, Gift, ShoppingCart, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';

const MobileNav = () => {
  const { navigateTo, currentView, openGiftStudio } = useApp();
  const { totalItemsCount } = useCart();

  const items = [
    { id: 'home', label: 'Home', icon: <Home size={22} /> },
    { id: 'bakery', label: 'Store', icon: <Grid3X3 size={22} /> },
    { id: 'gift', label: 'Gift Studio', icon: <Gift size={22} />, isGift: true },
    { id: 'cart', label: 'Cart', icon: <ShoppingCart size={22} />, badge: totalItemsCount > 0 ? totalItemsCount : null },
    { id: 'dashboard', label: 'Account', icon: <User size={22} /> },
  ];

  return (
    <div className="mobile-bottom-bar">
      <nav className="mobile-bottom-nav">
        {items.map(item => (
          <button
            key={item.id}
            className={`mobile-nav-btn ${currentView === item.id ? 'active' : ''}`}
            onClick={() => {
              if (item.isGift) {
                openGiftStudio();
              } else {
                navigateTo(item.id);
              }
            }}
          >
            <div style={{ position: 'relative' }}>
              {item.icon}
              {item.badge && (
                <span className="badge-count">{item.badge > 9 ? '9+' : item.badge}</span>
              )}
            </div>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default MobileNav;
