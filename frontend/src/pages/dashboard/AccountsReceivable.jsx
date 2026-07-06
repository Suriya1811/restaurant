import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { Download, Loader2, ArrowDownToLine } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AccountsReceivable = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [ranges, setRanges] = useState({});
    const [details, setDetails] = useState([]);

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

            const res = await fetch(`${import.meta.env.VITE_API_URL}/reports/aging-report?type=CUSTOMER`, { headers });
            const result = await res.json();

            if (result.success) {
                setRanges(result.data || {});
                setDetails(result.details || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportToCSV = () => {
        if (!details.length) return;
        const headers = "Entity,Reference,Date,Age (Days),Amount\n";
        const rows = details.map(row => `"${row.entity}","${row.reference}",${row.date.split('T')[0]},${row.age},${row.amount}`).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Accounts_Receivable_Aging.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalReceivable = Object.values(ranges).reduce((sum, val) => sum + val, 0);

    const chartData = {
        labels: ['0-30 Days', '30-60 Days', '60+ Days (Critical)'],
        datasets: [{
            label: 'Outstanding Volume (₹)',
            data: [ranges['0-30'] || 0, ranges['30-60'] || 0, ranges['60+'] || 0],
            backgroundColor: [
                'rgba(56, 189, 248, 0.8)', // Blue
                'rgba(245, 158, 11, 0.8)', // Amber
                'rgba(239, 68, 68, 0.8)'   // Red
            ],
            borderWidth: 0,
            borderRadius: 4
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
        }
    };

    const content = (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Top Toolbar */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">Accounts Receivable</span>
                </div>
                <div className="flex items-center gap-3">
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
                    <div className="flex-1 min-w-[150px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">0-30 Days</div>
                        <div className="text-xl font-bold text-sky-600">₹{(ranges['0-30'] || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">30-60 Days</div>
                        <div className="text-xl font-bold text-amber-500">₹{(ranges['30-60'] || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">60+ Days</div>
                        <div className="text-xl font-bold text-red-500">₹{(ranges['60+'] || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Total Outstanding</div>
                        <div className="text-xl font-bold text-emerald-600">₹{totalReceivable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0 bg-slate-50">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12">
                        <Loader2 className="animate-spin text-emerald-600 mb-4" size={48} />
                        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading...</p>
                    </div>
                ) : (
                    <>
                        <div className="md:w-1/3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Aging Distribution</h3>
                            <div className="flex-1 relative min-h-[240px]">
                                <Bar data={chartData} options={chartOptions} />
                            </div>
                        </div>

                        <div className="md:w-2/3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="overflow-auto flex-1 custom-scrollbar w-full">
                                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                                    <thead className="sticky top-0 bg-[#F8FAFC] z-10 shadow-sm border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <tr>
                                            <th className="py-3 px-4">Reference</th>
                                            <th className="py-3 px-4">Entity</th>
                                            <th className="py-3 px-4 text-center">Age (Days)</th>
                                            <th className="py-3 px-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {details.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-bold bg-slate-50">No pending receivables detected.</td></tr>
                                        ) : (
                                            details.map((item, ix) => (
                                                <tr key={ix} className="hover:bg-slate-50 transition-colors text-sm text-slate-700">
                                                    <td className="py-3 px-4 font-semibold text-slate-800">
                                                        <div className="text-xs text-slate-500 font-normal">{new Date(item.date).toLocaleDateString()}</div>
                                                        <span 
                                                            onClick={() => item.id && navigate('/dashboard/self-service/bills-sales', { state: { billId: item.id } })}
                                                            className="text-indigo-600 hover:underline cursor-pointer"
                                                        >
                                                            {item.reference}
                                                        </span>
                                                    </td>
                                                    <td 
                                                        className="py-3 px-4 font-medium hover:text-indigo-600 cursor-pointer transition-colors"
                                                        onClick={() => item.ledger_id && navigate('/dashboard/self-service/ledger-statement', { state: { ledgerId: item.ledger_id } })}
                                                    >
                                                        {item.entity}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold
                                                            ${item.age > 60 ? 'bg-red-50 text-red-600 border border-red-100' :
                                                                item.age > 30 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                    'bg-sky-50 text-sky-600 border border-sky-100'}
                                                        `}>
                                                            {item.age} Days
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                                                        ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    if (isEmbedded) return content;

    return (
        <div className="dashboard-layout bg-white">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main flex-1 overflow-hidden font-sans flex flex-col bg-slate-50">
                <Header toggleSidebar={toggleSidebar} title="Accounts Receivable Summary" />
                <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden m-2 lg:m-4 rounded-xl border border-slate-200">
                    {content}
                </div>
            </main>
        </div>
    );
};

export default AccountsReceivable;
