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
    Building2,
    CreditCard,
    ArrowDownLeft,
    ArrowUpRight
} from 'lucide-react';
import './Dashboard.css';

const Daybook = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({
        totalTransactions: 0,
        paymentIn: 0,
        paymentOut: 0,
        totalCash: 0,
        totalCredit: 0
    });

    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        search: ''
    });

    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const fetchDaybook = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const q = new URLSearchParams(filters).toString();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/accounts/daybook?${q}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (result.success) {
                setData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch daybook", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchDaybook();
    }, [fetchDaybook]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fmt = (num) => (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleRowClick = (entry) => {
        setSelectedEntry(entry);
        setIsDrawerOpen(true);
    };

    const exportToCSV = () => {
        if (data.length === 0) return;
        const headers = ["Date", "Trans No", "Type", "Party", "Inflow", "Outflow", "Credit", "Narration"];
        const rows = data.map(d => [
            new Date(d.date).toLocaleDateString(),
            d.voucher_no,
            d.type,
            d.party,
            d.payment_in,
            d.payment_out,
            d.credit_amt,
            d.narration
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Daybook_${filters.startDate}.csv`);
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
                    <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2.5" style={{borderBottom:'1px solid #e2e8f0'}}>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                <FileText size={14} className="text-indigo-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h2 className="text-xs font-normal text-slate-600 tracking-tight">Daybook</h2>
                                    <span className="text-[9px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wide">Journal</span>
                                </div>
                                <p className="text-[10px] text-slate-400">Chronological log of daily financial movements</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-1 rounded-lg shadow-sm">
                            <div className="flex items-center px-2 gap-1.5 border-r border-slate-200 pr-2">
                                <Calendar size={12} className="text-slate-400" />
                                <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({...p, startDate: e.target.value}))} className="bg-transparent border-none outline-none text-[11px] font-semibold text-slate-700 w-[100px]"/>
                                <span className="text-slate-300 text-xs">–</span>
                                <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({...p, endDate: e.target.value}))} className="bg-transparent border-none outline-none text-[11px] font-semibold text-slate-700 w-[100px]"/>
                            </div>
                            <button className="h-7 px-3 bg-white text-slate-600 border border-slate-200 rounded-md font-semibold text-[10px] hover:border-slate-400 hover:text-slate-900 transition-all flex items-center gap-1.5" onClick={fetchDaybook}>
                                <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Refresh
                            </button>
                        </div>
                    </div>

                    {/* ── Summary Cards (fixed) ── */}
                    <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                        {[
                            { label: 'Transactions', value: summary.totalTransactions, icon: <Activity size={13} />, color: 'indigo', isCount: true },
                            { label: 'Payment In', value: summary.paymentIn, icon: <ArrowDownLeft size={13} />, color: 'emerald' },
                            { label: 'Payment Out', value: summary.paymentOut, icon: <ArrowUpRight size={13} />, color: 'rose' },
                            { label: 'Cash', value: summary.totalCash, icon: <Wallet size={13} />, color: 'blue' },
                            { label: 'Credit', value: summary.totalCredit, icon: <Building2 size={13} />, color: 'amber', span: true },
                        ].map((card, i) => (
                            <div key={i} className={`bg-white rounded-lg border border-slate-200 flex items-center gap-2.5 p-2.5 ${card.span ? 'col-span-2 sm:col-span-1' : ''}`}>
                                <div className={`w-7 h-7 rounded-md bg-${card.color}-50 flex items-center justify-center text-${card.color}-500 shrink-0`}>
                                    {card.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide truncate">{card.label}</p>
                                    <p className={`text-sm font-bold text-${card.color === 'indigo' ? 'slate' : card.color}-${card.color === 'indigo' ? '800' : '600'} leading-tight mt-0.5`}>
                                        {card.isCount ? card.value : `₹${fmt(card.value)}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Toolbar (fixed) ── */}
                    <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 pb-1" style={{borderBottom:'1px solid #f1f5f9'}}>
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                            <input 
                                type="text" 
                                placeholder="Search by voucher or entity..." 
                                className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 pl-8 pr-3 text-[11px] font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-indigo-400 outline-none transition-all" 
                                value={filters.search}
                                onChange={e => setFilters(p => ({...p, search: e.target.value}))}
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
                                    <th className="p-2 bg-slate-50">Date</th>
                                    <th className="p-2 text-center bg-slate-50">Ref Manifest</th>
                                    <th className="p-2 bg-slate-50">Voucher Type</th>
                                    <th className="p-2 bg-slate-50">Entity / Ledger Hub</th>
                                    <th className="p-2 text-right bg-emerald-50/20 text-emerald-700">Payment In</th>
                                    <th className="p-2 text-right bg-rose-50/20 text-rose-700 border-r border-slate-100">Payment Out</th>
                                    <th className="p-2 text-right font-bold text-amber-700 bg-amber-50/20 border-l border-amber-100">Credit Volume</th>
                                    <th className="p-2 text-center bg-slate-50">Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-slate-400">
                                            <Loader2 size={24} className="animate-spin mb-2 mx-auto text-indigo-500" />
                                            <p className="text-[9px] font-bold uppercase tracking-wider">Reconstructing Daily Movements...</p>
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                            Registry is empty for this temporal window
                                        </td>
                                    </tr>
                                ) : data.map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-50/40 group transition-all cursor-pointer" onClick={() => handleRowClick(d)}>
                                        <td className="p-2">
                                            <span className="font-semibold text-slate-700">{new Date(d.date).toLocaleDateString('en-GB')}</span>
                                        </td>
                                        <td className="p-2 text-center">
                                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full tracking-tighter uppercase">{d.voucher_no}</span>
                                        </td>
                                        <td className="p-2">
                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                                d.type === 'SALES' ? 'text-indigo-600' :
                                                d.type === 'PURCHASE' ? 'text-amber-600' :
                                                d.type === 'RECEIPT' ? 'text-emerald-600' :
                                                d.type === 'PAYMENT' ? 'text-rose-600' : 'text-slate-500'
                                            }`}>
                                                {d.type}
                                            </span>
                                        </td>
                                        <td className="p-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <User size={11} />
                                                </div>
                                                <span className="font-semibold text-slate-800 truncate max-w-[200px] uppercase">{d.party}</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-right font-semibold text-emerald-600 bg-emerald-50/5">
                                            {d.payment_in > 0 ? `₹${fmt(d.payment_in)}` : <span className="opacity-20">—</span>}
                                        </td>
                                        <td className="p-2 text-right font-semibold text-rose-600 bg-rose-50/5 border-r border-slate-50">
                                            {d.payment_out > 0 ? `₹${fmt(d.payment_out)}` : <span className="opacity-20">—</span>}
                                        </td>
                                        <td className="p-2 text-right font-semibold text-amber-600 bg-amber-50/5">
                                            {d.credit_amt > 0 ? `₹${fmt(d.credit_amt)}` : <span className="opacity-20">—</span>}
                                        </td>
                                        <td className="p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center mx-auto">
                                                <Eye size={10} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Audit Drawer - Journal Detail Overlay */}
                <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className={`absolute top-0 right-0 w-full max-w-[420px] h-full bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-500 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        {selectedEntry && (
                            <div className="flex flex-col h-full bg-white">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-black">Journal Detail</p>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">VCH-{selectedEntry.voucher_no}</h3>
                                    </div>
                                    <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry Hub</span>
                                            <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest">{selectedEntry.type}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal Point</span>
                                            <span className="text-sm font-bold text-slate-900">{new Date(selectedEntry.date).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Counterparty</span>
                                            <span className="text-sm font-black text-slate-900 uppercase">{selectedEntry.party}</span>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-slate-50 rounded-2xl space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Valuation</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payment In</span>
                                                <span className="text-xl font-black text-emerald-600">₹{selectedEntry.payment_in > 0 ? fmt(selectedEntry.payment_in) : '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payment Out</span>
                                                <span className="text-xl font-black text-rose-600">₹{selectedEntry.payment_out > 0 ? fmt(selectedEntry.payment_out) : '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Credit Volume</span>
                                                <span className="text-xl font-black text-amber-600">₹{selectedEntry.credit_amt > 0 ? fmt(selectedEntry.credit_amt) : '0.00'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Info size={14} className="text-slate-300" /> Memoranda / Narrative
                                        </p>
                                        <div className="p-6 bg-slate-50 rounded-2xl italic text-slate-600 text-sm font-medium border-l-4 border-slate-200 leading-relaxed shadow-inner">
                                            "{selectedEntry.narration || 'No narrative description documented for this record.'}"
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 border-t border-slate-50 bg-slate-50 grid grid-cols-2 gap-3">
                                    <button className="h-12 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm">
                                        <Download size={16} /> Save Record
                                    </button>
                                    <button className="h-12 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                                        <Printer size={16} /> Print Voucher
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

export default Daybook;
