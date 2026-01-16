
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { CompanyInfo, User, Currency, PaymentType, View, ThemeConfig } from '../types';

type SettingsTab = 'company' | 'appearance' | 'users' | 'currencies' | 'payments';

interface SettingsPageProps {
  currentView?: View;
  setView?: (view: View) => void;
}

const FONTS_LIST = [
  'Inter', 'Poppins', 'Roboto', 'Montserrat', 'Open Sans', 'Lato', 'Oswald', 
  'Playfair Display', 'Raleway', 'Ubuntu', 'Merriweather', 'Lora', 'Nunito', 
  'Rubik', 'Arimo', 'Heebo', 'Kanit', 'Varela Round', 'Comfortaa'
];

const FontSelector: React.FC<{ 
  selected: string, 
  onSelect: (font: string) => void 
}> = ({ selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredFonts = useMemo(() => 
    FONTS_LIST.filter(font => font.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-left flex justify-between items-center transition-all"
      >
        <span style={{ fontFamily: selected }}>{selected}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <input 
              autoFocus
              type="text"
              placeholder="Search fonts..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredFonts.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 italic">No fonts found</div>
            ) : (
              filteredFonts.map(font => (
                <button
                  key={font}
                  type="button"
                  onClick={() => { onSelect(font); setIsOpen(false); setSearchTerm(''); }}
                  className={`w-full px-4 py-2.5 text-left text-sm rounded-lg transition-colors hover:bg-indigo-50 ${selected === font ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-700'}`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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

  // Sync active tab with global view
  useEffect(() => {
    if (currentView) {
      if (currentView === 'settings_company') setActiveTab('company');
      else if (currentView === 'settings_appearance') setActiveTab('appearance');
      else if (currentView === 'settings_users') setActiveTab('users');
      else if (currentView === 'settings_currencies') setActiveTab('currencies');
      else if (currentView === 'settings_payments') setActiveTab('payments');
    }
  }, [currentView]);

  const defaultCurrency = useMemo(() => 
    currencies.find(c => c.id === defaultCurrencyId) || currencies[0] || { code: '??', symbol: '?' },
    [currencies, defaultCurrencyId]
  );

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

  const handleThemeChange = (field: keyof ThemeConfig, value: any) => {
    updateThemeConfig({
      ...themeConfig,
      [field]: value
    });
  };

  const addThemeColor = () => {
    handleThemeChange('colors', [...themeConfig.colors, '#cccccc']);
  };

  const removeThemeColor = (index: number) => {
    if (themeConfig.colors.length <= 1) return;
    const newColors = themeConfig.colors.filter((_, i) => i !== index);
    handleThemeChange('colors', newColors);
  };

  const updateThemeColor = (index: number, color: string) => {
    const newColors = [...themeConfig.colors];
    newColors[index] = color;
    handleThemeChange('colors', newColors);
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
                    <button type="button" onClick={() => { const confirm = window.confirm("Are you a Super Admin? This setting affects all system calculations."); if (confirm) setIsSuperAdminUnlocked(true); }} className={`text-[8px] border px-1.5 py-0.5 rounded font-black tracking-tight transition-colors ${isSuperAdminUnlocked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{isSuperAdminUnlocked ? 'UNLOCKED' : 'SUPER ADMIN ONLY'}</button>
                  </div>
                  <div className="flex gap-2">
                    <select name="localCurrencyId" defaultValue={companyInfo.localCurrencyId} disabled={!isSuperAdminUnlocked} className={`flex-grow px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all ${!isSuperAdminUnlocked ? 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-70' : 'bg-white text-gray-800'}`}>
                      {currencies.length === 0 ? <option value="">No currencies defined</option> : currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
                    </select>
                    {isSuperAdminUnlocked && (
                      <button type="button" onClick={() => { setEditingCurrency(null); setCurrencyFormData({ code: '', symbol: '', name: '', digits: 2, exchangeRate: 1 }); setIsCurrencyModalOpen(true); }} className="px-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center animate-in zoom-in-90" title="Add New Currency"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg></button>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">BUSINESS ADDRESS</label>
                  <textarea name="address" defaultValue={companyInfo.address} rows={3} className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium transition-all" required />
                </div>
              </div>
              <div className="pt-6">
                <button type="submit" className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-all active:scale-[0.98]">Save Info</button>
              </div>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div className="max-w-4xl space-y-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Theme & Appearance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">🖼️ Main Logo</h3>
                  <div className="aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                    {logo ? <img src={logo} alt="Logo" className="max-h-full object-contain p-4" /> : <p className="text-xs text-gray-400 italic">No Logo Uploaded</p>}
                    {logo && <button onClick={() => updateLogo(null)} className="absolute top-2 right-2 bg-white/80 hover:bg-red-50 text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                  </div>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleFileUpload(e, 'logo')} />
                  <button onClick={() => logoInputRef.current?.click()} className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">Change Logo</button>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">🌐 Favicon</h3>
                  <div className="aspect-square w-32 mx-auto bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                    {favicon ? <img src={favicon} alt="Favicon" className="w-full h-full object-contain p-2" /> : <p className="text-[10px] text-gray-400 text-center px-2">No Favicon</p>}
                  </div>
                  <input type="file" ref={faviconInputRef} className="hidden" accept="image/x-icon, image/png" onChange={(e) => handleFileUpload(e, 'favicon')} />
                  <button onClick={() => faviconInputRef.current?.click()} className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">Upload Favicon</button>
                </div>
              </div>

              <div className="pt-10 border-t border-gray-100 space-y-10">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-lg">Theme Colors Palette</h3>
                    <button 
                      onClick={addThemeColor}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-black rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                      ADD NEW COLOR
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {themeConfig.colors.map((color, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3 relative group animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            {idx === 0 ? 'Primary Color' : idx === 1 ? 'Secondary Color' : `Accent Color ${idx + 1}`}
                          </label>
                          {themeConfig.colors.length > 2 && (
                            <button 
                              onClick={() => removeThemeColor(idx)}
                              className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl shadow-sm border border-white shrink-0 overflow-hidden relative">
                            <input 
                              type="color" 
                              value={color} 
                              onChange={(e) => updateThemeColor(idx, e.target.value)}
                              className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                            />
                          </div>
                          <input 
                            type="text" 
                            value={color.toUpperCase()} 
                            onChange={(e) => updateThemeColor(idx, e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-sm font-mono font-bold text-gray-600 uppercase focus:ring-0"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">WEBSITE FONT FAMILY</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                    <FontSelector 
                      selected={themeConfig.fontFamily} 
                      onSelect={(font) => handleThemeChange('fontFamily', font)} 
                    />
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Live Typography Preview</p>
                       <p className="text-gray-800 text-lg font-bold leading-tight" style={{ fontFamily: themeConfig.fontFamily }}>
                         Professional Inventory Solutions for Modern Business.
                       </p>
                       <p className="text-gray-500 text-sm leading-relaxed" style={{ fontFamily: themeConfig.fontFamily }}>
                         Managing your stock has never been more aesthetic. This font is being applied globally to your dashboard and exported documents.
                       </p>
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
                    <tr><th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</th><th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th></tr>
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
                <div><h3 className="text-2xl font-bold text-gray-800">Currencies</h3><p className="text-xs text-gray-400 mt-0.5">Manage active currencies and set your default unit</p></div>
                <button onClick={() => { setEditingCurrency(null); setCurrencyFormData({ code: '', symbol: '', name: '', digits: 2, exchangeRate: 1 }); setIsCurrencyModalOpen(true); }} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-md">Add Currency</button>
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
                    {currencies.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No currencies defined.</td></tr> : currencies.map((curr) => (
                        <tr key={curr.id} className={`hover:bg-gray-50 transition-colors ${curr.id === defaultCurrencyId ? 'bg-indigo-50/20' : ''}`}>
                          <td className="px-6 py-4"><input type="radio" name="default_currency" checked={curr.id === defaultCurrencyId} onChange={() => setDefaultCurrency(curr.id)} className="w-4 h-4 text-indigo-600 cursor-pointer"/></td>
                          <td className="px-6 py-4"><div className="flex flex-col"><span className="font-bold text-gray-800">{curr.name}</span><span className="text-xs text-gray-400 font-mono">{curr.code}</span></div></td>
                          <td className="px-6 py-4 text-center font-bold text-lg text-indigo-600">{curr.symbol}</td>
                          <td className="px-6 py-4 text-center font-bold text-gray-600">{curr.exchangeRate}</td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => { setEditingCurrency(curr); setCurrencyFormData({ code: curr.code, symbol: curr.symbol, name: curr.name, digits: curr.digits, exchangeRate: curr.exchangeRate }); setIsCurrencyModalOpen(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold text-sm transition-colors">Edit</button>
                            <button onClick={() => deleteCurrency(curr.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 font-bold text-sm transition-colors" disabled={currencies.length <= 1}>Delete</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div><h3 className="text-2xl font-bold text-gray-800">Payment Types</h3><p className="text-xs text-gray-400 mt-0.5">Manage methods for settlement of purchases and sales</p></div>
                <button onClick={() => { setEditingPayment(null); setPaymentFormData({ name: '' }); setIsPaymentModalOpen(true); }} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-md">Add Payment Type</button>
              </div>
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Default</th><th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Method Name</th><th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {paymentTypes.length === 0 ? <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">No payment types defined.</td></tr> : paymentTypes.map((pt) => (
                        <tr key={pt.id} className={`hover:bg-gray-50 transition-colors ${pt.id === defaultPaymentTypeId ? 'bg-indigo-50/20' : ''}`}><td className="px-6 py-4"><input type="radio" name="default_payment" checked={pt.id === defaultPaymentTypeId} onChange={() => setDefaultPaymentType(pt.id)} className="w-4 h-4 text-indigo-600 cursor-pointer"/></td><td className="px-6 py-4 font-bold text-gray-800">{pt.name}</td><td className="px-6 py-4 text-right space-x-2"><button onClick={() => { setEditingPayment(pt); setPaymentFormData({ name: pt.name }); setIsPaymentModalOpen(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold text-sm transition-colors">Edit</button><button onClick={() => deletePaymentType(pt.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 font-bold text-sm transition-colors" disabled={paymentTypes.length <= 1}>Delete</button></td></tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals for Settings (Currency, Payment, User) */}
      {isCurrencyModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">💰 {editingCurrency ? 'Edit Currency' : 'Add New Currency'}</h2>
                <button onClick={() => setIsCurrencyModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             <form onSubmit={handleCurrencySubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">CURRENCY NAME</label>
                  <input required value={currencyFormData.name} onChange={(e) => setCurrencyFormData({ ...currencyFormData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">ISO CODE</label><input required value={currencyFormData.code} onChange={(e) => setCurrencyFormData({ ...currencyFormData, code: e.target.value.toUpperCase() })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" maxLength={3} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">SYMBOL</label><input required value={currencyFormData.symbol} onChange={(e) => setCurrencyFormData({ ...currencyFormData, symbol: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" maxLength={5} /></div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">EXCHANGE RATE</label>
                  <div className="relative">
                    <input 
                      required 
                      type="number" 
                      step="any"
                      value={currencyFormData.exchangeRate} 
                      onChange={(e) => setCurrencyFormData({ ...currencyFormData, exchangeRate: parseFloat(e.target.value) || 0 })} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600" 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                      per 1 {defaultCurrency.code}
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-400 italic">Example: if 1 {defaultCurrency.code} = 1.41 USD, enter 1.41</p>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsCurrencyModalOpen(false)} className="flex-1 py-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]">Save</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">💳 {editingPayment ? 'Edit Payment Type' : 'Add New Payment Type'}</h2>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             <form onSubmit={handlePaymentSubmit} className="p-8 space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">METHOD NAME</label><input required value={paymentFormData.name} onChange={(e) => setPaymentFormData({ ...paymentFormData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" /></div>
                <div className="flex gap-4 pt-4"><button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button><button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">Save</button></div>
             </form>
          </div>
        </div>
      )}

      {isUserModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">👤 {editingUser ? 'Edit User' : 'Add New User'}</h2>
                <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             <form onSubmit={handleUserSubmit} className="p-8 space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">FULL NAME</label><input required value={userFormData.fullName} onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">EMAIL</label><input required type="email" value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" /></div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">ROLE</label>
                  <select required value={userFormData.role} onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"><option value="Administrator">Administrator</option><option value="Operator">Operator</option><option value="Viewer">Viewer</option></select>
                </div>
                <div className="flex gap-4 pt-4"><button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button><button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">Confirm</button></div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
