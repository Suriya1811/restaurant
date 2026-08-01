import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardPageShell from '@/components/dashboard/DashboardPageShell';
import {
    Loader2, RefreshCw, Printer, Settings, X, ChevronDown, FileText, XCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

const SalesSummaryHub = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const searchParams = new URLSearchParams(location.search);
    const initialFilter = searchParams.get('filter');

    const getInitialType = () => {
        if (initialFilter === 'brand') return 'Brand Wise';
        if (initialFilter === 'group') return 'Group Wise';
        if (initialFilter === 'item') return 'Item Wise';
        if (initialFilter === 'month') return 'Month-wise';
        return 'Group Wise';
    };

    const [salesType, setSalesType] = useState(getInitialType());

    // Global filters
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    // Captain Wise specific filters
    const [captain, setCaptain] = useState('All Captains');
    const [category, setCategory] = useState('All');
    const [captainOptions, setCaptainOptions] = useState(['All Captains']);
    const [categoryOptions, setCategoryOptions] = useState(['All']);

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Column Visibility Settings
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [visibleColumnKeys, setVisibleColumnKeys] = useState(null);
    const [tempVisibleKeys, setTempVisibleKeys] = useState(null);

    // Sidebar state
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

    // ── METADATA FETCHING (Captains & Categories) ──────────────────
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const savedUser = localStorage.getItem('user');
                if (!savedUser) return;
                const { token } = JSON.parse(savedUser);
                const headers = { 'Authorization': `Bearer ${token}` };

                const [captainsRes, categoriesRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/captains`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/categories`, { headers })
                ]);

                const captainsData = await captainsRes.json();
                const categoriesData = await categoriesRes.json();

                if (captainsData.success && Array.isArray(captainsData.data)) {
                    setCaptainOptions(['All Captains', ...captainsData.data.map(c => c.name)]);
                }
                if (categoriesData.success && Array.isArray(categoriesData.data)) {
                    setCategoryOptions(['All', ...categoriesData.data.map(c => c.name)]);
                }
            } catch (err) {
                console.error('Error fetching metadata:', err);
            }
        };
        fetchMetadata();
    }, []);

    // ── DATA FETCHING ───────────────────────────────────────────────
    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            let endpoint = '';
            if (salesType === 'Captain Wise') {
                endpoint = '/reports/sales-by-captain';
            } else if (salesType === 'Brand Wise') {
                endpoint = '/reports/sales-by-brand';
            } else if (salesType === 'Group Wise') {
                endpoint = '/reports/sales-by-category';
            } else if (salesType === 'Item Wise') {
                endpoint = '/reports/sales/summary?groupBy=ITEM';
            } else if (salesType === 'Month-wise') {
                endpoint = '/reports/month-wise';
            }

            const params = new URLSearchParams({ startDate: fromDate, endDate: toDate });
            if (endpoint.includes('?')) {
                endpoint += `&${params.toString()}`;
            } else {
                endpoint += `?${params.toString()}`;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success) {
                if (salesType === 'Month-wise') {
                    setData(result.data?.monthlyBreakdown || result.data || []);
                } else {
                    setData(result.data || []);
                }
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('Error fetching sales summary:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [salesType, fromDate, toDate]);

    useEffect(() => {
        const typeMap = {
            'Captain Wise': 'captain',
            'Brand Wise': 'brand',
            'Group Wise': 'group',
            'Item Wise': 'item',
            'Month-wise': 'month'
        };
        navigate(`/dashboard/self-service/reports?category=sales&filter=${typeMap[salesType] || 'group'}`, { replace: true });

        fetchReport();
    }, [salesType, fetchReport, navigate]);

    // Reset column visibility on type change
    useEffect(() => {
        setVisibleColumnKeys(null);
    }, [salesType]);

    // ── TABLE COLUMNS ───────────────────────────────────────────────
    const allColumns = useMemo(() => {
        if (salesType === 'Month-wise') {
            return [
                { key: 'month', label: 'Month' },
                { key: 'cash', label: 'Cash Amount' },
                { key: 'card', label: 'Card Amount' },
                { key: 'upi', label: 'UPI Amount' },
                { key: 'totalAmount', label: 'Total Amount' }
            ];
        }

        const cols = [];

        if (salesType === 'Captain Wise') {
            cols.push({ key: 'captain', label: 'Captain' });
            cols.push({ key: 'groupName', label: 'Group Wise' });
        } else if (salesType === 'Brand Wise') {
            cols.push({ key: 'brandName', label: 'Brand Name' });
        } else if (salesType === 'Group Wise') {
            cols.push({ key: 'groupName', label: 'Group Wise' });
        } else if (salesType === 'Item Wise') {
            cols.push({ key: 'itemName', label: 'Item Name' });
        }

        cols.push(
            { key: 'salesQty', label: 'Sales Quantity' },
            { key: 'returnQty', label: 'Return Quantity' },
            { key: 'netQty', label: 'Net Sales Quantity', subtext: '(Sales - Return)' },
            { key: 'salesValue', label: 'Sales Value' },
            { key: 'totalAmount', label: 'Total Amount' }
        );
        return cols;
    }, [salesType]);

    const activeColumns = useMemo(() => {
        if (!visibleColumnKeys) return allColumns;
        return allColumns.filter(c => visibleColumnKeys.includes(c.key));
    }, [allColumns, visibleColumnKeys]);

    const gridTemplateColumns = useMemo(() => {
        return activeColumns.map(col => {
            if (['sno'].includes(col.key)) return '70px';
            if (['groupName', 'brandName', 'itemName', 'captain', 'month'].includes(col.key)) return 'minmax(180px, 2fr)';
            if (['netQty'].includes(col.key)) return 'minmax(180px, 1.3fr)';
            return 'minmax(130px, 1fr)';
        }).join(' ');
    }, [activeColumns]);

    const fmt = (num) => (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Transform raw API data into table rows
    const getTableRows = () => {
        if (!data || data.length === 0) return [];

        return data.map((item, index) => {
            const row = { id: index, sno: index + 1 };
            const nameField = item.name || item.brand || item.category || item.item || item.captain || item.month || '-';

            if (salesType === 'Month-wise') {
                row.month = item.month || nameField;
                row.cash = item.cash || item.cashAmount || 0;
                row.card = item.card || item.cardAmount || 0;
                row.upi = item.upi || item.upiAmount || 0;
                row.totalAmount = item.totalSales || item.totalAmount || item.amount || 0;
            } else {
                if (salesType === 'Captain Wise') {
                    row.captain = item.captain || nameField;
                    row.groupName = item.category || item.group || '-';
                } else if (salesType === 'Brand Wise') {
                    row.brandName = item.brand || nameField;
                } else if (salesType === 'Group Wise') {
                    row.groupName = item.category || item.group || nameField;
                } else if (salesType === 'Item Wise') {
                    row.itemName = item.item || item.name || nameField;
                }

                row.salesQty = item.salesQty || item.qty || item.count || 0;
                row.returnQty = item.returnQty || 0;
                row.netQty = (item.salesQty || item.qty || item.count || 0) - (item.returnQty || 0);
                row.salesValue = item.salesValue || item.totalSales || item.amount || 0;
                row.totalAmount = item.totalAmount || item.totalSales || item.amount || 0;
            }
            return row;
        });
    };

    const rawRows = getTableRows();

    // Filter by Captain and Category dropdowns
    const filteredRows = useMemo(() => {
        let result = rawRows;
        if (salesType === 'Captain Wise') {
            if (captain !== 'All Captains') {
                result = result.filter(r => r.captain === captain);
            }
            if (category !== 'All') {
                result = result.filter(r => r.groupName === category);
            }
        }
        return result;
    }, [rawRows, salesType, captain, category]);

    // Calculate Totals
    const totals = useMemo(() => {
        const result = {};
        allColumns.forEach(c => {
            if (['sno', 'captain', 'groupName', 'brandName', 'itemName', 'month'].includes(c.key)) {
                result[c.key] = null;
            } else {
                result[c.key] = filteredRows.reduce((sum, row) => sum + (Number(row[c.key]) || 0), 0);
            }
        });
        return result;
    }, [filteredRows, allColumns]);

    // ── ACTION HANDLERS (Excel, PDF, Print, Close) ──────────────────
    const exportToCSV = () => {
        if (filteredRows.length === 0) return;
        const headers = activeColumns.map(c => `"${c.label}"`).join(',');
        const rowData = filteredRows.map(r =>
            activeColumns.map(c => {
                const val = r[c.key];
                return typeof val === 'string' ? `"${val}"` : (val ?? 0);
            }).join(',')
        );
        const totalRowData = activeColumns.map((c, idx) => {
            if (idx === 0) return '"Total"';
            if (totals[c.key] !== null) return totals[c.key];
            return '"-"';
        }).join(',');

        const csvContent = [headers, ...rowData, totalRowData].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Sales_Summary_${salesType.replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.csv`);
        link.click();
    };

    const exportToPDF = () => {
        if (filteredRows.length === 0) return;
        const doc = new jsPDF('p', 'pt');
        doc.setFontSize(16);
        doc.text(`Sales Summary - ${salesType}`, 40, 40);
        doc.setFontSize(10);
        doc.text(`Date Period: ${fromDate} to ${toDate}`, 40, 55);

        const tableHeaders = [activeColumns.map(c => c.label)];
        const tableBody = filteredRows.map(r =>
            activeColumns.map(c => {
                const val = r[c.key];
                const isNumeric = ['cash', 'card', 'upi', 'salesQty', 'returnQty', 'netQty', 'salesValue', 'totalAmount'].includes(c.key);
                const isMoney = ['cash', 'card', 'upi', 'salesValue', 'totalAmount'].includes(c.key);
                if (isNumeric && typeof val === 'number') {
                    return isMoney ? `₹${fmt(val)}` : fmt(val);
                }
                return val ?? '-';
            })
        );
        tableBody.push(
            activeColumns.map((c, idx) => {
                if (idx === 0) return 'Total';
                if (totals[c.key] !== null) {
                    const isMoney = ['cash', 'card', 'upi', 'salesValue', 'totalAmount'].includes(c.key);
                    return isMoney ? `₹${fmt(totals[c.key])}` : fmt(totals[c.key]);
                }
                return '-';
            })
        );

        autoTable(doc, {
            head: tableHeaders,
            body: tableBody,
            startY: 70,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [10, 17, 40], textColor: [255, 107, 0] }
        });

        doc.save(`Sales_Summary_${salesType.replace(/\s+/g, '_')}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    const headerActions = (
        <div className="flex items-center gap-2">
            <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 border border-emerald-300 bg-white hover:bg-emerald-50 rounded shadow-sm transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
            >
                <span className="bg-emerald-600 text-white rounded p-0.5 text-[10px] px-1 font-extrabold leading-none">X</span>
                Excel
            </button>
            <button
                onClick={exportToPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-300 bg-white hover:bg-red-50 rounded shadow-sm transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
            >
                <FileText size={15} className="text-red-500" />
                PDF
            </button>
            <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-500 border border-blue-300 bg-white hover:bg-blue-50 rounded shadow-sm transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
            >
                <Printer size={15} className="text-blue-500" />
                Print
            </button>
            <button
                onClick={() => setShowColumnModal(!showColumnModal)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#ff6b00] hover:bg-[#e66000] rounded shadow-sm transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
            >
                <Settings size={15} className="flex-shrink-0" />
                <span className="whitespace-nowrap">COLUMN SETTINGS</span>
            </button>
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-400 bg-white hover:bg-red-50 rounded shadow-sm transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
            >
                <XCircle size={15} className="text-red-500 flex-shrink-0" />
                <span className="whitespace-nowrap">CLOSE</span>
            </button>
        </div>
    );

    return (
        <DashboardPageShell className="bg-slate-50">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="SALES SUMMARY"
                    headerActions={headerActions}
                    showClose={false}
                />

                <div className="flex-1 flex flex-col min-h-0 m-2 lg:m-4 rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden relative">

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

                    {/* Filters Row */}
                    <div className="px-5 py-3.5 flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white flex-shrink-0">
                        {/* Sales Type */}
                        <div className="min-w-[150px]">
                            <div className="relative">
                                <select
                                    className="w-full appearance-none bg-white border border-slate-300 text-slate-800 text-[13px] font-semibold py-2 px-3 pr-8 rounded focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                                    value={salesType}
                                    onChange={(e) => setSalesType(e.target.value)}
                                >
                                    <option value="Group Wise">Sales Type</option>
                                    <option value="Captain Wise">Captain Wise</option>
                                    <option value="Brand Wise">Brand Wise</option>
                                    <option value="Group Wise">Group Wise</option>
                                    <option value="Item Wise">Item Wise</option>
                                    <option value="Month-wise">Month-wise</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Captain Selection Dropdown */}
                        <div className="min-w-[150px]">
                            <div className="relative">
                                <select
                                    className="w-full appearance-none bg-white border border-slate-300 text-slate-800 text-[13px] font-semibold py-2 px-3 pr-8 rounded focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                                    value={captain}
                                    onChange={(e) => setCaptain(e.target.value)}
                                >
                                    {captainOptions.map((c, i) => (
                                        <option key={i} value={c}>{c}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Group/Brand Filter */}
                        <div className="min-w-[150px]">
                            <div className="relative">
                                <select
                                    className="w-full appearance-none bg-white border border-slate-300 text-slate-800 text-[13px] font-semibold py-2 px-3 pr-8 rounded focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="All">Group/Brand</option>
                                    {categoryOptions.filter(c => c !== 'All').map((c, i) => (
                                        <option key={i} value={c}>{c}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="min-w-[140px]">
                            <div className="relative">
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    placeholder="From Date"
                                    title="From Date"
                                    className="w-full bg-white border border-slate-300 text-slate-800 text-[13px] font-semibold py-2 px-3 rounded focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="min-w-[140px]">
                            <div className="relative">
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    placeholder="To Date"
                                    title="To Date"
                                    className="w-full bg-white border border-slate-300 text-slate-800 text-[13px] font-semibold py-2 px-3 rounded focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                                />
                            </div>
                        </div>

                    </div>

                    {/* Table Area with Fixed Height, Scrollable Body, and Fixed Bottom Summary */}
                    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-x-auto custom-scrollbar p-3">
                        <div className="flex-1 flex flex-col min-h-0 min-w-[900px] border border-slate-200 rounded-lg overflow-hidden bg-white">

                            {/* Dark Navy Table Header */}
                            <div
                                className="grid bg-[#0a1128] text-[#ff6b00] text-[13px] font-extrabold border-b border-slate-800 flex-shrink-0"
                                style={{ gridTemplateColumns }}
                            >
                                {activeColumns.map((col) => {
                                    const isCenter = ['cash', 'card', 'upi', 'salesQty', 'returnQty', 'netQty', 'salesValue', 'totalAmount'].includes(col.key);
                                    return (
                                        <div
                                            key={col.key}
                                            className={`py-3.5 px-4 flex flex-col ${isCenter ? 'items-center justify-center text-center' : 'items-start justify-center text-left'}`}
                                        >
                                            <span>{col.label}</span>
                                            {col.subtext && <span className="text-[10px] text-[#ff6b00]/80 font-medium">{col.subtext}</span>}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Scrollable Table Body */}
                            <div className="flex-1 overflow-y-auto min-h-0 bg-white custom-scrollbar relative divide-y divide-slate-100">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-slate-500 py-16">
                                        <Loader2 className="animate-spin text-[#ff6b00] mb-2" size={32} />
                                        <span className="font-semibold text-sm">Loading report data...</span>
                                    </div>
                                ) : filteredRows.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400 py-12">
                                        <svg className="w-16 h-16 text-slate-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="4" y="2" width="16" height="20" rx="3" />
                                            <circle cx="9" cy="7" r="1" fill="currentColor" />
                                            <line x1="12" y1="7" x2="16" y2="7" />
                                            <line x1="8" y1="11" x2="16" y2="11" />
                                            <line x1="8" y1="15" x2="13" y2="15" />
                                        </svg>
                                        <p className="text-slate-500 font-semibold text-sm">No data available for the selected period.</p>
                                    </div>
                                ) : (
                                    filteredRows.map((row) => (
                                        <div
                                            key={row.id}
                                            className="grid text-slate-800 text-[13px] font-bold hover:bg-slate-50 transition-colors"
                                            style={{ gridTemplateColumns }}
                                        >
                                            {activeColumns.map(col => {
                                                const isNumeric = ['cash', 'card', 'upi', 'salesQty', 'returnQty', 'netQty', 'salesValue', 'totalAmount'].includes(col.key);
                                                const isMoney = ['cash', 'card', 'upi', 'salesValue', 'totalAmount'].includes(col.key);

                                                let displayVal = row[col.key] ?? '-';
                                                if (isNumeric && typeof displayVal === 'number') {
                                                    displayVal = isMoney ? `₹${fmt(displayVal)}` : fmt(displayVal);
                                                }

                                                return (
                                                    <div
                                                        key={col.key}
                                                        className={`py-3.5 px-4 flex items-center ${isNumeric ? 'justify-center text-center' : 'justify-start text-left'}`}
                                                    >
                                                        {displayVal}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Fixed Bottom Total Summary Row */}
                            <div
                                className="grid bg-white border-t-2 border-slate-200 divide-x divide-slate-200 flex-shrink-0"
                                style={{ gridTemplateColumns }}
                            >
                                {activeColumns.map((col, idx) => {
                                    const isFirstCell = idx === 0;
                                    const isSummable = totals[col.key] !== null && totals[col.key] !== undefined;
                                    const isMoney = ['cash', 'card', 'upi', 'salesValue', 'totalAmount'].includes(col.key);

                                    let displayVal = '-';
                                    if (isFirstCell) {
                                        displayVal = 'Total';
                                    } else if (isSummable) {
                                        displayVal = isMoney ? `₹${fmt(totals[col.key])}` : fmt(totals[col.key]);
                                    }

                                    return (
                                        <div
                                            key={`footer-${col.key}`}
                                            className={`py-4 px-4 font-extrabold text-[#ff6b00] text-xl flex items-center ${isFirstCell ? 'justify-start pl-6' : 'justify-center text-center'}`}
                                        >
                                            {displayVal}
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </DashboardPageShell>
    );
};

export default SalesSummaryHub;
