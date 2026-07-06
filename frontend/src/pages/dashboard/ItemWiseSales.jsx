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
    Package,
    LayoutGrid,
    SearchCode,
    Barcode,
    Database,
    ChevronDown,
    X,
    Eye,
    Printer,
    Target
} from 'lucide-react';
import './Dashboard.css';

const ItemWiseSales = ({ isEmbedded = false }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Data States
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({
        totalItems: 0,
        salesQty: 0,
        returnQty: 0,
        totalSalesQty: 0,
        salesValue: 0
    });

    // Filter States
    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        search: '',
        category: '',
        brand: ''
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
                search: filters.search,
                category: filters.category,
                brand: filters.brand
            }).toString();

            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/sales/item-detailed?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();
            if (result.success) {
                setReportData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch detailed item-wise report", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReport();
    }, [filters.startDate, filters.endDate, filters.category, filters.brand, fetchReport]);

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
        const headers = ["Code", "Barcode", "Item Name", "Category", "Brand", "Sales Qty", "Sales Value", "Return Qty", "Return Value", "Net Qty", "Net Value"];
        const rows = reportData.map(d => [
            d.code, d.barcode, d.name, d.category, d.brand,
            d.salesQty, d.salesValue, d.returnQty, d.returnValue, d.netQty, d.netValue
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Item_Analysis_${filters.startDate}.csv`);
        link.click();
    };

    const content = (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Top Toolbar */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">Item-Wise Sales</span>
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
                </div>
            </div>

            {/* Summary Cards */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex gap-4 overflow-x-auto custom-scrollbar min-w-[720px]">
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Active SKUs Traded</div>
                        <div className="text-xl font-bold text-slate-800">{summary.totalItems}</div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Gross Qty Out</div>
                        <div className="text-xl font-bold text-slate-800">{summary.salesQty}</div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Return Vol</div>
                        <div className="text-xl font-bold text-rose-600">{summary.returnQty}</div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Net Trading Vol</div>
                        <div className="text-xl font-bold text-slate-800">{summary.totalSalesQty}</div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Fiscal Realization</div>
                        <div className="text-xl font-bold text-slate-800">₹{fmt(summary.salesValue)}</div>
                    </div>
                </div>
            </div>

            {/* Filter Navigation Tool Hub */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
                <div className="flex-1 min-w-[200px] max-w-sm">
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Scan Matrix (SKU, Barcode, Name, Group)..."
                            className="w-full bg-white border-2 border-slate-300 rounded-sm py-1.5 pl-9 pr-4 text-sm font-medium text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors placeholder:normal-case"
                            value={filters.search}
                            onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <select
                            className="bg-white border-2 border-slate-300 rounded-sm py-1.5 px-2 text-sm text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors"
                            value={filters.category}
                            onChange={(e) => setFilters(p => ({ ...p, category: e.target.value }))}
                        >
                            <option value="">All Categories</option>
                            {[...new Set(reportData.map(d => d.category))].filter(Boolean).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select
                            className="bg-white border-2 border-slate-300 rounded-sm py-1.5 px-2 text-sm text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors"
                            value={filters.brand}
                            onChange={(e) => setFilters(p => ({ ...p, brand: e.target.value }))}
                        >
                            <option value="">All Brands</option>
                            {[...new Set(reportData.map(d => d.brand))].filter(Boolean).map(br => (
                                <option key={br} value={br}>{br}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Detailed SKU Movement Grid */}
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                    <thead className="bg-[#F8FAFC] text-[10px] font-black text-[#64748B] uppercase tracking-widest border-b border-slate-200 shadow-sm sticky top-0 z-20">
                        <tr>
                            <th className="py-3 px-4">Registry Code</th>
                            <th className="py-3 px-4">Commodity Detail</th>
                            <th className="py-3 px-4 text-center bg-indigo-50/50">Gross Qty</th>
                            <th className="py-3 px-4 text-right bg-indigo-50/50">Gross Value</th>
                            <th className="py-3 px-4 text-center bg-rose-50/50">Return Qty</th>
                            <th className="py-3 px-4 text-right bg-rose-50/50">Return Value</th>
                            <th className="py-3 px-4 text-center">Net Qty</th>
                            <th className="py-3 px-4 text-right">Net Realized</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={8} className="p-20 text-center">
                                    <Loader2 size={32} className="animate-spin mb-4 mx-auto text-indigo-500" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Auditing SKU Matrix...</p>
                                </td></tr>
                            ) : reportData.length === 0 ? (
                                <tr><td colSpan={8} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No movement detected in selected window</td></tr>
                            ) : reportData.map((d, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 group transition-all text-sm">
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-slate-800">{d.code}</span>
                                            <span className="text-xs text-slate-500">{d.barcode}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 min-w-[200px]">
                                        <span className="font-bold text-slate-800 block">{d.name}</span>
                                        <div className="flex gap-1.5 text-xs text-slate-500">
                                            <span>{d.category}</span>
                                            <span>•</span>
                                            <span>{d.brand}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center font-bold text-slate-700 bg-indigo-50/20">{d.salesQty}</td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-700 bg-indigo-50/20 border-r border-slate-50">₹{fmt(d.salesValue)}</td>

                                    <td className="py-3 px-4 text-center font-bold text-rose-500 bg-rose-50/20">{d.returnQty}</td>
                                    <td className="py-3 px-4 text-right font-bold text-rose-600 bg-rose-50/20 border-r border-slate-50">₹{fmt(d.returnValue)}</td>

                                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{d.netQty}</td>
                                    <td className="py-3 px-4 text-right font-black text-slate-900">₹{fmt(d.netValue)}</td>
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
                <Header toggleSidebar={toggleSidebar} title="Item-Wise Sales Summary" />
                <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden m-2 lg:m-4 rounded-xl border border-slate-200">
                    {content}
                </div>
            </main>
        </div>
    );
};

export default ItemWiseSales;

