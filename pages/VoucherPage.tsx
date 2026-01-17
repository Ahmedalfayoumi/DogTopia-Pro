
import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Voucher, View, PaymentType } from '../types';
import { jsPDF } from 'https://esm.sh/jspdf';

interface VoucherPageProps {
  currentView?: View;
  setView?: (view: View) => void;
}

type SortKey = 'id' | 'entityName' | 'date' | 'amount';

const VoucherPage: React.FC<VoucherPageProps> = ({ currentView, setView }) => {
  const { 
    vouchers, addVoucher, updateVoucher, deleteVoucher, 
    clients, suppliers, paymentTypes, defaultPaymentTypeId,
    currencies, defaultCurrencyId, companyInfo, logo, themeConfig 
  } = useInventory();

  const isReceipt = currentView === 'receipt_vouchers';
  const primaryColor = themeConfig.colors[0] || '#4f46e5';
  const currency = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(val);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | 'success'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  // Filter lists for the form
  const availableEntities = useMemo(() => {
    if (isReceipt) {
      // Filter out "Cash Sales" (default client)
      return clients.filter(c => !c.isDefault);
    } else {
      // Filter out "Cash Purchase" (default supplier)
      return suppliers.filter(s => !s.isDefault);
    }
  }, [isReceipt, clients, suppliers]);

  const availablePaymentTypes = useMemo(() => {
    // Vouchers settle credit, so they cannot themselves be "Credit"
    return paymentTypes.filter(pt => pt.name.toLowerCase() !== 'credit');
  }, [paymentTypes]);

  const [formData, setFormData] = useState<Omit<Voucher, 'id'>>({
    type: isReceipt ? 'Receipt' : 'Payment',
    entityId: '',
    entityName: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentTypeId: defaultPaymentTypeId,
    note: '',
    reference: ''
  });

  // Ensure default payment type in form isn't "Credit" if possible
  useEffect(() => {
    const initialPaymentType = availablePaymentTypes.find(pt => pt.id === defaultPaymentTypeId) 
      || availablePaymentTypes[0]?.id 
      || '';
      
    setFormData(prev => ({
      ...prev,
      type: isReceipt ? 'Receipt' : 'Payment',
      entityId: '',
      entityName: '',
      paymentTypeId: initialPaymentType
    }));
  }, [currentView, availablePaymentTypes, defaultPaymentTypeId]);

  const filteredAndSortedVouchers = useMemo(() => {
    let result = vouchers.filter(v => v.type === (isReceipt ? 'Receipt' : 'Payment'));

    result = result.filter(v => 
      v.entityName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [vouchers, searchTerm, sortConfig, isReceipt]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let entityName = '';
    if (isReceipt) {
      entityName = clients.find(c => c.id === formData.entityId)?.name || '';
    } else {
      entityName = suppliers.find(s => s.id === formData.entityId)?.name || '';
    }

    const payload = { ...formData, entityName };

    if (editingId) {
      updateVoucher(editingId, payload);
    } else {
      const created = addVoucher(payload);
      setEditingId(created.id);
    }
    setModalMode('success');
  };

  const handlePrint = (voucherId?: string) => {
    const vId = voucherId || editingId;
    const voucher = vouchers.find(v => v.id === vId);
    if (!voucher) return;

    const pt = paymentTypes.find(p => p.id === voucher.paymentTypeId);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${voucher.type} Voucher ${voucher.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #333; padding: 40px; }
            .voucher-box { border: 2px solid #eee; border-radius: 20px; padding: 40px; max-width: 800px; margin: 0 auto; position: relative; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
            .title { font-size: 28px; font-weight: 900; color: ${primaryColor}; text-transform: uppercase; margin: 0; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
            .amount-box { background: #f9fafb; border: 2px solid ${primaryColor}; border-radius: 12px; padding: 20px; text-align: center; margin-top: 20px; }
            .amount-text { font-size: 32px; font-weight: 900; color: ${primaryColor}; }
            .footer { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 100px; text-align: center; }
            .sig-line { border-top: 1px solid #333; padding-top: 5px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="voucher-box">
            <div class="header">
              <div>
                ${logo ? `<img src="${logo}" style="max-height: 50px; margin-bottom: 10px;" />` : `<h1 style="color:${primaryColor};margin:0">${companyInfo.name}</h1>`}
                <p style="font-size:12px;margin:0">${companyInfo.address}</p>
              </div>
              <div style="text-align:right">
                <h2 class="title">${voucher.type} Voucher</h2>
                <p><b>No:</b> ${voucher.id}<br><b>Date:</b> ${voucher.date}</p>
              </div>
            </div>
            <div class="meta">
              <div>
                <p style="font-size:10px;color:#999;font-weight:bold;text-transform:uppercase">Paid ${isReceipt ? 'By' : 'To'}</p>
                <p style="font-size:18px;font-weight:bold;margin:0">${voucher.entityName}</p>
              </div>
              <div style="text-align:right">
                <p style="font-size:10px;color:#999;font-weight:bold;text-transform:uppercase">Method</p>
                <p style="font-size:18px;font-weight:bold;margin:0">${pt?.name || 'N/A'}</p>
              </div>
            </div>
            <div style="margin-bottom:30px">
              <p style="font-size:10px;color:#999;font-weight:bold;text-transform:uppercase">Description / Notes</p>
              <p style="font-size:14px">${voucher.note || 'No specific notes provided.'}</p>
              ${voucher.reference ? `<p style="font-size:12px;color:#666">Ref: ${voucher.reference}</p>` : ''}
            </div>
            <div class="amount-box">
              <p style="font-size:10px;color:#999;font-weight:bold;text-transform:uppercase;margin-bottom:5px">Amount Settled</p>
              <div class="amount-text">${currency.symbol} ${formatAmount(voucher.amount)}</div>
            </div>
            <div class="footer">
              <div class="sig-line">Prepared By</div>
              <div class="sig-line">Received By / Authorized</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDF = (voucherId?: string) => {
    const vId = voucherId || editingId;
    const voucher = vouchers.find(v => v.id === vId);
    if (!voucher) return;

    const doc = new jsPDF();
    const pt = paymentTypes.find(p => p.id === voucher.paymentTypeId);

    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text(companyInfo.name, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(companyInfo.address, 14, 28);

    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(`${voucher.type.toUpperCase()} VOUCHER`, 130, 20);
    doc.setFontSize(10);
    doc.text(`Voucher #: ${voucher.id}`, 130, 28);
    doc.text(`Date: ${voucher.date}`, 130, 33);

    doc.setDrawColor(230);
    doc.line(14, 40, 196, 40);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(isReceipt ? 'PAID BY (CLIENT)' : 'PAID TO (SUPPLIER)', 14, 55);
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text(voucher.entityName, 14, 62);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('PAYMENT METHOD', 130, 55);
    doc.setTextColor(0);
    doc.text(pt?.name || 'N/A', 130, 62);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('DESCRIPTION / NOTES', 14, 80);
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(voucher.note || 'N/A', 14, 87, { maxWidth: 180 });

    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, 110, 182, 30, 3, 3, 'F');
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('AMOUNT PAID', 105, 120, { align: 'center' });
    doc.setFontSize(24);
    doc.setTextColor(primaryColor);
    doc.text(`${currency.symbol} ${formatAmount(voucher.amount)}`, 105, 132, { align: 'center' });

    doc.save(`${voucher.type}_Voucher_${voucher.id}.pdf`);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      type: isReceipt ? 'Receipt' : 'Payment',
      entityId: '',
      entityName: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentTypeId: availablePaymentTypes[0]?.id || '',
      note: '',
      reference: ''
    });
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (v: Voucher) => {
    setEditingId(v.id);
    setFormData({ ...v });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setModalMode('create');
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig?.key !== column) return <span className="ml-1 opacity-20">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="ml-1 text-indigo-600">↑</span> : <span className="ml-1 text-indigo-600">↓</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {modalMode === 'success' ? '✨ Voucher Saved' : (editingId ? `✏️ Edit ${isReceipt ? 'Receipt' : 'Payment'}` : `📥 New ${isReceipt ? 'Receipt' : 'Payment'} Voucher`)}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="flex-grow overflow-y-auto">
              {modalMode === 'success' ? (
                <div className="p-12 space-y-8 text-center">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">✓</div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gray-800">Voucher Recorded!</h3>
                    <p className="text-gray-500">Document <b>{editingId}</b> is ready for printing.</p>
                  </div>
                  <div className="max-w-xs mx-auto space-y-3">
                    <button onClick={() => handlePrint()} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-3">🖨️ Print Voucher</button>
                    <button onClick={() => handleExportPDF()} className="w-full py-4 bg-white border-2 border-indigo-100 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50">📄 Save PDF</button>
                    <button onClick={closeModal} className="w-full py-4 text-gray-400 font-bold hover:text-gray-600">Close</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{isReceipt ? 'CLIENT (PAYEE)' : 'SUPPLIER (RECIPIENT)'}</label>
                      <select
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold text-gray-800"
                        value={formData.entityId}
                        onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                      >
                        <option value="">Choose {isReceipt ? 'Client' : 'Supplier'}</option>
                        {availableEntities.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">DATE</label>
                      <input required type="date" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">AMOUNT ({currency.symbol})</label>
                      <input required type="number" step="any" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-black text-indigo-600" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">PAYMENT METHOD</label>
                      <select required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold text-gray-700" value={formData.paymentTypeId} onChange={(e) => setFormData({ ...formData, paymentTypeId: e.target.value })}>
                        {availablePaymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">REFERENCE (OPTIONAL)</label>
                    <input placeholder="e.g. Invoice #1234 or Check No." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">DESCRIPTION / NOTES</label>
                    <textarea rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={closeModal} className="flex-1 py-4 border-2 border-gray-100 text-gray-400 font-bold rounded-2xl hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">Save Document</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Table View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">{isReceipt ? 'Receipt Ledger' : 'Payment Ledger'}</h2>
            <p className="text-gray-500 mt-1">Manage settlements for {isReceipt ? 'clients' : 'suppliers'} with outstanding credit balances.</p>
            
            <div className="mt-6 relative max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
              <input type="text" placeholder="Search vouchers..." className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 focus:bg-white transition-all text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <button onClick={openAddModal} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-all active:scale-95">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
            Add New {isReceipt ? 'Receipt' : 'Payment'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer" onClick={() => handleSort('id')}>Document No <SortIcon column="id" /></th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer" onClick={() => handleSort('entityName')}>{isReceipt ? 'Client' : 'Supplier'} <SortIcon column="entityName" /></th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer" onClick={() => handleSort('date')}>Date <SortIcon column="date" /></th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer" onClick={() => handleSort('amount')}>Amount <SortIcon column="amount" /></th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedVouchers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400 italic">No {isReceipt ? 'receipts' : 'payments'} recorded in this ledger yet.</td></tr>
              ) : (
                filteredAndSortedVouchers.map(v => {
                  const pt = paymentTypes.find(p => p.id === v.paymentTypeId);
                  return (
                    <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600 text-sm">{v.id}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{v.entityName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{v.date}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-black uppercase text-gray-500">{pt?.name || 'N/A'}</span></td>
                      <td className="px-6 py-4 text-right font-black text-gray-900">{currency.symbol} {formatAmount(v.amount)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handlePrint(v.id)} className="p-2 text-gray-400 hover:text-indigo-600" title="Print Document">🖨️</button>
                          <button onClick={() => handleEdit(v)} className="p-2 text-gray-400 hover:text-amber-600" title="Edit">✏️</button>
                          <button onClick={() => { if(confirm('Delete this voucher record?')) deleteVoucher(v.id) }} className="p-2 text-gray-400 hover:text-red-600" title="Delete">✕</button>
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

export default VoucherPage;
