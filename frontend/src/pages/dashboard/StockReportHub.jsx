import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardPageShell from '@/components/dashboard/DashboardPageShell';
import {
    Loader2, RefreshCw, Printer, Settings, X, ChevronDown, FileText, Search, CheckSquare, Square
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../dashboard/Dashboard.css';

const StockReportHub = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Parse URL params
    const searchParams = new URLSearchParams(location.search);
    const initialFilter = searchParams.get('filter') || 'all';

    // Map initial filter param to Stock Type
    const getInitialStockType = () => {
        if (initialFilter === 'negative') return 'Negative Stock';
        if (initialFilter === 'moving') return 'Moving Stock';
        if (initialFilter === 'non-moving') return 'Non Moving Stock';
        if (initialFilter === 'min') return 'Below Minimum Stock';
        if (initialFilter === 'nil') return 'Nil Stock';
        return 'All Stock';
    };

    // Filter states
    const [stockType, setStockType] = useState(getInitialStockType());
    const [viewType, setViewType] = useState('Standard View'); // Standard View or Detail View
    const [selectedGroup, setSelectedGroup] = useState('All Groups');
    const [selectedBrand, setSelectedBrand] = useState('All Brands');
    
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');

    // Dropdown options
    const [groupOptions, setGroupOptions] = useState(['All Groups']);
    const [brandOptions, setBrandOptions] = useState(['All Brands']);

    // Data states
    const [rawStockData, setRawStockData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Column visibility modal
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [visibleColumnKeys, setVisibleColumnKeys] = useState(null);
    const [tempVisibleKeys, setTempVisibleKeys] = useState(null);

    // Sidebar collapse state
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    // ── FETCH METADATA (Categories & Brands) ───────────────────────
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const savedUser = localStorage.getItem('user');
                if (!savedUser) return;
                const { token } = JSON.parse(savedUser);
                const headers = { 'Authorization': `Bearer ${token}` };

                const [categoriesRes, brandsRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/categories`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/brands`, { headers })
                ]);

                const categoriesData = await categoriesRes.json();
                const brandsData = await brandsRes.json();

                if (categoriesData.success && Array.isArray(categoriesData.data)) {
                    setGroupOptions(['All Groups', ...categoriesData.data.map(c => c.name)]);
                }
                if (brandsData.success && Array.isArray(brandsData.data)) {
                    setBrandOptions(['All Brands', ...brandsData.data.map(b => b.name)]);
                }
            } catch (err) {
                console.error('Error fetching categories/brands metadata:', err);
            }
        };
        fetchMetadata();
    }, []);

    // ── FETCH STOCK REPORT DATA ─────────────────────────────────────
    const fetchStockData = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const queryParams = new URLSearchParams({
                startDate: fromDate,
                endDate: toDate,
                search: searchQuery,
                category: selectedGroup === 'All Groups' ? '' : selectedGroup,
                brand: selectedBrand === 'All Brands' ? '' : selectedBrand
            }).toString();

            const response = await fetch(`${import.meta.env.VITE_API_URL}/stock/report?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();
            if (result.success) {
                setRawStockData(result.data || []);
            } else {
                setRawStockData([]);
            }
        } catch (err) {
            console.error('Failed to fetch stock report:', err);
            setRawStockData([]);
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, searchQuery, selectedGroup, selectedBrand]);

    useEffect(() => {
        // Sync URL parameters
        const filterMap = {
            'All Stock': 'all',
            'Negative Stock': 'negative',
            'Moving Stock': 'moving',
            'Non Moving Stock': 'non-moving',
            'Below Minimum Stock': 'min',
            'Nil Stock': 'nil'
        };
        const currentFilter = filterMap[stockType] || 'all';
        navigate(`/dashboard/self-service/reports?category=stock&filter=${currentFilter}`, { replace: true });

        fetchStockData();
    }, [stockType, fetchStockData, navigate]);

    // Reset visible column keys when viewType changes
    useEffect(() => {
        setVisibleColumnKeys(null);
        setTempVisibleKeys(null);
    }, [viewType]);

    // ── FILTER DATA BY STOCK TYPE ──────────────────────────────────
    const processedRows = useMemo(() => {
        if (!rawStockData.length) return [];
        let filtered = rawStockData;

        // Stock Type filtering
        if (stockType === 'Negative Stock') {
            filtered = filtered.filter(item => (item.closingStk || item.closingQty || 0) < 0);
        } else if (stockType === 'Moving Stock') {
            filtered = filtered.filter(item => (item.stockOut || item.salesQty || 0) > 0);
        } else if (stockType === 'Non Moving Stock') {
            filtered = filtered.filter(item => (item.stockOut || item.salesQty || 0) === 0);
        } else if (stockType === 'Below Minimum Stock') {
            filtered = filtered.filter(item => item.min_stock != null && (item.closingStk || item.closingQty || 0) < item.min_stock);
        } else if (stockType === 'Nil Stock') {
            filtered = filtered.filter(item => (item.closingStk || item.closingQty || 0) === 0);
        }

        // Search filtering (SKU / Barcode / Name)
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                (item.name || '').toLowerCase().includes(query) ||
                (item.code || '').toLowerCase().includes(query) ||
                (item.barcode || '').toLowerCase().includes(query)
            );
        }

        return filtered.map((item, index) => {
            const openQty = item.openingStk ?? item.openingQty ?? 0;
            const openVal = item.openingValue ?? (openQty * (item.purchase_price || item.cost_price || 0));
            
            const purQty = item.stockIn ?? item.purchaseQty ?? 0;
            const purVal = item.purchaseValue ?? (purQty * (item.purchase_price || item.cost_price || 0));
            
            const salesQty = item.stockOut ?? item.salesQty ?? 0;
            const salesVal = item.salesValue ?? (salesQty * (item.selling_price || item.mrp || 0));

            const closingQty = item.closingStk ?? item.closingQty ?? (openQty + purQty - salesQty);
            const closingVal = item.stockValue ?? (closingQty * (item.purchase_price || item.cost_price || 0));

            return {
                id: index,
                barcode: item.barcode || '---',
                code: item.code || '---',
                group: item.category || '---',
                brand: item.brand || '---',
                itemName: item.name || '---',
                unit: item.unit || '---',
                openingQty: openQty,
                openingVal: openVal,
                purchaseQty: purQty,
                purchaseVal: purVal,
                salesQty: salesQty,
                salesVal: salesVal,
                inQty: purQty,
                outQty: salesQty,
                closingQty: closingQty,
                closingVal: closingVal
            };
        });
    }, [rawStockData, stockType, searchQuery]);

    // ── TABLE COLUMNS DEFINITION ───────────────────────────────────
    const allColumns = useMemo(() => {
        if (viewType === 'Standard View') {
            return [
                { key: 'barcode', label: 'Barcode' },
                { key: 'code', label: 'Code' },
                { key: 'itemName', label: 'Item Name' },
                { key: 'unit', label: 'Unit' },
                { key: 'openingQty', label: 'Opening Quantity' },
                { key: 'inQty', label: 'In Quantity' },
                { key: 'outQty', label: 'Out Quantity' },
                { key: 'closingQty', label: 'Closing Quantity' },
                { key: 'closingVal', label: 'Stock Value' }
            ];
        }

        // Detail View (Full Breakdown)
        return [
            { key: 'barcode', label: 'Barcode' },
            { key: 'code', label: 'Code' },
            { key: 'group', label: 'Group' },
            { key: 'brand', label: 'Brand' },
            { key: 'itemName', label: 'Item Name' },
            { key: 'unit', label: 'Unit' },
            { key: 'openingQty', label: 'Opening Quantity' },
            { key: 'openingVal', label: 'Opening Quantity Value' },
            { key: 'purchaseQty', label: 'Purchase Quantity' },
            { key: 'purchaseVal', label: 'Purchase Quantity Value' },
            { key: 'salesQty', label: 'Sales Quantity' },
            { key: 'salesVal', label: 'Sales Value' },
            { key: 'closingQty', label: 'Closing Quantity' },
            { key: 'closingVal', label: 'Closing Value' }
        ];
    }, [viewType]);

    const activeColumns = useMemo(() => {
        if (!visibleColumnKeys) return allColumns;
        return allColumns.filter(c => visibleColumnKeys.includes(c.key));
    }, [allColumns, visibleColumnKeys]);

    const fmt = (num) => (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtQty = (num) => (num || 0).toFixed(3);

    // ── CALCULATE TOTALS ───────────────────────────────────────────
    const totals = useMemo(() => {
        const result = {};
        allColumns.forEach(c => {
            if (['barcode', 'code', 'group', 'brand', 'itemName', 'unit'].includes(c.key)) {
                result[c.key] = null; // non summable
            } else if (c.key === 'barcode') {
                result[c.key] = processedRows.length; // total count
            } else {
                result[c.key] = processedRows.reduce((sum, row) => sum + (Number(row[c.key]) || 0), 0);
            }
        });
        return result;
    }, [processedRows, allColumns]);

    // ── ACTION HANDLERS (Excel, PDF, Print, Close) ──────────────────
    const exportToCSV = () => {
        if (processedRows.length === 0) return;
        const headers = activeColumns.map(c => `"${c.label}"`).join(',');
        const rowData = processedRows.map(r =>
            activeColumns.map(c => {
                const val = r[c.key];
                return typeof val === 'string' ? `"${val}"` : (val ?? 0);
            }).join(',')
        );
        const totalRowData = activeColumns.map((c, idx) => {
            if (idx === 0) return `"${processedRows.length}"`;
            if (totals[c.key] !== null) return totals[c.key];
            return '"-"';
        }).join(',');

        const csvContent = [headers, ...rowData, totalRowData].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Stock_Report_${viewType.replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.csv`);
        link.click();
    };

    const exportToPDF = () => {
        if (processedRows.length === 0) return;
        const doc = new jsPDF('l', 'pt');
        doc.setFontSize(16);
        doc.text(`Stock Report - ${viewType}`, 40, 40);
        doc.setFontSize(10);
        doc.text(`Period: ${fromDate} to ${toDate} | Filter: ${stockType}`, 40, 55);

        const tableHeaders = [activeColumns.map(c => c.label)];
        const tableBody = processedRows.map(r =>
            activeColumns.map(c => {
                const val = r[c.key];
                const isMoney = ['openingVal', 'purchaseVal', 'salesVal', 'closingVal'].includes(c.key);
                const isQty = ['openingQty', 'purchaseQty', 'salesQty', 'inQty', 'outQty', 'closingQty'].includes(c.key);

                if (isMoney) return `₹${fmt(val)}`;
                if (isQty) return fmtQty(val);
                return val ?? '-';
            })
        );
        // Total row
        tableBody.push(
            activeColumns.map((c, idx) => {
                if (idx === 0) return `${processedRows.length}`;
                if (totals[c.key] !== null) {
                    const isMoney = ['openingVal', 'purchaseVal', 'salesVal', 'closingVal'].includes(c.key);
                    return isMoney ? `₹${fmt(totals[c.key])}` : fmtQty(totals[c.key]);
                }
                return '-';
            })
        );

        autoTable(doc, {
            head: tableHeaders,
            body: tableBody,
            startY: 70,
            styles: { fontSize: 7 },
            headStyles: { fillColor: [10, 17, 40], textColor: [255, 107, 0] }
        });

        doc.save(`Stock_Report_${viewType.replace(/\s+/g, '_')}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    const headerActions = (
        <div className="flex items-center gap-2">
            <button onClick={exportToCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold text-emerald-600 border border-emerald-200 bg-white hover:bg-emerald-50 rounded-[4px] shadow-sm transition-colors cursor-pointer">
                <span className="bg-emerald-600 text-white rounded-[2px] p-0.5 text-[10px] px-1.5">X</span> Excel
            </button>
            <button onClick={exportToPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold text-red-600 border border-red-200 bg-white hover:bg-red-50 rounded-[4px] shadow-sm transition-colors cursor-pointer">
                <FileText size={16} /> PDF
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 rounded-[4px] shadow-sm transition-colors cursor-pointer">
                <Printer size={16} /> Print
            </button>
            <button onClick={() => setShowColumnModal(!showColumnModal)} className="btn-column-settings">
                <Settings size={14} /> <span>Column Settings</span>
            </button>
        </div>
    );

    return (
        <DashboardPageShell className="bg-slate-50">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    title="Stock Report" 
                    headerActions={headerActions}
                />

                <div className="flex-1 flex flex-col min-h-0 m-3 lg:m-5 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative gap-5">

                    {/* Column Settings Drawer Panel */}
                    {showColumnModal && (
                        <>
                            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999]" onClick={() => setShowColumnModal(false)} />
                            <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-2xl border-l border-slate-200 z-[10000] flex flex-col animate-in slide-in-from-right duration-300">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Column Settings</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select columns to display</p>
                                    </div>
                                    <button onClick={() => setShowColumnModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {allColumns.map((col) => {
                                        const currentKeys = tempVisibleKeys || visibleColumnKeys || allColumns.map(c => c.key);
                                        const isChecked = currentKeys.includes(col.key);
                                        return (
                                            <label key={col.key} className="flex items-center gap-3 cursor-pointer group py-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        const base = tempVisibleKeys || visibleColumnKeys || allColumns.map(c => c.key);
                                                        if (e.target.checked) {
                                                            setTempVisibleKeys([...base, col.key]);
                                                        } else {
                                                            if (base.length <= 1) return;
                                                            setTempVisibleKeys(base.filter(k => k !== col.key));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                                                    style={{ accentColor: '#ff6b00' }}
                                                />
                                                <span className="text-xs font-bold text-slate-700 group-hover:text-orange-500 transition-colors uppercase tracking-tight">{col.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTempVisibleKeys(allColumns.map(c => c.key))}
                                        className="flex-1 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        RESET
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (tempVisibleKeys) {
                                                setVisibleColumnKeys(tempVisibleKeys);
                                            }
                                            setShowColumnModal(false);
                                        }}
                                        className="flex-1 py-2 text-xs font-bold text-white bg-[#ff6b00] rounded hover:bg-[#e66000] transition-colors cursor-pointer"
                                    >
                                        APPLY
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Single Row Filters: Search, Dates, Stock Type, View Type, Group, Brand, Refresh */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search Bar */}
                        <div className="w-[160px] shrink-0 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                placeholder="Search SKU..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-300 text-slate-700 text-[12px] font-medium py-1.5 pl-8 pr-2 rounded-[4px] focus:outline-none focus:border-[#ff6b00]"
                            />
                        </div>

                        {/* From Date */}
                        <div className="w-[135px] shrink-0">
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                placeholder="From Date"
                                title="From Date"
                                className="w-full bg-white border border-slate-300 text-slate-700 text-[12px] font-semibold py-1.5 px-2 rounded-[4px] focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                            />
                        </div>

                        {/* To Date */}
                        <div className="w-[135px] shrink-0">
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                placeholder="To Date"
                                title="To Date"
                                className="w-full bg-white border border-slate-300 text-slate-700 text-[12px] font-semibold py-1.5 px-2 rounded-[4px] focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                            />
                        </div>

                        {/* Stock Type */}
                        <div className="w-[140px] shrink-0">
                            <div className="relative">
                                <select
                                    value={stockType}
                                    onChange={(e) => setStockType(e.target.value)}
                                    className="w-full appearance-none bg-white border border-slate-300 text-slate-700 text-[12px] font-semibold py-1.5 px-2 pr-6 rounded-[4px] focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                                >
                                    <option value="All Stock">Stock Type</option>
                                    <option value="All Stock">All Stock</option>
                                    <option value="Negative Stock">Negative Stock</option>
                                    <option value="Moving Stock">Moving Stock</option>
                                    <option value="Non Moving Stock">Non Moving Stock</option>
                                    <option value="Below Minimum Stock">Below Minimum Stock</option>
                                    <option value="Nil Stock">Nil Stock</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                            </div>
                        </div>

                        {/* View Type */}
                        <div className="w-[130px] shrink-0">
                            <div className="relative">
                                <select
                                    value={viewType}
                                    onChange={(e) => setViewType(e.target.value)}
                                    className="w-full appearance-none bg-white border border-slate-300 text-slate-700 text-[12px] font-semibold py-1.5 px-2 pr-6 rounded-[4px] focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                                >
                                    <option value="Standard View">View Type</option>
                                    <option value="Standard View">Standard View</option>
                                    <option value="Detail View">Detail View</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                            </div>
                        </div>

                        {/* Group */}
                        <div className="w-[130px] shrink-0">
                            <div className="relative">
                                <select
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="w-full appearance-none bg-white border border-slate-300 text-slate-700 text-[12px] font-semibold py-1.5 px-2 pr-6 rounded-[4px] focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                                >
                                    {groupOptions.map((g, i) => (
                                        <option key={i} value={g}>{g}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                            </div>
                        </div>

                        {/* Brand */}
                        <div className="w-[130px] shrink-0">
                            <div className="relative">
                                <select
                                    value={selectedBrand}
                                    onChange={(e) => setSelectedBrand(e.target.value)}
                                    className="w-full appearance-none bg-white border border-slate-300 text-slate-700 text-[12px] font-semibold py-1.5 px-2 pr-6 rounded-[4px] focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                                >
                                    {brandOptions.map((b, i) => (
                                        <option key={i} value={b}>{b}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                            </div>
                        </div>

                        {/* Refresh Button */}
                        <div className="shrink-0 ml-auto">
                            <button
                                onClick={fetchStockData}
                                disabled={loading}
                                className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#ff6b00] hover:bg-[#e66000] text-white text-[12px] font-bold rounded-[4px] shadow-sm transition-colors cursor-pointer"
                            >
                                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                            </button>
                        </div>
                    </div>

                    {/* Table Area Inside Card Container */}
                    <div className="flex-1 overflow-auto bg-white custom-scrollbar relative border border-slate-200 rounded-xl">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
                            <thead className="bg-[#0a1128] text-[#ff6b00] sticky top-0 z-10 text-[12px] font-bold border-b border-slate-200">
                                <tr>
                                    {activeColumns.map((col) => {
                                        const isRight = ['openingQty', 'openingVal', 'purchaseQty', 'purchaseVal', 'salesQty', 'salesVal', 'inQty', 'outQty', 'closingQty', 'closingVal'].includes(col.key);
                                        return (
                                            <th key={col.key} className={`py-3.5 px-4 ${isRight ? 'text-right' : 'text-left'}`}>
                                                <span>{col.label}</span>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[13px] font-bold">
                                {loading ? (
                                    <tr>
                                        <td colSpan={activeColumns.length} className="py-16 text-center">
                                            <Loader2 className="animate-spin text-[#ff6b00] mx-auto mb-2" size={32} />
                                            <span className="text-slate-500 font-medium">Loading stock audit...</span>
                                        </td>
                                    </tr>
                                ) : processedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeColumns.length} className="py-16 text-center text-slate-400 font-semibold">
                                            No stock variance logged in period.
                                        </td>
                                    </tr>
                                ) : (
                                    processedRows.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 text-slate-800 transition-colors border-b border-slate-100">
                                            {activeColumns.map(col => {
                                                const isMoney = ['openingVal', 'purchaseVal', 'salesVal', 'closingVal'].includes(col.key);
                                                const isQty = ['openingQty', 'purchaseQty', 'salesQty', 'inQty', 'outQty', 'closingQty'].includes(col.key);
                                                const isRight = isMoney || isQty;

                                                let displayVal = row[col.key] ?? '-';
                                                if (isMoney) {
                                                    displayVal = `₹${fmt(row[col.key])}`;
                                                } else if (isQty) {
                                                    displayVal = fmtQty(row[col.key]);
                                                }

                                                // Highlight closing quantity in Standard View
                                                const isDetailClosing = viewType === 'Standard View' && col.key === 'closingQty';

                                                return (
                                                    <td key={col.key} className={`py-3.5 px-4 ${isRight ? 'text-right' : 'text-left'} ${isDetailClosing ? 'text-[#10b981] font-black' : ''}`}>
                                                        {displayVal}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="sticky bottom-0 bg-white border-t-2 border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] text-[14px]">
                                <tr>
                                    {activeColumns.map((col, idx) => {
                                        const isFirstCell = idx === 0;
                                        const isSummable = totals[col.key] !== null;
                                        const isMoney = ['openingVal', 'purchaseVal', 'salesVal', 'closingVal'].includes(col.key);
                                        const isQty = ['openingQty', 'purchaseQty', 'salesQty', 'inQty', 'outQty', 'closingQty'].includes(col.key);
                                        const isRight = isMoney || isQty || isSummable;

                                        return (
                                            <td key={`footer-${col.key}`} className={`py-3.5 px-4 font-bold text-[#ff6b00] ${isRight ? 'text-right' : 'text-left'}`}>
                                                {isFirstCell ? processedRows.length : isSummable ? (isMoney ? `₹${fmt(totals[col.key])}` : fmtQty(totals[col.key])) : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </main>
        </DashboardPageShell>
    );
};

export default StockReportHub;
