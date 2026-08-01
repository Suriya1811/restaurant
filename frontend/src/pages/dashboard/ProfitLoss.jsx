import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import { Download, Printer, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { printReport } from '@/components/common/ReportToolbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getNatureForGroup } from '@/utils/standardGroups';

const API = import.meta.env.VITE_API_URL;
const getToken = () => JSON.parse(localStorage.getItem('user'))?.token;

const fmt = (num) => {
    if (!num) return '';
    return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const ProfitLoss = () => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isDetailView, setIsDetailView] = useState(false);
    const [data, setData] = useState({ expenses: [], income: [] });
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        const fetchProfitLoss = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API}/reports/trial-balance?startDate=${filters.startDate}&endDate=${filters.endDate}`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                const json = await res.json();
                if (json.success) {
                    const expenses = [];
                    const income = [];
                    json.data.forEach(group => {
                        const nature = getNatureForGroup(group.group);
                        const total = group.clDr > 0 ? group.clDr : group.clCr;
                        const ledgers = group.ledgers.map(l => ({
                            name: l.name,
                            amount: l.clDr > 0 ? l.clDr : l.clCr
                        }));
                        if (nature === 'EXPENSES') expenses.push({ group: group.group, total, ledgers });
                        else if (nature === 'INCOME') income.push({ group: group.group, total, ledgers });
                    });
                    setData({ expenses, income });
                }
            } catch (error) {
                console.error('Error fetching Profit Loss:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfitLoss();
    }, [filters.startDate, filters.endDate]);

    const totalExpenses = data.expenses.reduce((sum, g) => sum + g.total, 0);
    const totalIncome = data.income.reduce((sum, g) => sum + g.total, 0);

    const exportToCSV = () => {
        const rows = [["Expenses", "Amount", "Income", "Amount"]];
        const maxLen = Math.max(data.expenses.length, data.income.length);
        
        for (let i = 0; i < maxLen; i++) {
            const eGroup = data.expenses[i];
            const iGroup = data.income[i];
            
            rows.push([
                eGroup ? "[Group] " + eGroup.group : "", eGroup ? eGroup.total : "",
                iGroup ? "[Group] " + iGroup.group : "", iGroup ? iGroup.total : ""
            ].map(cell => `"\${String(cell).replace(/"/g, '""')}"`).join(','));
            
            if (isDetailView) {
                const eLedgers = eGroup ? eGroup.ledgers : [];
                const iLedgers = iGroup ? iGroup.ledgers : [];
                const maxLedgers = Math.max(eLedgers.length, iLedgers.length);
                for(let j=0; j<maxLedgers; j++) {
                    const eL = eLedgers[j];
                    const iL = iLedgers[j];
                    rows.push([
                        eL ? "    " + eL.name : "", eL ? eL.amount : "",
                        iL ? "    " + iL.name : "", iL ? iL.amount : ""
                    ].map(cell => `"\${String(cell).replace(/"/g, '""')}"`).join(','));
                }
            }
        }

        rows.push([
            "Total", totalExpenses, "Total", totalIncome
        ].map(cell => `"\${String(cell).replace(/"/g, '""')}"`).join(','));

        const csvContent = "data:text/csv;charset=utf-8," + 
            "Profit & Loss Account\n" + 
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
        doc.text('Profit & Loss Account', 14, 22);
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
                eGroup ? "[Group] " + eGroup.group : "",
                eGroup ? fmt(eGroup.total) : "",
                iGroup ? "[Group] " + iGroup.group : "",
                iGroup ? fmt(iGroup.total) : ""
            ]);
            
            if (isDetailView) {
                const eLedgers = eGroup ? eGroup.ledgers : [];
                const iLedgers = iGroup ? iGroup.ledgers : [];
                const maxLedgers = Math.max(eLedgers.length, iLedgers.length);
                for(let j=0; j<maxLedgers; j++) {
                    const eL = eLedgers[j];
                    const iL = iLedgers[j];
                    body.push([
                        eL ? "    " + eL.name : "",
                        eL ? fmt(eL.amount) : "",
                        iL ? "    " + iL.name : "",
                        iL ? fmt(iL.amount) : ""
                    ]);
                }
            }
        }

        body.push([
            { content: 'Total', styles: { fontStyle: 'bold', textColor: [234, 88, 12] } }, 
            { content: fmt(totalExpenses), styles: { fontStyle: 'bold', textColor: [234, 88, 12] } }, 
            { content: 'Total', styles: { fontStyle: 'bold', textColor: [234, 88, 12] } }, 
            { content: fmt(totalIncome), styles: { fontStyle: 'bold', textColor: [234, 88, 12] } }
        ]);

        autoTable(doc, {
            startY: 40,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [249, 115, 22], halign: 'left' },
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
            const eGroup = data.expenses[i];
            const iGroup = data.income[i];
            rows.push([
                eGroup ? "[Group] " + eGroup.group : "", eGroup ? fmt(eGroup.total) : "", 
                iGroup ? "[Group] " + iGroup.group : "", iGroup ? fmt(iGroup.total) : ""
            ]);
            
            if (isDetailView) {
                const eLedgers = eGroup ? eGroup.ledgers : [];
                const iLedgers = iGroup ? iGroup.ledgers : [];
                const maxLedgers = Math.max(eLedgers.length, iLedgers.length);
                for(let j=0; j<maxLedgers; j++) {
                    const eL = eLedgers[j];
                    const iL = iLedgers[j];
                    rows.push([
                        eL ? "    " + eL.name : "", eL ? fmt(eL.amount) : "",
                        iL ? "    " + iL.name : "", iL ? fmt(iL.amount) : ""
                    ]);
                }
            }
        }
        printReport(
            'Profit & Loss Account',
            `As on: ${filters.endDate} | From: ${filters.startDate}`,
            headers,
            rows,
            { label: 'Total', cells: [fmt(totalExpenses), 'Total', fmt(totalIncome)] }
        );
    };

    const renderTableSide = (groups) => {
        return (
            <div className="w-full">
                {groups.map((g, i) => (
                    <React.Fragment key={i}>
                        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 hover:bg-slate-100 transition-colors bg-slate-50">
                            <span className="text-sm font-black text-slate-900 uppercase">{g.group}</span>
                            <span className="text-sm font-bold text-slate-700">{fmt(g.total)}</span>
                        </div>
                        {isDetailView && g.ledgers.map((l, idx) => (
                            <div key={idx} className="flex items-center justify-between px-6 py-3 pl-12 border-b border-slate-200 bg-white hover:bg-orange-50/30 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                                    <span className="text-sm text-slate-700 font-semibold">{l.name}</span>
                                </div>
                                <span className="text-sm text-slate-600">{fmt(l.amount)}</span>
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <DashboardPageShell className="bg-slate-50 font-sans min-h-screen">
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
                
                <Header 
                    title="Profit & Loss Account"
                    toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    onClose={() => navigate('/dashboard/self-service/home')}
                    actions={
                        <>
                            <button type="button" className="px-3 py-1.5 border border-emerald-500 bg-white text-emerald-600 rounded text-[11px] font-black uppercase flex items-center gap-1.5 hover:bg-emerald-50 transition-colors shadow-sm" onClick={exportToCSV} title="Export to Excel">
                                <Download size={14} className="text-emerald-500" />
                                <span>Excel</span>
                            </button>
                            <button type="button" className="px-3 py-1.5 border border-rose-500 bg-white text-rose-600 rounded text-[11px] font-black uppercase flex items-center gap-1.5 hover:bg-rose-50 transition-colors shadow-sm" onClick={exportToPDF} title="Export to PDF">
                                <Download size={14} className="text-rose-500" />
                                <span>PDF</span>
                            </button>
                            <button type="button" className="px-3 py-1.5 border border-indigo-500 bg-white text-indigo-600 rounded text-[11px] font-black uppercase flex items-center gap-1.5 hover:bg-indigo-50 transition-colors shadow-sm" onClick={handlePrint} title="Print">
                                <Printer size={14} className="text-indigo-500" />
                                <span>Print</span>
                            </button>
                        </>
                    }
                />
                <div className="master-content-layout fade-in flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="toolbar-premium flex-shrink-0 no-print mb-4">
                        <div className="flex flex-row items-center gap-4 flex-1">
                            <div className="search-premium" style={{ width: '320px', flexShrink: 0 }}>
                                <Search size={20} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border-orange-500 focus:ring-orange-500"
                                    style={{ borderColor: '#f97316' }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">From Date</label>
                                <input 
                                    type="date" 
                                    value={filters.startDate} 
                                    onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} 
                                    className="border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">To Date</label>
                                <input 
                                    type="date" 
                                    value={filters.endDate} 
                                    onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} 
                                    className="border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden print-section relative">
                        <div className="hidden print:block mb-6">
                            <h2 className="text-2xl font-black text-slate-900 uppercase">Profit & Loss Account</h2>
                            <p className="text-slate-600 font-medium">As on: {filters.endDate}</p>
                        </div>

                        <div
                            className="table-container-premium flex-1 flex flex-col justify-between"
                            style={{
                                height: 'calc(100vh - 280px)',
                                maxHeight: 'calc(100vh - 280px)',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Headers */}
                            <div className="flex bg-[#0f172a] text-[#f97316] flex-shrink-0 z-10 shadow-sm min-h-[54px] items-center">
                                <div className="flex-1 flex items-center border-r border-slate-700 h-full">
                                    <div className="flex-1 px-6 py-[18px] text-xs font-black uppercase tracking-wider">Expenses</div>
                                    <div className="w-40 px-6 py-[18px] text-xs font-black uppercase tracking-wider text-right border-l border-slate-700">Amount</div>
                                </div>
                                <div className="flex-1 flex items-center h-full">
                                    <div className="flex-1 px-6 py-[18px] text-xs font-black uppercase tracking-wider">Income</div>
                                    <div className="w-40 px-6 py-[18px] text-xs font-black uppercase tracking-wider text-right border-l border-slate-700">Amount</div>
                                </div>
                            </div>

                            {/* Body content */}
                            <div className="flex-1 overflow-y-auto bg-white flex flex-col sm:flex-row items-start relative">
                                {data.expenses.length === 0 && data.income.length === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-medium bg-white">
                                        No transactions found for the selected period.
                                    </div>
                                )}
                                
                                {/* Expenses side */}
                                <div className="flex-1 w-full sm:border-r border-slate-200 h-full">
                                    {renderTableSide(data.expenses)}
                                </div>
                                
                                {/* Income side */}
                                <div className="flex-1 w-full h-full">
                                    {renderTableSide(data.income)}
                                </div>
                            </div>

                            {/* Footer Totals */}
                            <div className="flex bg-[#fff7ed] border-t-2 border-orange-200 flex-shrink-0 z-20">
                                <div className="flex-1 flex border-r border-orange-200">
                                    <div className="flex-1 px-6 py-3 text-sm font-black text-orange-600 uppercase">Total</div>
                                    <div className="w-40 px-6 py-3 text-sm font-black text-orange-600 text-right">{(totalExpenses > 0 || totalIncome > 0) ? fmt(totalExpenses) : ''}</div>
                                </div>
                                <div className="flex-1 flex">
                                    <div className="flex-1 px-6 py-3 text-sm font-black text-orange-600 uppercase">Total</div>
                                    <div className="w-40 px-6 py-3 text-sm font-black text-orange-600 text-right">{(totalExpenses > 0 || totalIncome > 0) ? fmt(totalIncome) : ''}</div>
                                </div>
                            </div>

                            {/* Difference Row */}
                            <div className="flex bg-[#fff7ed] border-t border-orange-200 flex-shrink-0 z-20">
                                <div className="flex-1 flex border-r border-orange-200">
                                    <div className="flex-1 px-6 py-3 text-sm font-black text-orange-600 uppercase">Difference</div>
                                    <div className="w-40 px-6 py-3 text-sm font-black text-orange-600 text-right">
                                        {(totalExpenses > 0 || totalIncome > 0) && totalExpenses > totalIncome ? fmt(totalExpenses - totalIncome) : ''}
                                    </div>
                                </div>
                                <div className="flex-1 flex">
                                    <div className="flex-1 px-6 py-3 text-sm font-black text-orange-600 uppercase">Difference</div>
                                    <div className="w-40 px-6 py-3 text-sm font-black text-orange-600 text-right">
                                        {(totalExpenses > 0 || totalIncome > 0) && totalIncome > totalExpenses ? fmt(totalIncome - totalExpenses) : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </DashboardPageShell>
    );
};

export default ProfitLoss;
