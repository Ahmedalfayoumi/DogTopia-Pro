
import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { TransactionItem, Item, Purchase, Currency, View } from '../types';
import { jsPDF } from 'https://esm.sh/jspdf';
import autoTable from 'https://esm.sh/jspdf-autotable';

interface PurchasePageProps {
  setView?: (view: View) => void;
}

type SortKey = 'id' | 'supplierName' | 'date' | 'grandTotal';

const PurchasePage: React.FC<PurchasePageProps> = ({ setView }) => {
  const { 
    items, purchases, suppliers, recordPurchase, updatePurchase, 
    deletePurchase, addItem, currencies, defaultCurrencyId, 
    paymentTypes, defaultPaymentTypeId, companyInfo, logo, themeConfig 
  } = useInventory();

  const primaryColor = themeConfig.colors[0] || '#4f46e5';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | 'success'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeItemRowIndex, setActiveItemRowIndex] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedCurrencyId, setSelectedCurrencyId] = useState(defaultCurrencyId);
  const [selectedPaymentTypeId, setSelectedPaymentTypeId] = useState(defaultPaymentTypeId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseItems, setPurchaseItems] = useState<TransactionItem[]>([
    { itemId: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);

  const filteredAndSortedPurchases = useMemo(() => {
    let result = purchases.filter(p => 
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [purchases, searchTerm, sortConfig]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    if (modalMode === 'create' && isModalOpen) {
      setSelectedCurrencyId(defaultCurrencyId);
      setSelectedPaymentTypeId(defaultPaymentTypeId);
    }
  }, [isModalOpen, modalMode, defaultCurrencyId, defaultPaymentTypeId]);

  const activeCurrency = useMemo(() => 
    currencies.find(c => c.id === selectedCurrencyId) || currencies[0],
    [selectedCurrencyId, currencies]
  );

  const activePaymentType = useMemo(() => 
    paymentTypes.find(pt => pt.id === selectedPaymentTypeId),
    [selectedPaymentTypeId, paymentTypes]
  );

  const [newItemData, setNewItemData] = useState<Omit<Item, 'id'>>({
    name: '', barcode: '', description: '', unitPrice: 0, stock: 0, 
    purchaseUnit: 'Box', storageUnit: 'Pack', conversionPurchaseToStorage: 10, 
    sellingUnit: 'Piece', conversionStorageToSelling: 5,
  });

  const grandTotal = useMemo(() => 
    purchaseItems.reduce((acc, item) => acc + item.total, 0),
    [purchaseItems]
  );

  // Helper to handle Print
  const handlePrint = (purchaseId?: string) => {
    const pId = purchaseId || editingId;
    const purchase = purchases.find(p => p.id === pId);
    if (!purchase) return;

    const supplier = suppliers.find(s => s.id === purchase.supplierId);
    const curr = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];
    const pt = paymentTypes.find(type => type.id === purchase.paymentTypeId);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = purchase.items.map(pItem => {
      const item = items.find(i => i.id === pItem.itemId);
      return `
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 12px 0;">${item?.name || 'Unknown Item'}</td>
          <td style="border-bottom: 1px solid #eee; padding: 12px 0; text-align: center;">${pItem.quantity}</td>
          <td style="border-bottom: 1px solid #eee; padding: 12px 0; text-align: right;">${curr.symbol} ${pItem.unitPrice.toFixed(curr.digits)}</td>
          <td style="border-bottom: 1px solid #eee; padding: 12px 0; text-align: right; font-weight: bold;">${curr.symbol} ${pItem.total.toFixed(curr.digits)}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${purchase.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
            .company-info h1 { margin: 0; color: ${primaryColor}; }
            .invoice-details { text-align: right; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; border-bottom: 2px solid #333; padding: 12px 0; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
            .total-row { margin-top: 40px; text-align: right; }
            .total-row h2 { color: ${primaryColor}; font-size: 32px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              ${logo ? `<img src="${logo}" style="max-height: 60px; margin-bottom: 10px;" />` : `<h1>${companyInfo.name}</h1>`}
              <p>${companyInfo.address}<br>${companyInfo.phone}<br>${companyInfo.email}</p>
            </div>
            <div class="invoice-details">
              <h2 style="margin:0">PURCHASE INVOICE</h2>
              <p><b>Invoice #:</b> ${purchase.id}<br><b>Date:</b> ${purchase.date}</p>
            </div>
          </div>
          <div class="meta">
            <div>
              <p style="color: #666; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">Supplier</p>
              <p><b>${supplier?.name}</b><br>${supplier?.address || ''}<br>${supplier?.phone || ''}</p>
            </div>
            <div style="text-align: right;">
              <p style="color: #666; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">Payment Method</p>
              <p><b>${pt?.name || 'N/A'}</b></p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="total-row">
            <p style="margin: 0; color: #666; font-weight: bold; text-transform: uppercase; font-size: 12px;">Grand Total</p>
            <h2>${curr.symbol} ${purchase.grandTotal.toFixed(curr.digits)}</h2>
          </div>
          <div style="margin-top: 80px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            This is a computer generated invoice. Authorized signature required for validity.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Helper to handle PDF Export
  const handleExportPDF = (purchaseId?: string) => {
    const pId = purchaseId || editingId;
    const purchase = purchases.find(p => p.id === pId);
    if (!purchase) return;

    const doc = new jsPDF();
    const curr = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];
    const pt = paymentTypes.find(type => type.id === purchase.paymentTypeId);

    // Company Header
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text(companyInfo.name, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(companyInfo.address, 14, 28);
    doc.text(`${companyInfo.phone} | ${companyInfo.email}`, 14, 33);

    // Invoice Meta
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('PURCHASE INVOICE', 140, 20);
    doc.setFontSize(10);
    doc.text(`Invoice #: ${purchase.id}`, 140, 28);
    doc.text(`Date: ${purchase.date}`, 140, 33);

    // Separator
    doc.setDrawColor(230);
    doc.line(14, 40, 196, 40);

    // Supplier Info
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('SUPPLIER', 14, 50);
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(purchase.supplierName, 14, 56);
    doc.setFontSize(10);
    doc.text(`Method: ${pt?.name || 'N/A'}`, 140, 56);

    // Table
    const tableData = purchase.items.map(pItem => {
      const item = items.find(i => i.id === pItem.itemId);
      return [
        item?.name || 'Unknown Item',
        pItem.quantity.toString(),
        `${curr.symbol} ${pItem.unitPrice.toFixed(curr.digits)}`,
        `${curr.symbol} ${pItem.total.toFixed(curr.digits)}`
      ];
    });

    autoTable(doc, {
      startY: 70,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    // Final Total
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(12);
    doc.text('Grand Total:', 140, finalY + 20);
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.text(`${curr.symbol} ${purchase.grandTotal.toFixed(curr.digits)}`, 140, finalY + 30);

    doc.save(`Invoice_${purchase.id}.pdf`);
  };

  const handleView = (purchase: Purchase) => {
    setModalMode('view');
    setEditingId(purchase.id);
    setSelectedSupplierId(purchase.supplierId);
    setDate(purchase.date);
    setPurchaseItems(purchase.items);
    setSelectedCurrencyId(defaultCurrencyId);
    setSelectedPaymentTypeId(purchase.paymentTypeId || defaultPaymentTypeId);
    setShowConfirmation(false);
    setIsModalOpen(true);
  };

  const handleEdit = (purchase: Purchase) => {
    setModalMode('edit');
    setEditingId(purchase.id);
    setSelectedSupplierId(purchase.supplierId);
    setDate(purchase.date);
    setPurchaseItems(purchase.items);
    setSelectedCurrencyId(defaultCurrencyId);
    setSelectedPaymentTypeId(purchase.paymentTypeId || defaultPaymentTypeId);
    setShowConfirmation(false);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setModalMode('create');
    setEditingId(null);
    setSelectedSupplierId('');
    setSelectedCurrencyId(defaultCurrencyId);
    setSelectedPaymentTypeId(defaultPaymentTypeId);
    setDate(new Date().toISOString().split('T')[0]);
    setPurchaseItems([{ itemId: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setShowConfirmation(false);
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    if (modalMode === 'view' || modalMode === 'success' || showConfirmation) return;
    setPurchaseItems([...purchaseItems, { itemId: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (modalMode === 'view' || modalMode === 'success' || showConfirmation) return;
    if (purchaseItems.length > 1) {
      setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof TransactionItem, value: string | number) => {
    if (modalMode === 'view' || modalMode === 'success' || showConfirmation) return;
    const newItems = [...purchaseItems];
    const item = { ...newItems[index] };

    if (field === 'itemId') {
      item.itemId = value as string;
      item.unitPrice = 0;
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
      name: '', barcode: '', description: '', unitPrice: 0, stock: 0, 
      purchaseUnit: 'Box', storageUnit: 'Pack', conversionPurchaseToStorage: 10, 
      sellingUnit: 'Piece', conversionStorageToSelling: 5 
    });
    setActiveItemRowIndex(null);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'view' || modalMode === 'success') return;
    const supplier = suppliers.find(s => s.id === selectedSupplierId);

    const isCredit = activePaymentType?.name.toLowerCase().includes('credit');
    if (isCredit && (!selectedSupplierId || selectedSupplierId === 'Sup-0001')) {
      alert("Validation Error: For 'Credit' purchases, you MUST select a specific registered supplier.");
      return;
    }

    if (!selectedSupplierId || !supplier || purchaseItems.some(i => !i.itemId)) {
      alert("Please select a supplier and fill in all item fields.");
      return;
    }

    setShowConfirmation(true);
  };

  const finalizeTransaction = () => {
    const isCredit = activePaymentType?.name.toLowerCase().includes('credit');
    if (isCredit && (!selectedSupplierId || selectedSupplierId === 'Sup-0001')) {
      alert("Error: A registered supplier is required for credit transactions.");
      setShowConfirmation(false);
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    const data = { 
      supplierId: supplier.id, 
      supplierName: supplier.name, 
      date, 
      items: purchaseItems, 
      grandTotal,
      paymentTypeId: selectedPaymentTypeId
    };
    
    let result: Purchase;
    if (modalMode === 'edit' && editingId) {
      result = { ...data, id: editingId };
      updatePurchase(editingId, result);
    } else {
      result = recordPurchase(data);
    }
    
    setEditingId(result.id);
    setModalMode('success');
    setShowConfirmation(false);
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

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig?.key !== column) return <span className="ml-1 opacity-20">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="ml-1 text-indigo-600">↑</span> : <span className="ml-1 text-indigo-600">↓</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Add New Item Modal (Inside Purchase) */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">✨ Add New Item</h2>
              <button onClick={() => setIsAddItemModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleQuickAddItem} className="p-6 space-y-6 overflow-y-auto">
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
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddItemModalOpen(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-colors">Confirm & Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Modal - Recording/Viewing Purchase */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">{modalMode === 'success' ? '✨' : '📥'}</span>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                  {modalMode === 'success' ? 'Purchase Finalized' : showConfirmation ? '✅ Finalize Purchase' : (modalMode === 'view' ? 'View Invoice' : modalMode === 'edit' ? 'Edit Invoice' : 'Record New Purchase')}
                </h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto">
              {modalMode === 'success' ? (
                <div className="p-12 space-y-8 animate-in zoom-in-95 duration-300">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xl shadow-emerald-50">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-3xl font-black text-gray-800">Success!</h3>
                    <p className="text-gray-500 font-medium">Invoice <b>${editingId}</b> has been recorded and stock updated.</p>
                  </div>
                  
                  <div className="max-w-md mx-auto grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => handlePrint()}
                      className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                      <span>🖨️</span> Print Invoice
                    </button>
                    <button 
                      onClick={() => handleExportPDF()}
                      className="w-full py-4 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                      <span>📄</span> Export to PDF
                    </button>
                    <button 
                      onClick={closeModal}
                      className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                    >
                      Continue to Ledger
                    </button>
                  </div>
                </div>
              ) : !showConfirmation ? (
                <form onSubmit={handlePreSubmit} className="p-8 space-y-8">
                  {/* Actions for existing invoice */}
                  {modalMode === 'view' && (
                    <div className="flex justify-end gap-3 mb-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                       <button type="button" onClick={() => handlePrint()} className="px-4 py-2 bg-white text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2 text-sm shadow-sm">
                         <span>🖨️</span> Print
                       </button>
                       <button type="button" onClick={() => handleExportPDF()} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm shadow-sm">
                         <span>📄</span> Save PDF
                       </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">SELECT SUPPLIER</label>
                      <select
                        disabled={modalMode === 'view'}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-50 text-sm font-medium transition-all ${
                          (activePaymentType?.name.toLowerCase().includes('credit') && (!selectedSupplierId || selectedSupplierId === 'Sup-0001'))
                            ? 'border-red-300 bg-red-50/30'
                            : 'border-gray-200'
                        }`}
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                      >
                        <option value="">Choose a Supplier</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} {s.isDefault ? '(Default)' : ''}</option>)}
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
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">PAYMENT TYPE</label>
                        {modalMode !== 'view' && setView && (
                          <button type="button" onClick={navigateToPayments} className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-tight">
                            Manage
                          </button>
                        )}
                      </div>
                      <select
                        disabled={modalMode === 'view'}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-50 text-sm font-bold text-indigo-700 transition-all"
                        value={selectedPaymentTypeId}
                        onChange={(e) => setSelectedPaymentTypeId(e.target.value)}
                      >
                        {paymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-2">
                      <h3 className="text-xs font-black text-indigo-800 uppercase tracking-[0.2em]">LINE ITEMS</h3>
                      {modalMode !== 'view' && (
                        <button type="button" onClick={addItemRow} className="flex items-center gap-1 px-4 py-2 border-2 border-indigo-600 rounded-lg text-indigo-600 font-bold text-xs hover:bg-indigo-50 transition-all active:scale-95">
                          <span className="text-lg">+</span> Add Row
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      {purchaseItems.map((pItem, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end group bg-gray-50/30 p-4 rounded-xl border border-gray-100">
                          <div className="col-span-12 md:col-span-4 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">ITEM</label>
                            <select
                              disabled={modalMode === 'view'}
                              required
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-50 text-sm font-medium"
                              value={pItem.itemId}
                              onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                            >
                              <option value="">Select Item</option>
                              {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                          </div>
                          <div className="col-span-6 md:col-span-2 space-y-1">
                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">QUANTITY</label>
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
                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">UNIT COST</label>
                            <input
                              disabled={modalMode === 'view'}
                              required
                              type="number"
                              step="any"
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 text-sm font-medium"
                              value={pItem.unitPrice || ''}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            />
                          </div>
                          <div className="col-span-10 md:col-span-3 space-y-1">
                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">LINE TOTAL</label>
                            <div className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-indigo-700 text-sm font-bold flex items-center">
                              {activeCurrency.symbol} {pItem.total.toFixed(activeCurrency.digits)}
                            </div>
                          </div>
                          <div className="col-span-2 md:col-span-1 flex justify-center pb-1">
                            {(modalMode !== 'view' && modalMode !== 'success') && (
                              <button type="button" onClick={() => removeItemRow(index)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
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
                        {modalMode === 'view' ? 'Close' : 'Cancel'}
                      </button>
                      {(modalMode !== 'view' && modalMode !== 'success') && (
                        <button type="submit" className="flex-1 md:w-56 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-all active:scale-[0.98] text-lg">
                          {modalMode === 'edit' ? 'Review & Update' : 'Finalize & Review'}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              ) : (
                <div className="p-12 space-y-8">
                  <div className="text-center space-y-2">
                     <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-4xl mb-4 shadow-inner">
                       <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                     </div>
                     <h3 className="text-3xl font-black text-gray-800">Confirm Stock-In</h3>
                     <p className="text-gray-500 font-medium">Verify the supplier settlement details before updating inventory</p>
                  </div>

                  <div className="max-w-md mx-auto bg-gray-50 rounded-[2.5rem] p-10 border border-gray-200 space-y-6 shadow-sm">
                     <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier</span>
                        <span className="font-bold text-gray-800">{suppliers.find(s => s.id === selectedSupplierId)?.name}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-gray-200 pb-4 bg-white -mx-4 px-4 py-3 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Payment Method</span>
                        <select
                          className="bg-transparent font-black text-indigo-800 text-xl uppercase tracking-tighter outline-none cursor-pointer border-b-2 border-indigo-200 focus:border-indigo-500 transition-colors"
                          value={selectedPaymentTypeId}
                          onChange={(e) => setSelectedPaymentTypeId(e.target.value)}
                        >
                          {paymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                        </select>
                     </div>
                     <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Invoice</span>
                        <span className="text-4xl font-black text-gray-900 tracking-tighter">{activeCurrency.symbol} {grandTotal.toFixed(activeCurrency.digits)}</span>
                     </div>
                  </div>

                  <div className="flex gap-4 max-w-md mx-auto pb-12">
                    <button 
                      onClick={() => setShowConfirmation(false)} 
                      className="flex-1 py-4 border-2 border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
                    >
                      Go Back
                    </button>
                    <button 
                      onClick={finalizeTransaction} 
                      className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-2xl transition-all active:scale-[0.98]"
                    >
                      Confirm & Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Ledger View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-grow">
            <h2 className="text-2xl font-bold text-gray-800">Purchase Ledger</h2>
            <p className="text-gray-500 text-sm mt-1">Summary of inventory stock-in invoices and payment terms</p>
            
            <div className="mt-4 relative max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
              <input
                type="text"
                placeholder="Search by supplier or invoice #..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
                <th 
                  className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('id')}
                >
                  Invoice # <SortIcon column="id" />
                </th>
                <th 
                  className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('supplierName')}
                >
                  Supplier Name <SortIcon column="supplierName" />
                </th>
                <th 
                  className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  Date <SortIcon column="date" />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Payment</th>
                <th 
                  className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('grandTotal')}
                >
                  Total Amount <SortIcon column="grandTotal" />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedPurchases.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400 italic">No matching purchase history found</td></tr>
              ) : (
                filteredAndSortedPurchases.map(p => {
                  const curr = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];
                  const pt = paymentTypes.find(type => type.id === p.paymentTypeId);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-gray-500 text-sm">{p.id}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{p.supplierName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                          pt?.name.toLowerCase().includes('credit') 
                            ? 'bg-amber-100 text-amber-600' 
                            : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {pt?.name || 'N/A'}
                        </span>
                      </td>
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
