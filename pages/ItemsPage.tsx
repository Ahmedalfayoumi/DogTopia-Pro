
import React, { useState, useRef, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Item, Purchase, Sale, TransactionItem } from '../types';
import * as XLSX from 'https://esm.sh/xlsx';
import { jsPDF } from 'https://esm.sh/jspdf';
import autoTable from 'https://esm.sh/jspdf-autotable';

type SortKey = 'name' | 'unitPrice' | 'stock' | 'openingStock';

interface ItemTransaction {
  type: 'Purchase' | 'Sale';
  id: string;
  date: string;
  qty: number;
  price: number;
  total: number;
  entityName: string; // Supplier or Client
}

const ItemsPage: React.FC = () => {
  const { items, addItem, updateItem, deleteItem, currencies, defaultCurrencyId, purchases, sales, companyInfo, logo, themeConfig } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<Item | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currency = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];
  const primaryColor = themeConfig.colors[0] || '#4f46e5';

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(val);
  };
  
  const [formData, setFormData] = useState<Omit<Item, 'id' | 'stock'>>({
    name: '',
    barcode: '',
    description: '',
    unitPrice: 0,
    openingStock: 0,
    purchaseUnit: '',
    storageUnit: '',
    conversionPurchaseToStorage: 1,
    sellingUnit: '',
    conversionStorageToSelling: 1,
  });

  // Calculate purchases and sales totals per item
  const itemLedgerStats = useMemo(() => {
    const stats: Record<string, { purchased: number, sold: number, purchaseValue: number, salesValue: number }> = {};
    
    // Initialize for all items
    items.forEach(item => {
      stats[item.id] = { purchased: 0, sold: 0, purchaseValue: 0, salesValue: 0 };
    });

    // Accumulate purchases
    purchases.forEach(purchase => {
      purchase.items.forEach(pItem => {
        if (stats[pItem.itemId]) {
          stats[pItem.itemId].purchased += pItem.quantity;
          stats[pItem.itemId].purchaseValue += pItem.total;
        }
      });
    });

    // Accumulate sales
    sales.forEach(sale => {
      sale.items.forEach(sItem => {
        if (stats[sItem.itemId]) {
          stats[sItem.itemId].sold += sItem.quantity;
          stats[sItem.itemId].salesValue += sItem.total;
        }
      });
    });

    return stats;
  }, [items, purchases, sales]);

  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [items, searchTerm, sortConfig]);

  // Build transaction history for the selected item
  const selectedItemHistory = useMemo(() => {
    if (!selectedItemForDetails) return [];

    const history: ItemTransaction[] = [];

    purchases.forEach(p => {
      const match = p.items.find(i => i.itemId === selectedItemForDetails.id);
      if (match) {
        history.push({
          type: 'Purchase',
          id: p.id,
          date: p.date,
          qty: match.quantity,
          price: match.unitPrice,
          total: match.total,
          entityName: p.supplierName
        });
      }
    });

    sales.forEach(s => {
      const match = s.items.find(i => i.itemId === selectedItemForDetails.id);
      if (match) {
        history.push({
          type: 'Sale',
          id: s.id,
          date: s.date,
          qty: match.quantity,
          price: match.unitPrice,
          total: match.total,
          entityName: s.customerName
        });
      }
    });

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedItemForDetails, purchases, sales]);

  const handlePrintItemDetails = () => {
    if (!selectedItemForDetails) return;
    const stats = itemLedgerStats[selectedItemForDetails.id];
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const ledgerHtml = selectedItemHistory.map(tr => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${tr.date}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${tr.type === 'Purchase' ? '#059669' : '#dc2626'}">${tr.type}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${tr.entityName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${tr.type === 'Purchase' ? '+' : '-'}${tr.qty}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${currency.symbol} ${formatAmount(tr.price)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${currency.symbol} ${formatAmount(tr.total)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Item Report - ${selectedItemForDetails.name}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: ${primaryColor}; font-size: 24px; }
            .item-title { margin-bottom: 20px; }
            .item-title h2 { margin: 0; font-size: 28px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: #f9fafb; padding: 15px; border-radius: 10px; border: 1px solid #e5e7eb; text-align: center; }
            .stat-label { font-size: 10px; font-weight: bold; color: #9ca3af; text-transform: uppercase; margin-bottom: 5px; }
            .stat-value { font-size: 18px; font-weight: 800; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f3f4f6; padding: 10px; font-size: 11px; text-transform: uppercase; color: #6b7280; }
            .financials { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; background: #f3f4f6; padding: 20px; border-radius: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              ${logo ? `<img src="${logo}" style="max-height: 50px; margin-bottom: 10px;" />` : `<h1>${companyInfo.name}</h1>`}
              <p style="font-size: 12px; color: #6b7280; margin: 0;">${companyInfo.address}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 12px; font-weight: bold; color: #9ca3af; margin: 0;">DETAILED ITEM REPORT</p>
              <p style="font-size: 14px; margin: 5px 0 0 0;">Generated: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div class="item-title">
            <h2>${selectedItemForDetails.name}</h2>
            <p style="font-family: monospace; color: #6b7280; margin: 5px 0;">Barcode: ${selectedItemForDetails.barcode || 'N/A'}</p>
          </div>
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-label">Opening</div><div class="stat-value">${selectedItemForDetails.openingStock}</div></div>
            <div class="stat-card"><div class="stat-label">Purchases</div><div class="stat-value" style="color: #059669;">+${stats.purchased}</div></div>
            <div class="stat-card"><div class="stat-label">Sales</div><div class="stat-value" style="color: #dc2626;">-${stats.sold}</div></div>
            <div class="stat-card"><div class="stat-label">Balance</div><div class="stat-value" style="color: ${primaryColor};">${selectedItemForDetails.stock}</div></div>
          </div>
          <div class="financials">
            <div>
              <p style="font-size: 10px; font-weight: bold; color: #6b7280; margin: 0;">PURCHASE VALUE</p>
              <p style="font-size: 18px; font-weight: 800; margin: 0;">${currency.symbol} ${formatAmount(stats.purchaseValue)}</p>
            </div>
            <div>
              <p style="font-size: 10px; font-weight: bold; color: #6b7280; margin: 0;">SALES REVENUE</p>
              <p style="font-size: 18px; font-weight: 800; margin: 0;">${currency.symbol} ${formatAmount(stats.salesValue)}</p>
            </div>
          </div>
          <h3>Transaction History</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Entity</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>${ledgerHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportItemPDF = () => {
    if (!selectedItemForDetails) return;
    const stats = itemLedgerStats[selectedItemForDetails.id];
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(primaryColor);
    doc.text(companyInfo.name, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('ITEM PERFORMANCE REPORT', 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 140, 28);

    doc.setDrawColor(230);
    doc.line(14, 32, 196, 32);

    // Item Info
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(selectedItemForDetails.name, 14, 45);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Barcode: ${selectedItemForDetails.barcode || 'N/A'}`, 14, 52);

    // Stats
    const statsData = [
      ['Opening Balance', String(selectedItemForDetails.openingStock)],
      ['Total Purchased', `+${stats.purchased}`],
      ['Total Sold', `-${stats.sold}`],
      ['Current Balance', String(selectedItemForDetails.stock)]
    ];

    autoTable(doc, {
      startY: 60,
      head: [['Metric', 'Quantity']],
      body: statsData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: { 1: { fontStyle: 'bold' } }
    });

    // Financial Summary
    const financialY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Financial Summary', 14, financialY);
    
    const finData = [
      ['Purchase Value', `${currency.symbol} ${formatAmount(stats.purchaseValue)}`],
      ['Sales Revenue', `${currency.symbol} ${formatAmount(stats.salesValue)}`],
      ['Current Stock Value', `${currency.symbol} ${formatAmount(selectedItemForDetails.stock * selectedItemForDetails.unitPrice)}`]
    ];

    autoTable(doc, {
      startY: financialY + 5,
      body: finData,
      theme: 'grid',
      styles: { fontSize: 10 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
    });

    // Ledger Table
    const ledgerY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text('Full Transaction Ledger', 14, ledgerY);

    const ledgerData = selectedItemHistory.map(tr => [
      tr.date,
      tr.type,
      tr.entityName,
      tr.qty.toString(),
      formatAmount(tr.price),
      formatAmount(tr.total)
    ]);

    autoTable(doc, {
      startY: ledgerY + 5,
      head: [['Date', 'Type', 'Entity', 'Qty', `Price (${currency.symbol})`, `Total (${currency.symbol})`]],
      body: ledgerData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor },
      styles: { fontSize: 8 },
      columnStyles: { 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'right' } }
    });

    doc.save(`Report_${selectedItemForDetails.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateItem(editingId, {
        ...formData,
      });
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
      openingStock: item.openingStock,
      purchaseUnit: item.purchaseUnit || '',
      storageUnit: item.storageUnit || '',
      conversionPurchaseToStorage: item.conversionPurchaseToStorage || 1,
      sellingUnit: item.sellingUnit || '',
      conversionStorageToSelling: item.conversionStorageToSelling || 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenDetails = (item: Item) => {
    setSelectedItemForDetails(item);
    setIsDetailModalOpen(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      barcode: '',
      description: '', 
      unitPrice: 0, 
      openingStock: 0,
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
        "Opening Stock": 100,
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
              openingStock: parseInt(row["Opening Stock"]) || 0,
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

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig?.key !== column) return <span className="ml-1 opacity-20">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="ml-1 text-indigo-600">↑</span> : <span className="ml-1 text-indigo-600">↓</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Item Details Modal */}
      {isDetailModalOpen && selectedItemForDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">{selectedItemForDetails.name}</h2>
                  <p className="text-gray-400 text-xs font-mono font-bold uppercase tracking-widest">{selectedItemForDetails.barcode || 'NO BARCODE'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrintItemDetails}
                  className="bg-white px-4 py-2 rounded-xl text-gray-600 font-bold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-sm shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Print Report
                </button>
                <button 
                  onClick={handleExportItemPDF}
                  className="bg-indigo-600 px-4 py-2 rounded-xl text-white font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Export PDF
                </button>
                <button onClick={() => setIsDetailModalOpen(false)} className="bg-white p-2 rounded-xl text-gray-400 hover:text-gray-600 border border-gray-100 hover:border-gray-300 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-8">
              {/* Stats Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {[
                  { label: 'Opening Balance', value: selectedItemForDetails.openingStock, color: 'text-gray-600', unit: selectedItemForDetails.sellingUnit },
                  { label: 'Purchases QTY', value: itemLedgerStats[selectedItemForDetails.id].purchased, color: 'text-emerald-600', unit: selectedItemForDetails.sellingUnit, prefix: '+' },
                  { label: 'Sales QTY', value: itemLedgerStats[selectedItemForDetails.id].sold, color: 'text-red-600', unit: selectedItemForDetails.sellingUnit, prefix: '-' },
                  { label: 'Balance QTY', value: selectedItemForDetails.stock, color: 'text-indigo-600', unit: selectedItemForDetails.sellingUnit, bold: true },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col items-center text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</span>
                    <span className={`text-2xl font-black ${stat.color} ${stat.bold ? 'scale-110' : ''}`}>
                      {stat.prefix}{stat.value} <small className="text-[10px] uppercase font-bold text-gray-400">{stat.unit}</small>
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                  { label: 'Purchase Value', value: itemLedgerStats[selectedItemForDetails.id].purchaseValue, color: 'text-gray-700' },
                  { label: 'Sales Value (Revenue)', value: itemLedgerStats[selectedItemForDetails.id].salesValue, color: 'text-emerald-700' },
                  { 
                    label: 'Gross Margin', 
                    value: itemLedgerStats[selectedItemForDetails.id].salesValue - itemLedgerStats[selectedItemForDetails.id].purchaseValue, 
                    color: itemLedgerStats[selectedItemForDetails.id].salesValue - itemLedgerStats[selectedItemForDetails.id].purchaseValue >= 0 ? 'text-indigo-600' : 'text-red-600' 
                  },
                  { label: 'Balance Value', value: selectedItemForDetails.stock * selectedItemForDetails.unitPrice, color: 'text-amber-600' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-50 shadow-sm flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</span>
                    <span className={`text-xl font-black ${stat.color}`}>
                      {currency.symbol} {formatAmount(stat.value)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Transaction Ledger */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                   <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Full Transaction Ledger</h3>
                   <span className="text-[10px] text-gray-400 font-bold uppercase">{selectedItemHistory.length} total entries</span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 font-bold text-gray-400 uppercase text-[9px]">Date</th>
                        <th className="px-6 py-4 font-bold text-gray-400 uppercase text-[9px]">Type</th>
                        <th className="px-6 py-4 font-bold text-gray-400 uppercase text-[9px]">Entity</th>
                        <th className="px-6 py-4 font-bold text-gray-400 uppercase text-[9px] text-center">Qty</th>
                        <th className="px-6 py-4 font-bold text-gray-400 uppercase text-[9px] text-right">Price</th>
                        <th className="px-6 py-4 font-bold text-gray-400 uppercase text-[9px] text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedItemHistory.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No movements recorded yet.</td></tr>
                      ) : (
                        selectedItemHistory.map((tr, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 text-gray-500 font-medium">{tr.date}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${tr.type === 'Purchase' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {tr.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-700">{tr.entityName}</td>
                            <td className="px-6 py-4 text-center font-black text-gray-600">{tr.type === 'Purchase' ? '+' : '-'}{tr.qty}</td>
                            <td className="px-6 py-4 text-right text-gray-500 font-mono">{currency.symbol}{formatAmount(tr.price)}</td>
                            <td className="px-6 py-4 text-right font-black text-indigo-600 font-mono">{currency.symbol}{formatAmount(tr.total)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-gray-50 bg-gray-50/50 text-center shrink-0">
               <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">End of Detailed Item Report</p>
            </div>
          </div>
        </div>
      )}

      {/* Item Create/Edit Modal Overlay */}
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Barcode (Item Code)</label>
                  <input
                    type="text"
                    placeholder="Scan or type barcode"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Opening Stock</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="Initial quantity"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.openingStock}
                    onChange={(e) => setFormData({ ...formData, openingStock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selling Price ({currency.symbol})</label>
                  <input
                    required
                    type="number"
                    step="0.001"
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
          <div className="flex-grow">
            <h2 className="text-2xl font-bold text-gray-800">Inventory Status</h2>
            <p className="text-gray-500 text-sm mt-1">Real-time tracking of item movements and stock balances</p>
            
            {/* Search Box */}
            <div className="mt-4 relative max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
              <input
                type="text"
                placeholder="Search by name or barcode..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('name')}>
                  Item Name <SortIcon column="name" />
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Item Code</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Opening Balance QTY</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Purchases QTY</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Sales QTY</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Available QTY</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400 italic">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <p>{searchTerm ? 'No items found matching your search.' : 'Your catalog is empty.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item) => {
                  const stats = itemLedgerStats[item.id] || { purchased: 0, sold: 0 };
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{item.name}</span>
                          <span className="text-[10px] text-gray-400">{item.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.barcode || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-600">
                        {item.openingStock} {item.sellingUnit}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-emerald-600 font-bold">+{stats.purchased}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-600 font-bold">-{stats.sold}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                          item.stock <= 5 
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        }`}>
                          {item.stock} {item.sellingUnit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenDetails(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Item Stats & History">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="Edit Item Metadata">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                          </button>
                          <button onClick={() => { if(window.confirm('Delete this item?')) deleteItem(item.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Item Permanently">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
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

export default ItemsPage;
