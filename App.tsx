
import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import Navbar from './components/Navbar';
import ItemsPage from './pages/ItemsPage';
import InventoryPage from './pages/InventoryPage';
import PurchasePage from './pages/PurchasePage';
import SalesPage from './pages/SalesPage';
import SuppliersPage from './pages/SuppliersPage';
import ClientsPage from './pages/ClientsPage';
import SettingsPage from './pages/SettingsPage';
import { View } from './types';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('items_list');
  const { companyInfo, logo } = useInventory();

  const renderContent = () => {
    switch (currentView) {
      case 'items':
      case 'items_list':
        return <ItemsPage />;
      case 'inventory':
      case 'inventory_count':
        return <InventoryPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'clients':
        return <ClientsPage />;
      case 'purchases':
      case 'purchases_local':
      case 'purchases_import':
        return <PurchasePage currentView={currentView} setView={setCurrentView} />;
      case 'sales':
        return <SalesPage setView={setCurrentView} />;
      case 'settings':
      case 'settings_company':
      case 'settings_appearance':
      case 'settings_users':
      case 'settings_currencies':
      case 'settings_payments':
        return <SettingsPage currentView={currentView} setView={setCurrentView} />;
      default:
        return <ItemsPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-row bg-gray-50">
      {/* Sidebar Navigation */}
      <Navbar currentView={currentView} setView={setCurrentView} />
      
      {/* Main Content Area */}
      <div className="flex-grow flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 shrink-0 flex items-center justify-center px-8 relative z-10 shadow-sm">
          <div className="flex items-center gap-3">
             {logo ? (
               <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
             ) : (
               <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center font-black text-indigo-600 text-lg">
                 {companyInfo.name.charAt(0).toUpperCase()}
               </div>
             )}
             <h2 className="text-lg font-bold text-gray-800 tracking-tight">{companyInfo.name}</h2>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <div className="pb-12">
              {renderContent()}
            </div>
          </main>

          <footer className="mt-auto bg-white border-t border-gray-200 py-6">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-xs font-medium uppercase tracking-widest">
              &copy; {new Date().getFullYear()} {companyInfo.name} &bull; Powered by InventoryMaster Pro
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
};

export default App;
