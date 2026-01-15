
import React, { useState } from 'react';
import { View } from '../types';

interface NavbarProps {
  currentView: View;
  setView: (view: View) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0 overflow-hidden">
        <div className={`flex items-center gap-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
          <span className="bg-indigo-600 text-white p-1.5 rounded-lg text-xs font-black">IM</span>
          <span className="text-lg font-bold text-indigo-600 tracking-tight whitespace-nowrap">
            InventoryMaster
          </span>
        </div>
        {isCollapsed && (
           <span className="mx-auto bg-indigo-600 text-white p-1.5 rounded-lg text-xs font-black">IM</span>
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
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-xl shrink-0 w-8 text-center">{item.icon}</span>
            <span 
              className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${
                isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
              }`}
            >
              {item.label}
            </span>
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
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
