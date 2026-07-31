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
    Target,
    LayoutDashboard
} from 'lucide-react';
import './Dashboard.css';

const DayWiseSales = ({ isEmbedded = false }) => {
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
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
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
                // Group by Day
                const grouped = {};
                result.data.forEach(t => {
                    const date = new Date(t.date).toLocaleDateString('en-GB');
                    if (!grouped[date]) {
                        grouped[date] = {
                            date,
                            billCount: 0,
                            cash: 0,
                            card: 0,
                            upi: 0,
                            credit: 0,
                            total: 0
                        };
                    }
                    grouped[date].billCount++;
                    grouped[date].cash += t.cash;
                    grouped[date].card += t.card;
                    grouped[date].upi += t.upi;
                    grouped[date].credit += t.credit_amt;
                    grouped[date].total += t.total;
                });

                setData(Object.values(grouped).sort((a, b) => {
                    const da = a.date.split('/').reverse().join('-');
                    const db = b.date.split('/').reverse().join('-');
                    return new Date(db) - new Date(da);
                }));
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch day-wise summary", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReport();
    }, [filters.startDate, filters.endDate, fetchReport]);

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
        const headers = ["Date", "Bill Count", "Cash", "Card", "UPI", "Credit", "Total"];
        const rows = data.map(d => [d.date, d.billCount, d.cash, d.card, d.upi, d.credit, d.total]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Daywise_Sales_${filters.startDate}.csv`);
        link.click();
    };

    const content = (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Top Toolbar */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">Day-Wise Sales</span>
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
                    {[
                        { label: "Period Bills", value: summary.totalBills, isCurrency: false },
                        { label: "Total Cash", value: summary.cash, isCurrency: true },
                        { label: "Total Card", value: summary.card, isCurrency: true },
                        { label: "Digital / UPI", value: summary.upi, isCurrency: true },
                        { label: "Credit Exposure", value: summary.credit, isCurrency: true }
                    ].map((item, idx) => (
                        <div key={idx} className="flex-1 min-w-[140px]">
                            <div className="text-xs text-slate-500 font-semibold mb-1">{item.label}</div>
                            <div className={`text-xl font-bold ${idx === 4 ? 'text-rose-600' : 'text-slate-800'}`}>
                                {item.isCurrency ? '₹' : ''}{item.isCurrency ? fmt(item.value) : item.value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Daily Summary Grid */}
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                    <thead className="bg-[#F8FAFC] text-[10px] font-black text-[#64748B] uppercase tracking-widest border-b border-slate-200 shadow-sm sticky top-0 z-20">
                        <tr>
                            <th className="py-4 px-5 whitespace-nowrap">Timeline Date</th>
                            <th className="py-4 px-5 text-center whitespace-nowrap">Receipt Vol</th>
                            <th className="py-4 px-5 text-right whitespace-nowrap bg-indigo-50/50">Cash Net</th>
                            <th className="py-4 px-5 text-right whitespace-nowrap bg-indigo-50/50">Card Net</th>
                            <th className="py-4 px-5 text-right whitespace-nowrap bg-indigo-50/50">Digital / UPI</th>
                            <th className="py-4 px-5 text-right whitespace-nowrap bg-rose-50/50">Credit Exposure</th>
                            <th className="py-4 px-5 text-right whitespace-nowrap">Fiscal Net</th>
                        </tr>
                    </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="py-20 text-center">
                                    <Loader2 size={32} className="animate-spin mb-3 mx-auto text-indigo-500" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Auditing Temporal Registry...</p>
                                </td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No sales variance logged in period</td></tr>
                            ) : data.map((d, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 group transition-all text-sm">
                                    <td className="py-3 px-5">
                                        <span className="font-bold text-slate-800">{d.date}</span>
                                    </td>
                                    <td className="py-3 px-5 text-center font-bold text-slate-500">{d.billCount}</td>
                                    <td className="py-3 px-5 text-right font-bold text-emerald-600 bg-emerald-50/20">₹{fmt(d.cash)}</td>
                                    <td className="py-3 px-5 text-right font-bold text-indigo-600 bg-indigo-50/20">₹{fmt(d.card)}</td>
                                    <td className="py-3 px-5 text-right font-bold text-amber-600 bg-amber-50/20">₹{fmt(d.upi)}</td>
                                    <td className="py-3 px-5 text-right font-bold text-rose-500 bg-rose-50/20 border-r border-slate-50">₹{fmt(d.credit)}</td>
                                    <td className="py-3 px-5 text-right font-black text-slate-900 bg-slate-50 text-base">₹{fmt(d.total)}</td>
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
                <Header toggleSidebar={toggleSidebar} title="Day-Wise Sales Summary" />
                <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden m-2 lg:m-4 rounded-xl border border-slate-200">
                    {content}
                </div>
            </main>
            <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fadeInShort {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </DashboardPageShell>
    );
};

export default DayWiseSales;

