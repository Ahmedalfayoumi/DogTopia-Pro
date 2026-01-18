
import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { View, Purchase, PurchaseReturn, TransactionItem } from '../types';

interface PurchaseReturnPageProps {
  currentView: View;
}

const PurchaseReturnPage: React.FC<PurchaseReturnPageProps> = ({ currentView }) => {
  const { purchases, purchaseReturns, recordPurchaseReturn, deletePurchaseReturn, items, currencies, defaultCurrencyId } = useInventory();
  
  const isImportReturn = currentView === 'purchases_import_return';
  const currency = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(val);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'select_invoice' | 'return_form'>('select_invoice');
  const [selectedInvoice, setSelectedInvoice] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Omit<PurchaseReturn, 'id'>>({
    originalPurchaseId: '',
    type: isImportReturn ? 'Import' : 'Local',
    supplierId: '',
    supplierName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    grandTotal: 0,
    reason: ''
  });

  const availableInvoices = useMemo(() => {
    const type = isImportReturn ? 'Import' : 'Local';
    return purchases.filter(p => p.type === type);
  }, [purchases, isImportReturn]);

  const filteredReturns = useMemo(() => {
    const type = isImportReturn ? 'Import' : 'Local';
    return purchaseReturns.filter(r => r.type === type && (
      r.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  }, [purchaseReturns, isImportReturn, searchTerm]);

  const handleSelectInvoice = (invoice: Purchase) => {
    setSelectedInvoice(invoice);
    setFormData({
      originalPurchaseId: invoice.id,
      type: invoice.type,
      supplierId: invoice.supplierId,
      supplierName: invoice.supplierName,
      date: new Date().toISOString().split('T')[0],
      reason: '',
      items: invoice.items.map(item => ({
        ...item,
        quantity: 0 // Default return quantity to 0
      })),
      grandTotal: 0
    });
    setStep('return_form');
  };

  const handleQtyChange = (index: number, val: string) => {
    const newItems = [...formData.items];
    const qty = parseFloat(val) || 0;
    const maxQty = selectedInvoice?.items[index].quantity || 0;
    
    if (qty > maxQty) {
      alert(`Cannot return more than originally purchased (${maxQty})`);
      newItems[index].quantity = maxQty;
    } else {
      newItems[index].quantity = qty;
    }
    
    newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    
    const newGrandTotal = newItems.reduce((acc, i) => acc + i.total, 0);
    setFormData({ ...formData, items: newItems, grandTotal: newGrandTotal });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.every(i => i.quantity === 0)) {
      alert("Please return at least one item.");
      return;
    }
    
    // Filter out items with 0 return quantity
    const finalItems = formData.items.filter(i => i.quantity > 0);
    recordPurchaseReturn({ ...formData, items: finalItems });
    closeModal();
  };

  const openAddModal = () => {
    setStep('select_invoice');
    setSelectedInvoice(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">
                {step === 'select_invoice' ? '🔍 Step 1: Select Original Invoice' : '🔄 Step 2: Configure Return'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
              {step === 'select_invoice' ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">Please choose the purchase invoice containing the items you wish to return.</p>
                  <div className="grid grid-cols-1 gap-3">
                    {availableInvoices.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 italic">No valid invoices found for this category.</div>
                    ) : (
                      availableInvoices.map(inv => (
                        <button
                          key={inv.id}
                          onClick={() => handleSelectInvoice(inv)}
                          className="w-full p-4 border border-gray-100 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left flex justify-between items-center group"
                        >
                          <div>
                            <div className="font-bold text-gray-800">{inv.id} &bull; {inv.supplierName}</div>
                            <div className="text-xs text-gray-400">{inv.date} &bull; {inv.items.length} items</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-indigo-600">{currency.symbol} {formatAmount(inv.grandTotal)}</div>
                            <div className="text-[10px] font-black text-indigo-400 opacity-0 group-hover:opacity-100 uppercase tracking-widest transition-opacity">Select Invoice →</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Original Document</div>
                      <div className="font-bold text-indigo-800">{selectedInvoice?.id} from {selectedInvoice?.supplierName}</div>
                    </div>
                    <button type="button" onClick={() => setStep('select_invoice')} className="text-xs font-bold text-indigo-600 underline">Change Invoice</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Return Date</label>
                      <input required type="date" className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason for Return</label>
                      <input required placeholder="e.g. Defective items, wrong quantity..." className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block border-b border-gray-100 pb-2">Items to Return</label>
                    {formData.items.map((rItem, idx) => {
                      const originalItem = items.find(i => i.id === rItem.itemId);
                      const maxQty = selectedInvoice?.items[idx].quantity || 0;
                      return (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                          <div className="md:col-span-6">
                            <div className="font-bold text-gray-800 text-sm">{originalItem?.name || 'Unknown'}</div>
                            <div className="text-[10px] text-gray-400 uppercase">Purchased: {maxQty} &bull; Price: {currency.symbol}{formatAmount(rItem.unitPrice)}</div>
                          </div>
                          <div className="md:col-span-3">
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Return Qty</label>
                            <input
                              type="number"
                              min="0"
                              max={maxQty}
                              step="any"
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-red-600 focus:ring-2 focus:ring-red-500 outline-none"
                              value={rItem.quantity || ''}
                              placeholder="0"
                              onChange={e => handleQtyChange(idx, e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-3 text-right">
                            <div className="text-[9px] font-bold text-gray-400 uppercase">Credit Value</div>
                            <div className="font-black text-gray-800">{currency.symbol} {formatAmount(rItem.total)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Refund Value</div>
                      <div className="text-3xl font-black text-red-600 tracking-tighter">{currency.symbol} {formatAmount(formData.grandTotal)}</div>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={closeModal} className="px-8 py-3 border-2 border-gray-100 text-gray-400 font-bold rounded-xl hover:bg-gray-50">Cancel</button>
                      <button type="submit" className="px-10 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg transition-all active:scale-95">Finalize Return</button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">{isImportReturn ? 'Import Returns' : 'Local Returns'}</h2>
            <p className="text-gray-500 mt-1">Manage stock-out returns for {isImportReturn ? 'overseas shipments' : 'local purchases'}.</p>
            
            <div className="mt-6 relative max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
              <input type="text" placeholder="Search returns..." className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white transition-all text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <button onClick={openAddModal} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg transition-all active:scale-95">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
            Add New Return
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 font-black text-gray-400 text-[10px] uppercase tracking-widest">
                <th className="px-6 py-4">Return ID</th>
                <th className="px-6 py-4">Original Invoice</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Refund Total</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReturns.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400 italic">No purchase returns recorded in this ledger yet.</td></tr>
              ) : (
                filteredReturns.map(ret => (
                  <tr key={ret.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold text-red-600 text-sm">{ret.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-500 text-sm">{ret.originalPurchaseId}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{ret.supplierName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{ret.date}</td>
                    <td className="px-6 py-4 text-right font-black text-red-600">{currency.symbol} {formatAmount(ret.grandTotal)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { if(confirm('Delete this return record? Warning: This will not automatically reverse stock.')) deletePurchaseReturn(ret.id) }} className="p-2 text-gray-300 hover:text-red-600 transition-colors">✕</button>
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

export default PurchaseReturnPage;
