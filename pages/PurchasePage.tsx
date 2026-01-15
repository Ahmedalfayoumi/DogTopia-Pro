
import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { TransactionItem } from '../types';

const PurchasePage: React.FC = () => {
  const { items, purchases, suppliers, recordPurchase } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseItems, setPurchaseItems] = useState<TransactionItem[]>([
    { itemId: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);

  const grandTotal = useMemo(() => 
    purchaseItems.reduce((acc, item) => acc + item.total, 0),
    [purchaseItems]
  );

  const addItemRow = () => {
    setPurchaseItems([...purchaseItems, { itemId: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (purchaseItems.length > 1) {
      setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof TransactionItem, value: string | number) => {
    const newItems = [...purchaseItems];
    const item = { ...newItems[index] };

    if (field === 'itemId') {
      const selectedItem = items.find(i => i.id === value);
      item.itemId = value as string;
      item.unitPrice = selectedItem?.unitPrice || 0;
    } else if (field === 'quantity') {
      item.quantity = parseInt(value as string) || 0;
    } else if (field === 'unitPrice') {
      item.unitPrice = parseFloat(value as string) || 0;
    }

    item.total = item.quantity * item.unitPrice;
    newItems[index] = item;
    setPurchaseItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    
    if (!selectedSupplierId || !supplier || purchaseItems.some(i => !i.itemId)) {
      alert("Please select a supplier and fill in all item fields.");
      return;
    }

    recordPurchase({
      supplierId: supplier.id,
      supplierName: supplier.name,
      date,
      items: purchaseItems,
      grandTotal
    });

    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSupplierId('');
    setDate(new Date().toISOString().split('T')[0]);
    setPurchaseItems([{ itemId: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Modal for Recording Purchase */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                📥 Record New Purchase
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Supplier</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                  >
                    <option value="">Choose a Supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Purchase Date</label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Line Items</h3>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Row
                  </button>
                </div>
                
                <div className="space-y-3">
                  {purchaseItems.map((pItem, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="md:col-span-4 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Item</label>
                        <select
                          required
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                          value={pItem.itemId}
                          onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                        >
                          <option value="">Select Item</option>
                          {items.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Quantity</label>
                        <input
                          required
                          type="number"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={pItem.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Unit Price</label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={pItem.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Line Total</label>
                        <div className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-mono font-bold">
                          ${pItem.total.toFixed(2)}
                        </div>
                      </div>
                      <div className="md:col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Row"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 sticky bottom-0 bg-white pb-2">
                <div className="text-lg">
                  <span className="text-gray-500 font-medium">Grand Total:</span>{' '}
                  <span className="text-3xl font-black text-indigo-600">${grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 md:flex-none px-8 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 md:flex-none px-12 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                  >
                    Save Invoice
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Table View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Purchase Ledger</h2>
            <p className="text-gray-500 text-sm mt-1">History of all inventory stock-ins</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Add Purchase
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Supplier Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Items Captured</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Invoice Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 font-medium italic">No purchase history found</p>
                      <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-bold hover:underline">Record your first invoice</button>
                    </div>
                  </td>
                </tr>
              ) : (
                purchases.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-gray-600 font-medium">{p.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{p.supplierName}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-bold uppercase">{p.supplierId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {p.items.map((pi, idx) => {
                          const itemObj = items.find(i => i.id === pi.itemId);
                          return (
                            <span key={idx} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-indigo-100">
                              {itemObj?.name || 'Unknown'} ×{pi.quantity}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-bold text-gray-900 font-mono">${p.grandTotal.toFixed(2)}</span>
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

export default PurchasePage;
