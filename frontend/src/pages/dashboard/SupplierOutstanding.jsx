import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { Download, Loader2, Building2 } from 'lucide-react';
import './Dashboard.css';

const SupplierOutstanding = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({ totalOutstanding: 0, supplierCount: 0 });

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

            const res = await fetch(`${import.meta.env.VITE_API_URL}/reports/supplier-outstanding`, { headers });
            const result = await res.json();

            if (result.success) {
                const fetchedData = result.data || [];
                setData(fetchedData);
                setSummary({
                    totalOutstanding: fetchedData.reduce((sum, item) => sum + item.balance, 0),
                    supplierCount: fetchedData.length
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
    }, []);

    const exportToCSV = () => {
        if (!data.length) return;
        const headers = "Supplier Name,Contact Person,Outstanding Balance\n";
        const rows = data.map(row => `"${row.name}","${row.contact || ''}",${row.balance}`).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Supplier_Outstanding.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const content = (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Top Toolbar */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">Supplier Outstanding</span>
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
                    <div className="flex-1 min-w-[200px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Active Accounts</div>
                        <div className="text-xl font-bold text-slate-800">{summary.supplierCount}</div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Aggregate Liability</div>
                        <div className="text-xl font-bold text-red-600">₹{summary.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative bg-slate-50 p-4 min-h-0">
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-20">
                            <Loader2 className="animate-spin text-red-600 mb-4" size={32} />
                            <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px]">Loading...</p>
                        </div>
                    ) : (
                        <div className="overflow-auto flex-1 custom-scrollbar w-full">
                            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                                <thead className="sticky top-0 bg-[#F8FAFC] z-10 border-b border-slate-200 shadow-sm text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-3">Corporate Entity</th>
                                        <th className="px-6 py-3">Contact Point</th>
                                        <th className="px-6 py-3 text-right">Outstanding Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="text-center py-24 text-slate-400 font-bold">No data found</td>
                                        </tr>
                                    ) : (
                                        data.map((item, ix) => (
                                            <tr key={ix} 
                                                onClick={() => navigate('/dashboard/self-service/ledger-statement', { state: { ledgerId: item.ledger_id } })}
                                                className="hover:bg-slate-50 transition-all cursor-pointer text-sm text-slate-700"
                                            >
                                                <td className="px-6 py-3 font-semibold text-slate-800">
                                                    {item.name}
                                                </td>
                                                <td className="px-6 py-3">
                                                    {item.contact || <span className="text-slate-400 italic text-xs">No Contact Provided</span>}
                                                </td>
                                                <td className="px-6 py-3 text-right font-semibold text-red-600">
                                                    ₹{item.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
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
                <Header toggleSidebar={toggleSidebar} title="Supplier Outstanding Summary" />
                <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden m-2 lg:m-4 rounded-xl border border-slate-200">
                    {content}
                </div>
            </main>
        </div>
    );
};

export default SupplierOutstanding;
