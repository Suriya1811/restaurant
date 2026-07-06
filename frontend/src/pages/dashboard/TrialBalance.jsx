import React, { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import ReportToolbar, { printReport } from '@/components/common/ReportToolbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const mockTrialBalanceData = [
    { name: "Cash in Hand", opDr: 15000, opCr: 0, trxDr: 125000, trxCr: 110000, clDr: 30000, clCr: 0 },
    { name: "Cash at Bank", opDr: 65000, opCr: 0, trxDr: 550000, trxCr: 420000, clDr: 195000, clCr: 0 },
    { name: "Accounts Receivable", opDr: 120000, opCr: 0, trxDr: 250000, trxCr: 210000, clDr: 160000, clCr: 0 },
    { name: "Inventory", opDr: 200000, opCr: 0, trxDr: 300000, trxCr: 280000, clDr: 220000, clCr: 0 },
    { name: "Furniture & Fixtures", opDr: 75000, opCr: 0, trxDr: 0, trxCr: 0, clDr: 75000, clCr: 0 },
    { name: "Motor Vehicles", opDr: 150000, opCr: 0, trxDr: 0, trxCr: 0, clDr: 150000, clCr: 0 },
    { name: "Accounts Payable", opDr: 0, opCr: 95000, trxDr: 190000, trxCr: 195000, clDr: 0, clCr: 100000 },
    { name: "Bank Loan", opDr: 0, opCr: 200000, trxDr: 0, trxCr: 0, clDr: 0, clCr: 200000 },
    { name: "Capital", opDr: 0, opCr: 300000, trxDr: 0, trxCr: 0, clDr: 0, clCr: 300000 },
    { name: "Sales", opDr: 0, opCr: 0, trxDr: 0, trxCr: 650000, clDr: 0, clCr: 650000 },
    { name: "Cost of Goods Sold", opDr: 0, opCr: 0, trxDr: 320000, trxCr: 0, clDr: 320000, clCr: 0 },
    { name: "Office Expenses", opDr: 0, opCr: 0, trxDr: 45000, trxCr: 0, clDr: 45000, clCr: 0 },
    { name: "Rent Expense", opDr: 0, opCr: 0, trxDr: 30000, trxCr: 0, clDr: 30000, clCr: 0 },
    { name: "Salaries Expense", opDr: 0, opCr: 0, trxDr: 60000, trxCr: 0, clDr: 60000, clCr: 0 },
];

const fmt = (num) => {
    if (!num) return '-';
    return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const TrialBalance = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const data = mockTrialBalanceData;

    const totals = data.reduce((acc, row) => ({
        opDr: acc.opDr + row.opDr,
        opCr: acc.opCr + row.opCr,
        trxDr: acc.trxDr + row.trxDr,
        trxCr: acc.trxCr + row.trxCr,
        clDr: acc.clDr + row.clDr,
        clCr: acc.clCr + row.clCr,
    }), { opDr: 0, opCr: 0, trxDr: 0, trxCr: 0, clDr: 0, clCr: 0 });

    const isBalanced = totals.clDr === totals.clCr;

    const exportToCSV = () => {
        const headers = ["Account Name", "Opening Balance (Dr)", "Opening Balance (Cr)", "Transactions (Dr)", "Transactions (Cr)", "Closing Balance (Dr)", "Closing Balance (Cr)"];
        const rows = data.map(d => [
            d.name, d.opDr, d.opCr, d.trxDr, d.trxCr, d.clDr, d.clCr
        ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
        
        rows.push([
            "Total", totals.opDr, totals.opCr, totals.trxDr, totals.trxCr, totals.clDr, totals.clCr
        ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));

        const csvContent = "data:text/csv;charset=utf-8," + 
            "Trial Balance\n" + 
            `Filters - From: ${filters.startDate} | To: ${filters.endDate}\n\n` +
            headers.join(',') + "\n" + rows.join('\n');
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `TrialBalance_${filters.startDate}_to_${filters.endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.text('Trial Balance', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 30);
        doc.setFontSize(10);
        doc.text(`Filters - From: ${filters.startDate} | To: ${filters.endDate}`, 14, 36);
        
        const head = [[
            { content: 'Account Name', rowSpan: 2 }, 
            { content: 'Opening Balance', colSpan: 2, styles: { halign: 'center' } }, 
            { content: 'Transactions', colSpan: 2, styles: { halign: 'center' } }, 
            { content: 'Closing Balance', colSpan: 2, styles: { halign: 'center' } }
        ], [
            'Dr', 'Cr', 'Dr', 'Cr', 'Dr', 'Cr'
        ]];
        
        const body = data.map(d => [
            d.name,
            fmt(d.opDr), fmt(d.opCr),
            fmt(d.trxDr), fmt(d.trxCr),
            fmt(d.clDr), fmt(d.clCr)
        ]);

        body.push([{ content: 'Total', styles: { fontStyle: 'bold' } }, fmt(totals.opDr), fmt(totals.opCr), fmt(totals.trxDr), fmt(totals.trxCr), fmt(totals.clDr), fmt(totals.clCr)]);

        autoTable(doc, {
            startY: 40,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], halign: 'center' },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' },
            }
        });

        doc.save(`TrialBalance_${filters.startDate}_to_${filters.endDate}.pdf`);
    };

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    };

    const handlePrint = () => {
        const headers = ['Account Name', 'Op Balance (Dr)', 'Op Balance (Cr)', 'Transactions (Dr)', 'Transactions (Cr)', 'Closing (Dr)', 'Closing (Cr)'];
        const rows = data.map(d => [
            d.name,
            fmt(d.opDr), fmt(d.opCr),
            fmt(d.trxDr), fmt(d.trxCr),
            fmt(d.clDr), fmt(d.clCr)
        ]);
        printReport(
            'Trial Balance',
            `From: ${filters.startDate} | To: ${filters.endDate} | Balanced: ${totals.clDr === totals.clCr ? 'YES ✓' : 'NO ✗'}`,
            headers,
            rows,
            { label: 'Total', cells: [fmt(totals.opDr), fmt(totals.opCr), fmt(totals.trxDr), fmt(totals.trxCr), fmt(totals.clDr), fmt(totals.clCr)] }
        );
    };

    return (
        <div className="dashboard-layout bg-slate-50 font-sans min-h-screen">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay z-40 fixed inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <style>{`
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body, html, #root { background: white !important; height: auto !important; overflow: visible !important; min-height: 0 !important; }
                    .no-print, aside, nav, .sidebar, .mobile-overlay, .top-bar { display: none !important; }
                    .dashboard-main { padding: 0 !important; margin: 0 !important; background: white !important; height: auto !important; overflow: visible !important; }
                    .print-section { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
                    table { border-collapse: collapse !important; width: 100% !important; }
                    th, td { padding: 8px !important; }
                }
            `}</style>

            <main className="dashboard-main flex flex-col h-screen overflow-hidden bg-slate-50 relative">
                <ReportToolbar 
                    title="Trial Balance"
                    toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    filters={filters}
                    setFilters={setFilters}
                    loading={loading}
                    onRefresh={handleRefresh}
                    onExportCSV={exportToCSV}
                    onExportPDF={exportToPDF}
                    onPrint={handlePrint}
                />

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 print-section relative">
                    <div className="hidden print:block mb-6">
                        <h2 className="text-2xl font-black text-slate-900 uppercase">Trial Balance</h2>
                        <p className="text-slate-600 font-medium">Generated on: {new Date().toLocaleString('en-GB')}</p>
                        <p className="text-slate-600 text-sm mt-1">Filters - From: {filters.startDate} | To: {filters.endDate}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-full relative">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left min-w-[800px]">
                                <thead className="bg-[#1e293b] text-white sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider border-b border-r border-slate-600" rowSpan="2">Account Name</th>
                                        <th className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-center border-b border-r border-slate-600" colSpan="2">Opening Balance</th>
                                        <th className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-center border-b border-r border-slate-600" colSpan="2">Transactions</th>
                                        <th className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-center border-b border-slate-600" colSpan="2">Closing Balance</th>
                                    </tr>
                                    <tr className="bg-[#334155]">
                                        <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-right border-b border-r border-slate-600 w-32">Dr.</th>
                                        <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-right border-b border-r border-slate-600 w-32">Cr.</th>
                                        <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-right border-b border-r border-slate-600 w-32">Dr.</th>
                                        <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-right border-b border-r border-slate-600 w-32">Cr.</th>
                                        <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-right border-b border-r border-slate-600 w-32">Dr.</th>
                                        <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-right border-b border-slate-600 w-32">Cr.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {data.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 text-sm font-semibold text-slate-800 border-r border-slate-200">{row.name}</td>
                                            <td className="px-6 py-3 text-sm text-right text-slate-600 border-r border-slate-200">{fmt(row.opDr)}</td>
                                            <td className="px-6 py-3 text-sm text-right text-slate-600 border-r border-slate-200">{fmt(row.opCr)}</td>
                                            <td className="px-6 py-3 text-sm text-right text-slate-600 border-r border-slate-200">{fmt(row.trxDr)}</td>
                                            <td className="px-6 py-3 text-sm text-right text-slate-600 border-r border-slate-200">{fmt(row.trxCr)}</td>
                                            <td className="px-6 py-3 text-sm text-right font-medium text-slate-800 border-r border-slate-200">{fmt(row.clDr)}</td>
                                            <td className="px-6 py-3 text-sm text-right font-medium text-slate-800">{fmt(row.clCr)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-[#fff7ed] sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t-2 border-orange-200">
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-black text-orange-600 uppercase border-r border-orange-200">Total</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-orange-600 border-r border-orange-200">{fmt(totals.opDr)}</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-orange-600 border-r border-orange-200">{fmt(totals.opCr)}</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-orange-600 border-r border-orange-200">{fmt(totals.trxDr)}</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-orange-600 border-r border-orange-200">{fmt(totals.trxCr)}</td>
                                        <td className="px-6 py-4 text-sm text-right font-black text-orange-600 border-r border-orange-200">{fmt(totals.clDr)}</td>
                                        <td className="px-6 py-4 text-sm text-right font-black text-orange-600">{fmt(totals.clCr)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        {isBalanced ? (
                            <div className="bg-emerald-50 px-6 py-3 border-t border-emerald-100 flex items-center justify-center">
                                <span className="text-emerald-700 font-bold text-sm">Difference is Zero (Balanced)</span>
                            </div>
                        ) : (
                            <div className="bg-rose-50 px-6 py-3 border-t border-rose-100 flex items-center justify-center">
                                <span className="text-rose-700 font-bold text-sm">Difference: {fmt(Math.abs(totals.clDr - totals.clCr))} (Not Balanced)</span>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TrialBalance;
