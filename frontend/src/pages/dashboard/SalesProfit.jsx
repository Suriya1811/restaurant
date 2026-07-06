import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ReportNavigationDropdown from '@/components/dashboard/ReportNavigationDropdown';
import {
    Search,
    TrendingUp,
    TrendingDown,
    Activity,
    Loader2,
    RefreshCw,
    Calendar,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Briefcase,
    DollarSign,
    Box,
    Layers,
    Tag,
    ChevronRight,
    Download,
    Settings,
    Database,
    ChevronDown,
    Landmark,
    Building2,
    Eye,
    X,
    FileText,
    Printer,
    Target
} from 'lucide-react';
import './Dashboard.css';

const SalesProfit = ({ isEmbedded = false }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({
        totalSales: 0,
        return: 0,
        salesProfit: 0
    });

    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        groupBy: 'BILL' // BILL, ITEM, CATEGORY, BRAND
    });

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const queryParams = new URLSearchParams({
                startDate: filters.startDate,
                endDate: filters.endDate,
                groupBy: filters.groupBy
            }).toString();

            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/sales-profit?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();
            if (result.success) {
                setReportData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch sales profit report", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReport();
    }, [filters.startDate, filters.endDate, filters.groupBy, fetchReport]);

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
        if (reportData.length === 0) return;
        const headers = ["Trans No", "Date", "Party", "Item", "Category", "Brand", "Revenue", "Cost Basis", "Sales Basis", "Profit", "Margin %"];
        const rows = reportData.map(row => [
            row.transaction_no,
            row.date === "---" ? "---" : new Date(row.date).toLocaleDateString(),
            row.party_name,
            row.item_name,
            row.category,
            row.brand,
            row.bill_amount,
            row.cost_rate,
            row.sales_rate,
            row.profit_amt,
            row.profit_pct
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Profit_Audit_${filters.startDate}.csv`);
        link.click();
    };

    const content = (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Top Toolbar */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">Profitability Audit</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <input 
                            type="date" 
                            value={filters.startDate} 
                            onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} 
                            className="bg-white border-2 border-slate-300 rounded-sm py-1.5 px-2 text-sm text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors" 
                        />
                        <span className="text-slate-400 font-bold">-</span>
                        <input 
                            type="date" 
                            value={filters.endDate} 
                            onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} 
                            className="bg-white border-2 border-slate-300 rounded-sm py-1.5 px-2 text-sm text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors" 
                        />
                    </div>
                    <button 
                        className="px-4 py-1.5 bg-slate-800 text-white rounded-sm font-semibold text-xs hover:bg-slate-900 transition-colors flex items-center gap-2" 
                        onClick={fetchReport}
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
                        <div className="text-xs text-slate-500 font-semibold mb-1">Gross Generated Revenue</div>
                        <div className="text-xl font-bold text-slate-800">₹{fmt(summary.totalSales)}</div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Sales Return / Variance</div>
                        <div className="text-xl font-bold text-rose-600">₹{fmt(summary.return)}</div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Net Fiscal Yield (Profit)</div>
                        <div className="text-xl font-bold text-emerald-600">₹{fmt(summary.salesProfit)}</div>
                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{summary.totalSales === 0 ? 0 : ((summary.salesProfit / summary.totalSales) * 100).toFixed(2)}% Margin</div>
                    </div>
                </div>
            </div>

            {/* Filter Navigation Tool Hub */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 mr-2">Group By:</span>
                    <div className="flex bg-slate-100 p-1 rounded">
                        {[
                            { id: 'BILL', label: 'Bill' },
                            { id: 'ITEM', label: 'SKU' },
                            { id: 'CATEGORY', label: 'Category' },
                            { id: 'BRAND', label: 'Brand' }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setFilters(p => ({ ...p, groupBy: mode.id }))}
                                className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors ${filters.groupBy === mode.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Precision Profitability Grid */}
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                    <thead className="bg-[#F8FAFC] text-[10px] font-black text-[#64748B] uppercase tracking-widest border-b border-slate-200 shadow-sm sticky top-0 z-20">
                        <tr>
                            <th className="py-3 px-4">Trans ID</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Manifest / Party</th>
                            <th className="py-3 px-4">Commodity (SKU)</th>
                            <th className="py-3 px-4 text-right bg-slate-50">Revenue (Bill)</th>
                            <th className="py-3 px-4 text-right">Cost Basis</th>
                            <th className="py-3 px-4 text-right">Sales Basis</th>
                            <th className="py-3 px-4 text-right bg-slate-50">Fiscal Yield (Profit)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={8} className="p-20 text-center">
                                    <Loader2 size={32} className="animate-spin mb-4 mx-auto text-indigo-500" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Calculating Fiscal Margins...</p>
                                </td></tr>
                            ) : reportData.length === 0 ? (
                                <tr><td colSpan={8} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No operational transactions logged</td></tr>
                            ) : reportData.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50 text-sm text-slate-700">
                                    <td className="py-3 px-4 font-medium text-slate-800">{row.transaction_no}</td>
                                    <td className="py-3 px-4">{row.date === "---" ? "---" : new Date(row.date).toLocaleDateString('en-GB')}</td>
                                    <td className="py-3 px-4">
                                        <span className="font-medium text-slate-800">{row.party_name}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div>
                                            <span className="font-medium text-slate-800 block">{row.item_name}</span>
                                            <div className="flex gap-1.5 mt-0.5 text-xs text-slate-500">
                                                <span>{row.category}</span>
                                                <span>•</span>
                                                <span>{row.brand}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right font-semibold text-slate-900 bg-slate-50/20">₹{fmt(row.bill_amount)}</td>
                                    <td className="py-3 px-4 text-right text-slate-500">₹{row.cost_rate === 0 ? "---" : fmt(row.cost_rate)}</td>
                                    <td className="py-3 px-4 text-right text-slate-500 border-r border-slate-50">₹{row.sales_rate === 0 ? "---" : fmt(row.sales_rate)}</td>
                                    <td className="py-3 px-4 text-right bg-slate-50/20">
                                        <div className="flex flex-col items-end">
                                            <span className={`font-semibold ${row.profit_amt >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{fmt(row.profit_amt)}</span>
                                            <span className={`text-xs ${row.profit_amt >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{row.profit_pct}% Margin</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                <Header toggleSidebar={toggleSidebar} title="Sales Profit Summary" />
                <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden m-2 lg:m-4 rounded-xl border border-slate-200">
                    {content}
                </div>
            </main>
        </div>
    );
};

export default SalesProfit;

