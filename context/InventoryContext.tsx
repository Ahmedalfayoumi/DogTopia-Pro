
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Item, Purchase, Sale, Supplier, Client, CompanyInfo, User, Currency } from '../types';

interface InventoryContextType {
  items: Item[];
  purchases: Purchase[];
  sales: Sale[];
  suppliers: Supplier[];
  clients: Client[];
  companyInfo: CompanyInfo;
  systemUsers: User[];
  currencies: Currency[];
  defaultCurrencyId: string;
  logo: string | null;
  favicon: string | null;
  addItem: (item: Omit<Item, 'id'>) => Item;
  updateItem: (id: string, item: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'isDefault'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addClient: (client: Omit<Client, 'id' | 'isDefault'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  recordPurchase: (purchase: Omit<Purchase, 'id'>) => void;
  updatePurchase: (id: string, purchase: Purchase) => void;
  deletePurchase: (id: string) => void;
  recordSale: (sale: Omit<Sale, 'id'>) => void;
  updateSale: (id: string, sale: Sale) => void;
  deleteSale: (id: string) => void;
  updateCompanyInfo: (info: CompanyInfo) => void;
  updateLogo: (data: string | null) => void;
  updateFavicon: (data: string | null) => void;
  addSystemUser: (user: Omit<User, 'id'>) => void;
  updateSystemUser: (id: string, userData: Partial<User>) => void;
  deleteSystemUser: (id: string) => void;
  addCurrency: (currency: Omit<Currency, 'id'>) => void;
  updateCurrency: (id: string, currency: Partial<Currency>) => void;
  deleteCurrency: (id: string) => void;
  setDefaultCurrency: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const INITIAL_CURRENCIES: Currency[] = [
  { id: '1', code: 'USD', symbol: '$', name: 'US Dollar', digits: 2, exchangeRate: 1 },
  { id: '2', code: 'EUR', symbol: '€', name: 'Euro', digits: 2, exchangeRate: 0.92 },
  { id: '3', code: 'EGP', symbol: '£', name: 'Egyptian Pound', digits: 2, exchangeRate: 48.40 },
];

const DEFAULT_SUPPLIER: Supplier = {
  id: 'Sup-0001',
  name: 'Cash Purchase',
  contactPerson: 'N/A',
  phone: 'N/A',
  email: 'N/A',
  address: 'N/A',
  isDefault: true
};

const DEFAULT_CLIENT: Client = {
  id: 'Sales-0001',
  name: 'Cash Sales',
  phone: 'N/A',
  email: 'N/A',
  address: 'N/A',
  isDefault: true
};

const INITIAL_COMPANY: CompanyInfo = {
  name: 'InventoryMaster Pro',
  address: '123 Business Way, Tech City',
  phone: '+1 234 567 890',
  email: 'support@inventorymaster.pro',
  website: 'www.inventorymaster.pro',
  language: 'English',
  localCurrencyId: '1'
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('inv_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('inv_suppliers');
    let data = saved ? JSON.parse(saved) : [];
    if (!data.find((s: Supplier) => s.id === DEFAULT_SUPPLIER.id)) {
      data = [DEFAULT_SUPPLIER, ...data];
    }
    return data;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('inv_clients');
    let data = saved ? JSON.parse(saved) : [];
    if (!data.find((c: Client) => c.id === DEFAULT_CLIENT.id)) {
      data = [DEFAULT_CLIENT, ...data];
    }
    return data;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem('inv_purchases');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('inv_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('inv_company');
    return saved ? JSON.parse(saved) : INITIAL_COMPANY;
  });

  const [systemUsers, setSystemUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('inv_users');
    return saved ? JSON.parse(saved) : [{ id: 'u-1', fullName: 'System Admin', email: 'admin@system.com', role: 'Administrator' }];
  });

  const [currencies, setCurrencies] = useState<Currency[]>(() => {
    const saved = localStorage.getItem('inv_currencies');
    return saved ? JSON.parse(saved) : INITIAL_CURRENCIES;
  });

  const [defaultCurrencyId, setDefaultCurrencyId] = useState<string>(() => {
    return localStorage.getItem('inv_default_currency') || '1';
  });

  const [logo, setLogo] = useState<string | null>(() => localStorage.getItem('inv_logo'));
  const [favicon, setFavicon] = useState<string | null>(() => localStorage.getItem('inv_favicon'));

  useEffect(() => localStorage.setItem('inv_items', JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem('inv_suppliers', JSON.stringify(suppliers)), [suppliers]);
  useEffect(() => localStorage.setItem('inv_clients', JSON.stringify(clients)), [clients]);
  useEffect(() => localStorage.setItem('inv_purchases', JSON.stringify(purchases)), [purchases]);
  useEffect(() => localStorage.setItem('inv_sales', JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem('inv_company', JSON.stringify(companyInfo)), [companyInfo]);
  useEffect(() => localStorage.setItem('inv_users', JSON.stringify(systemUsers)), [systemUsers]);
  useEffect(() => localStorage.setItem('inv_currencies', JSON.stringify(currencies)), [currencies]);
  useEffect(() => localStorage.setItem('inv_default_currency', defaultCurrencyId), [defaultCurrencyId]);

  useEffect(() => {
    if (logo) localStorage.setItem('inv_logo', logo);
    else localStorage.removeItem('inv_logo');
  }, [logo]);

  useEffect(() => {
    if (favicon) {
      localStorage.setItem('inv_favicon', favicon);
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) link.href = favicon;
      else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = favicon;
        document.head.appendChild(newLink);
      }
    } else {
      localStorage.removeItem('inv_favicon');
    }
  }, [favicon]);

  const addItem = useCallback((itemData: Omit<Item, 'id'>) => {
    const newItem: Item = { ...itemData, id: crypto.randomUUID() };
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const updateItem = useCallback((id: string, itemData: Partial<Item>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...itemData } : item));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const addSupplier = useCallback((supplierData: Omit<Supplier, 'id' | 'isDefault'>) => {
    setSuppliers(prev => {
      const numericIds = prev.map(s => parseInt(s.id.split('-')[1])).filter(n => !isNaN(n));
      const nextId = (numericIds.length > 0 ? Math.max(...numericIds) : 1) + 1;
      const formattedId = `Sup-${nextId.toString().padStart(4, '0')}`;
      return [...prev, { ...supplierData, id: formattedId, isDefault: false }];
    });
  }, []);

  const updateSupplier = useCallback((id: string, supplierData: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => (s.id === id && !s.isDefault) ? { ...s, ...supplierData } : s));
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id || s.isDefault));
  }, []);

  const addClient = useCallback((clientData: Omit<Client, 'id' | 'isDefault'>) => {
    setClients(prev => {
      const numericIds = prev.map(c => parseInt(c.id.split('-')[1])).filter(n => !isNaN(n));
      const nextId = (numericIds.length > 0 ? Math.max(...numericIds) : 1) + 1;
      const formattedId = `Sales-${nextId.toString().padStart(4, '0')}`;
      return [...prev, { ...clientData, id: formattedId, isDefault: false }];
    });
  }, []);

  const updateClient = useCallback((id: string, clientData: Partial<Client>) => {
    setClients(prev => prev.map(c => (c.id === id && !c.isDefault) ? { ...c, ...clientData } : c));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id || c.isDefault));
  }, []);

  const recordPurchase = useCallback((purchaseData: Omit<Purchase, 'id'>) => {
    setPurchases(prev => {
      const numericIds = prev.map(p => parseInt(p.id.split('-')[1])).filter(n => !isNaN(n));
      const nextId = (numericIds.length > 0 ? Math.max(...numericIds) : 0) + 1;
      const formattedId = `PUR-${nextId.toString().padStart(4, '0')}`;
      const newPurchase: Purchase = { ...purchaseData, id: formattedId };
      
      setItems(prevItems => {
        const updatedItems = [...prevItems];
        newPurchase.items.forEach(pItem => {
          const index = updatedItems.findIndex(i => i.id === pItem.itemId);
          if (index !== -1) updatedItems[index].stock += pItem.quantity;
        });
        return updatedItems;
      });
      return [newPurchase, ...prev];
    });
  }, []);

  const updatePurchase = useCallback((id: string, updatedPurchase: Purchase) => {
    setPurchases(prev => {
      const oldPurchase = prev.find(p => p.id === id);
      if (!oldPurchase) return prev;
      setItems(prevItems => {
        const updatedItems = [...prevItems];
        oldPurchase.items.forEach(pItem => {
          const index = updatedItems.findIndex(i => i.id === pItem.itemId);
          if (index !== -1) updatedItems[index].stock -= pItem.quantity;
        });
        updatedPurchase.items.forEach(pItem => {
          const index = updatedItems.findIndex(i => i.id === pItem.itemId);
          if (index !== -1) updatedItems[index].stock += pItem.quantity;
        });
        return updatedItems;
      });
      return prev.map(p => p.id === id ? updatedPurchase : p);
    });
  }, []);

  const deletePurchase = useCallback((id: string) => {
    setPurchases(prev => {
      const purchase = prev.find(p => p.id === id);
      if (purchase) {
        setItems(prevItems => {
          const updatedItems = [...prevItems];
          purchase.items.forEach(pItem => {
            const index = updatedItems.findIndex(i => i.id === pItem.itemId);
            if (index !== -1) updatedItems[index].stock -= pItem.quantity;
          });
          return updatedItems;
        });
      }
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const recordSale = useCallback((saleData: Omit<Sale, 'id'>) => {
    setSales(prev => {
      const numericIds = prev.map(s => parseInt(s.id.split('-')[1])).filter(n => !isNaN(n));
      const nextId = (numericIds.length > 0 ? Math.max(...numericIds) : 0) + 1;
      const formattedId = `INV-${nextId.toString().padStart(4, '0')}`;
      const newSale: Sale = { ...saleData, id: formattedId };
      setItems(prevItems => {
        const updatedItems = [...prevItems];
        newSale.items.forEach(sItem => {
          const index = updatedItems.findIndex(i => i.id === sItem.itemId);
          if (index !== -1) updatedItems[index].stock -= sItem.quantity;
        });
        return updatedItems;
      });
      return [newSale, ...prev];
    });
  }, []);

  const updateSale = useCallback((id: string, updatedSale: Sale) => {
    setSales(prev => {
      const oldSale = prev.find(s => s.id === id);
      if (!oldSale) return prev;
      setItems(prevItems => {
        const updatedItems = [...prevItems];
        oldSale.items.forEach(sItem => {
          const index = updatedItems.findIndex(i => i.id === sItem.itemId);
          if (index !== -1) updatedItems[index].stock += sItem.quantity;
        });
        updatedSale.items.forEach(sItem => {
          const index = updatedItems.findIndex(i => i.id === sItem.itemId);
          if (index !== -1) updatedItems[index].stock -= sItem.quantity;
        });
        return updatedItems;
      });
      return prev.map(s => s.id === id ? updatedSale : s);
    });
  }, []);

  const deleteSale = useCallback((id: string) => {
    setSales(prev => {
      const sale = prev.find(s => s.id === id);
      if (sale) {
        setItems(prevItems => {
          const updatedItems = [...prevItems];
          sale.items.forEach(sItem => {
            const index = updatedItems.findIndex(i => i.id === sItem.itemId);
            if (index !== -1) updatedItems[index].stock += sItem.quantity;
          });
          return updatedItems;
        });
      }
      return prev.filter(s => s.id !== id);
    });
  }, []);

  const addCurrency = useCallback((currency: Omit<Currency, 'id'>) => {
    setCurrencies(prev => [...prev, { ...currency, id: Date.now().toString() }]);
  }, []);

  const updateCurrency = useCallback((id: string, currency: Partial<Currency>) => {
    setCurrencies(prev => prev.map(c => c.id === id ? { ...c, ...currency } : c));
  }, []);

  const deleteCurrency = useCallback((id: string) => {
    setCurrencies(prev => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter(c => c.id !== id);
      if (id === defaultCurrencyId) setDefaultCurrencyId(filtered[0].id);
      return filtered;
    });
  }, [defaultCurrencyId]);

  const setDefaultCurrency = useCallback((id: string) => setDefaultCurrencyId(id), []);

  const updateCompanyInfo = useCallback((info: CompanyInfo) => setCompanyInfo(info), []);
  const updateLogo = useCallback((data: string | null) => setLogo(data), []);
  const updateFavicon = useCallback((data: string | null) => setFavicon(data), []);

  const addSystemUser = useCallback((userData: Omit<User, 'id'>) => {
    setSystemUsers(prev => [...prev, { ...userData, id: `u-${Date.now()}` }]);
  }, []);

  const updateSystemUser = useCallback((id: string, userData: Partial<User>) => {
    setSystemUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u));
  }, []);

  const deleteSystemUser = useCallback((id: string) => {
    setSystemUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  return (
    <InventoryContext.Provider value={{
      items, suppliers, clients, purchases, sales, companyInfo, systemUsers, currencies, defaultCurrencyId, logo, favicon,
      addItem, updateItem, deleteItem, addSupplier, updateSupplier, deleteSupplier,
      addClient, updateClient, deleteClient, recordPurchase, updatePurchase, deletePurchase, recordSale, updateSale, deleteSale,
      updateCompanyInfo, updateLogo, updateFavicon, addSystemUser, updateSystemUser, deleteSystemUser,
      addCurrency, updateCurrency, deleteCurrency, setDefaultCurrency
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};
