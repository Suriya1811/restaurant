import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import {
    Search,
    Download,
    Calendar,
    Loader2,
    FileText,
    Printer,
    Database,
    TrendingUp,
    TrendingDown,
    ChevronLeft,
    ChevronRight,
    ArrowDownCircle,
    ArrowUpCircle,
    Activity,
    Info,
    Filter,
    X,
    Eye,
    Landmark,
    Building2,
    RefreshCw,
    Layers
} from 'lucide-react';
import './Dashboard.css';

const LedgerStatement = () => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [selectedLedger, setSelectedLedger] = useState('');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
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
        if (!selectedLedger) return;
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/reports/accounts/ledger-statement?ledgerId=${selectedLedger}&startDate=${dateRange.start}&endDate=${dateRange.end}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) setStatement(result);
        } catch (err) {
            console.error("Statement error", err);
        } finally {
            setLoading(false);
        }
    }, [selectedLedger, dateRange]);

    useEffect(() => {
        fetchLedgers();
        if (location.state?.ledgerId) setSelectedLedger(location.state.ledgerId);
    }, [location.state]);

    useEffect(() => {
        if (selectedLedger) fetchStatementData();
    }, [selectedLedger, dateRange, fetchStatementData]);

    const fmt = (num) => (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleRowClick = (tx) => {
        setSelectedTransaction(tx);
        setIsDrawerOpen(true);
    };

    const exportToCSV = () => {
        if (!statement || !statement.data) return;
        const headers = ["Date", "Transaction No", "Type", "Inflow", "Outflow", "Balance", "Narration"];
        const rows = [
            [new Date(dateRange.start).toLocaleDateString(), '-', 'OPENING BALANCE', '-', '-', statement.summary.openingBalance, '-'],
            ...statement.data.map(d => [
                new Date(d.date).toLocaleDateString(),
                d.voucher_no,
                d.type,
                d.credit,
                d.debit,
                d.balance,
                d.narration
            ])
        ];
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Statement_${statement.ledger.name}.csv`);
        link.click();
    };

    return (
        <div className="dashboard-layout bg-white">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main overflow-hidden font-sans">
                <Header toggleSidebar={toggleSidebar} />

                <div className="dashboard-content fade-in" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: 'calc(100vh - 65px)', padding: '12px 16px', gap: '10px' }}>
                    
                    {/* ── Page Header (fixed) ── */}
                    <div className="shrink-0 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 pb-2.5" style={{borderBottom:'1px solid #e2e8f0'}}>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center shrink-0">
                                <Database size={13} className="text-indigo-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h2 className="text-xs font-normal text-slate-600">Ledger Statement</h2>
                                    <span className="text-[9px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wide">Audit</span>
                                </div>
                                <p className="text-[10px] text-slate-400">View fiscal history and audit trails for any ledger account</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border border-slate-200 bg-slate-50 p-1 rounded-lg w-full xl:w-auto">
                            <div className="flex items-center gap-1.5 px-2 border-r border-slate-200 pr-3 min-w-[180px]">
                                <Search size={12} className="text-indigo-400 shrink-0" />
                                <select 
                                    className="bg-transparent border-none focus:outline-none text-[11px] font-medium text-slate-700 w-full cursor-pointer"
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
                            <div className="flex items-center gap-1.5 px-2">
                                <Calendar size={12} className="text-slate-400 shrink-0" />
                                <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="bg-transparent border-none outline-none text-[11px] font-medium text-slate-700 w-[100px]"/>
                                <span className="text-slate-300 text-xs">–</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="bg-transparent border-none outline-none text-[11px] font-medium text-slate-700 w-[100px]"/>
                            </div>
                        </div>
                    </div>

                    {statement ? (
                        <>
                        {/* ── Summary Cards (fixed) ── */}
                        <div className="shrink-0 grid grid-cols-3 gap-2.5">
                            {[
                                { label: 'Total Debits', value: statement.summary.totalSales, icon: <TrendingUp size={13}/>, color: 'indigo' },
                                { label: 'Amount Received', value: statement.summary.totalReceived, icon: <ArrowDownCircle size={13}/>, color: 'emerald' },
                                { label: 'Net Receivable', value: statement.summary.currentReceivable, icon: <Activity size={13}/>, color: 'slate' },
                            ].map((c, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-lg flex items-center gap-2.5 p-2.5">
                                    <div className={`w-7 h-7 rounded-md bg-${c.color}-50 flex items-center justify-center text-${c.color}-500 shrink-0`}>
                                        {c.icon}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">{c.label}</p>
                                        <p className={`text-sm font-bold text-${c.color === 'slate' ? 'slate-800' : c.color + '-600'} leading-tight mt-0.5`}>₹{fmt(c.value)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Toolbar (fixed) ── */}
                        <div className="shrink-0 flex items-center justify-between gap-2 pb-1" style={{borderBottom:'1px solid #f1f5f9'}}>
                            <span className="text-[10px] text-slate-500">Viewing: <span className="font-semibold text-slate-700">{statement.ledger.name}</span></span>
                            <div className="flex items-center gap-2">
                                <button onClick={exportToCSV} className="h-7 px-3 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-600 hover:border-slate-400 transition-all flex items-center gap-1.5">
                                    <Download size={11} /> Export CSV
                                </button>
                                <button onClick={() => window.print()} className="h-7 px-3 bg-slate-800 text-white rounded text-[10px] font-medium hover:bg-slate-700 transition-all flex items-center gap-1.5">
                                    <Printer size={11} /> Print
                                </button>
                            </div>
                        </div>

                        {/* ── Table Section (scrollable only) ── */}
                        <div className="flex-1 min-h-0 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-3 py-2 bg-slate-50">Date</th>
                                        <th className="px-3 py-2 text-center bg-slate-50">Ref No.</th>
                                        <th className="px-3 py-2 bg-slate-50">Type</th>
                                        <th className="px-3 py-2 text-right text-emerald-700 bg-emerald-50/30">Inflow (Cr)</th>
                                        <th className="px-3 py-2 text-right text-rose-700 bg-rose-50/30 border-r border-slate-100">Outflow (Dr)</th>
                                        <th className="px-3 py-2 text-right text-slate-700 bg-slate-100/50">Balance</th>
                                        <th className="px-3 py-2 text-center bg-slate-50 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {/* Opening Balance Row */}
                                    <tr className="bg-slate-50/60">
                                        <td className="px-3 py-2 text-[10px] font-medium text-slate-500">{new Date(dateRange.start).toLocaleDateString('en-GB')}</td>
                                        <td className="px-3 py-2 text-center text-slate-300 text-[10px]">—</td>
                                        <td className="px-3 py-2">
                                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Opening Balance</span>
                                        </td>
                                        <td className="px-3 py-2 text-right text-slate-300 font-medium">—</td>
                                        <td className="px-3 py-2 text-right text-slate-300 font-medium border-r border-slate-100">—</td>
                                        <td className="px-3 py-2 text-right font-semibold text-slate-700">₹{fmt(statement.summary.openingBalance)}</td>
                                        <td className="px-3 py-2"></td>
                                    </tr>

                                    {statement.data.map((d, i) => (
                                        <tr key={i} className="hover:bg-slate-50 group transition-colors cursor-pointer" onClick={() => handleRowClick(d)}>
                                            <td className="px-3 py-2 text-slate-600 font-medium whitespace-nowrap">
                                                {new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{d.voucher_no}</span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">{d.type}</span>
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium text-emerald-600">
                                                {d.credit > 0 ? `₹${fmt(d.credit)}` : <span className="text-slate-200">—</span>}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium text-rose-600 border-r border-slate-100">
                                                {d.debit > 0 ? `₹${fmt(d.debit)}` : <span className="text-slate-200">—</span>}
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold text-slate-800">₹{fmt(d.balance)}</td>
                                            <td className="px-3 py-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-5 h-5 rounded bg-slate-100 text-slate-500 flex items-center justify-center mx-auto hover:bg-slate-800 hover:text-white transition-colors">
                                                    <Eye size={9} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Closing Total Row */}
                                    <tr className="bg-slate-800 text-white">
                                        <td className="px-3 py-2.5 text-[10px] font-medium text-slate-400" colSpan={3}>Closing Balance</td>
                                        <td className="px-3 py-2.5 text-right font-semibold text-emerald-400 text-xs">₹{fmt(statement.data.reduce((a,b)=>a+b.credit, 0))}</td>
                                        <td className="px-3 py-2.5 text-right font-semibold text-rose-400 text-xs border-r border-white/10">₹{fmt(statement.data.reduce((a,b)=>a+b.debit, 0))}</td>
                                        <td className="px-3 py-2.5 text-right font-bold text-white text-sm">₹{fmt(statement.summary.currentReceivable)}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        </>
                    ) : (
                        <div className="flex-1 min-h-0 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                                <Database size={22} className="text-slate-300" />
                            </div>
                            <p className="text-xs font-medium text-slate-400 mb-1">No Ledger Selected</p>
                            <p className="text-[10px] text-slate-300 max-w-xs text-center">Select a ledger account from the dropdown above to view its statement</p>
                        </div>
                    )}

                    {loading && (
                        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
                            <Loader2 size={32} className="text-indigo-500 animate-spin mb-2" />
                            <p className="text-slate-600 font-medium text-xs">Loading statement...</p>
                        </div>
                    )}
                </div>

                {/* Audit Drawer - Entry Intelligence Overlay */}
                <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className={`absolute top-0 right-0 w-full max-w-[480px] h-full bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-500 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        {selectedTransaction && (
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
                                    <button className="h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                                        <Printer size={16} /> Print Entry
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>


        </div>
    );
};

export default LedgerStatement;
