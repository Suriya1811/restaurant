import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import {
    Download,
    Loader2,
    Calendar,
    ChevronRight,
    TrendingDown,
    TrendingUp,
    Wallet,
    Landmark,
    Search,
    Info,
    RefreshCw,
    User,
    FileText,
    PieChart,
    ArrowRight,
    Eye,
    X,
    Filter,
    Layers,
    Activity,
    Printer,
    ArrowUpRight,
    ArrowDownLeft,
    ChevronDown,
    MapPin,
    Building2,
    CreditCard
} from 'lucide-react';
import './Dashboard.css';

const CashAndBank = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({
        openingCash: 0,
        openingBank: 0,
        totalOpening: 0,
        closingBalance: 0,
        snapshots: []
    });

    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const fetchAudit = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const q = new URLSearchParams(filters).toString();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/accounts/cash-bank?${q}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (result.success) {
                setData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch cash-bank audit", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAudit();
    }, [fetchAudit]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fmt = (num) => (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const exportToCSV = () => {
        if (data.length === 0) return;
        const headers = ["Date", "Transaction No", "Name", "Received", "Paid", "Cash Movement", "Bank Movement", "Balance", "Narration"];
        const rows = [
            [new Date(filters.startDate).toLocaleDateString(), '-', 'OPENING BALANCE', '-', '-', summary.openingCash, summary.openingBank, summary.totalOpening, '-'],
            ...data.map(d => [
                new Date(d.date).toLocaleDateString(),
                d.voucher_no,
                d.party || d.type,
                d.received,
                d.paid,
                d.cash_impact,
                d.bank_impact,
                d.balance,
                d.narration
            ])
        ];
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `CashBank_${filters.startDate}.csv`);
        link.click();
    };

    const handleRowClick = (tx) => {
        setSelectedTransaction(tx);
        setIsDrawerOpen(true);
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
                    <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2.5" style={{borderBottom:'1px solid #e2e8f0'}}>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                <Building2 size={14} className="text-indigo-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h2 className="text-xs font-normal text-slate-600 tracking-tight">Cash &amp; Bank</h2>
                                    <span className="text-[9px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wide">Controller</span>
                                </div>
                                <p className="text-[10px] text-slate-400">Audit trail of cash and bank movements</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-1 rounded-lg shadow-sm">
                            <div className="flex items-center px-2 gap-1.5 border-r border-slate-200 pr-2">
                                <Calendar size={12} className="text-slate-400" />
                                <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({...p, startDate: e.target.value}))} className="bg-transparent border-none outline-none text-[11px] font-semibold text-slate-700 w-[100px]"/>
                                <span className="text-slate-300">–</span>
                                <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({...p, endDate: e.target.value}))} className="bg-transparent border-none outline-none text-[11px] font-semibold text-slate-700 w-[100px]"/>
                            </div>
                            <button className="h-7 px-3 bg-white text-slate-600 border border-slate-200 rounded-md font-semibold text-[10px] hover:border-slate-400 hover:text-slate-900 transition-all flex items-center gap-1.5" onClick={fetchAudit}>
                                <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Refresh
                            </button>
                        </div>
                    </div>

                    {/* ── Summary Cards (fixed) ── */}
                    <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                                <Wallet size={15} />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cash in Hand</p>
                                <h4 className="text-base font-extrabold text-slate-800 leading-none mt-1">₹{fmt(summary.snapshots.find(s => s.name.toLowerCase().includes('cash'))?.balance || summary.openingCash)}</h4>
                            </div>
                        </div>

                        {summary.snapshots.filter(s => s.name.toLowerCase().includes('bank')).map((bank, i) => (
                            <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                    <Landmark size={15} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[100px]">{bank.name}</p>
                                    <h4 className="text-base font-extrabold text-slate-800 leading-none mt-1">₹{fmt(bank.balance)}</h4>
                                </div>
                            </div>
                        ))}

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1 xl:border-l xl:pl-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-white shrink-0">
                                <Activity size={15} />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Balance</p>
                                <h4 className="text-base font-extrabold text-slate-800 leading-none mt-1">₹{fmt(summary.closingBalance)}</h4>
                            </div>
                        </div>
                    </div>

                    {/* ── Toolbar (fixed) ── */}
                    <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 pb-1" style={{borderBottom:'1px solid #f1f5f9'}}>
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                            <input 
                                type="text" 
                                placeholder="Search transactions..." 
                                className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 pl-8 pr-3 text-[11px] font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-indigo-400 outline-none transition-all" 
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button onClick={exportToCSV} className="h-7 px-3 bg-white border border-slate-200 rounded-md text-[10px] font-semibold text-slate-600 hover:border-slate-400 transition-all flex items-center gap-1.5">
                                <Download size={12} /> Export
                            </button>
                            <button onClick={() => window.print()} className="h-7 px-3 bg-slate-800 text-white rounded-md text-[10px] font-semibold hover:bg-slate-700 transition-all flex items-center gap-1.5">
                                <Printer size={12} /> Print
                            </button>
                        </div>
                    </div>

                    {/* ── Table Section (scrollable only) ── */}
                    <div className="flex-1 min-h-0 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="p-2 bg-slate-50 whitespace-nowrap">Date</th>
                                    <th className="p-2 text-center bg-slate-50">Ref</th>
                                    <th className="p-2 bg-slate-50">Entity / Description</th>
                                    <th className="p-2 text-right bg-emerald-50/20 text-emerald-700">Inflow</th>
                                    <th className="p-2 text-right bg-rose-50/20 text-rose-700 border-r border-slate-100">Outflow</th>
                                    <th className="p-2 text-right bg-slate-50">Cash Link</th>
                                    <th className="p-2 text-right bg-slate-50">Bank Link</th>
                                    <th className="p-2 text-right bg-slate-100/30 text-slate-700">Current Position</th>
                                    <th className="p-2 text-center bg-slate-50">Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {/* Opening Row */}
                                <tr className="bg-slate-50/30 group">
                                    <td className="p-2 text-[10px] font-semibold text-slate-500 tracking-wider">
                                        {new Date(filters.startDate).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="p-2 text-center opacity-30 text-[10px] font-bold">---</td>
                                    <td className="p-2">
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Opening Audit Position</span>
                                    </td>
                                    <td className="p-2 text-right opacity-30 font-semibold">—</td>
                                    <td className="p-2 text-right opacity-30 font-semibold border-r border-slate-50">—</td>
                                    <td className="p-2 text-right font-bold text-slate-400 text-xs">₹{fmt(summary.openingCash)}</td>
                                    <td className="p-2 text-right font-bold text-slate-400 text-xs">₹{fmt(summary.openingBank)}</td>
                                    <td className="p-2 text-right font-bold text-slate-800">₹{fmt(summary.totalOpening)}</td>
                                    <td className="p-2 text-center text-slate-300"><Info size={12} className="mx-auto" /></td>
                                </tr>

                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-slate-400">
                                            <Loader2 size={24} className="animate-spin mb-2 mx-auto text-indigo-500" />
                                            <p className="text-[9px] font-bold uppercase tracking-wider">Querying Audit Archive...</p>
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                            No liquidity movement found
                                        </td>
                                    </tr>
                                ) : data.map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-50/40 group transition-all cursor-pointer border-b border-slate-100" onClick={() => handleRowClick(d)}>
                                        <td className="p-2">
                                            <span className="font-semibold text-slate-700">{new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        </td>
                                        <td className="p-2 text-center">
                                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">#{d.voucher_no}</span>
                                        </td>
                                        <td className="p-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors"></div>
                                                <span className="font-semibold text-slate-800 truncate max-w-[150px] uppercase">{d.party || d.type}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-right font-semibold text-emerald-600 bg-emerald-50/5">
                                            {d.received > 0 ? `₹${fmt(d.received)}` : <span className="opacity-20">—</span>}
                                        </td>
                                        <td className="p-2 text-right font-semibold text-rose-600 bg-rose-50/5 border-r border-slate-50">
                                            {d.paid > 0 ? `₹${fmt(d.paid)}` : <span className="opacity-20">—</span>}
                                        </td>
                                        <td className="p-2 text-right font-semibold text-slate-500 text-xs">
                                            {d.cash_impact !== 0 ? (d.cash_impact > 0 ? `+${fmt(d.cash_impact)}` : fmt(d.cash_impact)) : '—'}
                                        </td>
                                        <td className="p-2 text-right font-semibold text-slate-500 text-xs">
                                            {d.bank_impact !== 0 ? (d.bank_impact > 0 ? `+${fmt(d.bank_impact)}` : fmt(d.bank_impact)) : '—'}
                                        </td>
                                        <td className="p-2 text-right font-bold text-slate-800 bg-slate-50/10">
                                            ₹{fmt(d.balance)}
                                        </td>
                                        <td className="p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center mx-auto">
                                                <Eye size={10} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {/* Final Net Row */}
                                <tr className="bg-slate-950 text-white font-semibold">
                                    <td className="p-3" colSpan={3}>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Closing Liquidity Snapshot</span>
                                    </td>
                                    <td className="p-3 text-right font-bold text-emerald-400">₹{fmt(data.reduce((a,b)=>a+b.received, 0))}</td>
                                    <td className="p-3 text-right font-bold text-rose-400 border-r border-white/10">₹{fmt(data.reduce((a,b)=>a+b.paid, 0))}</td>
                                    <td colSpan={2}></td>
                                    <td className="p-3 text-right font-extrabold text-white text-sm">₹{fmt(summary.closingBalance)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Audit Drawer - Clean Minimalist Style */}
                <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className={`absolute top-0 right-0 w-full max-w-[480px] h-full bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-500 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        {selectedTransaction && (
                            <div className="flex flex-col h-full bg-white">
                                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-black">Audit Detail</p>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter">#{selectedTransaction.voucher_no}</h3>
                                    </div>
                                    <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entity</span>
                                            <span className="text-sm font-black text-slate-900 uppercase">{selectedTransaction.party || 'System'}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timeline</span>
                                            <span className="text-sm font-bold text-slate-900">{new Date(selectedTransaction.date).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Class</span>
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest">{selectedTransaction.type}</span>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50 rounded-3xl space-y-6">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement Breakdown</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <Wallet size={14} className="text-emerald-500" />
                                                    <span className="text-xs font-bold text-slate-600">Cash Flow</span>
                                                </div>
                                                <span className={`text-sm font-black ${selectedTransaction.cash_impact >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {selectedTransaction.cash_impact !== 0 ? `₹${fmt(selectedTransaction.cash_impact)}` : '—'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <Landmark size={14} className="text-indigo-500" />
                                                    <span className="text-xs font-bold text-slate-600">Bank Flow</span>
                                                </div>
                                                <span className={`text-sm font-black ${selectedTransaction.bank_impact >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                                    {selectedTransaction.bank_impact !== 0 ? `₹${fmt(selectedTransaction.bank_impact)}` : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Narration / Memo</p>
                                        <div className="p-8 bg-slate-50 rounded-3xl italic text-slate-600 text-sm font-medium border-l-4 border-slate-200">
                                            "{selectedTransaction.narration || 'No memorandums recorded for this entry.'}"
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 border-t border-slate-50 grid grid-cols-2 gap-4">
                                    <button className="h-14 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 transition-all flex items-center justify-center gap-2">
                                        <Download size={16} /> Receipt
                                    </button>
                                    <button className="h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                        <Printer size={16} /> Print Audit
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

export default CashAndBank;
