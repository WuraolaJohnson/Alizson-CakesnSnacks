import React, { createContext, useContext, useState, useEffect } from 'react';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  // 'bakery' or 'supplies'
  const [activeStore, setActiveStore] = useState(() => {
    const saved = localStorage.getItem('cz_active_store');
    return saved === 'supplies' ? 'supplies' : 'bakery';
  });

  useEffect(() => {
    localStorage.setItem('cz_active_store', activeStore);
  }, [activeStore]);

  const switchStore = (store) => {
    if (store === 'bakery' || store === 'supplies') {
      setActiveStore(store);
    }
  };

  const isBakery = activeStore === 'bakery';
  const isSupplies = activeStore === 'supplies';

  return (
    <StoreContext.Provider
      value={{
        activeStore,
        setActiveStore,
        switchStore,
        isBakery,
        isSupplies
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
