
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Item, Purchase, Sale, Supplier, Client, CompanyInfo, User } from '../types';

interface InventoryContextType {
  items: Item[];
  purchases: Purchase[];
  sales: Sale[];
  suppliers: Supplier[];
  clients: Client[];
  companyInfo: CompanyInfo;
  systemUsers: User[];
  logo: string | null;
  favicon: string | null;
  addItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (id: string, item: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'isDefault'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addClient: (client: Omit<Client, 'id' | 'isDefault'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  recordPurchase: (purchase: Omit<Purchase, 'id'>) => void;
  recordSale: (sale: Omit<Sale, 'id'>) => void;
  updateCompanyInfo: (info: CompanyInfo) => void;
  updateLogo: (data: string | null) => void;
  updateFavicon: (data: string | null) => void;
  addSystemUser: (user: Omit<User, 'id'>) => void;
  updateSystemUser: (id: string, userData: Partial<User>) => void;
  deleteSystemUser: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

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
  language: 'English'
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

  const [logo, setLogo] = useState<string | null>(() => localStorage.getItem('inv_logo'));
  const [favicon, setFavicon] = useState<string | null>(() => localStorage.getItem('inv_favicon'));

  useEffect(() => {
    localStorage.setItem('inv_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('inv_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('inv_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('inv_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('inv_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('inv_company', JSON.stringify(companyInfo));
  }, [companyInfo]);

  useEffect(() => {
    localStorage.setItem('inv_users', JSON.stringify(systemUsers));
  }, [systemUsers]);

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
      const nextId = Math.max(...numericIds, 1) + 1;
      const formattedId = `Sup-${nextId.toString().padStart(4, '0')}`;
      const newSupplier: Supplier = { ...supplierData, id: formattedId, isDefault: false };
      return [...prev, newSupplier];
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
      const nextId = Math.max(...numericIds, 1) + 1;
      const formattedId = `Sales-${nextId.toString().padStart(4, '0')}`;
      const newClient: Client = { ...clientData, id: formattedId, isDefault: false };
      return [...prev, newClient];
    });
  }, []);

  const updateClient = useCallback((id: string, clientData: Partial<Client>) => {
    setClients(prev => prev.map(c => (c.id === id && !c.isDefault) ? { ...c, ...clientData } : c));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id || c.isDefault));
  }, []);

  const recordPurchase = useCallback((purchaseData: Omit<Purchase, 'id'>) => {
    const newPurchase: Purchase = { ...purchaseData, id: crypto.randomUUID() };
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      newPurchase.items.forEach(pItem => {
        const index = updatedItems.findIndex(i => i.id === pItem.itemId);
        if (index !== -1) {
          updatedItems[index] = { ...updatedItems[index], stock: updatedItems[index].stock + pItem.quantity };
        }
      });
      return updatedItems;
    });
    setPurchases(prev => [newPurchase, ...prev]);
  }, []);

  const recordSale = useCallback((saleData: Omit<Sale, 'id'>) => {
    const newSale: Sale = { ...saleData, id: crypto.randomUUID() };
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      newSale.items.forEach(sItem => {
        const index = updatedItems.findIndex(i => i.id === sItem.itemId);
        if (index !== -1) {
          updatedItems[index] = { ...updatedItems[index], stock: updatedItems[index].stock - sItem.quantity };
        }
      });
      return updatedItems;
    });
    setSales(prev => [newSale, ...prev]);
  }, []);

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
      items, suppliers, clients, purchases, sales, companyInfo, systemUsers, logo, favicon,
      addItem, updateItem, deleteItem, addSupplier, updateSupplier, deleteSupplier,
      addClient, updateClient, deleteClient, recordPurchase, recordSale,
      updateCompanyInfo, updateLogo, updateFavicon, addSystemUser, updateSystemUser, deleteSystemUser
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
