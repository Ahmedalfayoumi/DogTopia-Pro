
import React, { useState } from 'react';
import { InventoryProvider } from './context/InventoryContext';
import Navbar from './components/Navbar';
import ItemsPage from './pages/ItemsPage';
import PurchasePage from './pages/PurchasePage';
import SalesPage from './pages/SalesPage';
import SuppliersPage from './pages/SuppliersPage';
import ClientsPage from './pages/ClientsPage';
import SettingsPage from './pages/SettingsPage';
import { View } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('items');

  const renderContent = () => {
    switch (currentView) {
      case 'items':
        return <ItemsPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'clients':
        return <ClientsPage />;
      case 'purchases':
        return <PurchasePage />;
      case 'sales':
        return <SalesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <ItemsPage />;
    }
  };

  return (
    <InventoryProvider>
      <div className="min-h-screen flex flex-row bg-gray-50">
        {/* Sidebar Navigation */}
        <Navbar currentView={currentView} setView={setCurrentView} />
        
        {/* Main Content Area */}
        <div className="flex-grow flex flex-col h-screen overflow-y-auto">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Render Current Page */}
            <div className="pb-12">
              {renderContent()}
            </div>
          </main>

          <footer className="mt-auto bg-white border-t border-gray-200 py-6">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} InventoryMaster Pro. Full Stack Business Solution.
            </div>
          </footer>
        </div>
      </div>
    </InventoryProvider>
  );
};

export default App;
