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
    Legend,
    ArcElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Download, Loader2, Calendar, Users, Printer } from 'lucide-react';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const SupplierWisePurchase = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ totalAmount: 0, totalDue: 0, totalPaid: 0 });

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

            const url = `${import.meta.env.VITE_API_URL}/reports/purchase-summary?groupBy=SUPPLIER&startDate=${dateRange.start}&endDate=${dateRange.end}`;
            const res = await fetch(url, { headers });
            const result = await res.json();

            if (result.success) {
                const fetchedData = result.data || [];
                setData(fetchedData);
                setSummary({
                    totalAmount: fetchedData.reduce((sum, item) => sum + item.amount, 0),
                    totalDue: fetchedData.reduce((sum, item) => sum + item.due, 0),
                    totalPaid: fetchedData.reduce((sum, item) => sum + item.paid, 0)
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
        const headers = "Supplier Name,Total Gross,Total Paid,Total Due\n";
        const rows = data.map(row => `"${row.name}",${row.amount},${row.paid},${row.due}`).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Supplier_Wise_Purchase_${dateRange.start}_to_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateColors = (count) => {
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'
        ];
        return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
    };

    const chartRenderData = data.slice(0, 8); // Display top 8 in pie/doughnut 
    const palette = generateColors(chartRenderData.length);

    const chartData = {
        labels: chartRenderData.map(d => d.name),
        datasets: [
            {
                data: chartRenderData.map(d => d.amount),
                backgroundColor: palette,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 10
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
                labels: { font: { weight: 'bold' } }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.label}: ₹${context.raw.toLocaleString('en-IN')}`;
                    }
                }
            }
        },
        cutout: '65%',
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const label = chartData.labels[index];
                navigate('/dashboard/self-service/purchase-invoices', { state: { supplierName: label } });
            }
        }
    };

    const sortedTableData = [...data].sort((a, b) => b.amount - a.amount);

    const content = (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Top Toolbar */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">Supplier-Wise Purchase</span>
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
                        className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-sm font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-2" 
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
                        <div className="text-xs text-slate-500 font-semibold mb-1">Aggregate Spend</div>
                        <div className="text-xl font-bold text-red-600">₹{summary.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Aggregate Dues</div>
                        <div className="text-xl font-bold text-amber-600">₹{summary.totalDue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                </div>
            </div>
            <div className="flex-1 flex flex-col p-4 bg-slate-50 min-h-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
                        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading...</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
                        <div className="md:w-1/3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center h-full">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6 w-full text-left">Capital Outflow Distribution</h3>
                            <div style={{ position: 'relative', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                                {data.length > 0 ? (
                                    <Doughnut data={chartData} options={chartOptions} />
                                ) : (
                                    <div className="flex justify-center items-center h-32 text-slate-400 font-bold text-sm">No data found</div>
                                )}
                                {data.length > 0 && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-4 -ml-[72px]">
                                        <div className="text-2xl font-black text-slate-800">
                                            {chartRenderData.length}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entities</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:w-2/3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="overflow-auto flex-1 custom-scrollbar w-full">
                                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                                    <thead className="sticky top-0 bg-[#F8FAFC] z-10 shadow-sm border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="py-3 px-4">Supplier Entity</th>
                                            <th className="py-3 px-4 text-right">Paid</th>
                                            <th className="py-3 px-4 text-right">Due</th>
                                            <th className="py-3 px-4 text-right">Gross Billed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sortedTableData.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-bold">No entries mapped</td></tr>
                                        ) : (
                                            sortedTableData.map((supp, ix) => (
                                                <tr key={ix}
                                                    onClick={() => navigate('/dashboard/self-service/purchase-invoices', { state: { supplierName: supp.name } })}
                                                    style={{ cursor: 'pointer' }}
                                                    className="hover:bg-slate-50 transition-colors text-sm text-slate-700"
                                                >
                                                    <td className="py-3 px-4 font-semibold text-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ background: palette[ix % palette.length] || '#cbd5e1' }}></div>
                                                            {supp.name}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                                                        ₹{supp.paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-amber-600 font-semibold">
                                                        ₹{supp.due.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-slate-800 font-semibold">
                                                        ₹{supp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <Header toggleSidebar={toggleSidebar} title="Supplier-Wise Purchase Summary" />
                <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden m-2 lg:m-4 rounded-xl border border-slate-200">
                    {content}
                </div>
            </main>
        </div>
    );
};

export default SupplierWisePurchase;
