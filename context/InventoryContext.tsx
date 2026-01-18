
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Item, Purchase, PurchaseReturn, Sale, SaleReturn, Supplier, Client, CompanyInfo, User, Currency, PaymentType, ThemeConfig, InventoryRecord, Voucher } from '../types';

interface InventoryContextType {
  items: Item[];
  purchases: Purchase[];
  purchaseReturns: PurchaseReturn[];
  sales: Sale[];
  saleReturns: SaleReturn[];
  suppliers: Supplier[];
  clients: Client[];
  vouchers: Voucher[];
  inventoryAuditRecords: InventoryRecord[];
  companyInfo: CompanyInfo;
  systemUsers: User[];
  currencies: Currency[];
  paymentTypes: PaymentType[];
  defaultCurrencyId: string;
  defaultPaymentTypeId: string;
  logo: string | null;
  favicon: string | null;
  themeConfig: ThemeConfig;
  addItem: (item: Omit<Item, 'id' | 'stock'>) => Item;
  updateItem: (id: string, item: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  bulkUpdateItemStock: (updates: { itemId: string, newStock: number }[]) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'isDefault'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addClient: (client: Omit<Client, 'id' | 'isDefault'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addInventoryAuditRecord: (record: Omit<InventoryRecord, 'id'>) => InventoryRecord;
  updateInventoryAuditRecord: (id: string, record: Partial<InventoryRecord>) => void;
  deleteInventoryAuditRecord: (id: string) => void;
  recordPurchase: (purchase: Omit<Purchase, 'id'>) => Purchase;
  updatePurchase: (id: string, purchase: Purchase) => void;
  deletePurchase: (id: string) => void;
  recordPurchaseReturn: (pReturn: Omit<PurchaseReturn, 'id'>) => PurchaseReturn;
  deletePurchaseReturn: (id: string) => void;
  recordSale: (sale: Omit<Sale, 'id'>) => Sale;
  updateSale: (id: string, sale: Sale) => void;
  deleteSale: (id: string) => void;
  recordSaleReturn: (sReturn: Omit<SaleReturn, 'id'>) => SaleReturn;
  deleteSaleReturn: (id: string) => void;
  addVoucher: (voucher: Omit<Voucher, 'id'>) => Voucher;
  updateVoucher: (id: string, voucher: Partial<Voucher>) => void;
  deleteVoucher: (id: string) => void;
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

const SEED_CURRENCIES: Currency[] = [
  INITIAL_CURRENCY,
  {
    id: '2',
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    digits: 2,
    exchangeRate: 0.787
  }
];

const INITIAL_PAYMENT_TYPES: PaymentType[] = [
  { id: 'pt-1', name: 'Cash', isDefault: true },
  { id: 'pt-2', name: 'Bank Transfer' },
  { id: 'pt-3', name: 'Credit Card' },
  { id: 'pt-4', name: 'Credit' }
];

const INITIAL_THEME: ThemeConfig = {
  colors: ['#4f46e5', '#10b981'],
  fontFamily: 'Inter'
};

const SEED_ITEMS: Item[] = [
  { id: 'i-1', name: 'iPhone 15 Pro', barcode: '1942538123', description: 'Apple Smartphone 256GB', unitPrice: 950, openingStock: 30, stock: 42, purchaseUnit: 'Box', storageUnit: 'Pack', conversionPurchaseToStorage: 1, sellingUnit: 'Piece', conversionStorageToSelling: 1 },
  { id: 'i-2', name: 'MacBook Air M2', barcode: '1942530044', description: 'Apple Laptop 13-inch', unitPrice: 1150, openingStock: 10, stock: 15, purchaseUnit: 'Box', storageUnit: 'Unit', conversionPurchaseToStorage: 1, sellingUnit: 'Piece', conversionStorageToSelling: 1 },
  { id: 'i-3', name: 'Logitech MX Master 3S', barcode: '0978551703', description: 'Wireless Performance Mouse', unitPrice: 85, openingStock: 70, stock: 85, purchaseUnit: 'Carton', storageUnit: 'Box', conversionPurchaseToStorage: 10, sellingUnit: 'Piece', conversionStorageToSelling: 1 },
  { id: 'i-4', name: 'Samsung 27" Odyssey G7', barcode: '8806090514', description: 'Curved Gaming Monitor', unitPrice: 450, openingStock: 20, stock: 24, purchaseUnit: 'Pallet', storageUnit: 'Box', conversionPurchaseToStorage: 5, sellingUnit: 'Piece', conversionStorageToSelling: 1 },
  { id: 'i-5', name: 'Keychron K2 V2', barcode: '4895248805', description: 'Mechanical Wireless Keyboard', unitPrice: 95, openingStock: 50, stock: 60, purchaseUnit: 'Box', storageUnit: 'Unit', conversionPurchaseToStorage: 1, sellingUnit: 'Piece', conversionStorageToSelling: 1 },
];

const SEED_AUDITS: InventoryRecord[] = [
  {
    id: 'AUD-001',
    date: '2024-01-15',
    status: 'Adjusted',
    totalImpact: -180,
    items: [
      { itemId: 'i-1', name: 'iPhone 15 Pro', barcode: '1942538123', systemQty: 45, physicalQty: 42, difference: -3, impactValue: -2850, unitPrice: 950 }
    ]
  }
];

const SEED_SUPPLIERS: Supplier[] = [
  { id: 'Sup-0001', name: 'Cash Purchase', contactPerson: 'N/A', phone: 'N/A', email: 'N/A', address: 'N/A', type: 'Local', isDefault: true },
  { id: 'Sup-0002', name: 'TechDistro Jordan', contactPerson: 'Zaid Omar', phone: '079-111-2222', email: 'sales@techdistro.jo', address: 'Amman, Gardens St.', type: 'Local' },
  { id: 'Sup-0003', name: 'Global Components Ltd', contactPerson: 'Chen Wei', phone: '+86-10-8888-9999', email: 'export@globalcomp.cn', address: 'Shenzhen, China', type: 'Overseas' },
  { id: 'Sup-0004', name: 'EuroParts GmbH', contactPerson: 'Hans Mueller', phone: '+49-30-555-0123', email: 'info@europarts.de', address: 'Berlin, Germany', type: 'Overseas' }
];

const SEED_CLIENTS: Client[] = [
  { id: 'Sales-0001', name: 'Cash Sales', phone: 'N/A', email: 'N/A', address: 'N/A', isDefault: true },
  { id: 'Sales-0002', name: 'Ahmad Corp Solutions', phone: '079-555-1212', email: 'ahmad@corp.jo', address: 'Abdoun, Amman' }
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

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    const saved = localStorage.getItem('inv_vouchers');
    return saved ? JSON.parse(saved) : [];
  });

  const [inventoryAuditRecords, setInventoryAuditRecords] = useState<InventoryRecord[]>(() => {
    const saved = localStorage.getItem('inv_audits');
    return saved ? JSON.parse(saved) : SEED_AUDITS;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem('inv_purchases');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>(() => {
    const saved = localStorage.getItem('inv_purchase_returns');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('inv_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [saleReturns, setSaleReturns] = useState<SaleReturn[]>(() => {
    const saved = localStorage.getItem('inv_sale_returns');
    return saved ? JSON.parse(saved) : [];
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('inv_company');
    return saved ? JSON.parse(saved) : INITIAL_COMPANY;
  });

  const [systemUsers, setSystemUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('inv_users');
    return saved ? JSON.parse(saved) : [{ 
      id: 'u-1', 
      firstName: 'System', 
      middleName: '', 
      thirdName: '', 
      lastName: 'Admin', 
      email: 'admin@system.com', 
      mobile: '000000000',
      username: 'admin',
      role: 'Super Admin' 
    }];
  });

  const [currencies, setCurrencies] = useState<Currency[]>(() => {
    const saved = localStorage.getItem('inv_currencies');
    return saved ? JSON.parse(saved) : SEED_CURRENCIES;
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
  useEffect(() => localStorage.setItem('inv_vouchers', JSON.stringify(vouchers)), [vouchers]);
  useEffect(() => localStorage.setItem('inv_audits', JSON.stringify(inventoryAuditRecords)), [inventoryAuditRecords]);
  useEffect(() => localStorage.setItem('inv_purchases', JSON.stringify(purchases)), [purchases]);
  useEffect(() => localStorage.setItem('inv_purchase_returns', JSON.stringify(purchaseReturns)), [purchaseReturns]);
  useEffect(() => localStorage.setItem('inv_sales', JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem('inv_sale_returns', JSON.stringify(saleReturns)), [saleReturns]);
  useEffect(() => localStorage.setItem('inv_company', JSON.stringify(companyInfo)), [companyInfo]);
  useEffect(() => localStorage.setItem('inv_users', JSON.stringify(systemUsers)), [systemUsers]);
  useEffect(() => localStorage.setItem('inv_currencies', JSON.stringify(currencies)), [currencies]);
  useEffect(() => localStorage.setItem('inv_payments', JSON.stringify(paymentTypes)), [paymentTypes]);
  useEffect(() => localStorage.setItem('inv_default_currency', defaultCurrencyId), [defaultCurrencyId]);
  useEffect(() => localStorage.setItem('inv_default_payment', defaultPaymentTypeId), [defaultPaymentTypeId]);
  useEffect(() => localStorage.setItem('inv_theme', JSON.stringify(themeConfig)), [themeConfig]);

  const addItem = useCallback((itemData: Omit<Item, 'id' | 'stock'>) => {
    const newItem: Item = { ...itemData, id: crypto.randomUUID(), stock: itemData.openingStock };
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const updateItem = useCallback((id: string, itemData: Partial<Item>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...itemData } : item));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const bulkUpdateItemStock = useCallback((updates: { itemId: string, newStock: number }[]) => {
    setItems(prev => prev.map(item => {
      const update = updates.find(u => u.itemId === item.id);
      return update ? { ...item, stock: update.newStock } : item;
    }));
  }, []);

  const addSupplier = useCallback((supplierData: Omit<Supplier, 'id' | 'isDefault'>) => {
    setSuppliers(prev => [...prev, { ...supplierData, id: `Sup-${(prev.length + 1).toString().padStart(4, '0')}`, isDefault: false }]);
  }, []);

  const updateSupplier = useCallback((id: string, supplierData: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...supplierData } : s));
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }, []);

  const addClient = useCallback((clientData: Omit<Client, 'id' | 'isDefault'>) => {
    setClients(prev => [...prev, { ...clientData, id: `Sales-${(prev.length + 1).toString().padStart(4, '0')}`, isDefault: false }]);
  }, []);

  const updateClient = useCallback((id: string, clientData: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...clientData } : c));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  const addInventoryAuditRecord = useCallback((recordData: Omit<InventoryRecord, 'id'>) => {
    const newRecord: InventoryRecord = { ...recordData, id: `AUD-${(inventoryAuditRecords.length + 1).toString().padStart(3, '0')}` };
    setInventoryAuditRecords(prev => [newRecord, ...prev]);
    return newRecord;
  }, [inventoryAuditRecords.length]);

  const updateInventoryAuditRecord = useCallback((id: string, recordData: Partial<InventoryRecord>) => {
    setInventoryAuditRecords(prev => prev.map(r => r.id === id ? { ...r, ...recordData } : r));
  }, []);

  const deleteInventoryAuditRecord = useCallback((id: string) => {
    setInventoryAuditRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  const recordPurchase = useCallback((purchaseData: Omit<Purchase, 'id'>) => {
    const newPurchase: Purchase = { ...purchaseData, id: `PUR-${(purchases.length + 1).toString().padStart(4, '0')}` };
    setPurchases(prev => [newPurchase, ...prev]);
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      newPurchase.items.forEach(pItem => {
        const idx = updatedItems.findIndex(i => i.id === pItem.itemId);
        if (idx !== -1) updatedItems[idx].stock += pItem.quantity;
      });
      return updatedItems;
    });
    return newPurchase;
  }, [purchases.length]);

  const updatePurchase = useCallback((id: string, updated: Purchase) => {
    setPurchases(prev => prev.map(p => p.id === id ? updated : p));
  }, []);

  const deletePurchase = useCallback((id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
  }, []);

  const recordPurchaseReturn = useCallback((returnData: Omit<PurchaseReturn, 'id'>) => {
    const newReturn: PurchaseReturn = { ...returnData, id: `PRT-${(purchaseReturns.length + 1).toString().padStart(4, '0')}` };
    setPurchaseReturns(prev => [newReturn, ...prev]);
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      newReturn.items.forEach(rItem => {
        const idx = updatedItems.findIndex(i => i.id === rItem.itemId);
        if (idx !== -1) updatedItems[idx].stock -= rItem.quantity;
      });
      return updatedItems;
    });
    return newReturn;
  }, [purchaseReturns.length]);

  const deletePurchaseReturn = useCallback((id: string) => {
    setPurchaseReturns(prev => prev.filter(r => r.id !== id));
  }, []);

  const recordSale = useCallback((saleData: Omit<Sale, 'id'>) => {
    const newSale: Sale = { ...saleData, id: `INV-${(sales.length + 1).toString().padStart(4, '0')}` };
    setSales(prev => [newSale, ...prev]);
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      newSale.items.forEach(sItem => {
        const idx = updatedItems.findIndex(i => i.id === sItem.itemId);
        if (idx !== -1) updatedItems[idx].stock -= sItem.quantity;
      });
      return updatedItems;
    });
    return newSale;
  }, [sales.length]);

  const updateSale = useCallback((id: string, updated: Sale) => {
    setSales(prev => prev.map(s => s.id === id ? updated : s));
  }, []);

  const deleteSale = useCallback((id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
  }, []);

  const recordSaleReturn = useCallback((returnData: Omit<SaleReturn, 'id'>) => {
    const newReturn: SaleReturn = { ...returnData, id: `SRT-${(saleReturns.length + 1).toString().padStart(4, '0')}` };
    setSaleReturns(prev => [newReturn, ...prev]);
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      newReturn.items.forEach(rItem => {
        const idx = updatedItems.findIndex(i => i.id === rItem.itemId);
        if (idx !== -1) updatedItems[idx].stock += rItem.quantity;
      });
      return updatedItems;
    });
    return newReturn;
  }, [saleReturns.length]);

  const deleteSaleReturn = useCallback((id: string) => {
    setSaleReturns(prev => prev.filter(r => r.id !== id));
  }, []);

  const addVoucher = useCallback((voucherData: Omit<Voucher, 'id'>) => {
    const prefix = voucherData.type === 'Receipt' ? 'RV' : 'PV';
    const newVoucher: Voucher = { ...voucherData, id: `${prefix}-${(vouchers.length + 1).toString().padStart(4, '0')}` };
    setVouchers(prev => [newVoucher, ...prev]);
    return newVoucher;
  }, [vouchers.length]);

  const updateVoucher = useCallback((id: string, voucherData: Partial<Voucher>) => {
    setVouchers(prev => prev.map(v => v.id === id ? { ...v, ...voucherData } : v));
  }, []);

  const deleteVoucher = useCallback((id: string) => {
    setVouchers(prev => prev.filter(v => v.id !== id));
  }, []);

  const updateCompanyInfo = (info: CompanyInfo) => setCompanyInfo(info);
  const updateLogo = (data: string | null) => setLogo(data);
  const updateFavicon = (data: string | null) => setFavicon(data);
  const updateThemeConfig = (config: ThemeConfig) => setThemeConfig(config);
  const addSystemUser = (u: Omit<User, 'id'>) => setSystemUsers(prev => [...prev, { ...u, id: Date.now().toString() }]);
  const updateSystemUser = (id: string, u: Partial<User>) => setSystemUsers(prev => prev.map(user => user.id === id ? { ...user, ...u } : user));
  const deleteSystemUser = (id: string) => setSystemUsers(prev => prev.filter(user => user.id !== id));
  const addCurrency = (c: Omit<Currency, 'id'>) => {
    const newC = { ...c, id: Date.now().toString() };
    setCurrencies(prev => [...prev, newC]);
    return newC;
  };
  const updateCurrency = (id: string, c: Partial<Currency>) => setCurrencies(prev => prev.map(curr => curr.id === id ? { ...curr, ...c } : curr));
  const deleteCurrency = (id: string) => setCurrencies(prev => prev.filter(curr => curr.id !== id));
  const setDefaultCurrency = (id: string) => setDefaultCurrencyId(id);
  const addPaymentType = (pt: Omit<PaymentType, 'id'>) => {
    const newPt = { ...pt, id: Date.now().toString() };
    setPaymentTypes(prev => [...prev, newPt]);
    return newPt;
  };
  const updatePaymentType = (id: string, pt: Partial<PaymentType>) => setPaymentTypes(prev => prev.map(p => p.id === id ? { ...p, ...pt } : p));
  const deletePaymentType = (id: string) => setPaymentTypes(prev => prev.filter(p => p.id !== id));
  const setDefaultPaymentType = (id: string) => setDefaultPaymentTypeId(id);

  return (
    <InventoryContext.Provider value={{
      items, purchases, purchaseReturns, sales, saleReturns, suppliers, clients, vouchers, inventoryAuditRecords, companyInfo, systemUsers, currencies, paymentTypes, defaultCurrencyId, defaultPaymentTypeId, logo, favicon, themeConfig,
      addItem, updateItem, deleteItem, bulkUpdateItemStock, addSupplier, updateSupplier, deleteSupplier, addClient, updateClient, deleteClient, addInventoryAuditRecord, updateInventoryAuditRecord, deleteInventoryAuditRecord,
      recordPurchase, updatePurchase, deletePurchase, recordPurchaseReturn, deletePurchaseReturn, recordSale, updateSale, deleteSale, recordSaleReturn, deleteSaleReturn, addVoucher, updateVoucher, deleteVoucher, updateCompanyInfo, updateLogo, updateFavicon, updateThemeConfig, addSystemUser, updateSystemUser, deleteSystemUser,
      addCurrency, updateCurrency, deleteCurrency, setDefaultCurrency, addPaymentType, updatePaymentType, deletePaymentType, setDefaultPaymentType
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
