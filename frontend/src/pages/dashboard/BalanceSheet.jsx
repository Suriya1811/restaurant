import React, { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import ReportToolbar, { printReport } from '@/components/common/ReportToolbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const mockBalanceSheetData = {
    liabilities: [
        {
            group: "Capital Account",
            total: 500000,
            ledgers: [
                { name: "Mr. Kumar Capital A/c", amount: 300000 },
                { name: "Mrs. Kumar Capital A/c", amount: 200000 }
            ]
        },
        {
            group: "Secured Loans",
            total: 300000,
            ledgers: [
                { name: "Bank Loan", amount: 300000 }
            ]
        },
        {
            group: "Unsecured Loans",
            total: 150000,
            ledgers: [
                { name: "Term Loan", amount: 100000 },
                { name: "Vehicle Loan", amount: 50000 }
            ]
        },
        {
            group: "Current Liabilities",
            total: 275000,
            ledgers: [
                { name: "Sundry Creditors", amount: 150000 },
                { name: "GST Payable", amount: 50000 },
                { name: "Outstanding Expenses", amount: 75000 }
            ]
        }
    ],
    assets: [
        {
            group: "Fixed Assets",
            total: 850000,
            ledgers: [
                { name: "Building", amount: 500000 },
                { name: "Furniture", amount: 150000 },
                { name: "Motor Vehicle", amount: 200000 }
            ]
        },
        {
            group: "Current Assets",
            total: 425000,
            ledgers: [
                { name: "Stock", amount: 220000 },
                { name: "Sundry Debtors", amount: 130000 },
                { name: "Advance to Supplier", amount: 75000 }
            ]
        },
        {
            group: "Cash & Bank",
            total: 210000,
            ledgers: [
                { name: "Cash in Hand", amount: 60000 },
                { name: "Indian Bank", amount: 100000 },
                { name: "HDFC Bank", amount: 50000 }
            ]
        },
        {
            group: "Loans & Advances",
            total: 140000,
            ledgers: [
                { name: "Staff Advance", amount: 140000 }
            ]
        }
    ]
};

const fmt = (num) => {
    if (!num) return '-';
    return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const BalanceSheet = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isDetailView, setIsDetailView] = useState(false);
    
    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const data = mockBalanceSheetData;

    const totalLiabilities = data.liabilities.reduce((sum, g) => sum + g.total, 0);
    const totalAssets = data.assets.reduce((sum, g) => sum + g.total, 0);
    const isBalanced = totalLiabilities === totalAssets;

    const exportToCSV = () => {
        const rows = [["Liabilities", "Amount", "Assets", "Amount"]];
        
        const maxLen = Math.max(data.liabilities.length, data.assets.length);
        
        // This is a simplified flat export. For real complex detail exports, 
        // a more complex row alignment is needed, but this works for standard view
        for (let i = 0; i < maxLen; i++) {
            const lGroup = data.liabilities[i];
            const aGroup = data.assets[i];
            
            rows.push([
                lGroup ? lGroup.group : "",
                lGroup ? lGroup.total : "",
                aGroup ? aGroup.group : "",
                aGroup ? aGroup.total : ""
            ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
        }

        rows.push([
            "Total", totalLiabilities, "Total", totalAssets
        ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));

        const csvContent = "data:text/csv;charset=utf-8," + 
            "Balance Sheet\n" + 
            `Filters - From: ${filters.startDate} | To: ${filters.endDate}\n\n` +
            rows.join('\n');
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `BalanceSheet_${filters.startDate}_to_${filters.endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.text('Balance Sheet', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 30);
        doc.setFontSize(10);
        doc.text(`Filters - From: ${filters.startDate} | To: ${filters.endDate}`, 14, 36);
        
        const head = [['Liabilities', 'Amount (Rs)', 'Assets', 'Amount (Rs)']];
        
        const body = [];
        const maxLen = Math.max(data.liabilities.length, data.assets.length);
        
        for (let i = 0; i < maxLen; i++) {
            const lGroup = data.liabilities[i];
            const aGroup = data.assets[i];
            
            body.push([
                lGroup ? lGroup.group : "",
                lGroup ? fmt(lGroup.total) : "",
                aGroup ? aGroup.group : "",
                aGroup ? fmt(aGroup.total) : ""
            ]);
        }

        body.push([
            { content: 'Total', styles: { fontStyle: 'bold', textColor: [234, 88, 12] } }, 
            { content: fmt(totalLiabilities), styles: { fontStyle: 'bold', textColor: [234, 88, 12] } }, 
            { content: 'Total', styles: { fontStyle: 'bold', textColor: [234, 88, 12] } }, 
            { content: fmt(totalAssets), styles: { fontStyle: 'bold', textColor: [234, 88, 12] } }
        ]);

        autoTable(doc, {
            startY: 40,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], halign: 'left' },
            styles: { fontSize: 9 },
            columnStyles: {
                1: { halign: 'right' },
                3: { halign: 'right' },
            }
        });

        doc.save(`BalanceSheet_${filters.startDate}_to_${filters.endDate}.pdf`);
    };

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    };

    const handlePrint = () => {
        const headers = ['Liabilities', 'Amount (Rs)', 'Assets', 'Amount (Rs)'];
        const maxLen = Math.max(data.liabilities.length, data.assets.length);
        const rows = [];
        for (let i = 0; i < maxLen; i++) {
            const l = data.liabilities[i];
            const a = data.assets[i];
            rows.push([l ? l.group : '', l ? fmt(l.total) : '', a ? a.group : '', a ? fmt(a.total) : '']);
        }
        printReport(
            'Balance Sheet',
            `As on: ${filters.endDate} | From: ${filters.startDate}`,
            headers,
            rows,
            { label: 'Total', cells: [fmt(totalLiabilities), 'Total', fmt(totalAssets)] }
        );
    };

    const renderTableSide = (groups) => {
        return (
            <div className="w-full">
                {groups.map((g, i) => (
                    <React.Fragment key={i}>
                        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 hover:bg-orange-50/30 transition-colors">
                            <span className="text-sm font-bold text-orange-600">{g.group}</span>
                            <span className="text-sm font-bold text-slate-900">{fmt(g.total)}</span>
                        </div>
                        {isDetailView && (
                            <div className="bg-slate-50/50 border-b border-slate-200 overflow-hidden transition-all duration-300">
                                {g.ledgers.map((l, idx) => (
                                    <div key={idx} className="flex items-center justify-between px-6 py-2 pl-10 border-b border-slate-100 last:border-0 hover:bg-slate-100 transition-colors">
                                        <span className="text-sm text-slate-700 font-medium">{l.name}</span>
                                        <span className="text-sm text-slate-600">{fmt(l.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
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
                }
            `}</style>

            <main className="dashboard-main flex flex-col h-screen overflow-hidden bg-slate-50 relative">
                <ReportToolbar 
                    title="Balance Sheet"
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
                    
                    <div className="flex items-center justify-between mb-6">
                        <div className="hidden print:block">
                            <h2 className="text-2xl font-black text-slate-900 uppercase">Balance Sheet</h2>
                            <p className="text-slate-600 font-medium">As on: {filters.endDate}</p>
                        </div>
                        
                        <div className="flex bg-slate-200 p-1 rounded-lg ml-auto no-print">
                            <button 
                                onClick={() => setIsDetailView(false)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${!isDetailView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Normal View
                            </button>
                            <button 
                                onClick={() => setIsDetailView(true)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${isDetailView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Detail View
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col mb-4">
                        {/* Headers */}
                        <div className="flex bg-[#0f172a] text-white sticky top-0 z-10">
                            <div className="flex-1 flex border-r border-slate-600">
                                <div className="flex-1 px-6 py-3 text-xs font-bold uppercase tracking-wider">Liabilities</div>
                                <div className="w-40 px-6 py-3 text-xs font-bold uppercase tracking-wider text-right border-l border-slate-600">Amount (₹)</div>
                            </div>
                            <div className="flex-1 flex">
                                <div className="flex-1 px-6 py-3 text-xs font-bold uppercase tracking-wider">Assets</div>
                                <div className="w-40 px-6 py-3 text-xs font-bold uppercase tracking-wider text-right border-l border-slate-600">Amount (₹)</div>
                            </div>
                        </div>

                        {/* Body content */}
                        <div className="flex flex-col sm:flex-row items-start relative">
                            {/* Liabilities side */}
                            <div className="flex-1 w-full border-b sm:border-b-0 sm:border-r border-slate-200 min-h-full">
                                {renderTableSide(data.liabilities)}
                            </div>
                            
                            {/* Assets side */}
                            <div className="flex-1 w-full min-h-full">
                                {renderTableSide(data.assets)}
                            </div>
                        </div>

                        {/* Footer Totals */}
                        <div className="flex bg-[#fff7ed] border-t-2 border-orange-200 sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                            <div className="flex-1 flex border-r border-orange-200">
                                <div className="flex-1 px-6 py-4 text-sm font-black text-orange-600 uppercase">Total</div>
                                <div className="w-40 px-6 py-4 text-sm font-black text-orange-600 text-right">{fmt(totalLiabilities)}</div>
                            </div>
                            <div className="flex-1 flex">
                                <div className="flex-1 px-6 py-4 text-sm font-black text-orange-600 uppercase">Total</div>
                                <div className="w-40 px-6 py-4 text-sm font-black text-orange-600 text-right">{fmt(totalAssets)}</div>
                            </div>
                        </div>
                    </div>

                    {isBalanced ? (
                        <div className="bg-emerald-50 px-6 py-3 border border-emerald-100 flex items-center justify-center rounded-lg shadow-sm">
                            <span className="text-emerald-700 font-bold text-sm">Difference is Zero (Balanced)</span>
                        </div>
                    ) : (
                        <div className="bg-rose-50 px-6 py-3 border border-rose-100 flex items-center justify-center rounded-lg shadow-sm">
                            <span className="text-rose-700 font-bold text-sm">Difference: {fmt(Math.abs(totalLiabilities - totalAssets))} (Not Balanced)</span>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default BalanceSheet;
