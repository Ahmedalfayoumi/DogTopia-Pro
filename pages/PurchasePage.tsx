
import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { TransactionItem, Item, Purchase, Currency, View, PurchaseExpense } from '../types';
import SearchableItemSelector from '../components/SearchableItemSelector';
import { jsPDF } from 'https://esm.sh/jspdf';
import autoTable from 'https://esm.sh/jspdf-autotable';

interface PurchasePageProps {
  currentView?: View;
  setView?: (view: View) => void;
}

type SortKey = 'id' | 'supplierName' | 'date' | 'grandTotal';

const PurchasePage: React.FC<PurchasePageProps> = ({ currentView, setView }) => {
  const { 
    items, purchases, suppliers, recordPurchase, updatePurchase, 
    deletePurchase, addItem, currencies, defaultCurrencyId, 
    paymentTypes, defaultPaymentTypeId, companyInfo, logo, themeConfig 
  } = useInventory();

  const isImportMode = currentView === 'purchases_import';
  const primaryColor = themeConfig.colors[0] || '#4f46e5';

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(val);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | 'success'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
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
  const [expenses, setExpenses] = useState<PurchaseExpense[]>([]);

  const filteredAndSortedPurchases = useMemo(() => {
    // Filter by view type
    const baseType = isImportMode ? 'Import' : 'Local';
    let result = purchases.filter(p => p.type === baseType);

    // Apply search
    result = result.filter(p => 
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
  }, [purchases, searchTerm, sortConfig, isImportMode]);

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

  const itemsSubtotal = useMemo(() => 
    purchaseItems.reduce((acc, item) => acc + item.total, 0),
    [purchaseItems]
  );

  const expensesTotal = useMemo(() => 
    expenses.reduce((acc, exp) => acc + exp.amount, 0),
    [expenses]
  );

  const grandTotal = itemsSubtotal + expensesTotal;

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
          <td style="border-bottom: 1px solid #eee; padding: 12px 0; text-align: right;">${curr.symbol} ${formatAmount(pItem.unitPrice)}</td>
          <td style="border-bottom: 1px solid #eee; padding: 12px 0; text-align: right; font-weight: bold;">${curr.symbol} ${formatAmount(pItem.total)}</td>
        </tr>
      `;
    }).join('');

    const expensesHtml = purchase.expenses?.length 
      ? `
        <div style="margin-top: 20px;">
          <h4 style="border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; font-size: 14px;">Shipment Expenses</h4>
          <table style="width: 100%;">
            ${purchase.expenses.map(e => `
              <tr>
                <td style="padding: 5px 0;">${e.description}</td>
                <td style="text-align: right; padding: 5px 0;">${curr.symbol} ${formatAmount(e.amount)}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      ` : '';

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
              <h2 style="margin:0">${purchase.type === 'Import' ? 'OVERSEAS INVOICE' : 'PURCHASE INVOICE'}</h2>
              <p><b>Invoice #:</b> ${purchase.id}<br><b>Date:</b> ${purchase.date}</p>
            </div>
          </div>
          <div class="meta">
            <div>
              <p style="color: #666; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">${purchase.type === 'Import' ? 'Exporter' : 'Supplier'}</p>
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
          ${expensesHtml}
          <div class="total-row">
            <p style="margin: 0; color: #666; font-weight: bold; text-transform: uppercase; font-size: 12px;">Grand Total</p>
            <h2>${curr.symbol} ${formatAmount(purchase.grandTotal)}</h2>
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

  const handleExportPDF = (purchaseId?: string) => {
    const pId = purchaseId || editingId;
    const purchase = purchases.find(p => p.id === pId);
    if (!purchase) return;

    const doc = new jsPDF();
    const curr = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];
    const pt = paymentTypes.find(type => type.id === purchase.paymentTypeId);

    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text(companyInfo.name, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(companyInfo.address, 14, 28);
    doc.text(`${companyInfo.phone} | ${companyInfo.email}`, 14, 33);

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(purchase.type === 'Import' ? 'OVERSEAS INVOICE' : 'PURCHASE INVOICE', 120, 20);
    doc.setFontSize(10);
    doc.text(`Invoice #: ${purchase.id}`, 120, 28);
    doc.text(`Date: ${purchase.date}`, 120, 33);

    doc.setDrawColor(230);
    doc.line(14, 40, 196, 40);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(purchase.type === 'Import' ? 'EXPORTER' : 'SUPPLIER', 14, 50);
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(purchase.supplierName, 14, 56);
    doc.setFontSize(10);
    doc.text(`Method: ${pt?.name || 'N/A'}`, 120, 56);

    const tableData = purchase.items.map(pItem => {
      const item = items.find(i => i.id === pItem.itemId);
      return [
        item?.name || 'Unknown Item',
        pItem.quantity.toString(),
        `${curr.symbol} ${formatAmount(pItem.unitPrice)}`,
        `${curr.symbol} ${formatAmount(pItem.total)}`
      ];
    });

    autoTable(doc, {
      startY: 70,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
    });

    let finalY = (doc as any).lastAutoTable.finalY || 100;

    if (purchase.expenses?.length) {
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text('Expenses Summary', 14, finalY + 15);
      const expenseData = purchase.expenses.map(e => [e.description, `${curr.symbol} ${formatAmount(e.amount)}`]);
      autoTable(doc, {
        startY: finalY + 20,
        head: [['Expense Description', 'Amount']],
        body: expenseData,
        theme: 'plain',
        columnStyles: { 1: { halign: 'right' } }
      });
      finalY = (doc as any).lastAutoTable.finalY || finalY + 30;
    }

    doc.setFontSize(12);
    doc.text('Grand Total:', 120, finalY + 20);
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.text(`${curr.symbol} ${formatAmount(purchase.grandTotal)}`, 120, finalY + 30);

    doc.save(`${purchase.type}_Invoice_${purchase.id}.pdf`);
  };

  const handleView = (purchase: Purchase) => {
    setModalMode('view');
    setEditingId(purchase.id);
    setSelectedSupplierId(purchase.supplierId);
    setDate(purchase.date);
    setPurchaseItems(purchase.items);
    setExpenses(purchase.expenses || []);
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
    setExpenses(purchase.expenses || []);
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
    setExpenses([]);
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
    } else if (field === 'quantity') {
      item.quantity = parseFloat(value as string) || 0;
    } else if (field === 'unitPrice') {
      item.unitPrice = parseFloat(value as string) || 0;
    }

    item.total = item.quantity * item.unitPrice;
    newItems[index] = item;
    setPurchaseItems(newItems);
  };

  const addExpenseRow = () => {
    if (modalMode === 'view' || modalMode === 'success' || showConfirmation) return;
    setExpenses([...expenses, { description: '', amount: 0 }]);
  };

  const removeExpenseRow = (index: number) => {
    if (modalMode === 'view' || modalMode === 'success' || showConfirmation) return;
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const handleExpenseChange = (index: number, field: keyof PurchaseExpense, value: string | number) => {
    if (modalMode === 'view' || modalMode === 'success' || showConfirmation) return;
    const newExpenses = [...expenses];
    newExpenses[index] = { 
      ...newExpenses[index], 
      [field]: field === 'amount' ? (parseFloat(value as string) || 0) : value 
    };
    setExpenses(newExpenses);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'view' || modalMode === 'success') return;
    const supplier = suppliers.find(s => s.id === selectedSupplierId);

    if (!selectedSupplierId || !supplier || purchaseItems.some(i => !i.itemId)) {
      alert("Please select a valid provider and fill in all item fields.");
      return;
    }

    setShowConfirmation(true);
  };

  const finalizeTransaction = () => {
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    const data = { 
      type: isImportMode ? 'Import' : ('Local' as any),
      supplierId: supplier.id, 
      supplierName: supplier.name, 
      date, 
      items: purchaseItems, 
      expenses: isImportMode ? expenses : [],
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

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig?.key !== column) return <span className="ml-1 opacity-20">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="ml-1 text-indigo-600">↑</span> : <span className="ml-1 text-indigo-600">↓</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Main Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">{isImportMode ? '🚢' : '🏠'}</span>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight uppercase">
                  {modalMode === 'success' ? 'Finalized' : showConfirmation ? 'Confirm Transaction' : (modalMode === 'view' ? 'View Details' : modalMode === 'edit' ? 'Edit Details' : (isImportMode ? 'New Overseas Transaction' : 'Record Local Purchase'))}
                </h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar">
              {modalMode === 'success' ? (
                <div className="p-12 space-y-8 animate-in zoom-in-95 duration-300">
                   <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                      ✓
                    </div>
                    <h3 className="text-3xl font-black text-gray-800">Transaction Recorded!</h3>
                    <p className="text-gray-500">Invoice <b>{editingId}</b> has been saved to the ledger.</p>
                  </div>
                  <div className="max-w-md mx-auto grid grid-cols-1 gap-4">
                    <button onClick={() => handlePrint()} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-3">🖨️ Print Document</button>
                    <button onClick={() => handleExportPDF()} className="w-full py-4 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 flex items-center justify-center gap-3">📄 Download PDF</button>
                    <button onClick={closeModal} className="w-full py-4 text-gray-400 font-bold hover:text-gray-600">Continue to Ledger</button>
                  </div>
                </div>
              ) : !showConfirmation ? (
                <form onSubmit={handlePreSubmit} className="p-8 space-y-8">
                  {modalMode === 'view' && (
                    <div className="flex justify-end gap-3 mb-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                       <button type="button" onClick={() => handlePrint()} className="px-4 py-2 bg-white text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm shadow-sm">🖨️ Print</button>
                       <button type="button" onClick={() => handleExportPDF()} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm shadow-sm">📄 Save PDF</button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{isImportMode ? 'EXPORTER' : 'SUPPLIER'}</label>
                      <select disabled={modalMode === 'view'} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-50 text-sm" value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)}>
                        <option value="">Choose Provider</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">INVOICE DATE</label>
                      <input disabled={modalMode === 'view'} required type="date" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">CURRENCY</label>
                      <select disabled={modalMode === 'view'} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-50 text-sm" value={selectedCurrencyId} onChange={(e) => setSelectedCurrencyId(e.target.value)}>
                        {currencies.map(c => <option key={c.id} value={c.id}>{c.code} ({c.symbol})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">PAYMENT TYPE</label>
                      <select disabled={modalMode === 'view'} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-50 text-sm font-bold text-indigo-700" value={selectedPaymentTypeId} onChange={(e) => setSelectedPaymentTypeId(e.target.value)}>
                        {paymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <h3 className="text-xs font-black text-indigo-800 uppercase tracking-[0.2em]">INVOICE ITEMS</h3>
                      {modalMode !== 'view' && <button type="button" onClick={addItemRow} className="text-indigo-600 font-bold text-xs flex items-center gap-1">+ ADD ROW</button>}
                    </div>
                    <div className="space-y-4">
                      {purchaseItems.map((pItem, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50/30 p-4 rounded-xl border border-gray-100">
                          <div className="col-span-12 md:col-span-4 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">ITEM</label>
                            <SearchableItemSelector
                              disabled={modalMode === 'view'}
                              items={items}
                              selectedId={pItem.itemId}
                              onSelect={(id) => handleItemChange(index, 'itemId', id)}
                              placeholder="Select Item..."
                            />
                          </div>
                          <div className="col-span-6 md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">QTY</label>
                            <input disabled={modalMode === 'view'} required type="number" step="any" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={pItem.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                          </div>
                          <div className="col-span-6 md:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">UNIT PRICE</label>
                            <input disabled={modalMode === 'view'} required type="number" step="0.001" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={pItem.unitPrice || ''} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} />
                          </div>
                          <div className="col-span-10 md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">TOTAL</label>
                            <div className="px-3 py-2 bg-white border border-gray-100 rounded-lg text-indigo-700 font-bold text-sm">{activeCurrency.symbol} {formatAmount(pItem.total)}</div>
                          </div>
                          <div className="col-span-2 md:col-span-1 pb-1">
                            {modalMode !== 'view' && <button type="button" onClick={() => removeItemRow(index)} className="text-red-400 hover:text-red-600">✕</button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isImportMode && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <h3 className="text-xs font-black text-amber-600 uppercase tracking-[0.2em]">SHIPMENT & IMPORT EXPENSES</h3>
                        {modalMode !== 'view' && <button type="button" onClick={addExpenseRow} className="text-amber-600 font-bold text-xs flex items-center gap-1">+ ADD EXPENSE</button>}
                      </div>
                      <div className="space-y-3">
                        {expenses.length === 0 && <p className="text-[10px] text-gray-400 italic">No shipment expenses recorded yet.</p>}
                        {expenses.map((exp, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-amber-50/30 p-4 rounded-xl border border-amber-100/50">
                            <div className="col-span-12 md:col-span-7 space-y-1">
                              <label className="text-[10px] font-bold text-amber-500/60 uppercase">EXPENSE DESCRIPTION</label>
                              <input disabled={modalMode === 'view'} required placeholder="e.g. Customs, Freight, Clearance..." className="w-full px-3 py-2 border border-amber-100 rounded-lg bg-white text-sm" value={exp.description} onChange={(e) => handleExpenseChange(idx, 'description', e.target.value)} />
                            </div>
                            <div className="col-span-10 md:col-span-4 space-y-1">
                              <label className="text-[10px] font-bold text-amber-500/60 uppercase">AMOUNT</label>
                              <input disabled={modalMode === 'view'} required type="number" step="0.001" className="w-full px-3 py-2 border border-amber-100 rounded-lg bg-white text-sm font-bold text-amber-700" value={exp.amount || ''} onChange={(e) => handleExpenseChange(idx, 'amount', e.target.value)} />
                            </div>
                            <div className="col-span-2 md:col-span-1 pb-1">
                              {modalMode !== 'view' && <button type="button" onClick={() => removeExpenseRow(idx)} className="text-red-400 hover:text-red-600">✕</button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-gray-100">
                    <div className="grid grid-cols-2 md:flex items-center gap-x-8 gap-y-2">
                       <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-gray-400 uppercase">Items Subtotal</span>
                         <span className="text-xl font-bold text-gray-700">{activeCurrency.symbol} {formatAmount(itemsSubtotal)}</span>
                       </div>
                       {isImportMode && (
                         <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-amber-400 uppercase">Total Expenses</span>
                           <span className="text-xl font-bold text-amber-600">{activeCurrency.symbol} {formatAmount(expensesTotal)}</span>
                         </div>
                       )}
                       <div className="col-span-2 flex flex-col md:ml-4 border-l border-gray-100 pl-8">
                         <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">FINAL GRAND TOTAL</span>
                         <span className="text-4xl font-black text-indigo-600 tracking-tighter">{activeCurrency.symbol} {formatAmount(grandTotal)}</span>
                       </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                      <button type="button" onClick={closeModal} className="flex-1 px-8 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">{modalMode === 'view' ? 'Close' : 'Cancel'}</button>
                      {modalMode !== 'view' && <button type="submit" className="flex-1 px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg">Review & Save</button>}
                    </div>
                  </div>
                </form>
              ) : (
                <div className="p-12 space-y-8 text-center max-w-md mx-auto">
                  <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Ready to Finalize?</h3>
                  <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 space-y-4 text-left">
                     <div className="flex justify-between border-b pb-2"><span className="text-xs text-gray-400">Total Invoice</span><span className="font-bold">{activeCurrency.symbol} {formatAmount(grandTotal)}</span></div>
                     <div className="flex justify-between"><span className="text-xs text-gray-400">Payment</span><span className="font-bold text-indigo-600">{activePaymentType?.name}</span></div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setShowConfirmation(false)} className="flex-1 py-4 border border-gray-200 text-gray-400 font-bold rounded-2xl">Edit More</button>
                    <button onClick={finalizeTransaction} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl">Confirm & Save</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Ledger View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{isImportMode ? 'Importing Ledger (Overseas)' : 'Local Purchase Ledger'}</h2>
            <p className="text-gray-500 text-sm mt-1">{isImportMode ? 'Manage international shipments and tracked expenses' : 'Summary of domestic inventory stock-in invoices'}</p>
            <div className="mt-4 relative max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
              <input type="text" placeholder="Search invoices..." className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 focus:bg-white text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg">
            {isImportMode ? '🚢 New Overseas Transaction' : '📥 Add Local Purchase'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest cursor-pointer" onClick={() => handleSort('id')}>Inv # <SortIcon column="id" /></th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest cursor-pointer" onClick={() => handleSort('supplierName')}>{isImportMode ? 'Exporter' : 'Supplier'} <SortIcon column="supplierName" /></th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest cursor-pointer" onClick={() => handleSort('date')}>Date <SortIcon column="date" /></th>
                {isImportMode && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Overhead</th>}
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right cursor-pointer" onClick={() => handleSort('grandTotal')}>Total <SortIcon column="grandTotal" /></th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedPurchases.length === 0 ? (
                <tr><td colSpan={isImportMode ? 6 : 5} className="px-6 py-16 text-center text-gray-400 italic">No {isImportMode ? 'import' : 'local'} history found</td></tr>
              ) : (
                filteredAndSortedPurchases.map(p => {
                  const curr = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];
                  const overhead = p.expenses?.reduce((a, b) => a + b.amount, 0) || 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-gray-500 text-sm">{p.id}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{p.supplierName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.date}</td>
                      {isImportMode && <td className="px-6 py-4 text-center font-bold text-amber-600 text-xs">{overhead > 0 ? `+ ${curr.symbol} ${formatAmount(overhead)}` : '-'}</td>}
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">{curr.symbol} {formatAmount(p.grandTotal)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleView(p)} className="p-2 text-gray-400 hover:text-indigo-600">🔍</button>
                          <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-amber-600">✏️</button>
                          <button onClick={() => { if(confirm('Delete?')) deletePurchase(p.id) }} className="p-2 text-gray-400 hover:text-red-600">✕</button>
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
