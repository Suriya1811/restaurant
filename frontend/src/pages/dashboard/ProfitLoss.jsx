import React, { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import ReportToolbar, { printReport } from '@/components/common/ReportToolbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const mockProfitLossData = {
    expenses: [
        {
            group: "Direct Expenses",
            total: 350000,
            ledgers: [
                { name: "Purchase A/c", amount: 250000 },
                { name: "Freight Inward", amount: 50000 },
                { name: "Carriage Inward", amount: 50000 }
            ]
        },
        {
            group: "Indirect Expenses",
            total: 175000,
            ledgers: [
                { name: "Salary", amount: 100000 },
                { name: "Rent", amount: 50000 },
                { name: "Electricity", amount: 25000 }
            ]
        },
        {
            group: "Depreciation",
            total: 50000,
            ledgers: [
                { name: "Building Depreciation", amount: 30000 },
                { name: "Furniture Depreciation", amount: 20000 }
            ]
        }
    ],
    income: [
        {
            group: "Direct Income",
            total: 850000,
            ledgers: [
                { name: "Sales A/c", amount: 800000 },
                { name: "Service Income", amount: 50000 }
            ]
        },
        {
            group: "Indirect Income",
            total: 75000,
            ledgers: [
                { name: "Interest Received", amount: 25000 },
                { name: "Commission Received", amount: 50000 }
            ]
        },
        {
            group: "Other Income",
            total: 25000,
            ledgers: [
                { name: "Miscellaneous Income", amount: 25000 }
            ]
        }
    ]
};

const fmt = (num) => {
    if (!num) return '-';
    return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const ProfitLoss = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isDetailView, setIsDetailView] = useState(false);
    
    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const data = mockProfitLossData;

    const totalExpenses = data.expenses.reduce((sum, g) => sum + g.total, 0);
    const totalIncome = data.income.reduce((sum, g) => sum + g.total, 0);
    
    const isProfit = totalIncome >= totalExpenses;
    const netDifference = Math.abs(totalIncome - totalExpenses);
    
    // Balanced Total
    const grandTotal = Math.max(totalExpenses, totalIncome);

    const exportToCSV = () => {
        const rows = [["Expenses", "Amount", "Income", "Amount"]];
        
        const maxLen = Math.max(data.expenses.length, data.income.length);
        
        for (let i = 0; i < maxLen; i++) {
            const eGroup = data.expenses[i];
            const iGroup = data.income[i];
            
            rows.push([
                eGroup ? eGroup.group : "",
                eGroup ? eGroup.total : "",
                iGroup ? iGroup.group : "",
                iGroup ? iGroup.total : ""
            ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
        }

        // Add Net Profit / Loss row
        rows.push([
            isProfit ? "Net Profit" : "",
            isProfit ? netDifference : "",
            !isProfit ? "Net Loss" : "",
            !isProfit ? netDifference : ""
        ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));

        rows.push([
            "Total", grandTotal, "Total", grandTotal
        ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));

        const csvContent = "data:text/csv;charset=utf-8," + 
            "Profit & Loss Report\n" + 
            `Filters - From: ${filters.startDate} | To: ${filters.endDate}\n\n` +
            rows.join('\n');
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ProfitLoss_${filters.startDate}_to_${filters.endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.text('Profit & Loss Report', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 30);
        doc.setFontSize(10);
        doc.text(`Filters - From: ${filters.startDate} | To: ${filters.endDate}`, 14, 36);
        
        const head = [['Expenses', 'Amount (Rs)', 'Income', 'Amount (Rs)']];
        
        const body = [];
        const maxLen = Math.max(data.expenses.length, data.income.length);
        
        for (let i = 0; i < maxLen; i++) {
            const eGroup = data.expenses[i];
            const iGroup = data.income[i];
            
            body.push([
                eGroup ? eGroup.group : "",
                eGroup ? fmt(eGroup.total) : "",
                iGroup ? iGroup.group : "",
                iGroup ? fmt(iGroup.total) : ""
            ]);
        }
        
        // Add Net Profit / Loss row
        body.push([
            isProfit ? { content: 'Net Profit', styles: { fontStyle: 'bold', textColor: [21, 128, 61] } } : "",
            isProfit ? { content: fmt(netDifference), styles: { fontStyle: 'bold', textColor: [21, 128, 61] } } : "",
            !isProfit ? { content: 'Net Loss', styles: { fontStyle: 'bold', textColor: [225, 29, 72] } } : "",
            !isProfit ? { content: fmt(netDifference), styles: { fontStyle: 'bold', textColor: [225, 29, 72] } } : ""
        ]);

        body.push([
            { content: 'Total', styles: { fontStyle: 'bold', textColor: [234, 88, 12] } }, 
            { content: fmt(grandTotal), styles: { fontStyle: 'bold', textColor: [234, 88, 12] } }, 
            { content: 'Total', styles: { fontStyle: 'bold', textColor: [234, 88, 12] } }, 
            { content: fmt(grandTotal), styles: { fontStyle: 'bold', textColor: [234, 88, 12] } }
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

        doc.save(`ProfitLoss_${filters.startDate}_to_${filters.endDate}.pdf`);
    };

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    };

    const handlePrint = () => {
        const headers = ['Expenses', 'Amount (Rs)', 'Income', 'Amount (Rs)'];
        const maxLen = Math.max(data.expenses.length, data.income.length);
        const rows = [];
        for (let i = 0; i < maxLen; i++) {
            const e = data.expenses[i];
            const inc = data.income[i];
            rows.push([e ? e.group : '', e ? fmt(e.total) : '', inc ? inc.group : '', inc ? fmt(inc.total) : '']);
        }
        if (isProfit) rows.push(['Net Profit', fmt(netDifference), '', '']);
        else rows.push(['', '', 'Net Loss', fmt(netDifference)]);
        printReport(
            'Profit & Loss Account',
            `From: ${filters.startDate} | To: ${filters.endDate} | ${isProfit ? `Net Profit: ${fmt(netDifference)}` : `Net Loss: ${fmt(netDifference)}`}`,
            headers,
            rows,
            { label: 'Grand Total', cells: [fmt(grandTotal), '', fmt(grandTotal)] }
        );
    };

    const renderTableSide = (groups, isExpenseSide) => {
        return (
            <div className="w-full flex flex-col h-full">
                <div className="flex-1">
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
                
                {/* Net Profit / Loss padding row to balance visual height if needed, but handled by flex-1 above */}
                {/* Render Net Profit on Expense Side, or Net Loss on Income Side */}
                {isExpenseSide && isProfit && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-emerald-50 mt-auto">
                        <span className="text-sm font-black text-emerald-700">Net Profit</span>
                        <span className="text-sm font-black text-emerald-700">{fmt(netDifference)}</span>
                    </div>
                )}
                {!isExpenseSide && !isProfit && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-rose-50 mt-auto">
                        <span className="text-sm font-black text-rose-700">Net Loss</span>
                        <span className="text-sm font-black text-rose-700">{fmt(netDifference)}</span>
                    </div>
                )}
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
                    title="Profit & Loss"
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
                            <h2 className="text-2xl font-black text-slate-900 uppercase">Profit & Loss</h2>
                            <p className="text-slate-600 font-medium">Period: {filters.startDate} to {filters.endDate}</p>
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
                                <div className="flex-1 px-6 py-3 text-xs font-bold uppercase tracking-wider">Expenses</div>
                                <div className="w-40 px-6 py-3 text-xs font-bold uppercase tracking-wider text-right border-l border-slate-600">Amount (₹)</div>
                            </div>
                            <div className="flex-1 flex">
                                <div className="flex-1 px-6 py-3 text-xs font-bold uppercase tracking-wider">Income</div>
                                <div className="w-40 px-6 py-3 text-xs font-bold uppercase tracking-wider text-right border-l border-slate-600">Amount (₹)</div>
                            </div>
                        </div>

                        {/* Body content */}
                        <div className="flex flex-col sm:flex-row items-stretch relative">
                            {/* Expenses side */}
                            <div className="flex-1 w-full border-b sm:border-b-0 sm:border-r border-slate-200 flex">
                                {renderTableSide(data.expenses, true)}
                            </div>
                            
                            {/* Income side */}
                            <div className="flex-1 w-full flex">
                                {renderTableSide(data.income, false)}
                            </div>
                        </div>

                        {/* Footer Totals */}
                        <div className="flex bg-[#fff7ed] border-t-2 border-orange-200 sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                            <div className="flex-1 flex border-r border-orange-200">
                                <div className="flex-1 px-6 py-4 text-sm font-black text-orange-600 uppercase">Total</div>
                                <div className="w-40 px-6 py-4 text-sm font-black text-orange-600 text-right">{fmt(grandTotal)}</div>
                            </div>
                            <div className="flex-1 flex">
                                <div className="flex-1 px-6 py-4 text-sm font-black text-orange-600 uppercase">Total</div>
                                <div className="w-40 px-6 py-4 text-sm font-black text-orange-600 text-right">{fmt(grandTotal)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center py-2">
                        {isProfit ? (
                            <span className="text-emerald-700 font-bold text-sm bg-emerald-50 px-6 py-2 rounded-full border border-emerald-100">
                                Net Profit for the Period: {fmt(netDifference)}
                            </span>
                        ) : (
                            <span className="text-rose-700 font-bold text-sm bg-rose-50 px-6 py-2 rounded-full border border-rose-100">
                                Net Loss for the Period: {fmt(netDifference)}
                            </span>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfitLoss;
