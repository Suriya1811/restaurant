import React from 'react';
import { Menu, FileText, Printer, RefreshCw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * printReport — opens a new window with ALL data (bypasses pagination/scroll).
 * @param {string} title  - Page title (e.g. "Daybook Entry Report")
 * @param {string} subMeta - Extra metadata line (e.g. filters, ledger name)
 * @param {string[]} headers - Column header labels
 * @param {(string|number)[][]} rows - 2D array of row data
 * @param {object} [totalsRow] - Optional { label: string, cells: (string|number)[] }
 */
export const printReport = (title, subMeta, headers, rows, totalsRow = null) => {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');

    const thead = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    const tbody = rows.map(row =>
        `<tr>${row.map(cell => `<td>${cell ?? '-'}</td>`).join('')}</tr>`
    ).join('');
    const tfoot = totalsRow
        ? `<tfoot><tr class="total-row"><td colspan="${totalsRow.cells.length > 0 ? headers.length - totalsRow.cells.length : headers.length}" style="text-align:right;font-weight:bold">${totalsRow.label}</td>${totalsRow.cells.map(c => `<td>${c}</td>`).join('')}</tr></tfoot>`
        : '';

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; padding: 16px; }
    h1 { font-size: 17px; font-weight: bold; margin-bottom: 3px; }
    .meta { font-size: 10px; color: #555; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th { background: #0f172a; color: #f97316; font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 6px 8px; text-align: left; border-right: 1px solid #1e293b; }
    td { padding: 5px 8px; font-size: 10px; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; }
    tr:nth-child(even) td { background: #fafafa; }
    .total-row td { font-weight: bold; background: #fff7ed; border-top: 2px solid #f97316; color: #c2410c; }
    @page { size: landscape; margin: 8mm; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">${subMeta} &nbsp;|&nbsp; Printed on: ${new Date().toLocaleString('en-GB')} &nbsp;|&nbsp; Total Records: ${rows.length}</p>
  <table>
    <thead>${thead}</thead>
    <tbody>${tbody}</tbody>
    ${tfoot}
  </table>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
};

const ReportToolbar = ({ 
    title, 
    toggleSidebar, 
    filters, 
    setFilters, 
    loading, 
    onRefresh, 
    onExportCSV, 
    onExportPDF,
    onPrint
}) => {
    const navigate = useNavigate();

    const handlePrint = () => {
        if (onPrint) {
            onPrint();
        } else {
            window.print();
        }
    };

    return (
        <div className="top-bar flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-3 border-b border-slate-200 shrink-0 gap-4 shadow-sm z-10">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="text-slate-500 hover:text-slate-800 transition-colors">
                    <Menu size={24} />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">{title}</h1>
                
                <div className="flex items-center gap-2 ml-4">
                    <button onClick={onExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 rounded text-emerald-600 text-xs font-bold hover:bg-emerald-50 transition-colors">
                        <FileText size={14} /> Excel
                    </button>
                    <button onClick={onExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 rounded text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors">
                        <FileText size={14} /> PDF
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 rounded text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors">
                        <Printer size={14} /> Print
                    </button>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 mb-0.5">From Date</label>
                        <div className="relative border border-slate-200 rounded px-2 py-1.5 bg-white flex items-center min-w-[120px]">
                            <input 
                                type="date" 
                                value={filters.startDate} 
                                onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} 
                                className="text-xs font-bold text-slate-800 outline-none w-full" 
                            />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 mb-0.5">To Date</label>
                        <div className="relative border border-slate-200 rounded px-2 py-1.5 bg-white flex items-center min-w-[120px]">
                            <input 
                                type="date" 
                                value={filters.endDate} 
                                onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} 
                                className="text-xs font-bold text-slate-800 outline-none w-full" 
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 h-full ml-2">
                    <button onClick={onRefresh} className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 border border-blue-200 rounded text-blue-600 hover:bg-blue-50 transition-colors h-[42px] w-[60px]">
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        <span className="text-[9px] font-bold">Refresh</span>
                    </button>
                    <button onClick={() => navigate('/dashboard/self-service')} className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 border border-rose-200 rounded text-rose-600 hover:bg-rose-50 transition-colors h-[42px] w-[60px]">
                        <X size={14} />
                        <span className="text-[9px] font-bold">Close</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportToolbar;
