import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import ReportNavigationDropdown from '../../components/dashboard/ReportNavigationDropdown';
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
import { Download, Loader2, Calendar, ShoppingCart, LayoutDashboard, RefreshCw, Printer, Activity, Target } from 'lucide-react';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DayWisePurchase = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ totalAmount: 0, totalDocs: 0 });

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

    const fetchData = async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            const url = `${import.meta.env.VITE_API_URL}/reports/purchase/day-wise?startDate=${dateRange.start}&endDate=${dateRange.end}`;
            const res = await fetch(url, { headers });
            const result = await res.json();

            if (result.success) {
                setData(result.data.dailyBreakdown || []);
                setSummary({
                    totalAmount: result.data.totalAmount || 0,
                    totalDocs: result.data.totalDocs || 0
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const exportToCSV = () => {
        if (!data.length) return;
        const headers = "Date,Total Docs,Total Amount\n";
        const rows = data.map(row => `${row.date},${row.billCount},${row.totalPurchases}`).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Day_Wise_Purchase_${dateRange.start}_to_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const chartData = {
        labels: data.map(d => d.date),
        datasets: [
            {
                label: 'Daily Expend (₹)',
                data: data.map(d => d.totalPurchases),
                backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red-ish for expense
                borderColor: '#ef4444',
                borderWidth: 1,
                borderRadius: 4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                bottom: 25,
                left: 10,
                right: 10,
                top: 5
            }
        },
        plugins: {
            legend: { display: false },
            title: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9', drawBorder: false },
                ticks: { color: '#94a3b8', font: { size: 10, weight: '700' } }
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 10, weight: '700' },
                    maxRotation: 45,
                    minRotation: 45,
                    padding: 8,
                    autoSkip: true,
                    maxTicksLimit: 15
                }
            }
        },
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const label = chartData.labels[index];
                navigate('/dashboard/self-service/purchase-invoices', { state: { date: label } });
            }
        }
    };

    const content = (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Top Toolbar */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">Day-Wise Purchase</span>
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
                    <button 
                        className="btn-export print" 
                        onClick={() => window.print()}
                    >
                        <Printer size={14} /> Print
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex gap-4 overflow-x-auto custom-scrollbar">
                    <div className="flex-1 min-w-[200px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Aggregate Purchase</div>
                        <div className="text-xl font-bold text-red-600">₹{summary.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Logged Invoices</div>
                        <div className="text-xl font-bold text-slate-800">{summary.totalDocs}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0 bg-slate-50">
                <div className="md:w-2/3 bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col min-h-[300px]">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Capital Outflow Trajectory</h3>
                    <div className="flex-1 relative h-72 md:h-80">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                <Loader2 className="animate-spin text-red-600 mb-2" size={32} />
                            </div>
                        ) : null}
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                </div>

                <div className="md:w-1/3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#F8FAFC] text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="py-3 px-4 whitespace-nowrap">Chronology</th>
                                    <th className="py-3 px-4 text-center whitespace-nowrap">Invoices</th>
                                    <th className="py-3 px-4 text-right whitespace-nowrap text-red-700 bg-red-50/50">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={3} className="py-20 text-center">
                                        <Loader2 size={24} className="animate-spin mb-3 mx-auto text-indigo-500" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading...</p>
                                    </td></tr>
                                ) : data.length === 0 ? (
                                    <tr><td colSpan={3} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No data found</td></tr>
                                ) : (
                                    data.map((day, ix) => (
                                        <tr key={ix}
                                            onClick={() => navigate('/dashboard/self-service/purchase-invoices', { state: { date: day.date } })}
                                            className="hover:bg-slate-50 group transition-all text-sm cursor-pointer"
                                        >
                                            <td className="py-3 px-4">
                                                <span className="font-semibold text-slate-800">{day.date}</span>
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium text-slate-500">{day.billCount}</td>
                                            <td className="py-3 px-4 text-right font-semibold text-red-600 bg-red-50/20">
                                                ₹{day.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isEmbedded) {
        return content;
    }

    return (
        <div className="dashboard-layout bg-white">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main flex-1 overflow-hidden font-sans flex flex-col bg-slate-50">
                <Header toggleSidebar={toggleSidebar} title="Day-Wise Purchase Summary" />
                <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden m-2 lg:m-4 rounded-xl border border-slate-200">
                    {content}
                </div>
            </main>
        </div>
    );
};

export default DayWisePurchase;
