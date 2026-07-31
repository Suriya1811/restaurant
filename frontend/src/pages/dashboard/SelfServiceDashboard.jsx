import { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import { useAuth } from '../../context/AuthContext';
import {
    TrendingUp,
    TrendingDown,
    CreditCard,
    ShoppingBag,
    Wallet,
    Activity,
    ArrowRight,
    ArrowDownRight,
    ArrowUpRight,
    PieChart,
    Search,
    Filter,
    Download,
    Calendar,
    Landmark,
    Banknote,
    Users,
    Briefcase,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    Layers,
    DollarSign,
    Monitor,
    FileText,
    Edit,
    BarChart2,
    ShoppingCart
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const StatCard = memo(({ label, value, icon, color, trend, iconBg }) => (
    <div className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-500 overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110 opacity-50"></div>
        
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" style={{ backgroundColor: iconBg || `${color}10`, color: color }}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-tight ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {trend.startsWith('+') ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {trend}
                    </div>
                )}
            </div>
            
            <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">{label}</p>
                <div className="flex items-baseline gap-1">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
                </div>
            </div>
        </div>
    </div>
));

const ReportSectionHeader = memo(({ icon, title, subtitle }) => (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div className="flex items-center gap-4 ml-auto">
            <div className="w-12 h-12 bg-indigo-600 flex items-center justify-center rounded-2xl shadow-lg shadow-indigo-200 text-white">
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">{title}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
            </div>
        </div>
        <div className="h-px flex-1 bg-slate-100 hidden xl:block mx-8 opacity-50"></div>
    </div>
));

const SelfServiceDashboard = () => {
    const navigate = useNavigate();
    const { hasModuleAccess } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState({});
    const [loading, setLoading] = useState(true);
    const [chartRange, setChartRange] = useState('DAILY');
    
    const getDateRangeForChart = (range) => {
        const today = new Date();
        const end = today.toISOString().split('T')[0];
        let start;
        switch (range) {
            case 'WEEKLY': {
                const d = new Date(today);
                d.setDate(d.getDate() - 6);
                start = d.toISOString().split('T')[0];
                break;
            }
            case 'MONTHLY': {
                const d = new Date(today);
                d.setDate(d.getDate() - 29);
                start = d.toISOString().split('T')[0];
                break;
            }
            case 'YEARLY': {
                const d = new Date(today);
                d.setFullYear(d.getFullYear(), 0, 1);
                start = d.toISOString().split('T')[0];
                break;
            }
            case 'DAILY':
            default:
                start = end;
                break;
        }
        return { startDate: start, endDate: end };
    };

    const [dateRange, setDateRange] = useState(() => getDateRangeForChart('DAILY'));

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) {
                setLoading(false);
                return;
            }
            const { token } = JSON.parse(savedUser);
            const queryParams = new URLSearchParams({
                startDate: dateRange.startDate || '',
                endDate: dateRange.endDate || '',
                range: chartRange === 'YEARLY' ? 'Year' : ''
            }).toString();

            const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/summary?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) setDashboardData(result.data);
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange, chartRange]);

    const handleChartRangeChange = (range) => {
        setChartRange(range);
        setDateRange(getDateRangeForChart(range));
    };

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const handleDateChange = (e, field) => {
        setDateRange(prev => ({ ...prev, [field]: e.target.value }));
    };

    const mainChartData = useMemo(() => ({
        labels: dashboardData?.chartData?.labels || [],
        datasets: [{
            label: 'Sales Revenue',
            data: dashboardData?.chartData?.sales || [],
            borderColor: '#6366f1',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#6366f1',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    }), [dashboardData?.chartData]);

    const inflowChartData = useMemo(() => ({
        labels: dashboardData?.chartData?.labels || [],
        datasets: [
            { label: 'RECEIPTS', data: dashboardData?.chartData?.receipts || [], backgroundColor: '#10b981', borderRadius: 12, barThickness: 15 },
            { label: 'PAYMENTS', data: dashboardData?.chartData?.payments || [], backgroundColor: '#f43f5e', borderRadius: 12, barThickness: 15 }
        ]
    }), [dashboardData?.chartData]);

    const outstandingChartData = useMemo(() => ({
        labels: ['Outstanding Balance'],
        datasets: [
            { label: 'RECEIVABLE', data: [dashboardData?.receivableAmount || 0], backgroundColor: '#8b5cf6', borderRadius: 15, barThickness: 45 },
            { label: 'PAYABLE', data: [dashboardData?.payableAmount || 0], backgroundColor: '#f43f5e', borderRadius: 15, barThickness: 45 }
        ]
    }), [dashboardData?.receivableAmount, dashboardData?.payableAmount]);

    if (loading && !dashboardData.todaySales && dashboardData.todaySales !== 0) {
        return (
            <DashboardPageShell className="bg-slate-50">
                <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
                <main className="dashboard-main">
                    <Header toggleSidebar={toggleSidebar} />
                    <div className="dashboard-content flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Activity size={24} className="text-indigo-600 opacity-50" />
                                </div>
                            </div>
                            <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Analyzing Metrics...</p>
                        </div>
                    </div>
                </main>
            </DashboardPageShell>
        );
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'top', 
                align: 'end',
                labels: { 
                    font: { family: "'Inter', sans-serif", weight: 900, size: 10 }, 
                    usePointStyle: true, 
                    pointStyle: 'circle',
                    padding: 24,
                    color: '#64748b'
                } 
            },
            tooltip: { 
                backgroundColor: '#0f172a', 
                titleFont: { size: 12, weight: 800 }, 
                bodyFont: { size: 13, weight: 900 }, 
                padding: 16, 
                cornerRadius: 12, 
                displayColors: false,
                borderWidth: 1,
                borderColor: '#1e293b'
            }
        },
        scales: {
            y: { 
                beginAtZero: true, 
                grid: { color: '#f1f5f9', drawBorder: false }, 
                ticks: { 
                    font: { weight: 700, size: 10 }, 
                    color: '#94a3b8',
                    padding: 10,
                    callback: (value) => '₹' + value.toLocaleString() 
                } 
            },
            x: { 
                grid: { display: false, drawBorder: false }, 
                ticks: { 
                    font: { weight: 700, size: 10 }, 
                    color: '#94a3b8',
                    padding: 10
                } 
            }
        }
    };

    const fmt = (num) => (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <DashboardPageShell>
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden', backgroundColor: '#F8FAFC' }}>
                    <Header toggleSidebar={toggleSidebar} restaurantName={dashboardData?.restaurantInfo?.printName} />

                    <div className="dashboard-content fade-in" style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', padding: '0.75rem', gap: '0.75rem', overflowY: 'auto', backgroundColor: '#F8F9FA', minHeight: 0 }}>
                        {!hasModuleAccess('dashboard') ? (
                            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                                <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-xl w-full">
                                    <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Welcome to Yugam Software</h1>
                                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Store Management System</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Top Stat Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 flex-shrink-0">
                                    {/* Card 1: SALES */}
                                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl border-transparent p-4 flex flex-col justify-between h-[98px] shadow-lg shadow-blue-500/30">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-[11px] font-bold text-blue-100 uppercase tracking-widest mb-1">SALES</h3>
                                                <div className="text-[26px] font-black text-white leading-none">₹{fmt(dashboardData.todaySales)}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="text-[11px] font-semibold text-blue-100">{dashboardData.totalBills || 0} Bills</span>
                                            <span className="text-[11px] font-bold text-white">Avg: ₹{dashboardData.totalBills ? fmt(dashboardData.todaySales / dashboardData.totalBills) : '0.00'}</span>
                                        </div>
                                    </div>

                                    {/* Card 2: PURCHASE */}
                                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl border-transparent p-4 flex flex-col justify-between h-[98px] shadow-lg shadow-orange-500/30">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-[11px] font-bold text-orange-50 uppercase tracking-widest mb-1">PURCHASE</h3>
                                                <div className="text-[26px] font-black text-white leading-none">₹{fmt(dashboardData.todayPurchases)}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="text-[11px] font-semibold text-orange-50">Procured Value</span>
                                            <span className="text-[11px] font-bold text-white">{chartRange === 'DAILY' ? 'Today' : chartRange}</span>
                                        </div>
                                    </div>

                                    {/* Card 3: EXPENSE */}
                                    <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl border-transparent p-4 flex flex-col justify-between h-[98px] shadow-lg shadow-rose-500/30">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-[11px] font-bold text-rose-100 uppercase tracking-widest mb-1">EXPENSE</h3>
                                                <div className="text-[26px] font-black text-white leading-none">₹{fmt(dashboardData.todayPaymentOut || dashboardData.todayExpenses || 0)}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="text-[11px] font-semibold text-rose-100">Paid Balance</span>
                                            <span className="text-[11px] font-bold text-white">{chartRange === 'DAILY' ? 'Today' : chartRange}</span>
                                        </div>
                                    </div>

                                    {/* Card 4: INCOME */}
                                    <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl border-transparent p-4 flex flex-col justify-between h-[98px] shadow-lg shadow-teal-500/30">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-[11px] font-bold text-teal-50 uppercase tracking-widest mb-1">INCOME</h3>
                                                <div className="text-[26px] font-black text-white leading-none">₹{fmt(dashboardData.todayPaymentIn || 0)}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="text-[11px] font-semibold text-teal-50">Receipts</span>
                                            <span className="text-[11px] font-bold text-white">{chartRange === 'DAILY' ? 'Today' : chartRange}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Middle Area */}
                                <div className="flex flex-col xl:flex-row gap-3 xl:items-stretch flex-1">
                                    {/* Left Panel - Sales Graph */}
                                    <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-[390px]">
                                        <div className="flex justify-between items-center mb-3 flex-shrink-0">
                                            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">SALES GRAPH</h3>
                                            <div className="flex gap-1">
                                                {['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].map((range) => (
                                                    <button 
                                                        key={range}
                                                        onClick={() => handleChartRangeChange(range)}
                                                        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors ${chartRange === range ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        {range}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-h-0 min-w-0 w-full relative">
                                            <Line data={mainChartData} options={{...chartOptions, maintainAspectRatio: false, plugins: {...chartOptions.plugins, legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 6, boxHeight: 6 } }}}} />
                                        </div>
                                    </div>

                                    {/* Right Panel - Quick Actions */}
                                    <div className="w-full xl:w-[320px] flex flex-col flex-shrink-0">
                                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col h-[390px]">
                                            <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-2.5">QUICK ACTIONS</h3>
                                            <div className="flex flex-col gap-2 flex-1 justify-between">
                                                {/* 1. Sales Bill - F2 */}
                                                <button 
                                                    onClick={() => navigate('/dashboard/self-service/billing')} 
                                                    className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-blue-50/80 hover:bg-blue-100/80 rounded-xl transition-all text-left border border-blue-100 shadow-sm hover:shadow cursor-pointer"
                                                >
                                                    <FileText size={17} className="text-blue-600 shrink-0" />
                                                    <span className="text-[12.5px] font-bold text-blue-700">Sales Bill - F2</span>
                                                </button>

                                                {/* 2. KOT - F3 */}
                                                {hasModuleAccess('kot') && (
                                                    <button 
                                                        onClick={() => navigate('/dashboard/self-service/table-select')} 
                                                        className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-amber-50/80 hover:bg-amber-100/80 rounded-xl transition-all text-left border border-amber-100 shadow-sm hover:shadow cursor-pointer"
                                                    >
                                                        <ShoppingCart size={17} className="text-amber-600 shrink-0" />
                                                        <span className="text-[12.5px] font-bold text-amber-700">KOT - F3</span>
                                                    </button>
                                                )}

                                                {/* 3. Purchase Bill - F12 */}
                                                <button 
                                                    onClick={() => navigate('/dashboard/self-service/purchase')} 
                                                    className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-rose-50/80 hover:bg-rose-100/80 rounded-xl transition-all text-left border border-rose-100 shadow-sm hover:shadow cursor-pointer"
                                                >
                                                    <ShoppingBag size={17} className="text-rose-600 shrink-0" />
                                                    <span className="text-[12.5px] font-bold text-rose-700">Purchase Bill - F12</span>
                                                </button>

                                                {/* 4. Voucher - F9 */}
                                                <button 
                                                    onClick={() => navigate('/dashboard/self-service/vouchers')} 
                                                    className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-yellow-50/80 hover:bg-yellow-100/80 rounded-xl transition-all text-left border border-yellow-200/60 shadow-sm hover:shadow cursor-pointer"
                                                >
                                                    <Wallet size={17} className="text-amber-600 shrink-0" />
                                                    <span className="text-[12.5px] font-bold text-amber-800">Voucher - F9</span>
                                                </button>

                                                {/* 5. Item Creation - F6 */}
                                                <button 
                                                    onClick={() => navigate('/dashboard/self-service/products')} 
                                                    className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-emerald-50/80 hover:bg-emerald-100/80 rounded-xl transition-all text-left border border-emerald-100 shadow-sm hover:shadow cursor-pointer"
                                                >
                                                    <Edit size={17} className="text-emerald-600 shrink-0" />
                                                    <span className="text-[12.5px] font-bold text-emerald-700">Item Creation - F6</span>
                                                </button>

                                                {/* 6. Ledger Creation - F5 */}
                                                <button 
                                                    onClick={() => navigate('/dashboard/self-service/ledgers/create')} 
                                                    className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-indigo-50/80 hover:bg-indigo-100/80 rounded-xl transition-all text-left border border-indigo-100 shadow-sm hover:shadow cursor-pointer"
                                                >
                                                    <Users size={17} className="text-indigo-600 shrink-0" />
                                                    <span className="text-[12.5px] font-bold text-indigo-700">Ledger Creation - F5</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </main>
        </DashboardPageShell>
    );
};

export default SelfServiceDashboard;
