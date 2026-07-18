import { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
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
    DollarSign
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
    
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

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
                endDate: dateRange.endDate || ''
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
    }, [dateRange]);

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
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderWidth: 5,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#6366f1',
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8
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

            <main className="dashboard-main flex flex-col flex-1 h-full bg-[#F4F5F9]">
                <Header toggleSidebar={toggleSidebar} restaurantName={dashboardData?.restaurantInfo?.businessName || dashboardData?.restaurantInfo?.storeName} />

                {!hasModuleAccess('dashboard') ? (
                    <div className="dashboard-content fade-in flex-1 min-h-0 flex flex-col items-center justify-center p-8 bg-[#F4F5F9]">
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100">
                                <Activity size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Dashboard Disabled</h2>
                            <p className="text-sm font-semibold text-slate-500 mb-8 leading-relaxed">The analytics dashboard is currently disabled. You can re-enable it from the General Settings tab.</p>
                        </div>
                    </div>
                ) : (
                    <div className="dashboard-content fade-in flex-1 min-h-0 flex flex-col !p-4 !gap-1 bg-[#F4F5F9]">

                    {/* Header Action Bar */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider border border-indigo-100">Live Analytics</span>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            </div>
                            <h2 className="premium-page-title mb-2">MAIN DASH BOARD</h2>
                            <p className="text-slate-400 font-bold text-sm tracking-wide">Enterprise Resource Analysis & Financial Forecasting</p>
                        </div>
                        
                        {/* Period Filter Card */}
                        <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                            <div className="flex items-center px-6 py-3 gap-4">
                                <Calendar size={18} className="text-indigo-600" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Analysis Range</span>
                                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                        <input
                                            type="date"
                                            value={dateRange.startDate}
                                            onChange={(e) => handleDateChange(e, 'startDate')}
                                            className="bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-32"
                                        />
                                        <ChevronRight size={14} className="text-slate-300" />
                                        <input
                                            type="date"
                                            value={dateRange.endDate}
                                            onChange={(e) => handleDateChange(e, 'endDate')}
                                            className="bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-32"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={fetchDashboardData}
                                className="h-14 px-8 bg-indigo-600 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all duration-300 active:scale-95 shadow-lg shadow-indigo-100"
                            >
                                Refresh Sync
                            </button>
                        </div>
                    </div>

                    {/* Metric Grids */}
                    <div className="grid grid-cols-1 gap-16">
                        
                        {/* Sales Section */}
                        <section aria-labelledby="sales-report">
                            <ReportSectionHeader icon={<TrendingUp />} title="Sales Report" subtitle="Revenue Stream & Returns Analysis" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                <StatCard label="TODAY SALES" value={`₹${fmt(dashboardData.todaySales)}`} icon={<TrendingUp size={28} />} color="#6366f1" trend="+12.4%" />
                                <StatCard label="TODAY RETURN" value={`₹${fmt(dashboardData.todayReturns)}`} icon={<TrendingDown size={28} />} color="#f43f5e" />
                                <StatCard label="TOTAL SALES" value={`₹${fmt(dashboardData.totalSales)}`} icon={<Layers size={28} />} color="#4338ca" />
                            </div>
                        </section>

                        {/* Purchase Section */}
                        <section aria-labelledby="purchase-report">
                            <ReportSectionHeader icon={<ShoppingBag />} title="Inventory Report" subtitle="Procurement & Supplier Returns" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                <StatCard label="TODAY PURCHASE" value={`₹${fmt(dashboardData.todayPurchases)}`} icon={<ShoppingBag size={28} />} color="#fb923c" />
                                <StatCard label="TOADY RETURN" value={`₹${fmt(dashboardData.todayPurchaseReturns)}`} icon={<ArrowRight size={28} />} color="#f43f5e" />
                                <StatCard label="TOTAL PURCHASE" value={`₹${fmt(dashboardData.totalPurchases)}`} icon={<Briefcase size={28} />} color="#ea580c" />
                            </div>
                        </section>

                        {/* Payments Row */}
                        <section aria-labelledby="payment-report">
                            <ReportSectionHeader icon={<CreditCard />} title="Cashflow Report" subtitle="Inflow vs Outflow Liquidity" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-5xl">
                                <StatCard label="TODAY PAYMENT IN" value={`₹${fmt(dashboardData.todayPaymentIn)}`} icon={<ArrowDownRight size={28} />} color="#10b981" iconBg="#ecfdf5" />
                                <StatCard label="TODAY PAYMENT OUT" value={`₹${fmt(dashboardData.todayPaymentOut)}`} icon={<ArrowUpRight size={28} />} color="#ec4899" iconBg="#fdf2f8" />
                            </div>
                        </section>

                        {/* Financial Standing */}
                        <section aria-labelledby="financial-report">
                            <ReportSectionHeader icon={<Landmark />} title="Asset Report" subtitle="Balanced Sheets & Outstanding Ledgers" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                                <StatCard label="TODAY CASH BALANCE" value={`₹${fmt(dashboardData.todayCashBalance)}`} icon={<Banknote size={26} />} color="#06b6d4" />
                                <StatCard label="TODAY BANK BALANCE" value={`₹${fmt(dashboardData.todayBankBalance)}`} icon={<Landmark size={26} />} color="#3b82f6" />
                                <StatCard label="TOTAL CASH + BANK" value={`₹${fmt((dashboardData.todayCashBalance || 0) + (dashboardData.todayBankBalance || 0))}`} icon={<Wallet size={26} />} color="#6366f1" />
                                <StatCard label="RECEIVABLE AMOUNT" value={`₹${fmt(dashboardData.receivableAmount)}`} icon={<ArrowDownRight size={26} />} color="#8b5cf6" />
                                <StatCard label="PAYABLE AMOUNT" value={`₹${fmt(dashboardData.payableAmount)}`} icon={<ArrowUpRight size={26} />} color="#f43f5e" />
                            </div>
                        </section>

                    </div>

                    {/* Analytics Graphics */}
                    <div className="mt-24 mb-10 pt-10 border-t border-slate-100">
                        <div className="flex items-center gap-4 ml-auto">
                            <div className="w-1.5 h-10 bg-indigo-600 rounded-full"></div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Graphical Data Analytics</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-20">
                        
                        {/* 1. Main Trend */}
                        <div className="lg:col-span-12 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-premium">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b border-slate-50 pb-8 gap-4">
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 tracking-tight">TOTAL SALES ANALYSIS</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Periodical growth trajectories</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-md bg-indigo-600"></div>
                                        <span>Primary Stream</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[400px]">
                                <Line 
                                    data={mainChartData} 
                                    options={chartOptions} 
                                />
                            </div>
                        </div>

                        {/* 2. Inflow/Outflow */}
                        <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-premium">
                            <h4 className="text-xl font-black text-slate-900 tracking-tight mb-8">CASH / BANK LIQUIDITY</h4>
                            <div className="h-[350px]">
                                <Bar 
                                    data={inflowChartData} 
                                    options={chartOptions} 
                                />
                            </div>
                        </div>

                        {/* 3. Outstanding */}
                        <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-premium">
                            <h4 className="text-xl font-black text-slate-900 tracking-tight mb-8">OUTSTANDING STANDING</h4>
                            <div className="h-[350px]">
                                <Bar 
                                    data={outstandingChartData} 
                                    options={{
                                        ...chartOptions,
                                        indexAxis: 'y',
                                        scales: {
                                            ...chartOptions.scales,
                                            x: { ...chartOptions.scales.y, beginAtZero: true },
                                            y: { ...chartOptions.scales.x }
                                        }
                                    }} 
                                />
                            </div>
                        </div>

                    </div>

                </div>
                )}
            </main>
        </div>
    );
};

export default SelfServiceDashboard;
