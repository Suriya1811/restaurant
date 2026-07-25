import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import {
    Loader2, RefreshCw, Printer, FileText, Calendar,
    PieChart, Box, Layers, Tag, Users
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

const PurchaseSummaryHub = ({ defaultTab, isEmbedded = false }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const searchParams = new URLSearchParams(location.search);
    const filterFromUrl = searchParams.get('filter');

    const getInitialTab = () => {
        if (defaultTab) return defaultTab;
        if (filterFromUrl && ['day', 'month', 'item', 'group', 'brand', 'supplier'].includes(filterFromUrl)) {
            return filterFromUrl;
        }
        return 'day';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());

    // Dynamic Date Range (Defaults to YYYY-01-01 to Today)
    const getTodayString = () => new Date().toISOString().split('T')[0];
    const getStartOfYearString = () => `${new Date().getFullYear()}-01-01`;

    const [fromDate, setFromDate] = useState(getStartOfYearString);
    const [toDate, setToDate] = useState(getTodayString);

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

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

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (!isEmbedded) {
            navigate(`/dashboard/self-service/reports?category=purchase&filter=${tab}`);
        }
    };

    // ── DATA FETCHING WITH LIVE DB SYNCHRONIZATION ───────────────────────
    const fetchReportData = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) {
                setData([]);
                setLoading(false);
                return;
            }
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            const dateQueryParams = `startDate=${fromDate}&endDate=${toDate}`;

            let url = '';
            if (activeTab === 'day') {
                url = `${import.meta.env.VITE_API_URL}/reports/purchase/day-wise?${dateQueryParams}`;
            } else if (activeTab === 'month') {
                url = `${import.meta.env.VITE_API_URL}/reports/purchase-summary?groupBy=MONTH&${dateQueryParams}`;
            } else if (activeTab === 'item') {
                url = `${import.meta.env.VITE_API_URL}/reports/purchase-summary?groupBy=ITEM&${dateQueryParams}`;
            } else if (activeTab === 'group') {
                url = `${import.meta.env.VITE_API_URL}/reports/purchase-summary?groupBy=CATEGORY&${dateQueryParams}`;
            } else if (activeTab === 'brand') {
                url = `${import.meta.env.VITE_API_URL}/reports/purchase-summary?groupBy=BRAND&${dateQueryParams}`;
            } else if (activeTab === 'supplier') {
                url = `${import.meta.env.VITE_API_URL}/reports/purchase-summary?groupBy=SUPPLIER&${dateQueryParams}`;
            }

            const res = await fetch(url, { headers });
            const result = await res.json();

            if (result.success && result.data) {
                let rawList = [];
                if (Array.isArray(result.data)) {
                    rawList = result.data;
                } else if (result.data.dailyBreakdown && Array.isArray(result.data.dailyBreakdown)) {
                    rawList = result.data.dailyBreakdown;
                }

                const formatDateForDisplay = (dateStr) => {
                    if (!dateStr) return '-';
                    if (typeof dateStr === 'string' && dateStr.includes('/')) return dateStr;
                    const cleanStr = typeof dateStr === 'string' ? dateStr.split('T')[0] : '';
                    const parts = cleanStr.split('-');
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    return dateStr;
                };

                const mapped = rawList.map((item, idx) => {
                    if (activeTab === 'day') {
                        return {
                            id: idx + 1,
                            title: formatDateForDisplay(item.date),
                            count: item.billCount || item.count || 0,
                            amount: parseFloat(item.totalPurchases !== undefined ? item.totalPurchases : item.amount) || 0
                        };
                    } else if (activeTab === 'month') {
                        return {
                            id: idx + 1,
                            title: item.month || 'Unknown Month',
                            count: item.count || 0,
                            amount: parseFloat(item.amount) || 0
                        };
                    } else if (activeTab === 'item' || activeTab === 'group' || activeTab === 'brand') {
                        const nameKey = item.item || item.category || item.brand || item.name || 'Uncategorized';
                        return {
                            id: idx + 1,
                            title: nameKey,
                            qty: parseFloat(item.qty) || 0,
                            amount: parseFloat(item.amount) || 0
                        };
                    } else if (activeTab === 'supplier') {
                        return {
                            id: idx + 1,
                            title: item.name || 'Walk-in / Unknown',
                            count: item.count || 0,
                            amount: parseFloat(item.amount) || 0,
                            paid: parseFloat(item.paid) || 0,
                            due: parseFloat(item.due) || 0
                        };
                    }
                    return item;
                });

                setData(mapped);
            } else {
                setData([]);
            }
        } catch (err) {
            console.error('Error fetching purchase report:', err);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [activeTab, fromDate, toDate]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    // Format currency Helper
    const formatCurrency = (val) => {
        if (val === undefined || val === null || isNaN(val)) return '₹ 0.00';
        return `₹ ${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Date formatting helper for input display
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
    };

    // Calculate Totals
    const totals = useMemo(() => {
        if (activeTab === 'day' || activeTab === 'month') {
            return {
                count: data.reduce((sum, item) => sum + (Number(item.count) || 0), 0),
                amount: data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
            };
        } else if (activeTab === 'item' || activeTab === 'group' || activeTab === 'brand') {
            return {
                qty: data.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
                amount: data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
            };
        } else if (activeTab === 'supplier') {
            return {
                count: data.reduce((sum, item) => sum + (Number(item.count) || 0), 0),
                amount: data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
                paid: data.reduce((sum, item) => sum + (Number(item.paid) || 0), 0),
                due: data.reduce((sum, item) => sum + (Number(item.due) || 0), 0)
            };
        }
        return { amount: 0 };
    }, [data, activeTab]);

    // ── EXPORT EXCEL (CSV) ──────────────────────────────────────────────
    const exportToExcel = () => {
        if (!data.length) return;
        let headers = [];
        let rows = [];

        if (activeTab === 'day' || activeTab === 'month') {
            headers = [activeTab === 'day' ? 'Date' : 'Month', 'Bills Count', 'Total Purchase Amount'];
            rows = data.map(r => [`"${r.title}"`, r.count, r.amount]);
            rows.push(['TOTAL', totals.count, totals.amount]);
        } else if (activeTab === 'item' || activeTab === 'group' || activeTab === 'brand') {
            const colLabel = activeTab === 'item' ? 'Item Name' : activeTab === 'group' ? 'Group / Category' : 'Brand Name';
            headers = [colLabel, 'Quantity', 'Total Purchase Amount'];
            rows = data.map(r => [`"${r.title}"`, r.qty, r.amount]);
            rows.push(['TOTAL', totals.qty, totals.amount]);
        } else if (activeTab === 'supplier') {
            headers = ['Supplier Name', 'Bills Count', 'Total Amount', 'Paid Amount', 'Due Amount'];
            rows = data.map(r => [`"${r.title}"`, r.count, r.amount, r.paid, r.due]);
            rows.push(['TOTAL', totals.count, totals.amount, totals.paid, totals.due]);
        }

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Purchase_Report_${activeTab.toUpperCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ── EXPORT PDF ──────────────────────────────────────────────────────
    const exportToPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait' });

        doc.setFontSize(16);
        doc.setTextColor(5, 17, 41);
        doc.text(`PURCHASE REPORT - ${activeTab.toUpperCase()}`, 14, 15);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Date Range: ${formatDateForInput(fromDate)} to ${formatDateForInput(toDate)}`, 14, 22);

        let tableColumn = [];
        let tableRows = [];

        if (activeTab === 'day' || activeTab === 'month') {
            tableColumn = [activeTab === 'day' ? 'Date' : 'Month', 'Bills Count', 'Total Purchase Amount'];
            tableRows = data.map(item => [item.title, item.count, formatCurrency(item.amount)]);
            tableRows.push(['TOTAL', totals.count, formatCurrency(totals.amount)]);
        } else if (activeTab === 'item' || activeTab === 'group' || activeTab === 'brand') {
            const colLabel = activeTab === 'item' ? 'Item Name' : activeTab === 'group' ? 'Group / Category' : 'Brand Name';
            tableColumn = [colLabel, 'Quantity', 'Total Purchase Amount'];
            tableRows = data.map(item => [item.title, item.qty, formatCurrency(item.amount)]);
            tableRows.push(['TOTAL', totals.qty, formatCurrency(totals.amount)]);
        } else if (activeTab === 'supplier') {
            tableColumn = ['Supplier Name', 'Bills Count', 'Total Amount', 'Paid Amount', 'Due Amount'];
            tableRows = data.map(item => [item.title, item.count, formatCurrency(item.amount), formatCurrency(item.paid), formatCurrency(item.due)]);
            tableRows.push(['TOTAL', totals.count, formatCurrency(totals.amount), formatCurrency(totals.paid), formatCurrency(totals.due)]);
        }

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 26,
            theme: 'grid',
            headStyles: { fillColor: [5, 17, 41], textColor: [255, 138, 0], fontStyle: 'bold', fontSize: 9 },
            styles: { fontSize: 8.5, cellPadding: 3 },
            alternateRowStyles: { fillColor: [250, 250, 250] }
        });

        doc.save(`Purchase_Report_${activeTab}.pdf`);
    };

    // Print handler
    const handlePrint = () => {
        window.print();
    };

    // Close handler
    const handleClose = () => {
        navigate('/dashboard');
    };

    // Header Actions JSX (Excel, PDF, Print)
    const headerActions = (
        <div className="flex items-center gap-2">
            {/* EXCEL */}
            <button
                onClick={exportToExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold text-emerald-600 border border-emerald-200 bg-white hover:bg-emerald-50 rounded-[4px] shadow-sm transition-colors cursor-pointer"
                title="Export to Excel"
            >
                <span className="bg-emerald-600 text-white rounded-[2px] p-0.5 text-[10px] px-1.5 font-black">X</span> Excel
            </button>

            {/* PDF */}
            <button
                onClick={exportToPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold text-red-600 border border-red-200 bg-white hover:bg-red-50 rounded-[4px] shadow-sm transition-colors cursor-pointer"
                title="Export to PDF"
            >
                <FileText size={16} /> PDF
            </button>

            {/* PRINT */}
            <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 rounded-[4px] shadow-sm transition-colors cursor-pointer"
                title="Print Report"
            >
                <Printer size={16} /> Print
            </button>
        </div>
    );

    // Master layout content
    const mainContent = (
        <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc] p-3 sm:p-4 lg:p-6 overflow-hidden">

            {/* ── FILTER & DATE BAR ─────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-2 mb-4 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-sm overflow-x-auto custom-scrollbar lg:overflow-visible">
                {/* FILTER TABS */}
                <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap">
                    {/* DAY WISE */}
                    <button
                        onClick={() => handleTabChange('day')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[11px] sm:text-xs transition-all whitespace-nowrap border cursor-pointer ${activeTab === 'day'
                                ? 'bg-[#f97316] text-white border-[#f97316] shadow-sm'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                    >
                        <Calendar size={14} className={activeTab === 'day' ? 'text-white' : 'text-slate-500'} />
                        Day Wise
                    </button>

                    {/* MONTH WISE */}
                    <button
                        onClick={() => handleTabChange('month')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[11px] sm:text-xs transition-all whitespace-nowrap border cursor-pointer ${activeTab === 'month'
                                ? 'bg-[#f97316] text-white border-[#f97316] shadow-sm'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                    >
                        <PieChart size={14} className={activeTab === 'month' ? 'text-white' : 'text-slate-500'} />
                        Month Wise
                    </button>

                    {/* ITEM WISE */}
                    <button
                        onClick={() => handleTabChange('item')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[11px] sm:text-xs transition-all whitespace-nowrap border cursor-pointer ${activeTab === 'item'
                                ? 'bg-[#f97316] text-white border-[#f97316] shadow-sm'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                    >
                        <Box size={14} className={activeTab === 'item' ? 'text-white' : 'text-slate-500'} />
                        Item Wise
                    </button>

                    {/* GROUP WISE */}
                    <button
                        onClick={() => handleTabChange('group')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[11px] sm:text-xs transition-all whitespace-nowrap border cursor-pointer ${activeTab === 'group'
                                ? 'bg-[#f97316] text-white border-[#f97316] shadow-sm'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                    >
                        <Layers size={14} className={activeTab === 'group' ? 'text-white' : 'text-slate-500'} />
                        Group Wise
                    </button>

                    {/* BRAND WISE */}
                    <button
                        onClick={() => handleTabChange('brand')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[11px] sm:text-xs transition-all whitespace-nowrap border cursor-pointer ${activeTab === 'brand'
                                ? 'bg-[#f97316] text-white border-[#f97316] shadow-sm'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                    >
                        <Tag size={14} className={activeTab === 'brand' ? 'text-white' : 'text-slate-500'} />
                        Brand Wise
                    </button>

                    {/* SUPPLIER WISE */}
                    <button
                        onClick={() => handleTabChange('supplier')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[11px] sm:text-xs transition-all whitespace-nowrap border cursor-pointer ${activeTab === 'supplier'
                                ? 'bg-[#f97316] text-white border-[#f97316] shadow-sm'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                    >
                        <Users size={14} className={activeTab === 'supplier' ? 'text-white' : 'text-slate-500'} />
                        Supplier Wise
                    </button>
                </div>

                {/* DATE FILTERS & REFRESH BUTTON */}
                <div className="flex items-center gap-2 flex-nowrap shrink-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">From</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="border border-slate-200 rounded-md px-2 py-1 text-[11px] font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-xs"
                        />
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">To</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="border border-slate-200 rounded-md px-2 py-1 text-[11px] font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-xs"
                        />
                    </div>

                    <button
                        onClick={fetchReportData}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-[11px] rounded-md shadow-xs transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── DATA TABLE CONTAINER ─────────────────────────────────── */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">Loading Purchase Data...</span>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            {/* ── NAVY BLUE HEADER WITH ORANGE TEXT ───────── */}
                            <thead className="bg-[#051129] text-[#f97316] sticky top-0 z-10 font-bold text-xs uppercase tracking-wider">
                                <tr>
                                    {activeTab === 'day' && (
                                        <>
                                            <th className="py-3.5 px-4 border-r border-[#152747] text-left">Date</th>
                                            <th className="py-3.5 px-4 border-r border-[#152747] text-center">Bills Count</th>
                                            <th className="py-3.5 px-4 text-right">Total Purchase Amount</th>
                                        </>
                                    )}
                                    {activeTab === 'month' && (
                                        <>
                                            <th className="py-3.5 px-4 border-r border-[#152747] text-left">Month</th>
                                            <th className="py-3.5 px-4 border-r border-[#152747] text-center">Bills Count</th>
                                            <th className="py-3.5 px-4 text-right">Total Purchase Amount</th>
                                        </>
                                    )}
                                    {(activeTab === 'item' || activeTab === 'group' || activeTab === 'brand') && (
                                        <>
                                            <th className="py-3.5 px-4 border-r border-[#152747] text-left">
                                                {activeTab === 'item' ? 'Item Name' : activeTab === 'group' ? 'Group / Category' : 'Brand Name'}
                                            </th>
                                            <th className="py-3.5 px-4 border-r border-[#152747] text-center">Quantity</th>
                                            <th className="py-3.5 px-4 text-right">Total Purchase Amount</th>
                                        </>
                                    )}
                                    {activeTab === 'supplier' && (
                                        <>
                                            <th className="py-3.5 px-4 border-r border-[#152747] text-left">Supplier Name</th>
                                            <th className="py-3.5 px-4 border-r border-[#152747] text-center">Bills Count</th>
                                            <th className="py-3.5 px-4 border-r border-[#152747] text-right">Total Amount</th>
                                            <th className="py-3.5 px-4 border-r border-[#152747] text-right">Paid Amount</th>
                                            <th className="py-3.5 px-4 text-right">Due Amount</th>
                                        </>
                                    )}
                                </tr>
                            </thead>

                            {/* ── TABLE BODY ─────────────────────────────── */}
                            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                                            No purchase data available for the selected period.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, idx) => (
                                        <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                                            {activeTab === 'day' || activeTab === 'month' ? (
                                                <>
                                                    <td className="py-3.5 px-4 font-semibold text-slate-800">{row.title}</td>
                                                    <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">{row.count}</td>
                                                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">{formatCurrency(row.amount)}</td>
                                                </>
                                            ) : activeTab === 'item' || activeTab === 'group' || activeTab === 'brand' ? (
                                                <>
                                                    <td className="py-3.5 px-4 font-semibold text-slate-800">{row.title}</td>
                                                    <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">{row.qty}</td>
                                                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">{formatCurrency(row.amount)}</td>
                                                </>
                                            ) : activeTab === 'supplier' ? (
                                                <>
                                                    <td className="py-3.5 px-4 font-semibold text-slate-800">{row.title}</td>
                                                    <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">{row.count}</td>
                                                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">{formatCurrency(row.amount)}</td>
                                                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600">{formatCurrency(row.paid)}</td>
                                                    <td className="py-3.5 px-4 text-right font-medium text-rose-600">{formatCurrency(row.due)}</td>
                                                </>
                                            ) : null}
                                        </tr>
                                    ))
                                )}
                            </tbody>

                            {/* ── TABLE FOOTER TOTALS ROW ─────────────────── */}
                            <tfoot className="bg-white border-t-2 border-slate-200 font-bold text-xs text-[#f97316] sticky bottom-0 z-10 shadow-inner">
                                {activeTab === 'day' || activeTab === 'month' ? (
                                    <tr>
                                        <td className="py-3.5 px-4 uppercase text-[#f97316] tracking-wider">TOTAL</td>
                                        <td className="py-3.5 px-4 text-center text-[#f97316]">{totals.count}</td>
                                        <td className="py-3.5 px-4 text-right text-[#f97316]">{formatCurrency(totals.amount)}</td>
                                    </tr>
                                ) : activeTab === 'item' || activeTab === 'group' || activeTab === 'brand' ? (
                                    <tr>
                                        <td className="py-3.5 px-4 uppercase text-[#f97316] tracking-wider">TOTAL</td>
                                        <td className="py-3.5 px-4 text-center text-[#f97316]">{totals.qty}</td>
                                        <td className="py-3.5 px-4 text-right text-[#f97316]">{formatCurrency(totals.amount)}</td>
                                    </tr>
                                ) : activeTab === 'supplier' ? (
                                    <tr>
                                        <td className="py-3.5 px-4 uppercase text-[#f97316] tracking-wider">TOTAL</td>
                                        <td className="py-3.5 px-4 text-center text-[#f97316]">{totals.count}</td>
                                        <td className="py-3.5 px-4 text-right text-[#f97316]">{formatCurrency(totals.amount)}</td>
                                        <td className="py-3.5 px-4 text-right text-[#f97316]">{formatCurrency(totals.paid)}</td>
                                        <td className="py-3.5 px-4 text-right text-[#f97316]">{formatCurrency(totals.due)}</td>
                                    </tr>
                                ) : null}
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );

    if (isEmbedded) {
        return mainContent;
    }

    return (
        <div className="dashboard-layout bg-slate-50">
            <Sidebar
                isCollapsed={isCollapsed}
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
            />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main flex-1 overflow-hidden font-sans bg-slate-50 flex flex-col h-screen">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="PURCHASE SUMMARY"
                    headerActions={headerActions}
                    onClose={handleClose}
                />
                {mainContent}
            </main>
        </div>
    );
};

export default PurchaseSummaryHub;
