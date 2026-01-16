
import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { CompanyInfo, User, Currency, PaymentType, View, ThemeConfig } from '../types';

type SettingsTab = 'company' | 'appearance' | 'users' | 'currencies' | 'payments';

interface SettingsPageProps {
  currentView?: View;
  setView?: (view: View) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ currentView, setView }) => {
  const { 
    companyInfo, updateCompanyInfo, 
    logo, updateLogo, 
    favicon, updateFavicon,
    themeConfig, updateThemeConfig,
    systemUsers, addSystemUser, updateSystemUser, deleteSystemUser,
    currencies, addCurrency, updateCurrency, deleteCurrency, defaultCurrencyId, setDefaultCurrency,
    paymentTypes, addPaymentType, updatePaymentType, deletePaymentType, defaultPaymentTypeId, setDefaultPaymentType
  } = useInventory();

  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<Omit<User, 'id'>>({ fullName: '', email: '', role: 'Operator' });

  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [currencyFormData, setCurrencyFormData] = useState<Omit<Currency, 'id'>>({ 
    code: '', 
    symbol: '', 
    name: '', 
    digits: 2,
    exchangeRate: 1 
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentType | null>(null);
  const [paymentFormData, setPaymentFormData] = useState<Omit<PaymentType, 'id'>>({ name: '' });

  const [isSuperAdminUnlocked, setIsSuperAdminUnlocked] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Sync active tab with global view (managed by Sidebar)
  useEffect(() => {
    if (currentView) {
      if (currentView === 'settings_company') setActiveTab('company');
      else if (currentView === 'settings_appearance') setActiveTab('appearance');
      else if (currentView === 'settings_users') setActiveTab('users');
      else if (currentView === 'settings_currencies') setActiveTab('currencies');
      else if (currentView === 'settings_payments') setActiveTab('payments');
    }
  }, [currentView]);

  const localCurrency = currencies.find(c => c.id === companyInfo.localCurrencyId) || currencies[0] || { code: '??', symbol: '?' };

  const handleCompanySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const info: CompanyInfo = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      website: formData.get('website') as string,
      language: formData.get('language') as 'English' | 'Arabic',
      localCurrencyId: (formData.get('localCurrencyId') || companyInfo.localCurrencyId) as string,
    };
    updateCompanyInfo(info);
    alert('Settings saved successfully!');
    setIsSuperAdminUnlocked(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Max 5MB allowed.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') updateLogo(reader.result as string);
        else updateFavicon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThemeChange = (field: keyof ThemeConfig, value: string) => {
    updateThemeConfig({
      ...themeConfig,
      [field]: value
    });
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) updateSystemUser(editingUser.id, userFormData);
    else addSystemUser(userFormData);
    setIsUserModalOpen(false);
    setEditingUser(null);
    setUserFormData({ fullName: '', email: '', role: 'Operator' });
  };

  const handleCurrencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCurrency) updateCurrency(editingCurrency.id, currencyFormData);
    else {
      const created = addCurrency(currencyFormData);
      if (currencies.length === 0) setDefaultCurrency(created.id);
    }
    setIsCurrencyModalOpen(false);
    setEditingCurrency(null);
    setCurrencyFormData({ code: '', symbol: '', name: '', digits: 2, exchangeRate: 1 });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPayment) updatePaymentType(editingPayment.id, paymentFormData);
    else {
      const created = addPaymentType(paymentFormData);
      if (paymentTypes.length === 0) setDefaultPaymentType(created.id);
    }
    setIsPaymentModalOpen(false);
    setEditingPayment(null);
    setPaymentFormData({ name: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header and Tabs removed as per request to avoid redundancy with Sidebar navigation */}
        
        <div className="p-10">
          {activeTab === 'company' && (
            <form onSubmit={handleCompanySubmit} className="max-w-4xl space-y-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">COMPANY NAME</label>
                  <input name="name" defaultValue={companyInfo.name} className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">DEFAULT LANGUAGE</label>
                  <select name="language" defaultValue={companyInfo.language} className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium transition-all">
                    <option value="English">English</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>
                
                <div className="space-y-2 relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">DEFAULT LOCAL CURRENCY</label>
                    <button 
                      type="button"
                      onClick={() => {
                        const confirm = window.confirm("Are you a Super Admin? This setting affects all system calculations.");
                        if (confirm) setIsSuperAdminUnlocked(true);
                      }}
                      className={`text-[8px] border px-1.5 py-0.5 rounded font-black tracking-tight transition-colors ${
                        isSuperAdminUnlocked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}
                    >
                      {isSuperAdminUnlocked ? 'UNLOCKED' : 'SUPER ADMIN ONLY'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <select 
                      name="localCurrencyId" 
                      defaultValue={companyInfo.localCurrencyId} 
                      disabled={!isSuperAdminUnlocked}
                      className={`flex-grow px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all ${
                        !isSuperAdminUnlocked ? 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-70' : 'bg-white text-gray-800'
                      }`}
                    >
                      {currencies.length === 0 ? (
                        <option value="">No currencies defined</option>
                      ) : (
                        currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)
                      )}
                    </select>
                    {isSuperAdminUnlocked && (
                      <button 
                        type="button" 
                        onClick={() => { setEditingCurrency(null); setCurrencyFormData({ code: '', symbol: '', name: '', digits: 2, exchangeRate: 1 }); setIsCurrencyModalOpen(true); }}
                        className="px-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center animate-in zoom-in-90"
                        title="Add New Currency"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 italic mt-2">This is the base currency for all accounting and reports. Only a Super Admin can adjust this central system setting.</p>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">BUSINESS ADDRESS</label>
                  <textarea name="address" defaultValue={companyInfo.address} rows={3} className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium transition-all" required />
                </div>
              </div>
              <div className="pt-6">
                <button type="submit" className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-[0_10px_20_rgba(79,70,229,0.3)] transition-all active:scale-[0.98]">
                  Save Info
                </button>
              </div>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div className="max-w-4xl space-y-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Theme & Appearance</h3>
              {/* Branding Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center text-xs">🖼️</span> 
                    Main Logo
                  </h3>
                  <div className="aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                    {logo ? <img src={logo} alt="Logo" className="max-h-full object-contain p-4" /> : <p className="text-xs text-gray-400 italic">No Logo Uploaded</p>}
                    {logo && <button onClick={() => updateLogo(null)} className="absolute top-2 right-2 bg-white/80 hover:bg-red-50 text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                  </div>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleFileUpload(e, 'logo')} />
                  <button onClick={() => logoInputRef.current?.click()} className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">Change Logo</button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center text-xs">🌐</span> 
                    Favicon
                  </h3>
                  <div className="aspect-square w-32 mx-auto bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                    {favicon ? <img src={favicon} alt="Favicon" className="w-full h-full object-contain p-2" /> : <p className="text-[10px] text-gray-400 text-center px-2">No Favicon</p>}
                  </div>
                  <input type="file" ref={faviconInputRef} className="hidden" accept="image/x-icon, image/png" onChange={(e) => handleFileUpload(e, 'favicon')} />
                  <button onClick={() => faviconInputRef.current?.click()} className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">Upload Favicon</button>
                  <p className="text-[10px] text-gray-400 text-center">Recommended: 32x32px or 64x64px PNG/ICO</p>
                </div>
              </div>

              {/* Theme Colors & Fonts Section */}
              <div className="pt-10 border-t border-gray-100 space-y-8">
                <h3 className="font-bold text-gray-800 text-lg">Website Theme & Typography</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">PRIMARY BRAND COLOR</label>
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-16 h-16 rounded-2xl shadow-inner border border-gray-100 flex-shrink-0" 
                        style={{ backgroundColor: themeConfig.primaryColor }}
                      ></div>
                      <div className="flex-grow space-y-2">
                        <input 
                          type="color" 
                          value={themeConfig.primaryColor} 
                          onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                          className="w-full h-10 border-none bg-transparent cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={themeConfig.primaryColor.toUpperCase()} 
                          onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono uppercase"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {['#4f46e5', '#0ea5e9', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#1e293b'].map(color => (
                        <button 
                          key={color}
                          onClick={() => handleThemeChange('primaryColor', color)}
                          className="w-6 h-6 rounded-full border border-white shadow-sm ring-2 ring-transparent hover:ring-gray-200 transition-all"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">WEBSITE FONT FAMILY</label>
                    <select 
                      value={themeConfig.fontFamily}
                      onChange={(e) => handleThemeChange('fontFamily', e.target.value as any)}
                      className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    >
                      <option value="Inter">Inter (Modern & Clean)</option>
                      <option value="Poppins">Poppins (Friendly & Rounded)</option>
                      <option value="Roboto">Roboto (Mechanical & Direct)</option>
                      <option value="Montserrat">Montserrat (Geometric & Bold)</option>
                      <option value="System">System Default</option>
                    </select>
                    
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Preview</p>
                       <p className="text-gray-800 font-bold" style={{ fontFamily: themeConfig.fontFamily }}>The quick brown fox jumps over the lazy dog.</p>
                       <p className="text-gray-500 text-sm" style={{ fontFamily: themeConfig.fontFamily }}>System testing typography and appearance styles.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">System Users</h3>
                <button onClick={() => { setEditingUser(null); setUserFormData({ fullName: '', email: '', role: 'Operator' }); setIsUserModalOpen(true); }} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-md">Add User</button>
              </div>
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {systemUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-800">{user.fullName}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => { setEditingUser(user); setUserFormData({ fullName: user.fullName, email: user.email, role: user.role }); setIsUserModalOpen(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold text-sm transition-colors">Edit</button>
                          <button onClick={() => deleteSystemUser(user.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg font-bold text-sm transition-colors">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'currencies' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="text-2xl font-bold text-gray-800">Currencies</h3>
                   <p className="text-xs text-gray-400 mt-0.5">Manage active currencies and set your default unit</p>
                </div>
                <button 
                  onClick={() => { setEditingCurrency(null); setCurrencyFormData({ code: '', symbol: '', name: '', digits: 2, exchangeRate: 1 }); setIsCurrencyModalOpen(true); }}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-md"
                >
                  Add Currency
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Default</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name & Code</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Symbol</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Exchange Rate</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currencies.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No currencies defined. Add one to get started.</td></tr>
                    ) : (
                      currencies.map((curr) => (
                        <tr key={curr.id} className={`hover:bg-gray-50 transition-colors ${curr.id === defaultCurrencyId ? 'bg-indigo-50/20' : ''}`}>
                          <td className="px-6 py-4">
                            <input 
                              type="radio" 
                              name="default_currency" 
                              checked={curr.id === defaultCurrencyId} 
                              onChange={() => setDefaultCurrency(curr.id)} 
                              className="w-4 h-4 text-indigo-600 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800">{curr.name}</span>
                              <span className="text-xs text-gray-400 font-mono">{curr.code}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-lg text-indigo-600">{curr.symbol}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                               <span className="font-bold text-gray-600">{curr.exchangeRate}</span>
                               <span className="text-[10px] text-gray-400">1 {curr.code} = {curr.exchangeRate} {localCurrency.code}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button 
                              onClick={() => { setEditingCurrency(curr); setCurrencyFormData({ code: curr.code, symbol: curr.symbol, name: curr.name, digits: curr.digits, exchangeRate: curr.exchangeRate }); setIsCurrencyModalOpen(true); }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold text-sm transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteCurrency(curr.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 font-bold text-sm transition-colors"
                              disabled={currencies.length <= 1}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="text-2xl font-bold text-gray-800">Payment Types</h3>
                   <p className="text-xs text-gray-400 mt-0.5">Manage methods for settlement of purchases and sales</p>
                </div>
                <button 
                  onClick={() => { setEditingPayment(null); setPaymentFormData({ name: '' }); setIsPaymentModalOpen(true); }}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-md"
                >
                  Add Payment Type
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Default</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Method Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paymentTypes.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">No payment types defined.</td></tr>
                    ) : (
                      paymentTypes.map((pt) => (
                        <tr key={pt.id} className={`hover:bg-gray-50 transition-colors ${pt.id === defaultPaymentTypeId ? 'bg-indigo-50/20' : ''}`}>
                          <td className="px-6 py-4">
                            <input 
                              type="radio" 
                              name="default_payment" 
                              checked={pt.id === defaultPaymentTypeId} 
                              onChange={() => setDefaultPaymentType(pt.id)} 
                              className="w-4 h-4 text-indigo-600 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-800">{pt.name}</td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button 
                              onClick={() => { setEditingPayment(pt); setPaymentFormData({ name: pt.name }); setIsPaymentModalOpen(true); }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold text-sm transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deletePaymentType(pt.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 font-bold text-sm transition-colors"
                              disabled={paymentTypes.length <= 1}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Currency Modal */}
      {isCurrencyModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span>💰</span> {editingCurrency ? 'Edit Currency' : 'Add New Currency'}
                </h2>
                <button onClick={() => setIsCurrencyModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             <form onSubmit={handleCurrencySubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">CURRENCY NAME</label>
                  <input required value={currencyFormData.name} onChange={(e) => setCurrencyFormData({ ...currencyFormData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="e.g. Jordanian Dinar" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">ISO CODE</label>
                    <input required value={currencyFormData.code} onChange={(e) => setCurrencyFormData({ ...currencyFormData, code: e.target.value.toUpperCase() })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="JOD" maxLength={3} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">SYMBOL</label>
                    <input required value={currencyFormData.symbol} onChange={(e) => setCurrencyFormData({ ...currencyFormData, symbol: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="JD" maxLength={5} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">DECIMAL DIGITS</label>
                    <input required type="number" min="0" max="4" value={currencyFormData.digits} onChange={(e) => setCurrencyFormData({ ...currencyFormData, digits: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="3" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">EXCHANGE RATE TO {localCurrency.code}</label>
                    <input required type="number" step="0.000001" min="0" value={currencyFormData.exchangeRate} onChange={(e) => setCurrencyFormData({ ...currencyFormData, exchangeRate: parseFloat(e.target.value) || 1 })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="1.0" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 italic">1 {currencyFormData.code || 'UNIT'} = {currencyFormData.exchangeRate} {localCurrency.symbol}</p>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsCurrencyModalOpen(false)} className="flex-1 py-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">{editingCurrency ? 'Update' : 'Save'}</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Payment Type Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span>💳</span> {editingPayment ? 'Edit Payment Type' : 'Add New Payment Type'}
                </h2>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             <form onSubmit={handlePaymentSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">METHOD NAME</label>
                  <input required value={paymentFormData.name} onChange={(e) => setPaymentFormData({ ...paymentFormData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="e.g. Cash, Visa, Bank Transfer" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">{editingPayment ? 'Update' : 'Save'}</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><span>👤</span> {editingUser ? 'Edit System User' : 'Add New User'}</h2>
                <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             <form onSubmit={handleUserSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">FULL NAME</label>
                  <input required value={userFormData.fullName} onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="e.g. Ahmad Khaled" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">EMAIL ADDRESS</label>
                  <input required type="email" value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="user@company.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">USER ROLE</label>
                  <select required value={userFormData.role} onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium">
                    <option value="Administrator">Administrator</option>
                    <option value="Operator">Operator</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">{editingUser ? 'Update' : 'Confirm'}</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;