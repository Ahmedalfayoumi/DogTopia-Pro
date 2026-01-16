
import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { CompanyInfo, User, Currency } from '../types';

const SettingsPage: React.FC = () => {
  const { 
    companyInfo, updateCompanyInfo, 
    logo, updateLogo, 
    favicon, updateFavicon,
    systemUsers, addSystemUser, updateSystemUser, deleteSystemUser,
    currencies, addCurrency, updateCurrency, deleteCurrency, defaultCurrencyId, setDefaultCurrency
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'company' | 'appearance' | 'users' | 'currencies'>('company');
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

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const localCurrency = currencies.find(c => c.id === companyInfo.localCurrencyId) || currencies[0];

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
      localCurrencyId: formData.get('localCurrencyId') as string,
    };
    updateCompanyInfo(info);
    alert('Settings saved successfully!');
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
    else addCurrency(currencyFormData);
    setIsCurrencyModalOpen(false);
    setEditingCurrency(null);
    setCurrencyFormData({ code: '', symbol: '', name: '', digits: 2, exchangeRate: 1 });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-white">
          <h2 className="text-3xl font-bold text-gray-800">System Settings</h2>
          <p className="text-gray-500 text-sm mt-1">Configure your business workspace and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto px-6">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'company' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            🏢 Company Info
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'appearance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            🎨 Theme & Logo
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab('currencies')}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'currencies' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            💰 Currencies
          </button>
        </div>

        <div className="p-10">
          {activeTab === 'company' && (
            <form onSubmit={handleCompanySubmit} className="max-w-4xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Company Name</label>
                  <input name="name" defaultValue={companyInfo.name} className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Default Language</label>
                  <select name="language" defaultValue={companyInfo.language} className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium transition-all">
                    <option value="English">English</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Default Local Currency</label>
                  <select name="localCurrencyId" defaultValue={companyInfo.localCurrencyId} className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium transition-all">
                    {currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
                  </select>
                  <p className="text-[10px] text-gray-400 italic">This is the base currency for all accounting and reports.</p>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Business Address</label>
                  <textarea name="address" defaultValue={companyInfo.address} rows={3} className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium transition-all" required />
                </div>
              </div>
              <div className="pt-6">
                <button type="submit" className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)] transition-all active:scale-[0.98]">
                  Save Info
                </button>
              </div>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div className="max-w-4xl space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800">Company Logo</h3>
                  <div className="aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                    {logo ? <img src={logo} alt="Logo" className="max-h-full object-contain p-4" /> : <p className="text-xs text-gray-400">No Logo</p>}
                  </div>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleFileUpload(e, 'logo')} />
                  <button onClick={() => logoInputRef.current?.click()} className="w-full py-3 bg-gray-50 text-gray-700 font-bold text-sm rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">Change Logo</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-800">System Users</h3>
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
              <div className="flex justify-between items-center">
                <div>
                   <h3 className="font-bold text-gray-800">Currencies</h3>
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
                    {currencies.map((curr) => (
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
                    ))}
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
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Currency Name</label>
                  <input 
                    required 
                    value={currencyFormData.name} 
                    onChange={(e) => setCurrencyFormData({ ...currencyFormData, name: e.target.value })} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
                    placeholder="e.g. Jordanian Dinar" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">ISO Code</label>
                    <input 
                      required 
                      value={currencyFormData.code} 
                      onChange={(e) => setCurrencyFormData({ ...currencyFormData, code: e.target.value.toUpperCase() })} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
                      placeholder="JOD" 
                      maxLength={3} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Symbol</label>
                    <input 
                      required 
                      value={currencyFormData.symbol} 
                      onChange={(e) => setCurrencyFormData({ ...currencyFormData, symbol: e.target.value })} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
                      placeholder="JD" 
                      maxLength={5} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Decimal Digits</label>
                    <input 
                      required 
                      type="number" 
                      min="0" 
                      max="4" 
                      value={currencyFormData.digits} 
                      onChange={(e) => setCurrencyFormData({ ...currencyFormData, digits: parseInt(e.target.value) || 0 })} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
                      placeholder="3" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Exchange Rate to {localCurrency.code}</label>
                    <input 
                      required 
                      type="number" 
                      step="0.000001"
                      min="0"
                      value={currencyFormData.exchangeRate} 
                      onChange={(e) => setCurrencyFormData({ ...currencyFormData, exchangeRate: parseFloat(e.target.value) || 1 })} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
                      placeholder="1.0" 
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 italic">1 {currencyFormData.code || 'UNIT'} = {currencyFormData.exchangeRate} {localCurrency.symbol}</p>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsCurrencyModalOpen(false)} className="flex-1 py-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">
                    {editingCurrency ? 'Update' : 'Save'}
                  </button>
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
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span>👤</span> {editingUser ? 'Edit System User' : 'Add New User'}
                </h2>
                <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             <form onSubmit={handleUserSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Full Name</label>
                  <input 
                    required 
                    value={userFormData.fullName} 
                    onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
                    placeholder="e.g. Ahmad Khaled"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    value={userFormData.email} 
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
                    placeholder="user@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">User Role</label>
                  <select 
                    required 
                    value={userFormData.role} 
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Operator">Operator</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">
                    {editingUser ? 'Update' : 'Confirm'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
