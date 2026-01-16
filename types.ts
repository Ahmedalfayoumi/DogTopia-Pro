
export interface Item {
  id: string;
  name: string;
  barcode: string;
  description: string;
  unitPrice: number;
  stock: number;
  purchaseUnit: string;
  storageUnit: string;
  conversionPurchaseToStorage: number;
  sellingUnit: string;
  conversionStorageToSelling: number;
}

export interface Supplier {
  id: string; // Format Sup-XXXX
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  isDefault?: boolean;
}

export interface Client {
  id: string; // Format Sales-XXXX
  name: string;
  phone: string;
  email: string;
  address: string;
  isDefault?: boolean;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  language: 'English' | 'Arabic';
  localCurrencyId: string;
}

export interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
  digits: number;
  exchangeRate: number; // Rate relative to the local base currency
}

export interface PaymentType {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface TransactionItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: TransactionItem[];
  grandTotal: number;
  paymentTypeId: string;
}

export interface Sale {
  id: string;
  clientId?: string;
  customerName: string; // Fallback or display name
  date: string;
  items: TransactionItem[];
  grandTotal: number;
  paymentTypeId: string;
}

export interface ThemeConfig {
  primaryColor: string;
  fontFamily: 'Inter' | 'Roboto' | 'Poppins' | 'Montserrat' | 'System';
}

export type View = 
  | 'items' 
  | 'inventory' 
  | 'purchases' 
  | 'purchases_local' 
  | 'purchases_import' 
  | 'sales' 
  | 'suppliers' 
  | 'clients' 
  | 'settings' 
  | 'settings_company' 
  | 'settings_appearance' 
  | 'settings_users' 
  | 'settings_currencies'
  | 'settings_payments';