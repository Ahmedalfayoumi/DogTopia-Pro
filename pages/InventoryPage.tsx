
import React, { useState, useRef, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { InventoryRecord, InventoryAuditItem } from '../types';
import SuperAdminApprovalModal from '../components/SuperAdminApprovalModal';
import * as XLSX from 'https://esm.sh/xlsx';
import { jsPDF } from 'https://esm.sh/jspdf';
import autoTable from 'https://esm.sh/jspdf-autotable';

const InventoryPage: React.FC = () => {
  const { 
    items, bulkUpdateItemStock, inventoryAuditRecords, 
    addInventoryAuditRecord, updateInventoryAuditRecord,
    currencies, defaultCurrencyId, companyInfo, logo, themeConfig 
  } = useInventory();

  // Navigation State: 'list' | 'reconcile' | 'detail'
  const [viewMode, setViewMode] = useState<'list' | 'reconcile' | 'detail'>('list');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [currentReconciliation, setCurrentReconciliation] = useState<InventoryAuditItem[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currency = currencies.find(c => c.id === defaultCurrencyId) || currencies[0];
  const primaryColor = themeConfig.colors[0] || '#4f46e5';

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(val);
  };

  const selectedAudit = useMemo(() => 
    inventoryAuditRecords.find(r => r.id === selectedAuditId),
    [selectedAuditId, inventoryAuditRecords]
  );

  const handleDownloadTemplate = () => {
    const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));
    const templateData = sortedItems.map(item => ({
      "Internal ID": item.id,
      "Item Name": item.name,
      "Barcode": item.barcode || 'N/A',
      "Physical Count": "" 
    }));
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [{ wch: 36 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory_Count_Audit");
    XLSX.writeFile(wb, `Inventory_Template_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleUploadCounts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const results: InventoryAuditItem[] = [];
        data.forEach(row => {
          const itemId = row["Internal ID"];
          const physicalQtyStr = row["Physical Count"];
          if (itemId) {
            const item = items.find(i => i.id === itemId);
            if (item) {
              const physicalQty = parseFloat(physicalQtyStr) || 0;
              const diff = physicalQty - item.stock;
              results.push({
                itemId: item.id,
                name: item.name,
                barcode: item.barcode,
                systemQty: item.stock,
                physicalQty: physicalQty,
                difference: diff,
                unitPrice: item.unitPrice,
                impactValue: diff * item.unitPrice
              });
            }
          }
        });

        setCurrentReconciliation(results.sort((a, b) => a.name.localeCompare(b.name)));
        setViewMode('reconcile');
        
        // Auto-save as a Draft Audit
        const totalImpact = results.reduce((sum, d) => sum + d.impactValue, 0);
        addInventoryAuditRecord({
          date: new Date().toISOString().split('T')[0],
          status: 'Draft',
          items: results,
          totalImpact: totalImpact
        });
      } catch (err) {
        alert("Failed to parse the file.");
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleViewAuditDetail = (audit: InventoryRecord) => {
    setSelectedAuditId(audit.id);
    setViewMode('detail');
  };

  const startStockOverwrite = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthConfirm = () => {
    setIsAuthModalOpen(false);
    const auditToAdjust = viewMode === 'detail' ? selectedAudit : null;
    const itemsToUpdate = viewMode === 'reconcile' ? currentReconciliation : auditToAdjust?.items;

    if (!itemsToUpdate || itemsToUpdate.length === 0) return;

    const confirm = window.confirm(`Final Warning: You are about to update system stock for ${itemsToUpdate.length} items to match physical counts. This action is irreversible. Proceed?`);
    if (!confirm) return;

    bulkUpdateItemStock(itemsToUpdate.map(d => ({ itemId: d.itemId, newStock: d.physicalQty })));
    
    // Update audit status to Adjusted if it's already saved
    if (selectedAuditId) {
      updateInventoryAuditRecord(selectedAuditId, { status: 'Adjusted' });
    } else if (viewMode === 'reconcile') {
      const lastAudit = inventoryAuditRecords[0];
      if (lastAudit) updateInventoryAuditRecord(lastAudit.id, { status: 'Adjusted' });
    }

    alert("Stock levels successfully synchronized!");
    setViewMode('list');
  };

  const handleExportPDF = (audit: InventoryRecord) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text(companyInfo.name, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`INVENTORY AUDIT RECORD - ${audit.id}`, 14, 28);
    doc.text(`Date: ${audit.date} | Status: ${audit.status}`, 14, 33);
    doc.line(14, 38, 196, 38);

    autoTable(doc, {
      startY: 45,
      head: [['Item Name', 'Sys Qty', 'Phy Qty', 'Diff', 'Impact']],
      body: audit.items.map(d => [d.name, d.systemQty, d.physicalQty, d.difference, `${currency.symbol} ${formatAmount(d.impactValue)}`]),
      theme: 'striped',
      headStyles: { fillColor: primaryColor },
      columnStyles: { 4: { halign: 'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.line(14, finalY, 70, finalY);
    doc.line(120, finalY, 180, finalY);
    doc.text('Auditor Signature', 14, finalY + 5);
    doc.text('Manager Approval', 120, finalY + 5);

    doc.save(`Audit_${audit.id}_${audit.date}.pdf`);
  };

  // -------------------------------------------------------------------------
  // Sub-Renderers
  // -------------------------------------------------------------------------

  const renderAuditList = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Audit History</h2>
          <p className="text-gray-500 mt-2">View past physical counts and reconcile active discrepancies. Records are permanent.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadTemplate} className="px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all">Download Template</button>
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">Upload New Audit</button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleUploadCounts} />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">Audit ID</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Items Count</th>
              <th className="px-6 py-4 text-right">Net Value Impact</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {inventoryAuditRecords.map(audit => (
              <tr key={audit.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4 font-mono font-bold text-indigo-600">{audit.id}</td>
                <td className="px-6 py-4 text-gray-600">{audit.date}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${audit.status === 'Adjusted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {audit.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-gray-500 font-bold">{audit.items.length}</td>
                <td className={`px-6 py-4 text-right font-bold ${audit.totalImpact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {currency.symbol} {formatAmount(audit.totalImpact)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleViewAuditDetail(audit)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="View Detail"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>
                    <button onClick={() => handleExportPDF(audit)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg" title="Export PDF"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAuditDetail = (auditItems: InventoryAuditItem[], auditId?: string, auditStatus?: string) => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center px-4">
         <button onClick={() => setViewMode('list')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Audits
         </button>
         <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">{auditId ? `Reviewing Audit ${auditId}` : 'New Reconciliation Results'}</h3>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">Item Information</th>
              <th className="px-6 py-4 text-center">System Qty</th>
              <th className="px-6 py-4 text-center">Physical Count</th>
              <th className="px-6 py-4 text-center">Variance</th>
              <th className="px-6 py-4 text-right">Value Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {auditItems.map((d, i) => (
              <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{d.name}</span>
                    <span className="text-[10px] font-mono font-bold text-gray-400">{d.barcode}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center font-medium text-gray-500">{d.systemQty}</td>
                <td className="px-6 py-4 text-center font-black text-indigo-600">{d.physicalQty}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    d.difference === 0 ? 'bg-gray-100 text-gray-400' : 
                    d.difference > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {d.difference > 0 ? `+${d.difference}` : d.difference}
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-bold ${d.difference === 0 ? 'text-gray-400' : d.difference > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {currency.symbol} {formatAmount(d.impactValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!auditStatus || auditStatus === 'Draft') && (
        <div className="bg-gray-900 rounded-3xl p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 border border-gray-800">
           <div className="space-y-2">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                 <h4 className="text-amber-400 font-black uppercase text-[10px] tracking-[0.2em]">Super Admin Authorization</h4>
              </div>
              <h3 className="text-2xl font-bold">Adjust System Stock?</h3>
              <p className="text-gray-400 text-sm">Force system stock levels to match this physical count. This action requires Super Admin approval to proceed.</p>
           </div>
           <button onClick={startStockOverwrite} className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 shadow-xl transition-all hover:scale-105 active:scale-95">Authorize Stock Update</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {viewMode === 'list' && renderAuditList()}
      {viewMode === 'reconcile' && renderAuditDetail(currentReconciliation)}
      {viewMode === 'detail' && selectedAudit && renderAuditDetail(selectedAudit.items, selectedAudit.id, selectedAudit.status)}

      <SuperAdminApprovalModal
        isOpen={isAuthModalOpen}
        onConfirm={handleAuthConfirm}
        onCancel={() => setIsAuthModalOpen(false)}
        message="Super Admin approval required to overwrite system stock levels with audit results."
      />
    </div>
  );
};

export default InventoryPage;
