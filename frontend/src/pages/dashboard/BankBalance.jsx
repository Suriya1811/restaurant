import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import { Download, Loader2, Landmark } from 'lucide-react';
import './Dashboard.css';

const BankBalance = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [totalBalance, setTotalBalance] = useState(0);

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

            const res = await fetch(`${import.meta.env.VITE_API_URL}/reports/account-balances?type=BANK`, { headers });
            const result = await res.json();

            if (result.success) {
                setData(result.data || []);
                setTotalBalance(result.totalBalance || 0);
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
        const headers = "Entity Details,Opening Registry,Allocated Bank Bounds\n";
        const rows = data.map(row => `"${row.name}",${row.opening_balance},${row.current_balance}`).join('\n');

        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Bank_Balance.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />

                <div className="master-content-layout fade-in">
                    <div className="master-header-premium">
                        <div className="master-title-premium">
                            <div className="flex items-center gap-2 mb-2">
                                <Landmark className="text-blue-600" size={18} />
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full">Accounts</span>
                            </div>
                            <h2>Digital Liquid Assets</h2>
                            <p>Bank network tracking indexing active float structures mapped across instances.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={exportToCSV} className="btn-premium-outline">
                                <Download size={18} /> EXPORT CSV
                            </button>
                        </div>
                    </div>

                    <div className="toolbar-premium">
                        <div className="flex gap-4 items-center w-full justify-between">
                            <div className="text-slate-400 font-bold text-sm">
                                Trackable Nodes: {data.length} Instances(s)
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Aggregate Remote Cash</div>
                                <div className="text-2xl font-black text-blue-600">₹{totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20">
                            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Processing Institute Gateways...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
                            <div className="table-container-premium">
                                <table className="table-premium w-full">
                                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                        <tr>
                                            <th>Ledger / Target Gateway</th>
                                            <th style={{ textAlign: 'right' }}>Registered Ground Array</th>
                                            <th style={{ textAlign: 'right' }}>Current Liquid Limit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.length === 0 ? (
                                            <tr><td colSpan="3" className="text-center py-10 text-slate-400 font-bold bg-slate-50/50">No centralized banking ledgers bound to gateway.</td></tr>
                                        ) : (
                                            data.map((row, ix) => (
                                                <tr key={ix}>
                                                    <td className="font-bold text-slate-700">{row.name}</td>
                                                    <td className="text-right font-black text-slate-400">
                                                        ₹{row.opening_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-right font-black text-blue-600">
                                                        ₹{row.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default BankBalance;
