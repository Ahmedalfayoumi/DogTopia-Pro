
import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { TransactionItem, Sale, View } from '../types';

interface SalesPageProps {
  setView?: (view: View) => void;
}

const SalesPage: React.FC<SalesPageProps> = ({ setView }) => {
  const { items, sales, clients, recordSale, updateSale, deleteSale, currencies, defaultCurrencyId, paymentTypes, defaultPaymentTypeId } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPaymentTypeId, setSelectedPaymentTypeId] = useState(defaultPaymentTypeId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesItems, setSalesItems] = useState<TransactionItem[]>([
    { itemId: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);

  const currency = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];

  const activePaymentType = useMemo(() => 
    paymentTypes.find(pt => pt.id === selectedPaymentTypeId),
    [selectedPaymentTypeId, paymentTypes]
  );

  useEffect(() => {
    if (modalMode === 'create' && isModalOpen) {
      setSelectedPaymentTypeId(defaultPaymentTypeId);
    }
  }, [isModalOpen, modalMode, defaultPaymentTypeId]);

  const grandTotal = useMemo(() => 
    salesItems.reduce((acc, item) => acc + item.total, 0),
    [salesItems]
  );

  const handleView = (sale: Sale) => {
    setModalMode('view');
    setEditingId(sale.id);
    setSelectedClientId(sale.clientId || '');
    setSelectedPaymentTypeId(sale.paymentTypeId || defaultPaymentTypeId);
    setDate(sale.date);
    setSalesItems(sale.items);
    setShowConfirmation(false);
    setIsModalOpen(true);
  };

  const handleEdit = (sale: Sale) => {
    setModalMode('edit');
    setEditingId(sale.id);
    setSelectedClientId(sale.clientId || '');
    setSelectedPaymentTypeId(sale.paymentTypeId || defaultPaymentTypeId);
    setDate(sale.date);
    setSalesItems(sale.items);
    setShowConfirmation(false);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setModalMode('create');
    setEditingId(null);
    setSelectedClientId('');
    setSelectedPaymentTypeId(defaultPaymentTypeId);
    setDate(new Date().toISOString().split('T')[0]);
    setSalesItems([{ itemId: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setShowConfirmation(false);
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    if (modalMode === 'view' || showConfirmation) return;
    setSalesItems([...salesItems, { itemId: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (modalMode === 'view' || showConfirmation) return;
    if (salesItems.length > 1) {
      setSalesItems(salesItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof TransactionItem, value: string | number) => {
    if (modalMode === 'view' || showConfirmation) return;
    const newItems = [...salesItems];
    const item = { ...newItems[index] };

    if (field === 'itemId') {
      const selectedItem = items.find(i => i.id === value);
      item.itemId = value as string;
      item.unitPrice = selectedItem?.unitPrice || 0;
    } else if (field === 'quantity') {
      const qty = parseFloat(value as string) || 0;
      const selectedItem = items.find(i => i.id === item.itemId);
      
      if (selectedItem && qty > selectedItem.stock) {
        alert(`Insufficient stock! Only ${selectedItem.stock} remaining.`);
        item.quantity = selectedItem.stock;
      } else {
        item.quantity = qty;
      }
    } else if (field === 'unitPrice') {
      item.unitPrice = parseFloat(value as string) || 0;
    }

    item.total = item.quantity * item.unitPrice;
    newItems[index] = item;
    setSalesItems(newItems);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'view') return;

    const isCredit = activePaymentType?.name.toLowerCase().includes('credit');
    // Validation for Credit payment type: must have a client and it cannot be the default Cash Sales
    if (isCredit && (!selectedClientId || selectedClientId === 'Sales-0001')) {
      alert("Validation Error: For 'Credit' sales, you must select a specific registered client. 'Walk-in' or 'Cash Sales' accounts cannot be used for credit transactions.");
      return;
    }

    if (salesItems.some(i => !i.itemId)) {
      alert("Please select at least one item.");
      return;
    }

    setShowConfirmation(true);
  };

  const finalizeTransaction = () => {
    const isCredit = activePaymentType?.name.toLowerCase().includes('credit');
    if (isCredit && (!selectedClientId || selectedClientId === 'Sales-0001')) {
      alert("Error: A registered client is required for credit transactions.");
      setShowConfirmation(false);
      return;
    }

    const client = clients.find(c => c.id === selectedClientId);
    const customerName = client ? client.name : 'Walk-in Customer';

    const data = {
      clientId: client?.id,
      customerName,
      date,
      items: salesItems,
      grandTotal,
      paymentTypeId: selectedPaymentTypeId
    };

    if (modalMode === 'edit' && editingId) {
      updateSale(editingId, { ...data, id: editingId });
    } else {
      recordSale(data);
    }

    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setModalMode('create');
    setShowConfirmation(false);
  };

  const navigateToPayments = () => {
    if (setView) {
      closeModal();
      setView('settings_payments');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Modal for Recording Sale */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {showConfirmation ? '✅ Finalize Transaction' : (modalMode === 'view' ? '🔍 View Invoice' : modalMode === 'edit' ? '✏️ Edit Invoice' : '📤 Record New Sale')}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {!showConfirmation ? (
              <form onSubmit={handlePreSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Client (Optional)</label>
                    <select
                      disabled={modalMode === 'view'}
                      className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white disabled:bg-gray-50 transition-colors ${
                        (activePaymentType?.name.toLowerCase().includes('credit') && (!selectedClientId || selectedClientId === 'Sales-0001')) 
                          ? 'border-red-300 bg-red-50/30' 
                          : 'border-gray-200'
                      }`}
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                      <option value="">None / Walk-in Customer</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                    </select>
                    {activePaymentType?.name.toLowerCase().includes('credit') && (!selectedClientId || selectedClientId === 'Sales-0001') && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 animate-pulse">Required for Credit</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sale Date</label>
                    <input
                      disabled={modalMode === 'view'}
                      required
                      type="date"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-50"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Type</label>
                      {modalMode !== 'view' && setView && (
                        <button type="button" onClick={navigateToPayments} className="text-[9px] font-black text-emerald-600 hover:text-emerald-800 transition-colors uppercase tracking-tight">
                          Manage
                        </button>
                      )}
                    </div>
                    <select
                      disabled={modalMode === 'view'}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white disabled:bg-gray-50 font-bold text-emerald-700"
                      value={selectedPaymentTypeId}
                      onChange={(e) => setSelectedPaymentTypeId(e.target.value)}
                    >
                      {paymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Sold Items</h3>
                    {modalMode !== 'view' && (
                      <button type="button" onClick={addItemRow} className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        Add Row
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {salesItems.map((sItem, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-emerald-50/30 p-3 rounded-xl border border-emerald-50">
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Item</label>
                          <select
                            disabled={modalMode === 'view'}
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white disabled:bg-gray-50"
                            value={sItem.itemId}
                            onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                          >
                            <option value="">Select Item</option>
                            {items.map(item => (
                              <option key={item.id} value={item.id} disabled={modalMode !== 'view' && item.stock <= 0}>
                                {item.name} ({item.stock} in stock)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qty</label>
                          <input
                            disabled={modalMode === 'view'}
                            required
                            type="number"
                            min="0"
                            step="any"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-50"
                            value={sItem.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unit Price</label>
                          <input
                            disabled={modalMode === 'view'}
                            required
                            type="number"
                            step="any"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-50"
                            value={sItem.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</label>
                          <div className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-emerald-700 font-mono font-bold">
                            {currency.symbol} {sItem.total.toFixed(currency.digits)}
                          </div>
                        </div>
                        <div className="md:col-span-1 flex justify-center">
                          {modalMode !== 'view' && (
                            <button type="button" onClick={() => removeItemRow(index)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 sticky bottom-0 bg-white pb-2">
                  <div className="text-lg"><span className="text-gray-500 font-medium">Grand Total:</span> <span className="text-4xl font-black text-emerald-600 tracking-tighter">{currency.symbol} {grandTotal.toFixed(currency.digits)}</span></div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button type="button" onClick={closeModal} className="flex-1 md:flex-none px-8 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                      {modalMode === 'view' ? 'Close' : 'Cancel'}
                    </button>
                    {modalMode !== 'view' && (
                      <button type="submit" className="flex-1 px-12 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg transition-all active:scale-[0.98]">
                        {modalMode === 'edit' ? 'Review & Update' : 'Finalize Sale'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            ) : (
              /* High-Fidelity Confirmation View */
              <div className="p-10 space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <div className="text-center space-y-2">
                   <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl mb-4 shadow-inner">
                     <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <h3 className="text-2xl font-black text-gray-800">Review Payment Terms</h3>
                   <p className="text-gray-500 font-medium">Almost there! Please verify the settlement method before closing this transaction.</p>
                </div>

                <div className="max-w-md mx-auto bg-gray-50 rounded-3xl p-8 border border-gray-100 space-y-6 shadow-sm">
                   <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</span>
                      <span className="font-bold text-gray-800">{clients.find(c => c.id === selectedClientId)?.name || 'Walk-in Customer'}</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</span>
                      <span className="font-bold text-gray-800">{date}</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-gray-200 pb-4 bg-emerald-100/50 -mx-4 px-4 py-3 rounded-xl border border-emerald-100/50">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Selected Payment Method</span>
                      <select
                        className="bg-transparent font-black text-emerald-800 text-xl uppercase tracking-tight outline-none cursor-pointer border-b-2 border-emerald-300 focus:border-emerald-500 transition-colors"
                        value={selectedPaymentTypeId}
                        onChange={(e) => setSelectedPaymentTypeId(e.target.value)}
                      >
                        {paymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                      </select>
                   </div>
                   <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice Total</span>
                      <span className="text-3xl font-black text-indigo-600 tracking-tighter">{currency.symbol} {grandTotal.toFixed(currency.digits)}</span>
                   </div>
                </div>

                <div className="flex gap-4 max-w-md mx-auto pt-4">
                  <button 
                    onClick={() => setShowConfirmation(false)} 
                    className="flex-1 py-4 border-2 border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    Go Back
                  </button>
                  <button 
                    onClick={finalizeTransaction} 
                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
                  >
                    Confirm & Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Table View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Sales Register</h2>
            <p className="text-gray-500 text-sm mt-1">Summary of all customer transactions and settlement types</p>
          </div>
          <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            Record Sale
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Invoice #</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Client Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Payment</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Total Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400 italic">No transactions recorded yet</td></tr>
              ) : (
                sales.map(s => {
                  const pt = paymentTypes.find(p => p.id === s.paymentTypeId);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-gray-500 text-sm">{s.id}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{s.customerName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                          pt?.name.toLowerCase().includes('credit') 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {pt?.name || 'Cash'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">{currency.symbol} {s.grandTotal.toFixed(currency.digits)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleView(s)} className="p-2 text-gray-400 hover:text-emerald-600 transition-colors" title="View"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>
                          <button onClick={() => handleEdit(s)} className="p-2 text-gray-400 hover:text-amber-600 transition-colors" title="Edit"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
                          <button onClick={() => { if(confirm('Delete this sale?')) deleteSale(s.id) }} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Delete"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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

export default SalesPage;
