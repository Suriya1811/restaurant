import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import {
    Loader2, RefreshCw, Printer, Settings, X, ChevronDown, FileText, CheckSquare, Square
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
        return 'Captain Wise';
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
        navigate(`/dashboard/self-service/reports?category=sales&filter=${typeMap[salesType]}`, { replace: true });

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

        const cols = [{ key: 'sno', label: 'S.No.' }];

        if (salesType === 'Captain Wise') {
            cols.push({ key: 'captain', label: 'Captain' });
            cols.push({ key: 'groupName', label: 'Group Wise' });
        } else if (salesType === 'Brand Wise') {
            cols.push({ key: 'brandName', label: 'Brand Name' });
        } else if (salesType === 'Group Wise') {
            cols.push({ key: 'groupName', label: 'Group Name' });
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

    const toggleColumn = (key) => {
        const currentKeys = visibleColumnKeys || allColumns.map(c => c.key);
        if (currentKeys.includes(key)) {
            if (currentKeys.length <= 1) return;
            setVisibleColumnKeys(currentKeys.filter(k => k !== key));
        } else {
            setVisibleColumnKeys([...currentKeys, key]);
        }
    };

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
        <div className="dashboard-layout bg-slate-50">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
                <Header
                    toggleSidebar={toggleSidebar}
                    title={salesType === 'Month-wise' ? 'SALES SUMMARY - MONTH-WISE' : 'SALES SUMMARY HUB'}
                    headerActions={headerActions}
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
                    <div className="px-5 py-4 flex flex-wrap items-end gap-6 border-b border-slate-100 bg-white">
                        {/* Sales Type */}
                        <div className="flex flex-col gap-2 min-w-[160px]">
                            <label className="text-[12px] font-bold text-[#ff6b00]">Sales Type</label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold py-2 px-3 pr-8 rounded-[4px] focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                                    value={salesType}
                                    onChange={(e) => setSalesType(e.target.value)}
                                >
                                    <option value="Captain Wise">Captain Wise</option>
                                    <option value="Brand Wise">Brand Wise</option>
                                    <option value="Group Wise">Group Wise</option>
                                    <option value="Item Wise">Item Wise</option>
                                    <option value="Month-wise">Month-wise</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Captain Wise Filters */}
                        {salesType === 'Captain Wise' && (
                            <>
                                <div className="flex flex-col gap-2 min-w-[160px]">
                                    <label className="text-[12px] font-bold text-[#ff6b00]">Captain</label>
                                    <div className="relative">
                                        <select
                                            className="w-full appearance-none bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold py-2 px-3 pr-8 rounded-[4px] focus:outline-none focus:border-[#ff6b00] cursor-pointer"
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
                                <div className="flex flex-col gap-2 min-w-[160px]">
                                    <label className="text-[12px] font-bold text-[#ff6b00]">Category</label>
                                    <div className="relative">
                                        <select
                                            className="w-full appearance-none bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold py-2 px-3 pr-8 rounded-[4px] focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                        >
                                            {categoryOptions.map((c, i) => (
                                                <option key={i} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Dates */}
                        <div className="flex flex-col gap-2 min-w-[150px]">
                            <label className="text-[12px] font-bold text-slate-800">From Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold py-2 px-3 rounded-[4px] focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[150px]">
                            <label className="text-[12px] font-bold text-slate-800">To Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold py-2 px-3 rounded-[4px] focus:outline-none focus:border-[#ff6b00] cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Refresh Button */}
                        <div className="flex flex-col gap-2">
                            <button
                                className="flex items-center justify-center gap-2 px-5 py-2 bg-[#ff6b00] hover:bg-[#e66000] text-white text-[13px] font-bold rounded-[4px] shadow-sm transition-colors min-h-[38px] cursor-pointer"
                                onClick={fetchReport}
                                disabled={loading}
                            >
                                <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
                            </button>
                        </div>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 overflow-auto bg-white custom-scrollbar relative px-5 pb-5 mt-2">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
                            <thead className="bg-[#0a1128] text-[#ff6b00] sticky top-0 z-10 text-[12px] font-bold border-b-2 border-slate-200">
                                <tr>
                                    {activeColumns.map((col) => (
                                        <th key={col.key} className={`py-3.5 px-4 ${['cash', 'card', 'upi', 'salesQty', 'returnQty', 'netQty', 'salesValue', 'totalAmount'].includes(col.key) ? 'text-center' : 'text-left'}`}>
                                            <div className="flex flex-col items-center">
                                                <span>{col.label}</span>
                                                {col.subtext && <span className="text-[10px] text-[#ff6b00]/80 font-semibold">{col.subtext}</span>}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[13px] font-bold">
                                {loading ? (
                                    <tr>
                                        <td colSpan={activeColumns.length} className="py-16 text-center">
                                            <Loader2 className="animate-spin text-[#ff6b00] mx-auto mb-2" size={32} />
                                            <span className="text-slate-500 font-medium">Loading report data...</span>
                                        </td>
                                    </tr>
                                ) : filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeColumns.length} className="py-16 text-center text-slate-400 font-semibold">
                                            No data available for the selected period.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 text-slate-800 transition-colors">
                                            {activeColumns.map(col => {
                                                const isNumeric = ['cash', 'card', 'upi', 'salesQty', 'returnQty', 'netQty', 'salesValue', 'totalAmount'].includes(col.key);
                                                const isMoney = ['cash', 'card', 'upi', 'salesValue', 'totalAmount'].includes(col.key);

                                                let displayVal = row[col.key] ?? '-';
                                                if (isNumeric && typeof displayVal === 'number') {
                                                    displayVal = isMoney ? `₹${fmt(displayVal)}` : fmt(displayVal);
                                                }

                                                return (
                                                    <td key={col.key} className={`py-4 px-4 ${isNumeric ? 'text-center' : 'text-left'}`}>
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
                                        const isMoney = ['cash', 'card', 'upi', 'salesValue', 'totalAmount'].includes(col.key);

                                        return (
                                            <td key={`footer-${col.key}`} className={`py-4 px-4 font-bold text-[#ff6b00] ${isSummable ? 'text-center' : 'text-left'}`}>
                                                {isFirstCell ? 'Total' : isSummable ? (isMoney ? `₹${fmt(totals[col.key])}` : fmt(totals[col.key])) : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SalesSummaryHub;
