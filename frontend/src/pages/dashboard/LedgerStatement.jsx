import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import { Download, Printer, Eye, FileText, Info, Loader2, X, Search } from 'lucide-react';
import { printReport } from '@/components/common/ReportToolbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LedgerStatement = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [selectedLedger, setSelectedLedger] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [statement, setStatement] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fetchLedgers = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/ledgers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setLedgers(data.data);
        } catch (err) { console.error(err); }
    };

    const fetchStatementData = useCallback(async () => {
        if (!selectedLedger) {
            setStatement(null);
            return;
        }
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/reports/accounts/ledger-statement?ledgerId=${selectedLedger}&startDate=${filters.startDate}&endDate=${filters.endDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) setStatement(result);
        } catch (err) {
            console.error("Statement error", err);
        } finally {
            setLoading(false);
        }
    }, [selectedLedger, filters]);

    useEffect(() => {
        fetchLedgers();
        if (location.state?.ledgerId) setSelectedLedger(location.state.ledgerId);
    }, [location.state]);

    useEffect(() => {
        if (selectedLedger) fetchStatementData();
    }, [selectedLedger, filters, fetchStatementData]);

    const fmt = (num) => (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleRowClick = (tx) => {
        setSelectedTransaction(tx);
        setIsDrawerOpen(true);
    };

    // Calculate totals for the summary cards based on the fetched data
    let totalDebit = 0;
    let totalCredit = 0;
    let openingBal = 0;
    let closingBal = 0;
    let opType = 'Dr';
    let clType = 'Cr';
    
    if (statement && statement.data) {
        totalDebit = statement.data.reduce((a, b) => a + (b.debit || 0), 0);
        totalCredit = statement.data.reduce((a, b) => a + (b.credit || 0), 0);
        openingBal = Math.abs(statement.summary.openingBalance || 0);
        opType = (statement.summary.openingBalance || 0) >= 0 ? 'Dr' : 'Cr'; // Assuming positive is debit for standard ledger, or adjust based on your specific logic
        closingBal = Math.abs(statement.summary.currentReceivable || 0);
        clType = (statement.summary.currentReceivable || 0) >= 0 ? 'Dr' : 'Cr';
    }

    const exportToCSV = () => {
        if (!selectedLedger || !statement) return alert('Please select a ledger first');
        const headers = ["Date", "Voucher No", "Particulars", "Vch Type", "Debit", "Credit", "Balance"];
        const rows = [
            [new Date(filters.startDate).toLocaleDateString(), '-', 'Opening Balance', 'Opening', '-', '-', `${openingBal} ${opType}`],
            ...statement.data.map(d => [
                new Date(d.date).toLocaleDateString(),
                d.voucher_no,
                d.narration || '-',
                d.type,
                d.debit || '-',
                d.credit || '-',
                d.balance
            ])
        ];
        rows.push(["Total", "", "", "", totalDebit, totalCredit, ""]);
        
        const csvContent = "data:text/csv;charset=utf-8," + 
            "Ledger Statement\n" + 
            `Ledger: ${statement.ledger.name} | From: ${filters.startDate} | To: ${filters.endDate}\n\n` +
            [headers, ...rows].map(e => e.join(",")).join("\n");
            
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `LedgerStatement_${statement.ledger.name}.csv`);
        link.click();
    };

    const exportToPDF = () => {
        if (!selectedLedger || !statement) return alert('Please select a ledger first');
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.text('Ledger Statement', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Ledger: ${statement.ledger.name}`, 14, 30);
        doc.setFontSize(10);
        doc.text(`Filters - From: ${filters.startDate} | To: ${filters.endDate}`, 14, 36);
        
        const head = [['Date', 'Voucher No', 'Particulars', 'Vch Type', 'Debit', 'Credit', 'Balance']];
        
        const body = [
            [new Date(filters.startDate).toLocaleDateString(), '-', 'Opening Balance', 'Opening', '-', '-', `${fmt(openingBal)} ${opType}`],
            ...statement.data.map(d => [
                new Date(d.date).toLocaleDateString(),
                d.voucher_no,
                d.narration || '-',
                d.type,
                d.debit ? fmt(d.debit) : '-',
                d.credit ? fmt(d.credit) : '-',
                `${fmt(d.balance)}`
            ])
        ];

        body.push([
            { content: 'Total', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right' } }, 
            { content: fmt(totalDebit), styles: { fontStyle: 'bold' } }, 
            { content: fmt(totalCredit), styles: { fontStyle: 'bold' } }, 
            ""
        ]);

        autoTable(doc, {
            startY: 40,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], halign: 'center' },
            styles: { fontSize: 9 },
            columnStyles: {
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' }
            }
        });

        doc.save(`LedgerStatement_${statement.ledger.name}.pdf`);
    };

    const handlePrint = () => {
        if (!statement || !statement.data) return alert('Please select a ledger first');
        const headers = ['Date', 'Voucher No', 'Particulars', 'Vch Type', 'Debit (Rs)', 'Credit (Rs)', 'Balance (Rs)'];
        const rows = [
            [new Date(filters.startDate).toLocaleDateString('en-GB'), 'OP-001', 'Opening Balance', 'Opening', '-', '-', `${fmt(openingBal)} ${opType}`],
            ...statement.data.map(d => [
                new Date(d.date).toLocaleDateString('en-GB'),
                d.voucher_no,
                d.narration || '-',
                d.type,
                d.debit ? fmt(d.debit) : '-',
                d.credit ? fmt(d.credit) : '-',
                fmt(d.balance)
            ])
        ];
        printReport(
            `Ledger Statement - ${statement.ledger.name}`,
            `Ledger: ${statement.ledger.name} | From: ${filters.startDate} | To: ${filters.endDate}`,
            headers,
            rows,
            { label: 'Total', cells: [fmt(totalDebit), fmt(totalCredit), ''] }
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
                    title="Ledger Statement"
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

<div className="flex-1 overflow-y-auto print-section relative">
                    <div className="hidden print:block mb-6">
                        <h2 className="text-2xl font-black text-slate-900 uppercase">Ledger Statement</h2>
                        <p className="text-slate-600 font-medium">Ledger: {statement?.ledger?.name || 'N/A'}</p>
                        <p className="text-slate-600 text-sm mt-1">Filters - From: {filters.startDate} | To: {filters.endDate}</p>
                    </div>

                    <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4 mb-6">
                        {/* Ledger Selection */}
                        <div className="w-full xl:w-64 bg-white p-3 rounded-lg border border-slate-200 shadow-sm shrink-0">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Ledger Name</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400"
                                value={selectedLedger}
                                onChange={(e) => setSelectedLedger(e.target.value)}
                            >
                                <option value="">Select Ledger...</option>
                                {(() => {
                                    const grouped = ledgers.reduce((acc, l) => {
                                        const cat = l.group || 'OTHER';
                                        if(!acc[cat]) acc[cat] = [];
                                        acc[cat].push(l);
                                        return acc;
                                    }, {});
                                    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, list]) => (
                                        <optgroup key={cat} label={`── ${cat.toUpperCase()} ──`}>
                                            {list.sort((a,b) => (a.name || '').localeCompare(b.name || '')).map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                        </optgroup>
                                    ));
                                })()}
                            </select>
                        </div>

                        {/* Summary Cards */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex flex-col justify-center items-center">
                                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Opening Balance (Dr.)</span>
                                <span className="text-lg font-black text-orange-600">₹ {fmt(openingBal)} {opType}</span>
                            </div>
                            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex flex-col justify-center items-center">
                                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Total Debit</span>
                                <span className="text-lg font-black text-orange-600">₹ {fmt(totalDebit)}</span>
                            </div>
                            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex flex-col justify-center items-center">
                                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Total Credit</span>
                                <span className="text-lg font-black text-orange-600">₹ {fmt(totalCredit)}</span>
                            </div>
                            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex flex-col justify-center items-center">
                                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Closing Balance (Cr.)</span>
                                <span className="text-lg font-black text-orange-600">₹ {fmt(closingBal)} {clType}</span>
                            </div>
                        </div>
                    </div>

                    {statement ? (
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col relative min-h-[300px]">
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left min-w-[900px]">
                                    <thead className="bg-[#0f172a] text-white sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider !text-orange-500 border-r border-slate-700">Date</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider !text-orange-500 border-r border-slate-700 text-center">Voucher No.</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider !text-orange-500 border-r border-slate-700">Particulars</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider !text-orange-500 border-r border-slate-700 text-center">Vch Type</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider !text-orange-500 border-r border-slate-700 text-right">Debit (₹)</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider !text-orange-500 border-r border-slate-700 text-right">Credit (₹)</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider !text-orange-500 text-right border-r border-slate-700">Balance (₹)</th>
                                            <th className="px-2 py-3 w-10 border-slate-700 no-print"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        <tr className="bg-slate-50">
                                            <td className="px-4 py-3 text-xs font-semibold text-slate-700">{new Date(filters.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td className="px-4 py-3 text-xs text-center text-slate-400">OP-001</td>
                                            <td className="px-4 py-3 text-xs font-bold text-slate-700">Opening Balance</td>
                                            <td className="px-4 py-3 text-xs text-center text-slate-600">Opening</td>
                                            <td className="px-4 py-3 text-xs text-right text-slate-400">-</td>
                                            <td className="px-4 py-3 text-xs text-right text-slate-400">-</td>
                                            <td className="px-4 py-3 text-xs text-right font-bold text-orange-600">{fmt(openingBal)} {opType}</td>
                                            <td className="px-2 py-3 no-print"></td>
                                        </tr>

                                        {statement.data.map((d, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => handleRowClick(d)}>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-700">{new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                <td className="px-4 py-3 text-xs text-center text-slate-600">{d.voucher_no}</td>
                                                <td className="px-4 py-3 text-xs text-slate-800">{d.narration || '-'}</td>
                                                <td className="px-4 py-3 text-xs text-center text-slate-600">{d.type}</td>
                                                <td className="px-4 py-3 text-xs text-right font-medium text-slate-800">{d.debit > 0 ? fmt(d.debit) : '-'}</td>
                                                <td className="px-4 py-3 text-xs text-right font-medium text-slate-800">{d.credit > 0 ? fmt(d.credit) : '-'}</td>
                                                <td className="px-4 py-3 text-xs text-right font-bold text-orange-600">{fmt(d.balance)}</td>
                                                <td className="px-2 py-3 text-center opacity-0 group-hover:opacity-100 transition-opacity no-print">
                                                    <div className="w-5 h-5 rounded bg-slate-200 text-slate-600 flex items-center justify-center mx-auto hover:bg-slate-800 hover:text-white transition-colors">
                                                        <Eye size={10} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-[#fff7ed] sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t-2 border-orange-100">
                                        <tr className="bg-slate-50 border-t-2 border-slate-200">
                                            <td colSpan="4" className="px-4 py-3 text-sm font-black text-slate-800 text-right uppercase tracking-wider">Total Transactions</td>
                                            <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">₹ {fmt(totalDebit)}</td>
                                            <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">₹ {fmt(totalCredit)}</td>
                                            <td colSpan="2"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-white">
                            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <FileText size={24} className="text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-600 mb-1">No Ledger Selected</p>
                            <p className="text-xs text-slate-400 max-w-xs text-center">Select a ledger account from the dropdown above to view its statement</p>
                        </div>
                    )}
                </div>

                {/* Audit Drawer - Entry Intelligence Overlay */}
                <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className={`absolute top-0 right-0 w-full max-w-[480px] h-full bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-500 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        {selectedTransaction && statement && (
                            <div className="flex flex-col h-full bg-white">
                                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-black">Fiscal Entry Point</p>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter">#{selectedTransaction.voucher_no}</h3>
                                    </div>
                                    <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Origin</span>
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest">{selectedTransaction.type}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal Point</span>
                                            <span className="text-sm font-bold text-slate-900">{new Date(selectedTransaction.date).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry Hub</span>
                                            <span className="text-sm font-black text-slate-900 uppercase">{statement.ledger.name}</span>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-3xl space-y-6">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Valuation</p>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inflow (Credit)</span>
                                                <span className="text-2xl font-black text-emerald-600">₹{selectedTransaction.credit > 0 ? fmt(selectedTransaction.credit) : '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outflow (Debit)</span>
                                                <span className="text-2xl font-black text-rose-600">₹{selectedTransaction.debit > 0 ? fmt(selectedTransaction.debit) : '0.00'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Narrative / Memo</p>
                                        <div className="p-8 bg-slate-100/50 rounded-3xl italic text-slate-600 text-sm font-medium border-l-4 border-slate-300 leading-relaxed shadow-inner">
                                            "{selectedTransaction.narration || 'No memorandums documented for this registry entry.'}"
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 border-t border-slate-50 bg-[#F8FAFC] grid grid-cols-2 gap-4">
                                    <button className="h-14 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm">
                                        <FileText size={16} /> Save Memo
                                    </button>
                                    <button className="btn-export print">
                                        <Printer size={16} /> Print Entry
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </main>
        </DashboardPageShell>
    );
};

export default LedgerStatement;
