import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import { Download, Printer, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { printReport } from '@/components/common/ReportToolbar';
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

const API = import.meta.env.VITE_API_URL;
const getToken = () => JSON.parse(localStorage.getItem('user'))?.token;

const TrialBalance = () => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('NORMAL');
    const [data, setData] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        const fetchTrialBalance = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API}/reports/trial-balance?startDate=${filters.startDate}&endDate=${filters.endDate}`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (error) {
                console.error('Error fetching Trial Balance:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTrialBalance();
    }, [filters.startDate, filters.endDate]);

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
        const rows = [];
        data.forEach(group => {
            rows.push([
                `[Group] ${group.group}`, group.opDr, group.opCr, group.trxDr, group.trxCr, group.clDr, group.clCr
            ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
            if (viewMode === 'DETAIL') {
                group.ledgers.forEach(ledger => {
                    rows.push([
                        `    ${ledger.name}`, ledger.opDr, ledger.opCr, ledger.trxDr, ledger.trxCr, ledger.clDr, ledger.clCr
                    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
                });
            }
        });
        
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
        
        const body = [];
        data.forEach(group => {
            body.push([
                { content: `[Group] ${group.group}`, styles: { fontStyle: 'bold' } },
                fmt(group.opDr), fmt(group.opCr), fmt(group.trxDr), fmt(group.trxCr), fmt(group.clDr), fmt(group.clCr)
            ]);
            if (viewMode === 'DETAIL') {
                group.ledgers.forEach(ledger => {
                    body.push([
                        `    ${ledger.name}`, fmt(ledger.opDr), fmt(ledger.opCr), fmt(ledger.trxDr), fmt(ledger.trxCr), fmt(ledger.clDr), fmt(ledger.clCr)
                    ]);
                });
            }
        });

        body.push([{ content: 'Total', styles: { fontStyle: 'bold' } }, fmt(totals.opDr), fmt(totals.opCr), fmt(totals.trxDr), fmt(totals.trxCr), fmt(totals.clDr), fmt(totals.clCr)]);

        autoTable(doc, {
            startY: 40,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [249, 115, 22], halign: 'center' }, // dark blue bg, orange text
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
        const rows = [];
        data.forEach(group => {
            rows.push([
                `[Group] ${group.group}`, fmt(group.opDr), fmt(group.opCr), fmt(group.trxDr), fmt(group.trxCr), fmt(group.clDr), fmt(group.clCr)
            ]);
            if (viewMode === 'DETAIL') {
                group.ledgers.forEach(ledger => {
                    rows.push([
                        `    ${ledger.name}`, fmt(ledger.opDr), fmt(ledger.opCr), fmt(ledger.trxDr), fmt(ledger.trxCr), fmt(ledger.clDr), fmt(ledger.clCr)
                    ]);
                });
            }
        });

        printReport(
            'Trial Balance',
            `From: ${filters.startDate} | To: ${filters.endDate} | Balanced: ${totals.clDr === totals.clCr ? 'YES ✓' : 'NO ✗'}`,
            headers,
            rows,
            { label: 'Total', cells: [fmt(totals.opDr), fmt(totals.opCr), fmt(totals.trxDr), fmt(totals.trxCr), fmt(totals.clDr), fmt(totals.clCr)] }
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
                    table { border-collapse: collapse !important; width: 100% !important; }
                    th, td { padding: 8px !important; }
                }
            `}</style>

            <main className="dashboard-main flex flex-col h-screen overflow-hidden bg-slate-50 relative">
                
                <Header 
                    title="Trial Balance"
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
                <div className="master-content-layout fade-in flex flex-col">
                    <div className="toolbar-premium no-print">
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
                                <input 
                                    type="date" 
                                    value={filters.startDate} 
                                    onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} 
                                    placeholder="From Date"
                                    title="From Date"
                                    className="border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="date" 
                                    value={filters.endDate} 
                                    onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} 
                                    placeholder="To Date"
                                    title="To Date"
                                    className="border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setViewMode('NORMAL')}
                                    className={`px-4 py-1.5 rounded text-xs font-bold border transition-colors ${
                                        viewMode === 'NORMAL' 
                                        ? 'bg-[#0f172a] text-[#f97316] border-[#0f172a]' 
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    Normal
                                </button>
                                <button 
                                    onClick={() => setViewMode('DETAIL')}
                                    className={`px-4 py-1.5 rounded text-xs font-bold border transition-colors ${
                                        viewMode === 'DETAIL' 
                                        ? 'bg-[#0f172a] text-[#f97316] border-[#0f172a]' 
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    Detailed
                                </button>
                            </div>
                        </div>
                    </div>

<div className="flex-1 overflow-y-auto print-section relative">
                    <div className="hidden print:block mb-6">
                        <h2 className="text-2xl font-black text-slate-900 uppercase">Trial Balance</h2>
                        <p className="text-slate-600 font-medium">Generated on: {new Date().toLocaleString('en-GB')}</p>
                        <p className="text-slate-600 text-sm mt-1">Filters - From: {filters.startDate} | To: {filters.endDate}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-full relative">
                        <div className="overflow-x-auto flex-1 bg-white">
                            <table className="w-full text-left min-w-[800px]">
                                <thead className="bg-[#0f172a] text-[#f97316] sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider border-b border-r border-slate-700" rowSpan="2">Account Name</th>
                                        <th className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-center border-b border-r border-slate-700" colSpan="2">Opening Balance</th>
                                        <th className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-center border-b border-r border-slate-700" colSpan="2">Transactions</th>
                                        <th className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-center border-b border-slate-700" colSpan="2">Closing Balance</th>
                                    </tr>
                                    <tr className="bg-[#1e293b] text-[#f97316]">
                                        <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-right border-b border-r border-slate-700 w-32">Dr.</th>
                                        <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-right border-b border-r border-slate-700 w-32">Cr.</th>
                                        <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-right border-b border-r border-slate-700 w-32">Dr.</th>
                                        <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-right border-b border-r border-slate-700 w-32">Cr.</th>
                                        <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-right border-b border-r border-slate-700 w-32">Dr.</th>
                                        <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-right border-b border-slate-700 w-32">Cr.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-slate-500 font-medium">No transactions found for the selected period.</td>
                                        </tr>
                                    )}
                                    {data.map((group, i) => (
                                        <React.Fragment key={i}>
                                            <tr className="bg-slate-50 hover:bg-slate-100 transition-colors">
                                                <td className="px-6 py-3 text-sm font-black text-slate-900 border-r border-slate-200 uppercase">{group.group}</td>
                                                <td className="px-6 py-3 text-sm text-right font-bold text-slate-700 border-r border-slate-200">{fmt(group.opDr)}</td>
                                                <td className="px-6 py-3 text-sm text-right font-bold text-slate-700 border-r border-slate-200">{fmt(group.opCr)}</td>
                                                <td className="px-6 py-3 text-sm text-right font-bold text-slate-700 border-r border-slate-200">{fmt(group.trxDr)}</td>
                                                <td className="px-6 py-3 text-sm text-right font-bold text-slate-700 border-r border-slate-200">{fmt(group.trxCr)}</td>
                                                <td className="px-6 py-3 text-sm text-right font-bold text-slate-700 border-r border-slate-200">{fmt(group.clDr)}</td>
                                                <td className="px-6 py-3 text-sm text-right font-bold text-slate-700">{fmt(group.clCr)}</td>
                                            </tr>
                                            {viewMode === 'DETAIL' && group.ledgers.map((ledger, j) => (
                                                <tr key={`${i}-${j}`} className="hover:bg-orange-50/30 transition-colors bg-white">
                                                    <td className="px-6 py-3 pl-12 text-sm font-semibold text-slate-700 border-r border-slate-200 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                                                        {ledger.name}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-right text-slate-600 border-r border-slate-200">{fmt(ledger.opDr)}</td>
                                                    <td className="px-6 py-3 text-sm text-right text-slate-600 border-r border-slate-200">{fmt(ledger.opCr)}</td>
                                                    <td className="px-6 py-3 text-sm text-right text-slate-600 border-r border-slate-200">{fmt(ledger.trxDr)}</td>
                                                    <td className="px-6 py-3 text-sm text-right text-slate-600 border-r border-slate-200">{fmt(ledger.trxCr)}</td>
                                                    <td className="px-6 py-3 text-sm text-right font-medium text-slate-800 border-r border-slate-200">{fmt(ledger.clDr)}</td>
                                                    <td className="px-6 py-3 text-sm text-right font-medium text-slate-800">{fmt(ledger.clCr)}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                                <tfoot className="bg-[#fff7ed] sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-orange-300">
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
            </div>
            </main>
        </DashboardPageShell>
    );
};

export default TrialBalance;
