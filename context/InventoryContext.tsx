
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Item, Purchase, Sale, Supplier, Client, CompanyInfo, User, Currency, PaymentType, ThemeConfig } from '../types';

interface InventoryContextType {
  items: Item[];
  purchases: Purchase[];
  sales: Sale[];
  suppliers: Supplier[];
  clients: Client[];
  companyInfo: CompanyInfo;
  systemUsers: User[];
  currencies: Currency[];
  paymentTypes: PaymentType[];
  defaultCurrencyId: string;
  defaultPaymentTypeId: string;
  logo: string | null;
  favicon: string | null;
  themeConfig: ThemeConfig;
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
  updateThemeConfig: (config: ThemeConfig) => void;
  addSystemUser: (user: Omit<User, 'id'>) => void;
  updateSystemUser: (id: string, userData: Partial<User>) => void;
  deleteSystemUser: (id: string) => void;
  addCurrency: (currency: Omit<Currency, 'id'>) => Currency;
  updateCurrency: (id: string, currency: Partial<Currency>) => void;
  deleteCurrency: (id: string) => void;
  setDefaultCurrency: (id: string) => void;
  addPaymentType: (paymentType: Omit<PaymentType, 'id'>) => PaymentType;
  updatePaymentType: (id: string, paymentType: Partial<PaymentType>) => void;
  deletePaymentType: (id: string) => void;
  setDefaultPaymentType: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const INITIAL_CURRENCY: Currency = { 
  id: '1', 
  code: 'JOD', 
  symbol: 'JD', 
  name: 'Jordanian Dinar', 
  digits: 3, 
  exchangeRate: 1 
};

const INITIAL_PAYMENT_TYPES: PaymentType[] = [
  { id: 'pt-1', name: 'Cash', isDefault: true },
  { id: 'pt-2', name: 'Bank Transfer' },
  { id: 'pt-3', name: 'Credit Card' },
  { id: 'pt-4', name: 'Credit' }
];

const INITIAL_THEME: ThemeConfig = {
  primaryColor: '#4f46e5',
  fontFamily: 'Inter'
};

const SEED_ITEMS: Item[] = [
  { id: 'i-1', name: 'iPhone 15 Pro', barcode: '1942538123', description: 'Apple Smartphone 256GB', unitPrice: 950, stock: 42, purchaseUnit: 'Box', storageUnit: 'Pack', conversionPurchaseToStorage: 1, sellingUnit: 'Piece', conversionStorageToSelling: 1 },
  { id: 'i-2', name: 'MacBook Air M2', barcode: '1942530044', description: 'Apple Laptop 13-inch', unitPrice: 1150, stock: 15, purchaseUnit: 'Box', storageUnit: 'Unit', conversionPurchaseToStorage: 1, sellingUnit: 'Piece', conversionStorageToSelling: 1 },
  { id: 'i-3', name: 'Logitech MX Master 3S', barcode: '0978551703', description: 'Wireless Performance Mouse', unitPrice: 85, stock: 85, purchaseUnit: 'Carton', storageUnit: 'Box', conversionPurchaseToStorage: 10, sellingUnit: 'Piece', conversionStorageToSelling: 1 },
  { id: 'i-4', name: 'Samsung 27" Odyssey G7', barcode: '8806090514', description: 'Curved Gaming Monitor', unitPrice: 450, stock: 24, purchaseUnit: 'Pallet', storageUnit: 'Box', conversionPurchaseToStorage: 5, sellingUnit: 'Piece', conversionStorageToSelling: 1 },
  { id: 'i-5', name: 'Keychron K2 V2', barcode: '4895248805', description: 'Mechanical Wireless Keyboard', unitPrice: 95, stock: 60, purchaseUnit: 'Box', storageUnit: 'Unit', conversionPurchaseToStorage: 1, sellingUnit: 'Piece', conversionStorageToSelling: 1 },
];

const DEFAULT_SUPPLIER: Supplier = { id: 'Sup-0001', name: 'Cash Purchase', contactPerson: 'N/A', phone: 'N/A', email: 'N/A', address: 'N/A', isDefault: true };
const SEED_SUPPLIERS: Supplier[] = [
  DEFAULT_SUPPLIER,
  { id: 'Sup-0002', name: 'TechDistro Jordan', contactPerson: 'Zaid Omar', phone: '079-111-2222', email: 'sales@techdistro.jo', address: 'Amman, Gardens St.' },
  { id: 'Sup-0003', name: 'MegaParts Ltd', contactPerson: 'Laila H.', phone: '077-333-4444', email: 'info@megaparts.com', address: 'Zarqa Free Zone' },
  { id: 'Sup-0004', name: 'Global Supply Chain', contactPerson: 'Mark Wilson', phone: '+44-20-1234', email: 'mark@globalsupply.com', address: 'London, UK' },
  { id: 'Sup-0005', name: 'Elite Hardware', contactPerson: 'Rami K.', phone: '06-555-6666', email: 'rami@elite.jo', address: 'Irbid, City Center' },
  { id: 'Sup-0006', name: 'Prime Components', contactPerson: 'Sara T.', phone: '078-777-8888', email: 'sara@prime.jo', address: 'Aqaba, Port Area' },
];

const DEFAULT_CLIENT: Client = { id: 'Sales-0001', name: 'Cash Sales', phone: 'N/A', email: 'N/A', address: 'N/A', isDefault: true };
const SEED_CLIENTS: Client[] = [
  DEFAULT_CLIENT,
  { id: 'Sales-0002', name: 'Ahmad Corp Solutions', phone: '079-555-1212', email: 'ahmad@corp.jo', address: 'Abdoun, Amman' },
  { id: 'Sales-0003', name: 'Sarah Design Studio', phone: '077-888-9999', email: 'sarah@studio.jo', address: 'Weibdeh, Amman' },
  { id: 'Sales-0004', name: 'TechHub Coworking', phone: '06-444-3333', email: 'admin@techhub.jo', address: 'Sweifieh Village' },
  { id: 'Sales-0005', name: 'Jordan University IT', phone: '06-535-5000', email: 'it@ju.edu.jo', address: 'University St, Amman' },
  { id: 'Sales-0006', name: 'Future Systems LLC', phone: '078-222-3344', email: 'sales@future.com', address: 'Khalda, Amman' },
];

const SEED_PURCHASES: Purchase[] = [
  { id: 'PUR-0001', supplierId: 'Sup-0002', supplierName: 'TechDistro Jordan', date: '2023-12-01', grandTotal: 9500, paymentTypeId: 'pt-1', items: [{ itemId: 'i-1', quantity: 10, unitPrice: 950, total: 9500 }] },
  { id: 'PUR-0002', supplierId: 'Sup-0003', supplierName: 'MegaParts Ltd', date: '2023-12-05', grandTotal: 5750, paymentTypeId: 'pt-4', items: [{ itemId: 'i-2', quantity: 5, unitPrice: 1150, total: 5750 }] },
  { id: 'PUR-0003', supplierId: 'Sup-0004', supplierName: 'Global Supply Chain', date: '2023-12-10', grandTotal: 850, paymentTypeId: 'pt-2', items: [{ itemId: 'i-3', quantity: 10, unitPrice: 85, total: 850 }] },
  { id: 'PUR-0004', supplierId: 'Sup-0005', supplierName: 'Elite Hardware', date: '2023-12-15', grandTotal: 2250, paymentTypeId: 'pt-4', items: [{ itemId: 'i-4', quantity: 5, unitPrice: 450, total: 2250 }] },
  { id: 'PUR-0005', supplierId: 'Sup-0006', supplierName: 'Prime Components', date: '2023-12-20', grandTotal: 950, paymentTypeId: 'pt-1', items: [{ itemId: 'i-5', quantity: 10, unitPrice: 95, total: 950 }] },
];

const SEED_SALES: Sale[] = [
  { id: 'INV-0001', clientId: 'Sales-0002', customerName: 'Ahmad Corp Solutions', date: '2024-01-05', grandTotal: 1050, paymentTypeId: 'pt-1', items: [{ itemId: 'i-1', quantity: 1, unitPrice: 1050, total: 1050 }] },
  { id: 'INV-0002', clientId: 'Sales-0003', customerName: 'Sarah Design Studio', date: '2024-01-10', grandTotal: 1250, paymentTypeId: 'pt-4', items: [{ itemId: 'i-2', quantity: 1, unitPrice: 1250, total: 1250 }] },
  { id: 'INV-0003', clientId: 'Sales-0004', customerName: 'TechHub Coworking', date: '2024-01-15', grandTotal: 200, paymentTypeId: 'pt-3', items: [{ itemId: 'i-3', quantity: 2, unitPrice: 100, total: 200 }] },
  { id: 'INV-0004', clientId: 'Sales-0005', customerName: 'Jordan University IT', date: '2024-01-20', grandTotal: 1500, paymentTypeId: 'pt-4', items: [{ itemId: 'i-4', quantity: 3, unitPrice: 500, total: 1500 }] },
  { id: 'INV-0005', clientId: 'Sales-0006', customerName: 'Future Systems LLC', date: '2024-01-25', grandTotal: 240, paymentTypeId: 'pt-2', items: [{ itemId: 'i-5', quantity: 2, unitPrice: 120, total: 240 }] },
];

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
    return saved ? JSON.parse(saved) : SEED_ITEMS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('inv_suppliers');
    return saved ? JSON.parse(saved) : SEED_SUPPLIERS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('inv_clients');
    return saved ? JSON.parse(saved) : SEED_CLIENTS;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem('inv_purchases');
    return saved ? JSON.parse(saved) : SEED_PURCHASES;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('inv_sales');
    return saved ? JSON.parse(saved) : SEED_SALES;
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
    return saved ? JSON.parse(saved) : [INITIAL_CURRENCY];
  });

  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>(() => {
    const saved = localStorage.getItem('inv_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENT_TYPES;
  });

  const [defaultCurrencyId, setDefaultCurrencyId] = useState<string>(() => {
    return localStorage.getItem('inv_default_currency') || '1';
  });

  const [defaultPaymentTypeId, setDefaultPaymentTypeId] = useState<string>(() => {
    const saved = localStorage.getItem('inv_default_payment');
    return saved || (paymentTypes.find(pt => pt.isDefault)?.id || paymentTypes[0]?.id || '');
  });

  const [logo, setLogo] = useState<string | null>(() => localStorage.getItem('inv_logo'));
  const [favicon, setFavicon] = useState<string | null>(() => localStorage.getItem('inv_favicon'));
  
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('inv_theme');
    return saved ? JSON.parse(saved) : INITIAL_THEME;
  });

  useEffect(() => localStorage.setItem('inv_items', JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem('inv_suppliers', JSON.stringify(suppliers)), [suppliers]);
  useEffect(() => localStorage.setItem('inv_clients', JSON.stringify(clients)), [clients]);
  useEffect(() => localStorage.setItem('inv_purchases', JSON.stringify(purchases)), [purchases]);
  useEffect(() => localStorage.setItem('inv_sales', JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem('inv_company', JSON.stringify(companyInfo)), [companyInfo]);
  useEffect(() => localStorage.setItem('inv_users', JSON.stringify(systemUsers)), [systemUsers]);
  useEffect(() => localStorage.setItem('inv_currencies', JSON.stringify(currencies)), [currencies]);
  useEffect(() => localStorage.setItem('inv_payments', JSON.stringify(paymentTypes)), [paymentTypes]);
  useEffect(() => localStorage.setItem('inv_default_currency', defaultCurrencyId), [defaultCurrencyId]);
  useEffect(() => localStorage.setItem('inv_default_payment', defaultPaymentTypeId), [defaultPaymentTypeId]);
  useEffect(() => localStorage.setItem('inv_theme', JSON.stringify(themeConfig)), [themeConfig]);

  useEffect(() => {
    if (logo) localStorage.setItem('inv_logo', logo);
    else localStorage.removeItem('inv_logo');
  }, [logo]);

  // Apply Favicon
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

  // Apply Theme Styles (Primary Color and Font)
  useEffect(() => {
    const root = document.documentElement;
    const styleId = 'dynamic-theme-overrides';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    // Convert hex to rgb for opacity variants if needed, or just use variable injection
    // We override common Tailwind classes that use 'indigo' with the dynamic color
    styleTag.innerHTML = `
      :root {
        --primary-color: ${themeConfig.primaryColor};
        --primary-light: ${themeConfig.primaryColor}15; /* ~8% opacity */
      }
      body {
        font-family: '${themeConfig.fontFamily}', sans-serif !important;
      }
      /* Global Indigo Class Overrides */
      .bg-indigo-600 { background-color: var(--primary-color) !important; }
      .hover\\:bg-indigo-700:hover { filter: brightness(0.9); }
      .text-indigo-600 { color: var(--primary-color) !important; }
      .text-indigo-700 { color: var(--primary-color) !important; filter: brightness(0.85); }
      .bg-indigo-50 { background-color: var(--primary-light) !important; }
      .border-indigo-600 { border-color: var(--primary-color) !important; }
      .border-indigo-100 { border-color: var(--primary-light) !important; }
      .focus\\:ring-indigo-500:focus { --tw-ring-color: var(--primary-color) !important; }
    `;
  }, [themeConfig]);

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

  const addCurrency = useCallback((currencyData: Omit<Currency, 'id'>) => {
    const newCurrency: Currency = { ...currencyData, id: Date.now().toString() };
    setCurrencies(prev => [...prev, newCurrency]);
    return newCurrency;
  }, []);

  const updateCurrency = useCallback((id: string, currencyData: Partial<Currency>) => {
    setCurrencies(prev => prev.map(c => c.id === id ? { ...c, ...currencyData } : c));
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

  const addPaymentType = useCallback((data: Omit<PaymentType, 'id'>) => {
    const newPt: PaymentType = { ...data, id: `pt-${Date.now()}` };
    setPaymentTypes(prev => [...prev, newPt]);
    return newPt;
  }, []);

  const updatePaymentType = useCallback((id: string, data: Partial<PaymentType>) => {
    setPaymentTypes(prev => prev.map(pt => pt.id === id ? { ...pt, ...data } : pt));
  }, []);

  const deletePaymentType = useCallback((id: string) => {
    setPaymentTypes(prev => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter(pt => pt.id !== id);
      if (id === defaultPaymentTypeId) setDefaultPaymentTypeId(filtered[0].id);
      return filtered;
    });
  }, [defaultPaymentTypeId]);

  const setDefaultPaymentType = useCallback((id: string) => {
    setDefaultPaymentTypeId(id);
    setPaymentTypes(prev => prev.map(pt => ({ ...pt, isDefault: pt.id === id })));
  }, []);

  const updateCompanyInfo = useCallback((info: CompanyInfo) => setCompanyInfo(info), []);
  const updateLogo = useCallback((data: string | null) => setLogo(data), []);
  const updateFavicon = useCallback((data: string | null) => setFavicon(data), []);
  const updateThemeConfig = useCallback((config: ThemeConfig) => setThemeConfig(config), []);

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
      items, suppliers, clients, purchases, sales, companyInfo, systemUsers, currencies, paymentTypes, defaultCurrencyId, defaultPaymentTypeId, logo, favicon, themeConfig,
      addItem, updateItem, deleteItem, addSupplier, updateSupplier, deleteSupplier,
      addClient, updateClient, deleteClient, recordPurchase, updatePurchase, deletePurchase, recordSale, updateSale, deleteSale,
      updateCompanyInfo, updateLogo, updateFavicon, updateThemeConfig, addSystemUser, updateSystemUser, deleteSystemUser,
      addCurrency, updateCurrency, deleteCurrency, setDefaultCurrency,
      addPaymentType, updatePaymentType, deletePaymentType, setDefaultPaymentType
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