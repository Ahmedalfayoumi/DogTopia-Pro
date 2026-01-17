
import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { TransactionItem, Sale, View, Item } from '../types';
import SearchableItemSelector from '../components/SearchableItemSelector';
import { jsPDF } from 'https://esm.sh/jspdf';
import autoTable from 'https://esm.sh/jspdf-autotable';

interface SalesPageProps {
  setView?: (view: View) => void;
}

type SortKey = 'id' | 'customerName' | 'date' | 'grandTotal';

const SalesPage: React.FC<SalesPageProps> = ({ setView }) => {
  const { 
    items, sales, clients, recordSale, updateSale, deleteSale, 
    currencies, defaultCurrencyId, paymentTypes, defaultPaymentTypeId,
    companyInfo, logo, themeConfig
  } = useInventory();

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

  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPaymentTypeId, setSelectedPaymentTypeId] = useState(defaultPaymentTypeId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesItems, setSalesItems] = useState<TransactionItem[]>([
    { itemId: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);

  const currency = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];

  const filteredAndSortedSales = useMemo(() => {
    let result = sales.filter(s => 
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [sales, searchTerm, sortConfig]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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

  // Helper to handle Print
  const handlePrint = (saleId?: string) => {
    const sId = saleId || editingId;
    const sale = sales.find(s => s.id === sId);
    if (!sale) return;

    const client = clients.find(c => c.id === sale.clientId);
    const curr = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];
    const pt = paymentTypes.find(type => type.id === sale.paymentTypeId);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = sale.items.map(sItem => {
      const item = items.find(i => i.id === sItem.itemId);
      return `
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 12px 0;">${item?.name || 'Unknown Item'}</td>
          <td style="border-bottom: 1px solid #eee; padding: 12px 0; text-align: center;">${sItem.quantity}</td>
          <td style="border-bottom: 1px solid #eee; padding: 12px 0; text-align: right;">${curr.symbol} ${formatAmount(sItem.unitPrice)}</td>
          <td style="border-bottom: 1px solid #eee; padding: 12px 0; text-align: right; font-weight: bold;">${curr.symbol} ${formatAmount(sItem.total)}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Sales Invoice ${sale.id}</title>
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
              <h2 style="margin:0">SALES INVOICE</h2>
              <p><b>Invoice #:</b> ${sale.id}<br><b>Date:</b> ${sale.date}</p>
            </div>
          </div>
          <div class="meta">
            <div>
              <p style="color: #666; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">Customer</p>
              <p><b>${sale.customerName}</b><br>${client?.address || ''}<br>${client?.phone || ''}</p>
            </div>
            <div style="text-align: right;">
              <p style="color: #666; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">Payment Method</p>
              <p><b>${pt?.name || 'Cash'}</b></p>
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
            <h2>${curr.symbol} ${formatAmount(sale.grandTotal)}</h2>
          </div>
          <div style="margin-top: 80px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            Thank you for your business. This is a computer generated invoice.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Helper to handle PDF Export
  const handleExportPDF = (saleId?: string) => {
    const sId = saleId || editingId;
    const sale = sales.find(s => s.id === sId);
    if (!sale) return;

    const doc = new jsPDF();
    const curr = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];
    const pt = paymentTypes.find(type => type.id === sale.paymentTypeId);

    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text(companyInfo.name, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(companyInfo.address, 14, 28);
    doc.text(`${companyInfo.phone} | ${companyInfo.email}`, 14, 33);

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('SALES INVOICE', 140, 20);
    doc.setFontSize(10);
    doc.text(`Invoice #: ${sale.id}`, 140, 28);
    doc.text(`Date: ${sale.date}`, 140, 33);

    doc.setDrawColor(230);
    doc.line(14, 40, 196, 40);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('CUSTOMER', 14, 50);
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(sale.customerName, 14, 56);
    doc.setFontSize(10);
    doc.text(`Method: ${pt?.name || 'Cash'}`, 140, 56);

    const tableData = sale.items.map(sItem => {
      const item = items.find(i => i.id === sItem.itemId);
      return [
        item?.name || 'Unknown Item',
        sItem.quantity.toString(),
        `${curr.symbol} ${formatAmount(sItem.unitPrice)}`,
        `${curr.symbol} ${formatAmount(sItem.total)}`
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

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(12);
    doc.text('Grand Total:', 140, finalY + 20);
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.text(`${curr.symbol} ${formatAmount(sale.grandTotal)}`, 140, finalY + 30);

    doc.save(`Sales_Invoice_${sale.id}.pdf`);
  };

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
    if (modalMode === 'view' || modalMode === 'success' || showConfirmation) return;
    setSalesItems([...salesItems, { itemId: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (modalMode === 'view' || modalMode === 'success' || showConfirmation) return;
    if (salesItems.length > 1) {
      setSalesItems(salesItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof TransactionItem, value: string | number) => {
    if (modalMode === 'view' || modalMode === 'success' || showConfirmation) return;
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
    if (modalMode === 'view' || modalMode === 'success') return;

    const isCredit = activePaymentType?.name.toLowerCase().includes('credit');
    if (isCredit && (!selectedClientId || selectedClientId === 'Sales-0001')) {
      alert("Validation Error: For 'Credit' sales, you must select a specific registered client.");
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

    let result: Sale;
    if (modalMode === 'edit' && editingId) {
      result = { ...data, id: editingId };
      updateSale(editingId, result);
    } else {
      result = recordSale(data);
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
      {/* Modal for Recording Sale */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {modalMode === 'success' ? '✨ Sale Successful' : showConfirmation ? '✅ Finalize Transaction' : (modalMode === 'view' ? '🔍 View Invoice' : modalMode === 'edit' ? '✏️ Edit Invoice' : '📤 Record New Sale')}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
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
                    <h3 className="text-3xl font-black text-gray-800">Payment Confirmed!</h3>
                    <p className="text-gray-500 font-medium">Invoice <b>{editingId}</b> has been generated and stock levels updated.</p>
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
                      <span>📄</span> Save as PDF
                    </button>
                    <button 
                      onClick={closeModal}
                      className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                    >
                      Done & Close
                    </button>
                  </div>
                </div>
              ) : !showConfirmation ? (
                <form onSubmit={handlePreSubmit} className="p-6 space-y-6">
                  {/* Actions for existing invoice */}
                  {modalMode === 'view' && (
                    <div className="flex justify-end gap-3 mb-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                       <button type="button" onClick={() => handlePrint()} className="px-4 py-2 bg-white text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2 text-sm shadow-sm">
                         <span>🖨️</span> Print
                       </button>
                       <button type="button" onClick={() => handleExportPDF()} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm shadow-sm">
                         <span>📄</span> PDF
                       </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Client (Optional)</label>
                      <select
                        disabled={modalMode === 'view'}
                        className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-50 transition-colors ${
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
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sale Date</label>
                      <input
                        disabled={modalMode === 'view'}
                        required
                        type="date"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Type</label>
                        {modalMode !== 'view' && setView && (
                          <button type="button" onClick={navigateToPayments} className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-tight">
                            Manage
                          </button>
                        )}
                      </div>
                      <select
                        disabled={modalMode === 'view'}
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-gray-50 font-bold text-indigo-700"
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
                        <button type="button" onClick={addItemRow} className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                          Add Row
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {salesItems.map((sItem, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                          <div className="md:col-span-4 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Item</label>
                            <SearchableItemSelector
                              disabled={modalMode === 'view'}
                              items={items}
                              selectedId={sItem.itemId}
                              onSelect={(id) => handleItemChange(index, 'itemId', id)}
                              placeholder="Choose item..."
                              renderExtraInfo={(item) => (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                                  item.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                                }`}>
                                  {item.stock} LEFT
                                </span>
                              )}
                              disablePredicate={(item) => modalMode !== 'view' && item.stock <= 0}
                            />
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qty</label>
                            <input
                              disabled={modalMode === 'view'}
                              required
                              type="number"
                              min="0"
                              step="any"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
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
                              step="0.001"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                              value={sItem.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</label>
                            <div className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-indigo-700 font-mono font-bold">
                              {currency.symbol} {formatAmount(sItem.total)}
                            </div>
                          </div>
                          <div className="md:col-span-1 flex justify-center">
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

                  <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-lg"><span className="text-gray-500 font-medium">Grand Total:</span> <span className="text-4xl font-black text-indigo-600 tracking-tighter">{currency.symbol} {formatAmount(grandTotal)}</span></div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button type="button" onClick={closeModal} className="flex-1 md:flex-none px-8 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                        {modalMode === 'view' ? 'Close' : 'Cancel'}
                      </button>
                      {(modalMode !== 'view' && modalMode !== 'success') && (
                        <button type="submit" className="flex-1 px-12 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-all active:scale-[0.98]">
                          {modalMode === 'edit' ? 'Review & Update' : 'Finalize Sale'}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              ) : (
                <div className="p-10 space-y-8">
                  <div className="text-center space-y-2">
                     <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-4xl mb-4 shadow-inner">
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
                     <div className="flex justify-between items-center border-b border-gray-200 pb-4 bg-indigo-50 -mx-4 px-4 py-3 rounded-xl border border-indigo-100/50">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Selected Payment Method</span>
                        <select
                          className="bg-transparent font-black text-indigo-800 text-xl uppercase tracking-tight outline-none cursor-pointer border-b-2 border-indigo-300 focus:border-indigo-500 transition-colors"
                          value={selectedPaymentTypeId}
                          onChange={(e) => setSelectedPaymentTypeId(e.target.value)}
                        >
                          {paymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                        </select>
                     </div>
                     <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice Total</span>
                        <span className="text-3xl font-black text-indigo-600 tracking-tighter">{currency.symbol} {formatAmount(grandTotal)}</span>
                     </div>
                  </div>

                  <div className="flex gap-4 max-w-md mx-auto pt-4 pb-8">
                    <button 
                      onClick={() => setShowConfirmation(false)} 
                      className="flex-1 py-4 border-2 border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
                    >
                      Go Back
                    </button>
                    <button 
                      onClick={finalizeTransaction} 
                      className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl transition-all active:scale-[0.98]"
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

      {/* Main Table View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
          <div className="flex-grow">
            <h2 className="text-2xl font-bold text-gray-800">Sales Register</h2>
            <p className="text-gray-500 text-sm mt-1">Summary of all customer transactions and settlement types</p>
            
            <div className="mt-4 relative max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
              <input
                type="text"
                placeholder="Search by client or invoice #..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            Record Sale
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
                  onClick={() => handleSort('customerName')}
                >
                  Client Name <SortIcon column="customerName" />
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
              {filteredAndSortedSales.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400 italic">No matching transactions found</td></tr>
              ) : (
                filteredAndSortedSales.map(s => {
                  const pt = paymentTypes.find(p => p.id === s.paymentTypeId);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-gray-500 text-sm">{s.id}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{s.customerName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{s.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                          pt?.name.toLowerCase().includes('credit') 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {pt?.name || 'Cash'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">{currency.symbol} {formatAmount(s.grandTotal)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleView(s)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="View"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>
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
