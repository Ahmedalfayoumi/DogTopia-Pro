
export interface Item {
  id: string;
  name: string;
  barcode: string;
  description: string;
  unitPrice: number;
  openingStock: number; // The stock quantity when the item was first registered
  stock: number; // The real-time available quantity
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
  type: 'Local' | 'Overseas';
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
  firstName: string;
  middleName: string;
  thirdName: string;
  lastName: string;
  email: string;
  mobile: string;
  username: string;
  password?: string;
  role: string;
}

export interface TransactionItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseExpense {
  description: string;
  amount: number;
}

export interface Purchase {
  id: string;
  type: 'Local' | 'Import';
  supplierId: string;
  supplierName: string;
  date: string;
  items: TransactionItem[];
  expenses?: PurchaseExpense[];
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

export interface Voucher {
  id: string;
  type: 'Receipt' | 'Payment';
  entityId: string; // Client ID for Receipt, Supplier ID for Payment
  entityName: string;
  date: string;
  amount: number;
  paymentTypeId: string;
  note: string;
  reference?: string;
}

export interface InventoryAuditItem {
  itemId: string;
  name: string;
  barcode: string;
  systemQty: number;
  physicalQty: number;
  difference: number;
  impactValue: number;
  unitPrice: number;
}

export interface InventoryRecord {
  id: string;
  date: string;
  status: 'Draft' | 'Adjusted';
  items: InventoryAuditItem[];
  totalImpact: number;
}

export interface ThemeConfig {
  colors: string[]; // Array of colors, index 0 is primary, 1 is secondary
  fontFamily: string;
}

export type View = 
  | 'items' 
  | 'items_list'
  | 'inventory_count'
  | 'inventory' 
  | 'purchases' 
  | 'purchases_local' 
  | 'purchases_import' 
  | 'sales' 
  | 'suppliers' 
  | 'suppliers_local'
  | 'suppliers_overseas'
  | 'clients' 
  | 'vouchers'
  | 'receipt_vouchers'
  | 'payment_vouchers'
  | 'settings' 
  | 'settings_company' 
  | 'settings_appearance' 
  | 'settings_users' 
  | 'settings_currencies' 
  | 'settings_payments';
