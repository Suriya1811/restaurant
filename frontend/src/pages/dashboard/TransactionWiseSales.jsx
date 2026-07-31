import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import ReportNavigationDropdown from '@/components/dashboard/ReportNavigationDropdown';
import {
    Search,
    CreditCard,
    Wallet,
    Smartphone,
    User,
    MapPin,
    Calendar,
    ChevronRight,
    Download,
    FileText,
    TrendingUp,
    Filter,
    Loader2,
    RefreshCw,
    XCircle,
    Info,
    ArrowUpRight,
    SearchCode,
    Receipt,
    Database,
    ChevronDown,
    Activity,
    Landmark,
    X,
    Eye,
    Printer,
    Target
} from 'lucide-react';
import './Dashboard.css';

const TransactionWiseSales = ({ isEmbedded = false }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({
        totalBills: 0,
        cash: 0,
        card: 0,
        upi: 0,
        credit: 0
    });

    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        search: '',
        payMode: '',
        partyId: '',
        area: ''
    });

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const q = new URLSearchParams(filters).toString();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/sales/transaction-summary?${q}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success) {
                setData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch transaction summary", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReport();
    }, [filters.startDate, filters.endDate, filters.payMode, filters.area, fetchReport]);

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
        const headers = ["Date", "Transaction No", "Party Name", "Area", "Cash", "Card", "UPI", "Credit Amt", "Total"];
        const rows = data.map(d => [
            new Date(d.date).toLocaleDateString(),
            d.transaction_no,
            d.party_name,
            d.area,
            d.cash,
            d.card,
            d.upi,
            d.credit_amt,
            d.total
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Transaction_Audit_${filters.startDate}.csv`);
        link.click();
    };

    const uniqueAreas = [...new Set(data.map(d => d.area))].filter(Boolean);

    const content = (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Top Toolbar */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">Transaction-Wise Sales</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <input 
                            type="date" 
                            value={filters.startDate} 
                            onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} 
                            className="bg-white border-2 border-slate-300 rounded-sm py-1.5 px-2 text-sm text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors" 
                        />
                        <span className="text-slate-400 font-bold">-</span>
                        <input 
                            type="date" 
                            value={filters.endDate} 
                            onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} 
                            className="bg-white border-2 border-slate-300 rounded-sm py-1.5 px-2 text-sm text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors" 
                        />
                    </div>
                    <button 
                        className="px-4 py-1.5 bg-slate-800 text-white rounded-sm font-semibold text-xs hover:bg-slate-900 transition-colors flex items-center gap-2" 
                        onClick={fetchReport}
                        disabled={loading}
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : "Refresh"}
                    </button>
                    <button 
                        className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-sm font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-2" 
                        onClick={exportToCSV}
                    >
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex gap-4 overflow-x-auto custom-scrollbar min-w-[720px]">
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Total Bill Registry</div>
                        <div className="text-xl font-bold text-slate-800">{summary.totalBills}</div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Cash Liquidity</div>
                        <div className="text-xl font-bold text-emerald-600">₹{fmt(summary.cash)}</div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Card Settlement</div>
                        <div className="text-xl font-bold text-indigo-600">₹{fmt(summary.card)}</div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Digital / UPI Yield</div>
                        <div className="text-xl font-bold text-amber-600">₹{fmt(summary.upi)}</div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Credit Exposure</div>
                        <div className="text-xl font-bold text-rose-600">₹{fmt(summary.credit)}</div>
                    </div>
                </div>
            </div>

            {/* Filter Navigation Tool Hub */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
                <div className="flex-1 min-w-[200px] max-w-sm">
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Scan Manifest (Bill No, Customer Name, Identity)..."
                            className="w-full bg-white border-2 border-slate-300 rounded-sm py-1.5 pl-9 pr-4 text-sm font-medium text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors placeholder:normal-case"
                            value={filters.search}
                            onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <select
                            className="bg-white border-2 border-slate-300 rounded-sm py-1.5 px-2 text-sm text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors"
                            value={filters.payMode}
                            onChange={(e) => setFilters(p => ({ ...p, payMode: e.target.value }))}
                        >
                            <option value="">All Paymodes</option>
                            <option value="CASH">Cash Only</option>
                            <option value="CARD">Card Only</option>
                            <option value="UPI">UPI Only</option>
                            <option value="CREDIT">Credit Only</option>
                        </select>
                        <select
                            className="bg-white border-2 border-slate-300 rounded-sm py-1.5 px-2 text-sm text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors"
                            value={filters.area}
                            onChange={(e) => setFilters(p => ({ ...p, area: e.target.value }))}
                        >
                            <option value="">All Areas</option>
                            {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Comprehensive Settlement Registry Grid */}
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                    <thead className="bg-[#F8FAFC] text-[10px] font-black text-[#64748B] uppercase tracking-widest border-b border-slate-200 shadow-sm sticky top-0 z-20">
                        <tr>
                            <th className="py-3 px-4">Temporal ID</th>
                            <th className="py-3 px-4">Ref Manifest</th>
                            <th className="py-3 px-4">Client / Entity Identity</th>
                            <th className="py-3 px-4">Sector / Area</th>
                            <th className="py-3 px-4 text-right bg-emerald-50/50">Cash Port</th>
                            <th className="py-3 px-4 text-right bg-indigo-50/50">Card Port</th>
                            <th className="py-3 px-4 text-right bg-amber-50/50">Digital Port</th>
                            <th className="py-3 px-4 text-right bg-rose-50/50">Credit Exposure</th>
                            <th className="py-3 px-4 text-right">Net Recognized</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={9} className="p-20 text-center">
                                    <Loader2 size={32} className="animate-spin mb-4 mx-auto text-indigo-500" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reconciling Transaction Archives...</p>
                                </td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={9} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No settlement variance detected</td></tr>
                            ) : data.map((d, i) => (
                                <tr key={d._id} className="hover:bg-slate-50 text-sm text-slate-700 cursor-pointer">
                                    <td className="py-3 px-4">
                                        <div className="font-medium">{new Date(d.date).toLocaleDateString('en-GB')}</div>
                                        <div className="text-xs text-slate-400">{new Date(d.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="font-medium">{d.transaction_no}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="font-medium">{d.party_name}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-xs text-slate-500 uppercase tracking-wider">{d.area || 'Direct'}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right font-medium text-emerald-600 bg-emerald-50/20">₹{fmt(d.cash)}</td>
                                    <td className="py-3 px-4 text-right font-medium text-indigo-600 bg-indigo-50/20">₹{fmt(d.card)}</td>
                                    <td className="py-3 px-4 text-right font-medium text-amber-600 bg-amber-50/20">₹{fmt(d.upi)}</td>
                                    <td className="py-3 px-4 text-right font-medium text-rose-600 bg-rose-50/20 border-r border-slate-50">₹{fmt(d.credit_amt)}</td>
                                    <td className="py-3 px-4 text-right font-semibold text-slate-900 text-sm">₹{fmt(d.total)}</td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (isEmbedded) {
        return content;
    }

    return (
        <DashboardPageShell className="bg-white">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main flex-1 overflow-hidden font-sans flex flex-col bg-slate-50">
                <Header toggleSidebar={toggleSidebar} title="Transaction-Wise Sales Summary" />
                <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden m-2 lg:m-4 rounded-xl border border-slate-200">
                    {content}
                </div>
            </main>
        </DashboardPageShell>
    );
};

export default TransactionWiseSales;

