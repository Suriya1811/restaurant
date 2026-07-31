import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import ReportNavigationDropdown from '@/components/dashboard/ReportNavigationDropdown';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
    Download,
    Loader2,
    Calendar,
    Activity,
    TrendingUp,
    Target,
    Box,
    ChevronRight,
    RefreshCw,
    Printer,
    Eye,
    LayoutDashboard
} from 'lucide-react';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MonthWiseSales = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ totalSales: 0, totalBills: 0 });

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            const url = `${import.meta.env.VITE_API_URL}/reports/month-wise?startDate=${dateRange.start}&endDate=${dateRange.end}`;
            const res = await fetch(url, { headers });
            const result = await res.json();

            if (result.success) {
                setData(result.data.monthlyBreakdown || []);
                setSummary({
                    totalSales: result.data.totalSales || 0,
                    totalBills: result.data.totalBills || 0
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
        if (!data.length) return;
        const headers = ["Month", "Doc Volume", "Revenue Recognition"];
        const rows = data.map(d => [d.month, d.billCount, d.totalSales]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Monthwise_Audit_${dateRange.start}.csv`);
        link.click();
    };

    const chartData = {
        labels: data.map(d => d.month),
        datasets: [
            {
                label: 'Monthly Net Realization (₹)',
                data: data.map(d => d.totalSales),
                backgroundColor: 'rgba(79, 70, 229, 0.9)',
                hoverBackgroundColor: '#1e1b4b',
                borderRadius: 12,
                barThickness: 40
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                titleFont: { size: 10, weight: 'bold', family: 'Inter' },
                bodyFont: { size: 12, weight: '900', family: 'Inter' },
                padding: 12,
                cornerRadius: 8,
                displayColors: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f8fafc', drawBorder: false },
                ticks: { font: { size: 10, weight: '700' }, color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { font: { size: 10, weight: '700' }, color: '#94a3b8' }
            }
        }
    };

    const content = (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Top Toolbar */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">Month-Wise Sales</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <input 
                            type="date" 
                            value={dateRange.start} 
                            onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} 
                            className="bg-white border-2 border-slate-300 rounded-sm py-1.5 px-2 text-sm text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors" 
                        />
                        <span className="text-slate-400 font-bold">-</span>
                        <input 
                            type="date" 
                            value={dateRange.end} 
                            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} 
                            className="bg-white border-2 border-slate-300 rounded-sm py-1.5 px-2 text-sm text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors" 
                        />
                    </div>
                    <button 
                        className="px-4 py-1.5 bg-slate-800 text-white rounded-sm font-semibold text-xs hover:bg-slate-900 transition-colors flex items-center gap-2" 
                        onClick={fetchData}
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
                <div className="flex gap-4 overflow-x-auto custom-scrollbar">
                    <div className="flex-1 min-w-[200px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Aggregate Revenue Recognition</div>
                        <div className="text-xl font-bold text-indigo-700">₹{fmt(summary.totalSales)}</div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Aggregate Doc Volume</div>
                        <div className="text-xl font-bold text-slate-800">{summary.totalBills}</div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-32">
                    <Loader2 className="animate-spin text-indigo-600 mb-6" size={48} />
                    <p className="text-slate-300 font-bold tracking-widest uppercase text-[10px]">Processing Longitudinal Matrix...</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col xl:flex-row gap-4 p-4 min-h-0 bg-slate-50">
                    {/* Visual Trajectory */}
                    <div className="xl:flex-1 bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Temporal Revenue Vector</h3>
                        </div>
                        <div className="flex-1 min-h-[300px]">
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Monthly Data Precinct */}
                    <div className="xl:w-[400px] bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
                        <div className="overflow-y-auto custom-scrollbar flex-1 min-h-[300px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#F8FAFC] text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="py-3 px-4">Chronology</th>
                                        <th className="py-3 px-4 text-center">Volume</th>
                                        <th className="py-3 px-4 text-right">Yield</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.length === 0 ? (
                                        <tr><td colSpan={3} className="p-8 text-center text-slate-400 font-bold uppercase text-[10px]">No logs detected</td></tr>
                                    ) : (
                                        data.map((m, ix) => (
                                            <tr key={ix} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/dashboard/self-service/bills-sales', { state: { search: m.month } })}>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm font-bold text-slate-800">{m.month}</span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                        {m.billCount} docs
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                                                    ₹{fmt(m.totalSales)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
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
                <Header toggleSidebar={toggleSidebar} title="Month-Wise Sales Summary" />
                <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden m-2 lg:m-4 rounded-xl border border-slate-200">
                    {content}
                </div>
            </main>
        </DashboardPageShell>
    );
};

export default MonthWiseSales;
