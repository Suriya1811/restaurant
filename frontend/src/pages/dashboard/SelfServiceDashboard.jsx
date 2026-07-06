import { useState, useEffect, useMemo, memo } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
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
    BarChart2
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
        <div className="flex items-center gap-4">
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
            <div className="dashboard-layout bg-slate-50">
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
            </div>
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
        <div className="dashboard-layout bg-[#F8FAFC]">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main overflow-hidden">
                <Header toggleSidebar={toggleSidebar} restaurantName={dashboardData?.restaurantInfo?.printName} />

                <div className="dashboard-content fade-in flex flex-col p-4 gap-1 bg-[#F8F9FA]">
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
                        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 flex flex-col justify-between h-[95px] shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">SALES</h3>
                                    <div className="text-[26px] font-bold text-slate-700 leading-none">₹{fmt(dashboardData.todaySales)}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-[10px] font-semibold text-slate-400">{dashboardData.todayBills || 0} Bills</span>
                                <span className="text-[10px] font-semibold text-blue-500">Avg: ₹{dashboardData.todayBills ? fmt(dashboardData.todaySales / dashboardData.todayBills) : '0.00'}</span>
                            </div>
                        </div>
                        
                        {/* Card 2: RETURN */}
                        <div className="bg-rose-50 rounded-2xl border border-rose-200 p-4 flex flex-col justify-between h-[95px] shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">RETURN</h3>
                                    <div className="text-[26px] font-bold text-slate-700 leading-none">₹{fmt(dashboardData.todayReturns)}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-[10px] font-semibold text-rose-400">Cancelled Bills</span>
                                <span className="text-[10px] font-semibold text-rose-500">Today</span>
                            </div>
                        </div>

                        {/* Card 3: PURCHASE */}
                        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex flex-col justify-between h-[95px] shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">PURCHASE</h3>
                                    <div className="text-[26px] font-bold text-slate-700 leading-none">₹{fmt(dashboardData.todayPurchases)}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-[10px] font-semibold text-amber-500">Procured Value</span>
                                <span className="text-[10px] font-semibold text-amber-500">Today</span>
                            </div>
                        </div>

                        {/* Card 4: EXPENSES */}
                        <div className="bg-fuchsia-50 rounded-2xl border border-fuchsia-200 p-4 flex flex-col justify-between h-[95px] shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">EXPENSES</h3>
                                    <div className="text-[26px] font-bold text-slate-700 leading-none">₹{fmt(dashboardData.todayExpenses || 0)}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-[10px] font-semibold text-fuchsia-400">Paid Balance</span>
                                <span className="text-[10px] font-semibold text-fuchsia-400">Vouchers</span>
                            </div>
                        </div>
                    </div>

                    {/* Middle Area */}
                    <div className="flex flex-col xl:flex-row gap-4 xl:items-start">
                        {/* Left Panel - Sales Graph */}
                        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-[400px]">
                            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">SALES GRAPH</h3>
                                <div className="flex gap-1">
                                    {['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].map((range) => (
                                        <button 
                                            key={range}
                                            onClick={() => handleChartRangeChange(range)}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors ${chartRange === range ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
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

                        {/* Right Panel - Quick Actions + Total Sales */}
                        <div className="w-full xl:w-[280px] flex flex-col gap-4 flex-shrink-0">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-4">QUICK ACTIONS</h3>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => window.location.href = '/dashboard/self-service/kitchen-management'} className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 rounded-xl transition-colors text-left border border-slate-100">
                                        <Monitor size={16} className="text-slate-500" />
                                        <span className="text-[12px] font-semibold text-slate-700">KOT</span>
                                    </button>
                                    <button onClick={() => window.location.href = '/dashboard/self-service/billing'} className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left border border-blue-100">
                                        <FileText size={16} className="text-blue-500" />
                                        <span className="text-[12px] font-semibold text-blue-600">Sales Bill</span>
                                    </button>
                                    <button onClick={() => window.location.href = '/dashboard/self-service/purchase'} className="w-full flex items-center gap-3 px-4 py-3 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors text-left border border-rose-100">
                                        <ShoppingBag size={16} className="text-rose-500" />
                                        <span className="text-[12px] font-semibold text-rose-600">Purchase</span>
                                    </button>
                                    <button onClick={() => window.location.href = '/dashboard/self-service/products'} className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-left border border-purple-100">
                                        <Edit size={16} className="text-purple-500" />
                                        <span className="text-[12px] font-semibold text-purple-600">Item Creation</span>
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                                <div className="flex justify-between items-start relative z-10">
                                    <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">TOTAL SALES</h3>
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center"><BarChart2 size={14} /></div>
                                </div>
                                <div className="relative z-10 mt-auto">
                                    <div className="text-[26px] font-bold text-slate-700">₹{fmt(dashboardData.todaySales)}</div>
                                    <p className="text-[11px] text-slate-400 mt-1 font-medium">Based on {chartRange.charAt(0) + chartRange.slice(1).toLowerCase()} report</p>
                                </div>
                            </div>
                        </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SelfServiceDashboard;
