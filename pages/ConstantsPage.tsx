
import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { View } from '../types';

interface ConstantsPageProps {
  currentView: View;
}

const ConstantsPage: React.FC<ConstantsPageProps> = ({ currentView }) => {
  const { 
    measureUnits, addMeasureUnit, deleteMeasureUnit,
    brands, addBrand, deleteBrand,
    itemTypes, addItemType, deleteItemType,
    weightUnits, addWeightUnit, deleteWeightUnit,
    categories, addCategory, deleteCategory,
    subcategories, addSubcategory, deleteSubcategory
  } = useInventory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const config = useMemo(() => {
    switch (currentView) {
      case 'settings_constants_measure':
        return {
          title: 'Measure Units',
          description: 'Manage packaging and counting units for your products.',
          icon: '📏',
          data: measureUnits,
          onAdd: (name: string) => addMeasureUnit(name),
          onDelete: deleteMeasureUnit,
          label: 'Unit Name'
        };
      case 'settings_constants_brand':
        return {
          title: 'Brands Register',
          description: 'Registry of manufacturer brands. "Non Branding" is system default.',
          icon: '🏷️',
          data: brands,
          onAdd: (name: string) => addBrand(name),
          onDelete: deleteBrand,
          label: 'Brand Name'
        };
      case 'settings_constants_type':
        return {
          title: 'Item Types',
          description: 'Categorize your inventory into logic groups.',
          icon: '🗂️',
          data: itemTypes,
          onAdd: (name: string) => addItemType(name),
          onDelete: deleteItemType,
          label: 'Type Name'
        };
      case 'settings_constants_weight':
        return {
          title: 'Weight Registry',
          description: 'Define mass measurement units (e.g. KG, Gram, Lbs).',
          icon: '⚖️',
          data: weightUnits,
          onAdd: (name: string) => addWeightUnit(name),
          onDelete: deleteWeightUnit,
          label: 'Weight Unit'
        };
      case 'settings_constants_category':
        return {
          title: 'Category Registry',
          description: 'Define product categories for hierarchical organization.',
          icon: '📁',
          data: categories,
          onAdd: (name: string) => addCategory(name),
          onDelete: deleteCategory,
          label: 'Category Name'
        };
      case 'settings_constants_subcategory':
        return {
          title: 'Subcategory Registry',
          description: 'Define subcategories linked to specific parent categories.',
          icon: '📂',
          data: subcategories.map(sc => ({
            ...sc,
            parentName: categories.find(c => c.id === sc.categoryId)?.name || 'Unknown'
          })),
          onAdd: (name: string, catId: string) => addSubcategory(name, catId),
          onDelete: deleteSubcategory,
          label: 'Subcategory Name',
          hasParent: true,
          parentList: categories,
          parentLabel: 'Parent Category'
        };
      default:
        return null;
    }
  }, [currentView, measureUnits, brands, itemTypes, weightUnits, categories, subcategories, addMeasureUnit, deleteMeasureUnit, addBrand, deleteBrand, addItemType, deleteItemType, addWeightUnit, deleteWeightUnit, addCategory, deleteCategory, addSubcategory, deleteSubcategory]);

  const filteredData = useMemo(() => {
    if (!config) return [];
    return config.data.filter((item: any) => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.parentName && item.parentName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [config, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim() || !config) return;
    
    if (config.hasParent) {
      if (!selectedParentId) {
        alert("Please select a parent category.");
        return;
      }
      (config as any).onAdd(newValue.trim(), selectedParentId);
    } else {
      (config as any).onAdd(newValue.trim());
    }
    
    setNewValue('');
    setSelectedParentId('');
    setIsModalOpen(false);
  };

  if (!config) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {config.icon} Add New {config.title.slice(0, -1)}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {config.hasParent && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{config.parentLabel}</label>
                  <select
                    required
                    className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {config.parentList?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{config.label}</label>
                <input
                  autoFocus
                  required
                  type="text"
                  placeholder={`e.g. ${config.title === 'Brands Register' ? 'Apple' : config.title === 'Measure Units' ? 'Carton' : 'New Value'}`}
                  className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none transition-all text-lg font-bold"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Save Constant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6 text-center md:text-left">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-indigo-100">
            {config.icon}
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">{config.title}</h2>
            <p className="text-gray-500 mt-1 max-w-md">{config.description}</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 whitespace-nowrap"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          ADD NEW
        </button>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
            <input
              type="text"
              placeholder={`Search ${config.title.toLowerCase()}...`}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{filteredData.length} records found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Internal ID</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{config.label}</th>
                {config.hasParent && (
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{config.parentLabel}</th>
                )}
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={config.hasParent ? 4 : 3} className="px-8 py-16 text-center text-gray-400 italic">No matching entries found.</td>
                </tr>
              ) : (
                filteredData.map((item: any) => (
                  <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors group ${item.isDefault ? 'bg-indigo-50/20' : ''}`}>
                    <td className="px-8 py-5 font-mono text-xs text-gray-400">{item.id}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">{item.name}</span>
                        {item.isDefault && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-full tracking-widest shadow-sm">DEFAULT</span>
                        )}
                      </div>
                    </td>
                    {config.hasParent && (
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">{item.parentName}</span>
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                      {!item.isDefault && (
                        <button
                          onClick={() => { if(confirm('Are you sure you want to delete this constant? This might affect items using it.')) config.onDelete(item.id) }}
                          className="p-2 text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Entry"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConstantsPage;
