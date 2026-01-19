
import React, { useState } from 'react';
import { View } from '../types';
import { useInventory } from '../context/InventoryContext';

interface NavItem {
  id: View | string;
  label: string;
  icon: string;
  children?: NavItem[];
}

interface NavbarProps {
  currentView: View;
  setView: (view: View) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const { companyInfo, logo } = useInventory();

  const navItems: NavItem[] = [
    { 
      id: 'items', 
      label: 'Items', 
      icon: '📦',
      children: [
        { id: 'items_list', label: 'Items Details', icon: '📋' },
        { id: 'inventory_count', label: 'Inventory', icon: '📏' }
      ]
    },
    { 
      id: 'suppliers', 
      label: 'Suppliers', 
      icon: '🤝',
      children: [
        { id: 'suppliers_local', label: 'Local Suppliers', icon: '🏠' },
        { id: 'suppliers_overseas', label: 'Overseas Suppliers', icon: '🌍' }
      ]
    },
    { id: 'clients', label: 'Clients', icon: '👥' },
    { 
      id: 'vouchers', 
      label: 'Vouchers', 
      icon: '🧾',
      children: [
        { id: 'receipt_vouchers', label: 'Receipt Voucher', icon: '📥' },
        { id: 'payment_vouchers', label: 'Payment Voucher', icon: '📤' }
      ]
    },
    { 
      id: 'purchases', 
      label: 'Purchases', 
      icon: '📥',
      children: [
        { id: 'purchases_local', label: 'Local Purchase', icon: '🏠' },
        { id: 'purchases_local_return', label: 'Local Return', icon: '🔄' },
        { id: 'purchases_import', label: 'Importing Goods', icon: '🚢' },
        { id: 'purchases_import_return', label: 'Import Return', icon: '↩️' }
      ]
    },
    { 
      id: 'sales', 
      label: 'Sales', 
      icon: '📤',
      children: [
        { id: 'sales_list', label: 'Sales Invoice', icon: '🧾' },
        { id: 'sales_return', label: 'Sales Return', icon: '🔄' }
      ]
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: '⚙️',
      children: [
        { id: 'settings_company', label: 'Company Info', icon: '🏢' },
        { id: 'settings_appearance', label: 'Theme & Logo', icon: '🎨' },
        { id: 'settings_users', label: 'Users', icon: '👥' },
        { id: 'settings_currencies', label: 'Currencies', icon: '💰' },
        { id: 'settings_payments', label: 'Payment Types', icon: '💳' },
        { 
          id: 'settings_constants', 
          label: 'Constants', 
          icon: '🗝️',
          children: [
            { id: 'settings_constants_measure', label: 'Measure Unit', icon: '📏' },
            { id: 'settings_constants_brand', label: 'Brand', icon: '🏷️' },
            { id: 'settings_constants_category', label: 'Category', icon: '📁' },
            { id: 'settings_constants_subcategory', label: 'Subcategory', icon: '📂' },
            { id: 'settings_constants_type', label: 'Type', icon: '🗂️' },
            { id: 'settings_constants_weight', label: 'Weight', icon: '⚖️' },
          ]
        },
      ]
    },
  ];

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleNavClick = (item: NavItem) => {
    if (item.children) {
      if (isCollapsed) {
        setIsCollapsed(false);
        setExpandedMenus(prev => ({ ...prev, [item.id]: true }));
      } else {
        toggleMenu(item.id as string);
      }
      
      // Navigate to the first leaf child if not on a child already
      const findFirstLeaf = (it: NavItem): string => it.children ? findFirstLeaf(it.children[0]) : it.id;
      const firstLeafId = findFirstLeaf(item);
      if (!isViewActive(item)) {
         setView(firstLeafId as View);
      }
    } else {
      setView(item.id as View);
    }
  };

  const isViewActive = (item: NavItem): boolean => {
    if (currentView === item.id) return true;
    if (item.children) return item.children.some(child => isViewActive(child));
    return false;
  };

  const renderNavItems = (items: NavItem[], depth = 0) => {
    return items.map((item) => {
      const isSelected = currentView === item.id;
      const isParentActive = isViewActive(item);
      const isExpanded = expandedMenus[item.id];
      const hasChildren = item.children && item.children.length > 0;

      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={() => handleNavClick(item)}
            title={isCollapsed && depth === 0 ? item.label : ''}
            className={`w-full flex items-center gap-3 rounded-xl transition-all relative group ${
              depth === 0 ? 'px-3 py-3' : 'px-3 py-2 text-xs'
            } ${
              isSelected && !hasChildren
                ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            } ${isParentActive && hasChildren ? 'text-indigo-700 font-bold' : ''}`}
          >
            <span className={`${depth === 0 ? 'text-xl' : 'text-sm'} shrink-0 w-8 text-center`}>{item.icon}</span>
            <span 
              className={`flex-grow whitespace-nowrap transition-all duration-300 overflow-hidden text-left ${
                isCollapsed && depth === 0 ? 'opacity-0 w-0' : 'opacity-100 w-auto'
              }`}
            >
              {item.label}
            </span>

            {!(isCollapsed && depth === 0) && hasChildren && (
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            )}
            
            {isCollapsed && depth === 0 && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold uppercase rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                {item.label}
              </div>
            )}
          </button>

          {!(isCollapsed && depth === 0) && hasChildren && isExpanded && (
            <div className={`ml-4 pl-4 border-l-2 border-indigo-100 space-y-1 animate-in slide-in-from-top-2 duration-200`}>
              {renderNavItems(item.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <aside 
      className={`bg-white border-r border-gray-200 sticky top-0 h-screen transition-all duration-300 ease-in-out flex flex-col z-20 shadow-sm ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className={`flex flex-col items-center shrink-0 transition-all duration-300 border-b border-gray-100 ${isCollapsed ? 'py-4 h-20' : 'py-10 h-52'}`}>
        <div className={`transition-all duration-300 flex items-center justify-center rounded-2xl bg-white border border-indigo-100 overflow-hidden shadow-sm ${isCollapsed ? 'w-10 h-10' : 'w-24 h-24'}`}>
          {logo ? (
            <img src={logo} alt="Company Logo" className="w-full h-full object-contain p-2" />
          ) : (
            <span className={`font-black text-indigo-600 ${isCollapsed ? 'text-xs' : 'text-3xl'}`}>
              {companyInfo.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <div className="mt-5 px-4 text-center animate-in fade-in slide-in-from-top-2 duration-500 flex flex-col items-center">
            <h1 className="text-xs font-black text-gray-800 uppercase tracking-widest line-clamp-2">{companyInfo.name}</h1>
            <div className="mt-2 h-1 w-10 bg-indigo-600 rounded-full"></div>
          </div>
        )}
      </div>

      <div className="flex-grow py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {renderNavItems(navItems)}
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <svg className={`w-6 h-6 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </aside>
  );
};

export default Navbar;
