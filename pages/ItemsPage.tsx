
import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Item } from '../types';
import * as XLSX from 'https://esm.sh/xlsx';

const ItemsPage: React.FC = () => {
  const { items, addItem, updateItem, deleteItem, currencies, defaultCurrencyId } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currency = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];
  
  const [formData, setFormData] = useState<Omit<Item, 'id'>>({
    name: '',
    barcode: '',
    description: '',
    unitPrice: 0,
    stock: 0,
    purchaseUnit: '',
    storageUnit: '',
    conversionPurchaseToStorage: 1,
    sellingUnit: '',
    conversionStorageToSelling: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateItem(editingId, formData);
    } else {
      addItem(formData);
    }
    closeModal();
  };

  const handleEdit = (item: Item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      barcode: item.barcode || '',
      description: item.description,
      unitPrice: item.unitPrice,
      stock: item.stock,
      purchaseUnit: item.purchaseUnit || '',
      storageUnit: item.storageUnit || '',
      conversionPurchaseToStorage: item.conversionPurchaseToStorage || 1,
      sellingUnit: item.sellingUnit || '',
      conversionStorageToSelling: item.conversionStorageToSelling || 1,
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      barcode: '',
      description: '', 
      unitPrice: 0, 
      stock: 0,
      purchaseUnit: 'Box',
      storageUnit: 'Pack',
      conversionPurchaseToStorage: 10,
      sellingUnit: 'Piece',
      conversionStorageToSelling: 5,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Name": "Sample Product",
        "Barcode": "123456789",
        "Description": "High quality sample item",
        "Selling Price": 25.00,
        "Current Stock": 0,
        "Purchase Unit": "Box",
        "Storage Unit": "Pack",
        "Conversion P to S": 10,
        "Selling Unit": "Piece",
        "Conversion S to Sell": 5
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ItemsTemplate");
    XLSX.writeFile(wb, "Inventory_Template.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let importCount = 0;
        data.forEach((row: any) => {
          if (row["Name"]) {
            addItem({
              name: String(row["Name"]),
              barcode: String(row["Barcode"] || ""),
              description: String(row["Description"] || ""),
              unitPrice: parseFloat(row["Selling Price"]) || 0,
              stock: parseInt(row["Current Stock"]) || 0,
              purchaseUnit: String(row["Purchase Unit"] || "Box"),
              storageUnit: String(row["Storage Unit"] || "Pack"),
              conversionPurchaseToStorage: parseFloat(row["Conversion P to S"]) || 1,
              sellingUnit: String(row["Selling Unit"] || "Piece"),
              conversionStorageToSelling: parseFloat(row["Conversion S to Sell"]) || 1,
            });
            importCount++;
          }
        });
        alert(`Successfully imported ${importCount} items!`);
      } catch (error) {
        console.error("Error parsing excel:", error);
        alert("Failed to parse the Excel file. Please ensure it follows the template format.");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {editingId ? '✏️ Edit Item' : '✨ Add New Item'}
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Premium Coffee Beans"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Barcode</label>
                  <input
                    type="text"
                    placeholder="Scan or type barcode"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                  <input
                    required
                    placeholder="Brief summary of the item"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selling Price ({currency.symbol})</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Unit Configuration Section */}
              <div className="bg-indigo-50/50 p-6 rounded-2xl space-y-4 border border-indigo-100">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Unit & Conversion Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Purchase Unit</label>
                    <input
                      required
                      placeholder="e.g. Box"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      value={formData.purchaseUnit}
                      onChange={(e) => setFormData({ ...formData, purchaseUnit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Storage Unit</label>
                    <input
                      required
                      placeholder="e.g. Pack"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      value={formData.storageUnit}
                      onChange={(e) => setFormData({ ...formData, storageUnit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-500 uppercase">1 {formData.purchaseUnit || 'P.U'} = ? {formData.storageUnit || 'S.U'}</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold text-indigo-600"
                      value={formData.conversionPurchaseToStorage}
                      onChange={(e) => setFormData({ ...formData, conversionPurchaseToStorage: parseFloat(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Selling Unit</label>
                    <input
                      required
                      placeholder="e.g. Piece"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      value={formData.sellingUnit}
                      onChange={(e) => setFormData({ ...formData, sellingUnit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-indigo-500 uppercase">1 {formData.storageUnit || 'S.U'} = ? {formData.sellingUnit || 'Selling unit'}</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold text-indigo-600"
                      value={formData.conversionStorageToSelling}
                      onChange={(e) => setFormData({ ...formData, conversionStorageToSelling: parseFloat(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-indigo-400 italic">
                  Note: Total 1 {formData.purchaseUnit || 'P.U'} = {formData.conversionPurchaseToStorage * formData.conversionStorageToSelling} {formData.sellingUnit || 'Selling Units'}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                >
                  {editingId ? 'Save Changes' : 'Confirm & Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Inventory Catalog</h2>
            <p className="text-gray-500 text-sm mt-1">Detailed view of products and multi-unit configurations</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-100 transition-all"
              title="Download Excel Template"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Template
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all"
              title="Import from Excel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Import Excel
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleImportExcel} 
            />
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Item & Units</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Conversions</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Selling Price</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Current Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400 italic">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <p>Your catalog is empty.</p>
                      <button onClick={openAddModal} className="text-indigo-600 font-bold hover:underline underline-offset-4">Add your first item manually</button>
                      <span className="text-[10px] text-gray-300">or use the Import Excel button above</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{item.name}</span>
                        {item.barcode && <span className="text-[10px] text-gray-400 font-mono font-bold tracking-tight">{item.barcode}</span>}
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold">{item.purchaseUnit}</span>
                          <span className="text-[10px] text-gray-300">→</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold">{item.storageUnit}</span>
                          <span className="text-[10px] text-gray-300">→</span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold">{item.sellingUnit}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-[11px] text-gray-500 space-y-0.5">
                        <div>1 {item.purchaseUnit} = {item.conversionPurchaseToStorage} {item.storageUnit}</div>
                        <div>1 {item.storageUnit} = {item.conversionStorageToSelling} {item.sellingUnit}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700 font-mono font-medium">{currency.symbol} {item.unitPrice.toFixed(currency.digits)} / {item.sellingUnit}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        item.stock <= 5 
                          ? 'bg-red-50 text-red-600 border border-red-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {item.stock} {item.sellingUnit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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

export default ItemsPage;
