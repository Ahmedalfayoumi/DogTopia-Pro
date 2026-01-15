
import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { CompanyInfo, User } from '../types';

const SettingsPage: React.FC = () => {
  const { 
    companyInfo, updateCompanyInfo, 
    logo, updateLogo, 
    favicon, updateFavicon,
    systemUsers, addSystemUser, updateSystemUser, deleteSystemUser 
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'company' | 'appearance' | 'users'>('company');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<Omit<User, 'id'>>({ fullName: '', email: '', role: 'Operator' });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

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
    if (editingUser) {
      updateSystemUser(editingUser.id, userFormData);
    } else {
      addSystemUser(userFormData);
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
    setUserFormData({ fullName: '', email: '', role: 'Operator' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
          <p className="text-gray-500 text-sm mt-1">Configure your business workspace and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'company' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            🏢 Company Information
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'appearance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            🎨 Theme & Logo
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            👥 User Management
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'company' && (
            <form onSubmit={handleCompanySubmit} className="max-w-3xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Company Name</label>
                  <input
                    name="name"
                    defaultValue={companyInfo.name}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Default Language</label>
                  <select
                    name="language"
                    defaultValue={companyInfo.language}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="English">English</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Business Address</label>
                  <textarea
                    name="address"
                    defaultValue={companyInfo.address}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                  <input
                    name="phone"
                    defaultValue={companyInfo.phone}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Official Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={companyInfo.email}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Website URL</label>
                  <input
                    name="website"
                    defaultValue={companyInfo.website}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                >
                  Save Company Info
                </button>
              </div>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div className="max-w-4xl space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Logo Section */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-gray-800">Company Logo</h3>
                    <p className="text-xs text-gray-400">Displayed on invoices and dashboard (Max 5MB)</p>
                  </div>
                  <div className="aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                    {logo ? (
                      <>
                        <img src={logo} alt="Logo Preview" className="max-h-full object-contain" />
                        <button 
                          onClick={() => updateLogo(null)}
                          className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </>
                    ) : (
                      <div className="text-center space-y-2">
                        <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-xs text-gray-400 font-medium">No Logo Uploaded</p>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={logoInputRef} 
                    className="hidden" 
                    accept="image/png, image/jpeg" 
                    onChange={(e) => handleFileUpload(e, 'logo')} 
                  />
                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full py-2.5 bg-gray-50 text-gray-700 font-bold text-sm rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    {logo ? 'Change Logo' : 'Upload Logo'}
                  </button>
                </div>

                {/* Favicon Section */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-gray-800">Browser Favicon</h3>
                    <p className="text-xs text-gray-400">Small icon in browser tab (Max 5MB)</p>
                  </div>
                  <div className="aspect-square w-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden mx-auto relative group">
                    {favicon ? (
                      <>
                        <img src={favicon} alt="Favicon Preview" className="w-16 h-16 object-contain" />
                        <button 
                          onClick={() => updateFavicon(null)}
                          className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </>
                    ) : (
                      <div className="text-center">
                        <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={faviconInputRef} 
                    className="hidden" 
                    accept="image/png, image/jpeg" 
                    onChange={(e) => handleFileUpload(e, 'favicon')} 
                  />
                  <button 
                    onClick={() => faviconInputRef.current?.click()}
                    className="w-full py-2.5 bg-gray-50 text-gray-700 font-bold text-sm rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    {favicon ? 'Change Favicon' : 'Upload Favicon'}
                  </button>
                </div>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                  <strong>Pro Tip:</strong> Using a high-contrast PNG with a transparent background works best for both logo and favicon. Favicon updates may take a moment to reflect in your browser tab.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                   <h3 className="font-bold text-gray-800">System Users</h3>
                   <p className="text-xs text-gray-400">Manage administrative and operator access</p>
                </div>
                <button
                  onClick={() => { setEditingUser(null); setUserFormData({ fullName: '', email: '', role: 'Operator' }); setIsUserModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  Add User
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {systemUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-800">{user.fullName}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            user.role === 'Administrator' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button 
                            onClick={() => { setEditingUser(user); setUserFormData({ fullName: user.fullName, email: user.email, role: user.role }); setIsUserModalOpen(true); }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                          </button>
                          <button 
                            onClick={() => deleteSystemUser(user.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-800">{editingUser ? 'Edit User' : 'Add New User'}</h2>
                <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                  <input
                    required
                    value={userFormData.fullName}
                    onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                  <input
                    required
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">System Role</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Operator">Operator</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                  >
                    {editingUser ? 'Save Changes' : 'Create User'}
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
