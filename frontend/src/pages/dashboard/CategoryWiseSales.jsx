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
    Legend,
    ArcElement
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import {
    Download,
    Loader2,
    Calendar,
    Layers,
    Activity,
    Target,
    RefreshCw,
    ChevronRight,
    Eye,
    Landmark,
    PieChart,
    Database,
    Printer
} from 'lucide-react';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const CategoryWiseSales = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ totalSales: 0, itemCount: 0 });

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            const url = `${import.meta.env.VITE_API_URL}/reports/sales-by-category?startDate=${dateRange.start}&endDate=${dateRange.end}`;
            const res = await fetch(url, { headers });
            const result = await res.json();

            if (result.success) {
                const fetchedData = result.data || [];
                setData(fetchedData);
                setSummary({
                    totalSales: fetchedData.reduce((sum, item) => sum + item.totalSales, 0),
                    itemCount: fetchedData.reduce((sum, item) => sum + item.itemCount, 0)
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
        const headers = ["Segment", "Unit Volume", "Revenue Realization"];
        const rows = data.map(d => [d.category, d.itemCount, d.totalSales]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Category_Audit_${dateRange.start}.csv`);
        link.click();
    };

    const chartRenderData = data.slice(0, 8);
    const industrialPalette = [
        '#4f46e5', '#1e1b4b', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#f5f3ff'
    ];

    const chartData = {
        labels: chartRenderData.map(d => d.category),
        datasets: [
            {
                data: chartRenderData.map(d => d.totalSales),
                backgroundColor: industrialPalette,
                borderWidth: 0,
                hoverOffset: 20
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 10, weight: 'bold' },
                bodyFont: { size: 12, weight: '900' }
            }
        },
        cutout: '80%',
    };

    const sortedTableData = [...data].sort((a, b) => b.totalSales - a.totalSales);

    const content = (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Top Toolbar */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">Category-Wise Sales</span>
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
                        <div className="text-xs text-slate-500 font-semibold mb-1">Aggregate Segment Yield</div>
                        <div className="text-xl font-bold text-indigo-700">₹{fmt(summary.totalSales)}</div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Net Inventory Flow</div>
                        <div className="text-xl font-bold text-slate-800">{summary.itemCount} Units</div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-32">
                    <Loader2 className="animate-spin text-indigo-600 mb-6" size={48} />
                    <p className="text-slate-300 font-bold tracking-widest uppercase text-[10px]">Assembling Segmental Matrix...</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col xl:flex-row gap-4 p-4 min-h-0 bg-slate-50">
                    {/* Visual Analytics */}
                    <div className="xl:flex-1 bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[350px]">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6 self-start">Yield Distribution</h3>
                        <div className="relative w-full max-w-[280px] aspect-square flex-1">
                            <Doughnut data={chartData} options={chartOptions} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-slate-800 tracking-tighter">{data.length}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Categories</span>
                            </div>
                        </div>
                        <div className="mt-8 w-full flex flex-wrap justify-center gap-3">
                            {chartRenderData.map((d, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: industrialPalette[i] }}></div>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{d.category}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Segment Data Precinct */}
                    <div className="xl:w-[450px] bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
                        <div className="overflow-y-auto custom-scrollbar flex-1 min-h-[350px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#F8FAFC] text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="py-3 px-4">Segment Hub</th>
                                        <th className="py-3 px-4 text-center">Operational Units</th>
                                        <th className="py-3 px-4 text-right">Yield Recognition</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedTableData.length === 0 ? (
                                        <tr><td colSpan={3} className="p-8 text-center text-slate-400 font-bold uppercase text-[10px]">No categorical data detected</td></tr>
                                    ) : (
                                        sortedTableData.map((cat, ix) => (
                                            <tr key={ix} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/dashboard/self-service/bills-sales', { state: { search: cat.category } })}>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm font-bold text-slate-800">{cat.category || 'Generic/Misc'}</span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                        {cat.itemCount} Units
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                                                    ₹{fmt(cat.totalSales)}
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
                <Header toggleSidebar={toggleSidebar} title="Category-Wise Sales Summary" />
                <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden m-2 lg:m-4 rounded-xl border border-slate-200">
                    {content}
                </div>
            </main>
        </DashboardPageShell>
    );
};

export default CategoryWiseSales;

