
import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { TransactionItem, Item, Purchase, Currency } from '../types';

const PurchasePage: React.FC = () => {
  const { items, purchases, suppliers, recordPurchase, updatePurchase, deletePurchase, addItem, currencies, defaultCurrencyId, companyInfo } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeItemRowIndex, setActiveItemRowIndex] = useState<number | null>(null);
  
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedCurrencyId, setSelectedCurrencyId] = useState(defaultCurrencyId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseItems, setPurchaseItems] = useState<TransactionItem[]>([
    { itemId: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);

  // Sync selected currency with default when opening for a new purchase
  useEffect(() => {
    if (modalMode === 'create' && isModalOpen) {
      setSelectedCurrencyId(defaultCurrencyId);
    }
  }, [isModalOpen, modalMode, defaultCurrencyId]);

  const activeCurrency = useMemo(() => 
    currencies.find(c => c.id === selectedCurrencyId) || currencies[0],
    [selectedCurrencyId, currencies]
  );

  // Quick Add Item Form State - Expanded to match ItemsPage
  const [newItemData, setNewItemData] = useState<Omit<Item, 'id'>>({
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

  const grandTotal = useMemo(() => 
    purchaseItems.reduce((acc, item) => acc + item.total, 0),
    [purchaseItems]
  );

  const handleView = (purchase: Purchase) => {
    setModalMode('view');
    setEditingId(purchase.id);
    setSelectedSupplierId(purchase.supplierId);
    setDate(purchase.date);
    setPurchaseItems(purchase.items);
    setSelectedCurrencyId(defaultCurrencyId);
    setIsModalOpen(true);
  };

  const handleEdit = (purchase: Purchase) => {
    setModalMode('edit');
    setEditingId(purchase.id);
    setSelectedSupplierId(purchase.supplierId);
    setDate(purchase.date);
    setPurchaseItems(purchase.items);
    setSelectedCurrencyId(defaultCurrencyId);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setModalMode('create');
    setEditingId(null);
    setSelectedSupplierId('');
    setSelectedCurrencyId(defaultCurrencyId);
    setDate(new Date().toISOString().split('T')[0]);
    setPurchaseItems([{ itemId: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    if (modalMode === 'view') return;
    setPurchaseItems([...purchaseItems, { itemId: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (modalMode === 'view') return;
    if (purchaseItems.length > 1) {
      setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof TransactionItem, value: string | number) => {
    if (modalMode === 'view') return;
    const newItems = [...purchaseItems];
    const item = { ...newItems[index] };

    if (field === 'itemId') {
      const selectedItem = items.find(i => i.id === value);
      item.itemId = value as string;
      item.unitPrice = selectedItem?.unitPrice || 0;
    } else if (field === 'quantity') {
      item.quantity = parseFloat(value as string) || 0;
    } else if (field === 'unitPrice') {
      item.unitPrice = parseFloat(value as string) || 0;
    }

    item.total = item.quantity * item.unitPrice;
    newItems[index] = item;
    setPurchaseItems(newItems);
  };

  const handleQuickAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const createdItem = addItem(newItemData);
    if (activeItemRowIndex !== null) {
      handleItemChange(activeItemRowIndex, 'itemId', createdItem.id);
    }
    setIsAddItemModalOpen(false);
    setNewItemData({ 
      name: '', 
      barcode: '', 
      description: '', 
      unitPrice: 0, 
      stock: 0, 
      purchaseUnit: 'Box', 
      storageUnit: 'Pack', 
      conversionPurchaseToStorage: 10, 
      sellingUnit: 'Piece', 
      conversionStorageToSelling: 5 
    });
    setActiveItemRowIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'view') return;
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!selectedSupplierId || !supplier || purchaseItems.some(i => !i.itemId)) {
      alert("Please select a supplier and fill in all item fields.");
      return;
    }
    const data = { supplierId: supplier.id, supplierName: supplier.name, date, items: purchaseItems, grandTotal };
    if (modalMode === 'edit' && editingId) updatePurchase(editingId, { ...data, id: editingId });
    else recordPurchase(data);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setModalMode('create');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Expanded Quick Add Item Modal (identical to ItemsPage version) */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">✨ Add New Item</h2>
              <button onClick={() => setIsAddItemModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleQuickAddItem} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</label>
                  <input required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newItemData.name} onChange={e => setNewItemData({...newItemData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Barcode</label>
                  <input className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newItemData.barcode} onChange={e => setNewItemData({...newItemData, barcode: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                  <input required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newItemData.description} onChange={e => setNewItemData({...newItemData, description: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selling Price ({activeCurrency.symbol})</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newItemData.unitPrice} onChange={e => setNewItemData({...newItemData, unitPrice: parseFloat(e.target.value) || 0})} />
                </div>
              </div>

              {/* Unit Configuration Section - Matches ItemsPage */}
              <div className="bg-indigo-50/50 p-6 rounded-2xl space-y-4 border border-indigo-100">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">Unit Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Purchase Unit</label>
                    <input required className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white" value={newItemData.purchaseUnit} onChange={e => setNewItemData({...newItemData, purchaseUnit: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Storage Unit</label>
                    <input required className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white" value={newItemData.storageUnit} onChange={e => setNewItemData({...newItemData, storageUnit: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-500 uppercase">1 {newItemData.purchaseUnit} = ? {newItemData.storageUnit}</label>
                    <input required type="number" className="w-full px-3 py-2 border border-indigo-200 rounded-lg font-bold text-indigo-600 bg-white" value={newItemData.conversionPurchaseToStorage} onChange={e => setNewItemData({...newItemData, conversionPurchaseToStorage: parseFloat(e.target.value) || 1})} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Selling Unit</label>
                    <input required className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white" value={newItemData.sellingUnit} onChange={e => setNewItemData({...newItemData, sellingUnit: e.target.value})} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-indigo-500 uppercase">1 {newItemData.storageUnit} = ? {newItemData.sellingUnit}</label>
                    <input required type="number" className="w-full px-3 py-2 border border-indigo-200 rounded-lg font-bold text-indigo-600 bg-white" value={newItemData.conversionStorageToSelling} onChange={e => setNewItemData({...newItemData, conversionStorageToSelling: parseFloat(e.target.value) || 1})} />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddItemModalOpen(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-colors">Confirm & Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Modal - Recording Purchase */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">📥</span>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                  {modalMode === 'view' ? 'View Invoice' : modalMode === 'edit' ? 'Edit Invoice' : 'Record New Purchase'}
                </h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">SELECT SUPPLIER</label>
                  <select
                    disabled={modalMode === 'view'}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-50 text-sm font-medium transition-all"
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                  >
                    <option value="">Choose a Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">PURCHASE DATE</label>
                  <input
                    disabled={modalMode === 'view'}
                    required
                    type="date"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 text-sm font-medium transition-all"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">CURRENCY</label>
                  <select
                    disabled={modalMode === 'view'}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-50 text-sm font-medium transition-all"
                    value={selectedCurrencyId}
                    onChange={(e) => setSelectedCurrencyId(e.target.value)}
                  >
                    {currencies.map(c => <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center pb-2">
                  <h3 className="text-xs font-black text-indigo-800 uppercase tracking-[0.2em]">LINE ITEMS</h3>
                  {modalMode !== 'view' && (
                    <button 
                      type="button" 
                      onClick={addItemRow} 
                      className="flex items-center gap-1 px-4 py-2 border-2 border-indigo-600 rounded-lg text-indigo-600 font-bold text-xs hover:bg-indigo-50 transition-all active:scale-95"
                    >
                      <span className="text-lg">+</span> Add Row
                    </button>
                  )}
                </div>
                
                <div className="space-y-6">
                  {/* Headers for desktop */}
                  <div className="grid grid-cols-12 gap-4 px-1 hidden md:grid">
                    <div className="col-span-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ITEM</div>
                    <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">QUANTITY</div>
                    <div className="col-span-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">UNIT PRICE</div>
                    <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">LINE TOTAL</div>
                    <div className="col-span-1"></div>
                  </div>

                  {purchaseItems.map((pItem, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end group bg-white p-2 rounded-xl border border-transparent hover:border-indigo-100 transition-colors">
                      <div className="col-span-12 md:col-span-4 space-y-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block md:hidden">ITEM</label>
                          {modalMode !== 'view' && (
                            <button 
                              type="button" 
                              onClick={() => { setActiveItemRowIndex(index); setIsAddItemModalOpen(true); }} 
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors tracking-tight flex items-center gap-1"
                            >
                              <span className="text-lg">+</span> Add New Item
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <select
                            disabled={modalMode === 'view'}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-50 text-sm font-medium pr-10"
                            value={pItem.itemId}
                            onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                          >
                            <option value="">Select Item</option>
                            {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                          </select>
                        </div>
                      </div>
                      
                      <div className="col-span-6 md:col-span-2 space-y-1">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block md:hidden">QUANTITY</label>
                        <input
                          disabled={modalMode === 'view'}
                          required
                          type="number"
                          min="0"
                          step="any"
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 text-sm font-medium"
                          value={pItem.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </div>
                      
                      <div className="col-span-6 md:col-span-2 space-y-1">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block md:hidden">UNIT PRICE</label>
                        <input
                          disabled={modalMode === 'view'}
                          required
                          type="number"
                          step="any"
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 text-sm font-medium"
                          value={pItem.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        />
                      </div>
                      
                      <div className="col-span-10 md:col-span-3 space-y-1">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block md:hidden">LINE TOTAL</label>
                        <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-700 text-sm font-bold flex items-center">
                          {activeCurrency.symbol} {pItem.total.toFixed(activeCurrency.digits)}
                        </div>
                      </div>
                      
                      <div className="col-span-2 md:col-span-1 flex justify-center pb-1">
                        {modalMode !== 'view' && (
                          <button type="button" onClick={() => removeItemRow(index)} className="p-2 text-red-400 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 font-bold text-lg">Grand Total:</span> 
                  <span className="text-5xl font-black text-indigo-600 tracking-tighter">
                    {activeCurrency.symbol} {grandTotal.toFixed(activeCurrency.digits)}
                  </span>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <button type="button" onClick={closeModal} className="flex-1 md:w-40 py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors text-lg">
                    Cancel
                  </button>
                  {modalMode !== 'view' && (
                    <button type="submit" className="flex-1 md:w-56 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] transition-all active:scale-[0.98] text-lg">
                      Save Invoice
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Ledger View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Purchase Ledger</h2>
            <p className="text-gray-500 text-sm mt-1">Summary of inventory stock-in invoices</p>
          </div>
          <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            Add Purchase
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Invoice #</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Supplier Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Total Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchases.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-400 italic">No purchase history found</td></tr>
              ) : (
                purchases.map(p => {
                  const curr = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-gray-500 text-sm">{p.id}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{p.supplierName}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">{curr.symbol} {p.grandTotal.toFixed(curr.digits)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleView(p)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="View"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>
                          <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-amber-600 transition-colors" title="Edit"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
                          <button onClick={() => { if(confirm('Delete this invoice?')) deletePurchase(p.id) }} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Delete"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
