
import React, { useState } from 'react';
import { View } from '../types';
import { useInventory } from '../context/InventoryContext';

interface NavbarProps {
  currentView: View;
  setView: (view: View) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { companyInfo, logo } = useInventory();

  const navItems: { id: View; label: string; icon: string }[] = [
    { id: 'items', label: 'Items', icon: '📦' },
    { id: 'suppliers', label: 'Suppliers', icon: '🤝' },
    { id: 'clients', label: 'Clients', icon: '👥' },
    { id: 'purchases', label: 'Purchases', icon: '📥' },
    { id: 'sales', label: 'Sales', icon: '📤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside 
      className={`bg-white border-r border-gray-200 sticky top-0 h-screen transition-all duration-300 ease-in-out flex flex-col z-20 shadow-sm ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Top: Logo & Company Name */}
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
            <h1 className="text-xs font-black text-gray-800 uppercase tracking-widest line-clamp-2">
              {companyInfo.name}
            </h1>
            <div className="mt-2 h-1 w-10 bg-indigo-600 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-grow py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            title={isCollapsed ? item.label : ''}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all relative group ${
              currentView === item.id
                ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-xl shrink-0 w-8 text-center">{item.icon}</span>
            <span 
              className={`whitespace-nowrap transition-all duration-300 overflow-hidden text-sm ${
                isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
              }`}
            >
              {item.label}
            </span>
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold uppercase rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <svg 
            className={`w-6 h-6 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </aside>
  );
};

export default Navbar;
