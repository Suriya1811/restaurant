import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardPageShell from '../components/dashboard/DashboardPageShell';
import ReportNavigationDropdown from '@/components/dashboard/ReportNavigationDropdown';
import {
    Search,
    Package,
    AlertTriangle,
    RefreshCw,
    Download,
    FileText,
    Settings,
    Eye,
    EyeOff,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    MinusCircle,
    Activity,
    Layers,
    ChevronDown,
    Building2,
    Database,
    X,
    CheckCircle2,
    Loader2,
    Calendar
} from 'lucide-react';
import './StockPage.css';

const StockPage = ({ isEmbedded = false, embeddedFilter = null }) => {
    const location = useLocation();
    const activeFilter = embeddedFilter || new URLSearchParams(location.search).get('filter') || 'all';
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [stockData, setStockData] = useState([]);
    const [summary, setSummary] = useState({
        totalStock: 0,
        totalStockValue: 0,
        nilStock: 0,
        negativeStock: 0,
        minStock: 0
    });

    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        search: '',
        category: '',
        brand: ''
    });

    const [reportType, setReportType] = useState('NORMAL'); // NORMAL or DETAILED
    const [showSettings, setShowSettings] = useState(false);

    // Detailed column selection state
    const [selectedColumns, setSelectedColumns] = useState({
        code: true,
        barcode: true,
        name: true,
        category: true,
        brand: true,
        unit: true,
        purchase_price: true,
        cost_price: true,
        selling_price: true,
        mrp: true,
        openingStk: true,
        stockIn: true,
        stockOut: true,
        closingStk: true,
        stockValue: true
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

            const response = await fetch(`${import.meta.env.VITE_API_URL}/stock/report?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();
            if (result.success) {
                setStockData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch stock report", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReport();
    }, [filters.startDate, filters.endDate, filters.category, filters.brand, fetchReport]);

    // Client-side filter based on URL param
    const filteredStockData = useMemo(() => {
        if (!stockData.length) return stockData;
        switch (activeFilter) {
            case 'negative': return stockData.filter(p => (p.closingStk || 0) < 0);
            case 'nil': return stockData.filter(p => (p.closingStk || 0) === 0);
            case 'min': return stockData.filter(p => p.min_stock != null && (p.closingStk || 0) < p.min_stock);
            case 'max': return stockData.filter(p => p.max_stock != null && (p.closingStk || 0) > p.max_stock);
            case 'moving': return stockData.filter(p => (p.stockOut || 0) > 0);
            case 'non-moving': return stockData.filter(p => (p.stockOut || 0) === 0);
            case 'transaction': return stockData.filter(p => (p.stockIn || 0) > 0 || (p.stockOut || 0) > 0);
            case 'all':
            default: return stockData;
        }
    }, [stockData, activeFilter]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const handleSearchInput = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter') fetchReport();
    };

    const exportToCSV = () => {
        const headers = reportType === 'NORMAL'
            ? ['CODE', 'BARCODE', 'ITEM NAME', 'CATEGORY', 'BRAND', 'CLOSING STK', 'STOCK VALUE']
            : Object.keys(selectedColumns).filter(k => selectedColumns[k]).map(k => k.toUpperCase().replace('_', ' '));

        if (filteredStockData.length === 0) {
            // If no data, we can either alert or download just the headers.
            // Let's download the headers so the user gets an empty template file rather than a silent failure.
        }

        const rows = filteredStockData.map(p => {
            if (reportType === 'NORMAL') {
                return [p.code, p.barcode, p.name, p.category, p.brand, p.closingStk, p.stockValue];
            } else {
                return Object.keys(selectedColumns).filter(k => selectedColumns[k]).map(k => p[k]);
            }
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Inventory_Audit_${filters.startDate}.csv`);
        link.click();
    };

    const content = (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Top Toolbar */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <button 
                        className={`px-3 py-1.5 text-xs font-semibold rounded-sm border ${reportType === 'NORMAL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`} 
                        onClick={() => setReportType('NORMAL')}
                    >
                        Standard View
                    </button>
                    <button 
                        className={`px-3 py-1.5 text-xs font-semibold rounded-sm border ${reportType === 'DETAILED' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`} 
                        onClick={() => setReportType('DETAILED')}
                    >
                        Detailed Audit
                    </button>
                    
                    <button 
                        className={`px-3 py-1.5 text-xs font-semibold rounded-sm border flex items-center gap-1 ${showSettings ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`} 
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <Settings size={14} /> 
                        Fields
                    </button>
                    
                    <button 
                        className="px-3 py-1.5 text-xs font-semibold rounded-sm border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 flex items-center gap-1" 
                        onClick={exportToCSV}
                    >
                        <Download size={14} /> 
                        Export
                    </button>
                </div>
            </div>

            {/* Unified Summary Dashboard (Flat style) */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex gap-4 overflow-x-auto custom-scrollbar min-w-[720px]">
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Total Hand Stock</div>
                        <div className="text-xl font-bold text-slate-800">{summary.totalStock.toLocaleString()}</div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Assets Valuation</div>
                        <div className="text-xl font-bold text-slate-800">₹{summary.totalStockValue.toLocaleString()}</div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Nil Accounts</div>
                        <div className="text-xl font-bold text-slate-800">{summary.nilStock.toLocaleString()}</div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Negative Variance</div>
                        <div className="text-xl font-bold text-slate-800">{summary.negativeStock.toLocaleString()}</div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <div className="text-xs text-slate-500 font-semibold mb-1">Min Threshold</div>
                        <div className="text-xl font-bold text-slate-800">{summary.minStock.toLocaleString()}</div>
                    </div>
                </div>
            </div>

                    {/* Column Field Selection Panel */}
                    {showSettings && !isEmbedded && (
                        <div className="mb-14 p-10 bg-slate-50 border border-slate-100 rounded-[3rem] animate-scaleIn relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8">
                                <button onClick={() => setShowSettings(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-900">
                                        <Layers size={20} />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Audit Matrix Customization</h5>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select relevant field stream for detailed analysis</p>
                                    </div>
                                </div>
                                <button className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline" onClick={() => setSelectedColumns(Object.keys(selectedColumns).reduce((acc, k) => ({ ...acc, [k]: true }), {}))}>Enable All Fields</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-10">
                                {Object.keys(selectedColumns).map(col => (
                                    <label key={col} className="flex items-center gap-4 cursor-pointer group">
                                        <div
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedColumns[col] ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'border-slate-200 group-hover:border-slate-400'}`}
                                            onClick={() => setSelectedColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                                        >
                                            {selectedColumns[col] && <CheckCircle2 size={12} />}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${selectedColumns[col] ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {col.replace('_', ' ')}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

            {/* Filter Action Tool Hub */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
                <div className="flex-1 min-w-[200px] max-w-sm">
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search SKU, Barcode, Name"
                            className="w-full bg-white border-2 border-slate-300 rounded-sm py-1.5 pl-9 pr-4 text-sm font-medium text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors"
                            value={filters.search}
                            onChange={handleSearchInput}
                            onKeyDown={handleSearchSubmit}
                        />
                    </div>
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
                        {loading ? <Loader2 size={14} className="animate-spin" /> : "Audit"}
                    </button>
                </div>
            </div>

            {/* Inventory Registry Grid */}
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                    <thead className="bg-[#F8FAFC] text-[10px] font-black text-[#64748B] uppercase tracking-widest border-b border-slate-200 shadow-sm sticky top-0 z-20">
                                    <tr>
                                        {reportType === 'NORMAL' ? (
                                            <>
                                                <th className="p-3">Registry</th>
                                                <th className="p-3">Barcode</th>
                                                <th className="p-3">Asset</th>
                                                <th className="p-3">Group</th>
                                                <th className="p-3">Brand</th>
                                                <th className="p-3 text-right font-black text-slate-900 bg-slate-50/50">Closing</th>
                                                <th className="p-3 text-right font-black text-slate-900 bg-slate-50/50">Value</th>
                                            </>
                                        ) : (
                                            <>
                                                {selectedColumns.code && <th className="p-6">Code</th>}
                                                {selectedColumns.barcode && <th className="p-6">Barcode</th>}
                                                {selectedColumns.name && <th className="p-6">Asset Name</th>}
                                                {selectedColumns.category && <th className="p-6">Group</th>}
                                                {selectedColumns.brand && <th className="p-6">Brand</th>}
                                                {selectedColumns.unit && <th className="p-6">Unit</th>}
                                                {selectedColumns.purchase_price && <th className="p-6 text-right bg-indigo-50/5">Purch Rate</th>}
                                                {selectedColumns.cost_price && <th className="p-6 text-right bg-indigo-50/5">Cost Rate</th>}
                                                {selectedColumns.selling_price && <th className="p-6 text-right bg-emerald-50/5">Sales Rate</th>}
                                                {selectedColumns.mrp && <th className="p-6 text-right bg-emerald-50/5">MRP</th>}
                                                {selectedColumns.openingStk && <th className="p-6 text-right">Opening</th>}
                                                {selectedColumns.stockIn && <th className="p-6 text-right text-emerald-600">In</th>}
                                                {selectedColumns.stockOut && <th className="p-6 text-right text-rose-600 border-r border-slate-50">Out</th>}
                                                {selectedColumns.closingStk && <th className="p-6 text-right font-black text-slate-900 bg-slate-50/50">Closing</th>}
                                                {selectedColumns.stockValue && <th className="p-6 text-right font-black text-slate-900 bg-slate-50/50">Value</th>}
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan={20} className="p-32 text-center text-slate-300 flex-col items-center gap-4">
                                            <Loader2 size={40} className="animate-spin mb-4 mx-auto text-indigo-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Reconstructing Inventory Archive...</p>
                                        </td></tr>
                                    ) : filteredStockData.length === 0 ? (
                                        <tr><td colSpan={20} className="p-32 text-center">
                                            <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">No operational variance detected</p>
                                        </td></tr>
                                    ) : filteredStockData.map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-50/30 group transition-all">
                                            {reportType === 'NORMAL' ? (
                                                <>
                                                    <td className="p-3 text-[10px] font-bold text-slate-400">{p.code || '---'}</td>
                                                    <td className="p-3 text-[10px] font-bold text-slate-400">{p.barcode || '---'}</td>
                                                    <td className="p-3">
                                                        <div>
                                                            <span className="text-sm font-black text-slate-900 block tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{p.name}</span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">{p.unit || 'Unit'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[9px] font-black rounded-lg uppercase border border-slate-100">{p.category}</span>
                                                    </td>
                                                    <td className="p-3 text-[10px] font-bold text-slate-400 uppercase">{p.brand || '---'}</td>
                                                    <td className={`p-3 text-right font-black text-sm bg-slate-50/20 ${p.closingStk <= 0 ? 'text-rose-500' : 'text-slate-900'}`}>{p.closingStk}</td>
                                                    <td className="p-3 text-right font-black text-sm bg-slate-50/20 text-slate-900">₹{p.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                </>
                                            ) : (
                                                <>
                                                    {selectedColumns.code && <td className="p-6 text-xs font-bold text-slate-400">{p.code || '---'}</td>}
                                                    {selectedColumns.barcode && <td className="p-6 text-xs font-bold text-slate-400">{p.barcode || '---'}</td>}
                                                    {selectedColumns.name && <td className="p-6 text-sm font-bold text-slate-900 uppercase">{p.name}</td>}
                                                    {selectedColumns.category && <td className="p-6 text-xs font-bold text-slate-400 uppercase">{p.category}</td>}
                                                    {selectedColumns.brand && <td className="p-6 text-xs font-bold text-slate-400 uppercase">{p.brand || '---'}</td>}
                                                    {selectedColumns.unit && <td className="p-6 text-xs font-bold text-slate-400 uppercase">{p.unit || '---'}</td>}
                                                    {selectedColumns.purchase_price && <td className="p-6 text-sm font-bold text-slate-600 text-right bg-indigo-50/5">₹{p.purchase_price}</td>}
                                                    {selectedColumns.cost_price && <td className="p-6 text-sm font-bold text-slate-600 text-right bg-indigo-50/5">₹{p.cost_price}</td>}
                                                    {selectedColumns.selling_price && <td className="p-6 text-sm font-bold text-emerald-600 text-right bg-emerald-50/5">₹{p.selling_price}</td>}
                                                    {selectedColumns.mrp && <td className="p-6 text-sm font-bold text-emerald-600 text-right bg-emerald-50/5">₹{p.mrp}</td>}
                                                    {selectedColumns.openingStk && <td className="p-6 text-sm font-bold text-slate-400 text-right">{p.openingStk}</td>}
                                                    {selectedColumns.stockIn && <td className="p-6 text-sm font-black text-emerald-600 text-right">{p.stockIn}</td>}
                                                    {selectedColumns.stockOut && <td className="p-6 text-sm font-black text-rose-600 text-right border-r border-slate-50">{p.stockOut}</td>}
                                                    {selectedColumns.closingStk && <td className={`p-6 text-right font-black text-slate-900 bg-slate-50/20 text-base ${p.closingStk <= 0 ? 'text-rose-600' : ''}`}>{p.closingStk}</td>}
                                                    {selectedColumns.stockValue && <td className="p-6 text-right font-black text-slate-900 bg-slate-50/20 text-base">₹{p.stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>}
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                </table>
            </div>
            
            {showSettings && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
                    <div className="bg-white rounded border border-slate-200 shadow-xl w-full max-w-[500px] relative z-10 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h5 className="font-bold text-slate-800 text-sm">Configure Fields</h5>
                            <button className="text-slate-500 text-xs font-semibold hover:text-slate-800" onClick={() => setSelectedColumns(Object.keys(selectedColumns).reduce((acc, k) => ({ ...acc, [k]: true }), {}))}>Enable All</button>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {Object.keys(selectedColumns).map(col => (
                                <label key={col} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={selectedColumns[col]} onChange={() => setSelectedColumns(prev => ({ ...prev, [col]: !prev[col] }))} className="w-4 h-4" />
                                    <span className="text-xs font-semibold text-slate-700 capitalize">{col.replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>
                        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button className="px-4 py-1.5 bg-slate-800 text-white rounded-sm font-semibold text-xs hover:bg-slate-900" onClick={() => setShowSettings(false)}>Done</button>
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
                <Header toggleSidebar={toggleSidebar} title="Stock Master" />
                <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden m-2 lg:m-4 rounded-xl border border-slate-200">
                    {content}
                </div>
            </main>
        </DashboardPageShell>
    );
};

export default StockPage;
