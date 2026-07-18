import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import {
    TrendingUp,
    Users,
    Truck,
    Package,
    ArrowUpRight,
    DollarSign,
    Calendar,
    Search,
    Download,
    PieChart as PieIcon,
    Loader2,
    BookOpen,
    Filter,
    BarChart3,
    Activity,
    Wallet,
    ArrowRight
} from 'lucide-react';
import './Dashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

/* ─── KPI Card ─── */
const KpiCard = ({ label, value, icon, color, trend, sub }) => (
    <div
        className="bg-white rounded-2xl p-5 shadow-premium flex flex-col justify-between min-h-[140px] relative overflow-hidden group hover:shadow-xl transition-all duration-300"
    >
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: color }}></div>
        <div className="flex justify-between items-start">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
                {icon}
            </div>
            {trend && (
                <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <ArrowUpRight size={11} className={trend.startsWith('+') ? '' : 'rotate-90'} />{trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{value}</h3>
            {sub && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{sub}</p>}
        </div>
    </div>
);

const AdvancedReports = () => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('SUMMARY'); // SUMMARY, SALES, PURCHASE, ACCOUNTS

    const [supplierOutstanding, setSupplierOutstanding] = useState([]);
    const [customerOutstanding, setCustomerOutstanding] = useState([]);
    const [stockValuation, setStockValuation] = useState({ items: [], totalValue: 0 });
    const [profitLoss, setProfitLoss] = useState({ revenue: 0, purchases: 0, expenses: 0, netProfit: 0 });

    const [salesByBrand, setSalesByBrand] = useState([]);
    const [purchaseSummary, setPurchaseSummary] = useState([]);
    const [daybook, setDaybook] = useState([]);

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fetchAllReports = async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };
            const query = `?startDate=${dateRange.start}&endDate=${dateRange.end}`;

            const urls = [
                `${import.meta.env.VITE_API_URL}/reports/supplier-outstanding`,
                `${import.meta.env.VITE_API_URL}/reports/customer-outstanding`,
                `${import.meta.env.VITE_API_URL}/reports/stock-valuation`,
                `${import.meta.env.VITE_API_URL}/reports/profit-loss${query}`,
                `${import.meta.env.VITE_API_URL}/reports/sales-by-brand${query}`,
                `${import.meta.env.VITE_API_URL}/reports/purchase-summary${query}`,
                `${import.meta.env.VITE_API_URL}/reports/daybook?date=${dateRange.end}`
            ];

            const responses = await Promise.all(urls.map(url => fetch(url, { headers })));
            const data = await Promise.all(responses.map(r => r.json()));

            if (data[0].success) setSupplierOutstanding(data[0].data);
            if (data[1].success) setCustomerOutstanding(data[1].data);
            if (data[2].success) setStockValuation(data[2].data);
            if (data[3].success) {
                const pl = data[3].data;
                setProfitLoss({
                    revenue: pl.income.total,
                    purchases: pl.direct_expenses.total,
                    expenses: pl.indirect_expenses.total,
                    grossProfit: pl.gross_profit,
                    netProfit: pl.net_profit
                });
            }
            if (data[4].success) setSalesByBrand(data[4].data);
            if (data[5].success) setPurchaseSummary(data[5].data);
            if (data[6].success) setDaybook(data[6].data);

        } catch (err) {
            console.error("Report fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllReports();
    }, [dateRange]);

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) return;
        const keys = Object.keys(data[0]);
        const headers = keys.join(',');
        const rows = data.map(obj => keys.map(k => obj[k]).join(',')).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Assembling Enterprise Insights...</p>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Enterprise Intelligence"
                    actions={
                        <div className="relative">
                            <select
                                className="input-premium-modern text-xs font-bold appearance-none pr-8 cursor-pointer"
                                defaultValue=""
                                onChange={(e) => e.target.value && navigate(e.target.value)}
                            >
                                <option value="" disabled>Go to Specific Report...</option>
                                <option value="/dashboard/self-service/stock">Stock Master</option>
                                <optgroup label="Sales Summary">
                                    <option value="/dashboard/self-service/reports/sales/day">Day Wise</option>
                                    <option value="/dashboard/self-service/reports/sales/month">Month Wise</option>
                                    <option value="/dashboard/self-service/reports/sales/item">Item Wise</option>
                                    <option value="/dashboard/self-service/reports/sales/category">Category Wise</option>
                                    <option value="/dashboard/self-service/reports/sales/transaction">Transaction Wise</option>
                                    <option value="/dashboard/self-service/reports/sales/profit">Sales Profit</option>
                                </optgroup>
                                <optgroup label="Purchase Summary">
                                    <option value="/dashboard/self-service/reports/purchase/day">Day Wise</option>
                                    <option value="/dashboard/self-service/reports/purchase/supplier">Supplier Wise</option>
                                </optgroup>
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                ▼
                            </span>
                        </div>
                    }
                />

                <div className="dashboard-content fade-in p-4 lg:p-6 max-w-[1600px] mx-auto w-full">

                    {/* ── search_and_action_bar ── */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                                    <BarChart3 size={16} />
                                </div>
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Predictive Analytics</span>
                            </div>
                            <h2 className="premium-page-title">Enterprise Intelligence</h2>
                            <p className="text-slate-500 font-bold text-sm">Multi-module financial health & real-time operational performance.</p>
                        </div>

                        {/* Date filters + actions aligned right */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                                <Calendar size={16} className="text-indigo-400" />
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                                />
                                <span className="text-slate-300">→</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                                />
                            </div>
                            <button onClick={fetchAllReports} className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-indigo-300 transition-colors bg-white shadow-sm">
                                <Search size={18} />
                            </button>
                            <button className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors bg-white shadow-sm">
                                <Filter size={18} />
                            </button>
                            <button
                                onClick={() => exportToCSV(activeTab === 'PURCHASE' ? purchaseSummary : activeTab === 'ACCOUNTS' ? daybook : supplierOutstanding, activeTab)}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                            >
                                <Download size={16} /> Export
                            </button>
                        </div>
                    </div>

                    {/* ── Tab Bar ── */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-8 w-fit">
                        {['SUMMARY', 'SALES', 'PURCHASE', 'ACCOUNTS'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-lg text-xs font-black tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* ══════════ SUMMARY TAB ══════════ */}
                    {activeTab === 'SUMMARY' && (
                        <div className="space-y-8">

                            {/* kpi_metrics_cards — 4 column grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <KpiCard
                                    label="Net Profit / Loss"
                                    value={`₹${(profitLoss.netProfit || 0).toLocaleString()}`}
                                    icon={<TrendingUp size={22} />}
                                    color={profitLoss.netProfit >= 0 ? '#10b981' : '#ef4444'}
                                    trend="+8.1%"
                                    sub="Operational yield"
                                />
                                <KpiCard
                                    label="Total Revenue"
                                    value={`₹${(profitLoss.revenue || 0).toLocaleString()}`}
                                    icon={<DollarSign size={22} />}
                                    color="#6366f1"
                                    trend="+12.5%"
                                    sub="Topline gross"
                                />
                                <KpiCard
                                    label="Stock Valuation"
                                    value={`₹${(stockValuation.totalValue || 0).toLocaleString()}`}
                                    icon={<Package size={22} />}
                                    color="#f59e0b"
                                    trend="+3.2%"
                                    sub="Inventory capitalisation"
                                />
                                <KpiCard
                                    label="Gross Profit"
                                    value={`₹${(profitLoss.grossProfit || 0).toLocaleString()}`}
                                    icon={<Wallet size={22} />}
                                    color="#8b5cf6"
                                    trend="+5.4%"
                                    sub="Before indirect expenses"
                                />
                            </div>

                            {/* analytics_visualization_section — two column */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                                {/* Left panel — Vendor Payables list (large) */}
                                <div className="lg:col-span-7 bg-white rounded-2xl shadow-premium overflow-hidden">
                                    <div className="flex justify-between items-center p-6 border-b border-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                                                <Truck size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900">Vendor Payables</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Distributed liabilities across supply chain</p>
                                            </div>
                                        </div>
                                        <button onClick={() => exportToCSV(supplierOutstanding, 'Suppliers')} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                                            <Download size={18} />
                                        </button>
                                    </div>
                                    <div className="max-h-[380px] overflow-y-auto p-4 space-y-3">
                                        {supplierOutstanding.length > 0 ? supplierOutstanding.map((s, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center font-black text-slate-400 text-sm shadow-sm">V</div>
                                                    <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                                                </div>
                                                <span className="font-black text-rose-600">₹{(s.balance || 0).toLocaleString()}</span>
                                            </div>
                                        )) : (
                                            <div className="py-12 text-center text-slate-400 font-bold text-sm">No outstanding vendor payables.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Right panel — Ledger Credits + donut widgets */}
                                <div className="lg:col-span-5 flex flex-col gap-6">
                                    {/* top_customer_list */}
                                    <div className="bg-white rounded-2xl shadow-premium overflow-hidden">
                                        <div className="flex justify-between items-center p-5 border-b border-slate-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-sm">Ledger Credits</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending inflows</p>
                                                </div>
                                            </div>
                                            <button onClick={() => exportToCSV(customerOutstanding, 'Customers')} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                                                <Download size={16} />
                                            </button>
                                        </div>
                                        <div className="max-h-[180px] overflow-y-auto p-3 space-y-2">
                                            {customerOutstanding.length > 0 ? customerOutstanding.slice(0, 5).map((c, i) => (
                                                <div key={i} className="flex justify-between items-center px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-emerald-50 rounded-full flex items-center justify-center font-black text-emerald-600 text-xs">{c.name?.charAt(0)}</div>
                                                        <span className="font-bold text-slate-700 text-sm truncate max-w-[120px]">{c.name}</span>
                                                    </div>
                                                    <span className="font-black text-emerald-600 text-sm">₹{(c.balance || 0).toLocaleString()}</span>
                                                </div>
                                            )) : (
                                                <div className="py-6 text-center text-slate-400 font-bold text-sm">No outstanding credits.</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* small_chart_widgets — subscribe + lead source donuts */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white rounded-2xl shadow-premium p-4 flex flex-col items-center text-center">
                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Subscribe</h5>
                                            <div className="w-20 h-20 rounded-full border-[6px] border-slate-100 border-t-indigo-500 border-r-indigo-500 flex items-center justify-center mb-2">
                                                <span className="text-xs font-black text-slate-900">75%</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-500">Active Rate</p>
                                        </div>
                                        <div className="bg-white rounded-2xl shadow-premium p-4 flex flex-col items-center text-center">
                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Lead Source</h5>
                                            <PieIcon className="text-indigo-500 mb-2" size={36} />
                                            <div className="flex gap-1.5 text-[9px] font-black uppercase">
                                                <span className="text-indigo-600">Direct</span>
                                                <span className="text-slate-400">•</span>
                                                <span className="text-slate-500">Referral</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* bottom_analytics_panels — 3 columns */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* 1. Subscription Overview — stock items breakdown */}
                                <div className="bg-white rounded-2xl shadow-premium p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-black text-slate-900">Subscription Overview</h3>
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Inventory</span>
                                    </div>
                                    {stockValuation.items?.length > 0 ? (
                                        <div className="space-y-3">
                                            {stockValuation.items.slice(0, 5).map((item, i) => (
                                                <div key={i}>
                                                    <div className="flex justify-between text-xs font-bold mb-1">
                                                        <span className="text-slate-600 truncate max-w-[140px]">{item.name}</span>
                                                        <span className="font-black text-slate-900">₹{(item.value || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${Math.min(100, stockValuation.totalValue > 0 ? (item.value / stockValuation.totalValue) * 100 : 0)}%`,
                                                                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center text-slate-400 font-bold text-sm">No stock items found.</div>
                                    )}
                                </div>

                                {/* 2. Tickets by Status — P&L cost breakdown */}
                                <div className="bg-white rounded-2xl shadow-premium p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-black text-slate-900">Tickets by Status</h3>
                                        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">P&L</span>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Revenue', value: profitLoss.revenue, color: '#10b981' },
                                            { label: 'Direct Expenses', value: profitLoss.purchases, color: '#f59e0b' },
                                            { label: 'Indirect Expenses', value: profitLoss.expenses, color: '#ef4444' },
                                            { label: 'Net Profit', value: profitLoss.netProfit, color: '#6366f1' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                    <span className="text-xs font-bold text-slate-700">{item.label}</span>
                                                </div>
                                                <span className="font-black text-sm text-slate-900">₹{(item.value || 0).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 3. Recent Activity — daybook feed */}
                                <div className="bg-white rounded-2xl shadow-premium p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-black text-slate-900">Recent Activity</h3>
                                        <button className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 tracking-widest flex items-center gap-1">
                                            All <ArrowRight size={10} />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {daybook.slice(0, 4).map((tr, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xs
                                                    ${tr.side === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {tr.side === 'IN' ? '↓' : '↑'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 truncate">{tr.desc || tr.ref}</p>
                                                    <div className="flex justify-between items-center mt-0.5">
                                                        <span className="text-[10px] text-slate-400 font-bold">{tr.type}</span>
                                                        <span className="text-xs font-black text-slate-900">₹{tr.amount?.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {daybook.length === 0 && (
                                            <div className="py-6 text-center text-slate-400 font-bold text-sm">No activity for this period.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════ SALES TAB ══════════ */}
                    {activeTab === 'SALES' && (
                        <div className="space-y-8">
                            {/* KPI strip */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                <KpiCard label="Total Revenue" value={`₹${(profitLoss.revenue || 0).toLocaleString()}`} icon={<TrendingUp size={20} />} color="#6366f1" trend="+12.5%" />
                                <KpiCard label="Brands Tracked" value={salesByBrand.length} icon={<BarChart3 size={20} />} color="#10b981" />
                                <KpiCard label="Gross Profit" value={`₹${(profitLoss.grossProfit || 0).toLocaleString()}`} icon={<Wallet size={20} />} color="#8b5cf6" trend="+5.4%" />
                            </div>

                            {/* analytics_visualization_section */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Bar chart — left */}
                                <div className="lg:col-span-7 bg-white rounded-2xl shadow-premium p-6 flex flex-col">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                                <BarChart3 size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900">Brand Architecture</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue by brand entity</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-[300px]">
                                        <Bar
                                            data={{
                                                labels: salesByBrand.map(b => b.brand),
                                                datasets: [{
                                                    label: 'Fiscal Output',
                                                    data: salesByBrand.map(b => b.amount),
                                                    backgroundColor: '#6366f1',
                                                    borderRadius: 12,
                                                    borderSkipped: false,
                                                    hoverBackgroundColor: '#4f46e5',
                                                    barThickness: 40
                                                }]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false }, tooltip: { cornerRadius: 12, padding: 14 } },
                                                scales: {
                                                    y: { border: { display: false }, grid: { color: '#f8fafc' }, ticks: { font: { weight: '900', size: 11 }, color: '#cbd5e1' } },
                                                    x: { border: { display: false }, grid: { display: false }, ticks: { font: { weight: '900', size: 11 }, color: '#64748b', autoSkip: false } }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Right — Pie chart + lead source donut */}
                                <div className="lg:col-span-5 flex flex-col gap-6">
                                    <div className="bg-white rounded-2xl shadow-premium p-6 flex flex-col flex-1">
                                        <h4 className="font-black text-slate-900 mb-1">Deployment Share</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Service distribution index</p>
                                        <div className="flex-1 min-h-[220px]">
                                            <Pie
                                                data={{
                                                    labels: ['Direct', 'Referral', 'Partners'],
                                                    datasets: [{
                                                        data: [65, 20, 15],
                                                        backgroundColor: ['#6366f1', '#10b981', '#f59e0b'],
                                                        borderWidth: 6,
                                                        borderColor: '#ffffff',
                                                        hoverOffset: 20
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: { position: 'bottom', labels: { usePointStyle: true, font: { weight: '900', size: 11 }, padding: 20, color: '#64748b' } }
                                                    },
                                                    cutout: '55%'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white rounded-2xl shadow-premium p-4 text-center">
                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subscribe</h5>
                                            <div className="w-16 h-16 mx-auto rounded-full border-[5px] border-slate-100 border-t-indigo-500 border-r-indigo-500 flex items-center justify-center">
                                                <span className="text-[11px] font-black text-slate-900">75%</span>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-2xl shadow-premium p-4 text-center flex flex-col items-center justify-center">
                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lead By Source</h5>
                                            <PieIcon className="text-indigo-400" size={32} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* bottom_analytics_panels */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="bg-white rounded-2xl shadow-premium p-6">
                                    <h3 className="font-black text-slate-900 mb-4">Subscription Overview</h3>
                                    {salesByBrand.slice(0, 5).map((b, i) => (
                                        <div key={i} className="mb-3">
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-slate-600">{b.brand}</span>
                                                <span className="font-black">₹{b.amount?.toLocaleString()}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, profitLoss.revenue > 0 ? (b.amount / profitLoss.revenue) * 100 : 0)}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white rounded-2xl shadow-premium p-6">
                                    <h3 className="font-black text-slate-900 mb-4">Analytics</h3>
                                    <p className="text-slate-500 text-sm">Deployment share analytics have been restructured.</p>
                                </div>
                                <div className="bg-white rounded-2xl shadow-premium p-6">
                                    <h3 className="font-black text-slate-900 mb-4">Recent Activity</h3>
                                    {daybook.slice(0, 4).map((tr, i) => (
                                        <div key={i} className="flex items-center gap-3 mb-3">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${tr.side === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {tr.side === 'IN' ? '↓' : '↑'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">{tr.desc}</p>
                                                <p className="text-[10px] text-slate-400">₹{tr.amount?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════ PURCHASE TAB ══════════ */}
                    {activeTab === 'PURCHASE' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                <KpiCard label="Total Purchases" value={`₹${purchaseSummary.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}`} icon={<Truck size={20} />} color="#ef4444" trend="+4.2%" />
                                <KpiCard label="Amount Paid" value={`₹${purchaseSummary.reduce((s, p) => s + (p.paid || 0), 0).toLocaleString()}`} icon={<DollarSign size={20} />} color="#10b981" />
                                <KpiCard label="Amount Due" value={`₹${purchaseSummary.reduce((s, p) => s + (p.due || 0), 0).toLocaleString()}`} icon={<Wallet size={20} />} color="#f59e0b" />
                                <KpiCard label="Vendors" value={purchaseSummary.length} icon={<Package size={20} />} color="#6366f1" />
                            </div>

                            <div className="bg-white rounded-2xl shadow-premium overflow-hidden">
                                <div className="flex justify-between items-center p-6 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900">Procurement Matrix</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detailed audit of resource inward</p>
                                        </div>
                                    </div>
                                    <button onClick={() => exportToCSV(purchaseSummary, 'Purchases')} className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-indigo-600 transition-colors">
                                        <Download size={16} /> Export
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                                <th className="px-6 py-4 text-left">Vendor</th>
                                                <th className="px-6 py-4 text-right">Total Commitment</th>
                                                <th className="px-6 py-4 text-right">Capital Injected</th>
                                                <th className="px-6 py-4 text-right">Deferred</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {purchaseSummary.map((p, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50/50">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-slate-800">{p.name || 'Global Entity'}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold">Ref #{i + 102}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-900">₹{p.amount?.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-emerald-600 font-black">₹{p.paid?.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-rose-600">₹{p.due?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════ ACCOUNTS TAB ══════════ */}
                    {activeTab === 'ACCOUNTS' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                <KpiCard label="Day Inflow" value={`₹${daybook.filter(t => t.side === 'IN').reduce((s, t) => s + t.amount, 0).toLocaleString()}`} icon={<TrendingUp size={20} />} color="#10b981" />
                                <KpiCard label="Day Outflow" value={`₹${daybook.filter(t => t.side === 'OUT').reduce((s, t) => s + t.amount, 0).toLocaleString()}`} icon={<Activity size={20} />} color="#ef4444" />
                                <KpiCard label="Entries" value={daybook.length} icon={<BookOpen size={20} />} color="#6366f1" />
                                <KpiCard label="Net Flow" value={`₹${(daybook.filter(t => t.side === 'IN').reduce((s, t) => s + t.amount, 0) - daybook.filter(t => t.side === 'OUT').reduce((s, t) => s + t.amount, 0)).toLocaleString()}`} icon={<Wallet size={20} />} color="#8b5cf6" />
                            </div>

                            <div className="bg-white rounded-2xl shadow-premium overflow-hidden">
                                <div className="flex justify-between items-center p-6 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900">Financial Daybook</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chronological audit trail • {new Date(dateRange.end).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => exportToCSV(daybook, 'Daybook')} className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-indigo-600 transition-colors">
                                        <Download size={16} /> Export
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {daybook.length === 0 ? (
                                        <div className="py-20 text-center opacity-30">
                                            <Activity size={64} className="mx-auto mb-4" />
                                            <p className="font-black text-sm">Audit trail is clear.</p>
                                            <p className="font-bold text-sm mt-1">No ledger activities for this period.</p>
                                        </div>
                                    ) : (
                                        daybook.map((tr, i) => (
                                            <div key={i} className="flex justify-between items-center p-5 hover:bg-slate-50/60 transition-colors">
                                                <div className="flex items-center gap-4 ml-auto">
                                                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-black text-sm shadow-inner
                                                        ${tr.side === 'IN' ? 'bg-emerald-50 text-emerald-600' : tr.side === 'OUT' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                                        <span>{tr.side === 'IN' ? '+' : '-'}</span>
                                                        <span className="text-[8px] uppercase font-black opacity-60">{tr.side || 'LOG'}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{tr.desc}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black uppercase">{tr.type}</span>
                                                            <span className="text-[10px] font-bold text-slate-400">{new Date(tr.time).toLocaleTimeString()} • {tr.ref}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className={`text-xl font-black tracking-tight ${tr.side === 'IN' ? 'text-emerald-600' : tr.side === 'OUT' ? 'text-rose-600' : 'text-slate-800'}`}>
                                                    ₹{tr.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default AdvancedReports;
