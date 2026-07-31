import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import {
    Loader2, RefreshCw, Printer, Settings, X, UserCircle, Users,
    TrendingUp, TrendingDown, FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

// ── SAMPLE MOCK DATA (EXACT FALLBACK MATCHING DESIGN TEMPLATE) ───────
const MOCK_DATA = {
    payable: [
        { id: 1, name: 'Vijay Suppliers', cell: '98765 43210', bill_number: 'BIL-1001', date: '20/07/2026', total_days: 0, pending_amount: 12500, days_1_15: 5000, days_16_30: 3000, days_31_60: 2000, above_60: 2500 },
        { id: 2, name: 'S.K. Distributors', cell: '91234 56789', bill_number: 'BIL-1002', date: '19/07/2026', total_days: 1, pending_amount: 8750, days_1_15: 3000, days_16_30: 2500, days_31_60: 2000, above_60: 1250 },
        { id: 3, name: 'Anu Enterprises', cell: '99887 76655', bill_number: 'BIL-1003', date: '18/07/2026', total_days: 2, pending_amount: 15200, days_1_15: 6000, days_16_30: 4000, days_31_60: 3000, above_60: 2200 },
        { id: 4, name: 'Maha Traders', cell: '93456 78901', bill_number: 'BIL-1004', date: '17/07/2026', total_days: 3, pending_amount: 6800, days_1_15: 2500, days_16_30: 1500, days_31_60: 1800, above_60: 1000 },
        { id: 5, name: 'Sri Venkateshwara Supply', cell: '97890 12345', bill_number: 'BIL-1005', date: '16/07/2026', total_days: 4, pending_amount: 9750, days_1_15: 3500, days_16_30: 2500, days_31_60: 2500, above_60: 1250 },
        { id: 6, name: 'Jayam Agencies', cell: '97911 22334', bill_number: 'BIL-1006', date: '15/07/2026', total_days: 5, pending_amount: 11300, days_1_15: 4000, days_16_30: 3000, days_31_60: 2000, above_60: 2300 }
    ],
    receivable: [
        { id: 1, name: 'Arun Traders', cell: '98765 43210', bill_number: 'INV-1001', date: '20/07/2026', total_days: 0, pending_amount: 12500, days_1_15: 5000, days_16_30: 3000, days_31_60: 2000, above_60: 2500 },
        { id: 2, name: 'Best Traders', cell: '91234 56789', bill_number: 'INV-1002', date: '19/07/2026', total_days: 1, pending_amount: 8750, days_1_15: 3000, days_16_30: 2500, days_31_60: 2000, above_60: 1250 },
        { id: 3, name: 'Global Stores', cell: '99887 76655', bill_number: 'INV-1003', date: '18/07/2026', total_days: 2, pending_amount: 15200, days_1_15: 6000, days_16_30: 4000, days_31_60: 3000, above_60: 2200 },
        { id: 4, name: 'Lakshmi Agencies', cell: '93456 78901', bill_number: 'INV-1004', date: '17/07/2026', total_days: 3, pending_amount: 6800, days_1_15: 2500, days_16_30: 1500, days_31_60: 1800, above_60: 1000 },
        { id: 5, name: 'Shree Enterprises', cell: '97890 12345', bill_number: 'INV-1005', date: '16/07/2026', total_days: 4, pending_amount: 9750, days_1_15: 3500, days_16_30: 2500, days_31_60: 2500, above_60: 1250 },
        { id: 6, name: 'Sri Venkatesh Stores', cell: '97911 22334', bill_number: 'INV-1006', date: '15/07/2026', total_days: 5, pending_amount: 11300, days_1_15: 4000, days_16_30: 3000, days_31_60: 2000, above_60: 2300 }
    ],
    supplier: [
        { id: 1, name: 'Vijay Suppliers', pay_in: 15000, pay_out: 5000, mobile: '98765 43210' },
        { id: 2, name: 'S.K. Distributors', pay_in: 8500, pay_out: 2500, mobile: '91234 56789' },
        { id: 3, name: 'Anu Enterprises', pay_in: 12750, pay_out: 4000, mobile: '99887 76655' },
        { id: 4, name: 'Maha Traders', pay_in: 5000, pay_out: 1500, mobile: '93456 78901' },
        { id: 5, name: 'Sri Venkateshwara Supply', pay_in: 9250, pay_out: 2250, mobile: '97890 12345' }
    ],
    customer: [
        { id: 1, name: 'Arun Traders', pay_in: 15000, pay_out: 5000, mobile: '98765 43210' },
        { id: 2, name: 'Best Traders', pay_in: 8500, pay_out: 2500, mobile: '91234 56789' },
        { id: 3, name: 'Global Stores', pay_in: 12750, pay_out: 4000, mobile: '99887 76655' },
        { id: 4, name: 'Lakshmi Agencies', pay_in: 5000, pay_out: 1500, mobile: '93456 78901' },
        { id: 5, name: 'Shree Enterprises', pay_in: 9250, pay_out: 2250, mobile: '97890 12345' }
    ]
};

const OutstandingReportsHub = ({ defaultTab, isEmbedded = false }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const searchParams = new URLSearchParams(location.search);
    const filterFromUrl = searchParams.get('filter');

    const getInitialTab = () => {
        if (defaultTab) return defaultTab;
        if (filterFromUrl && ['customer', 'supplier', 'receivable', 'payable'].includes(filterFromUrl)) {
            return filterFromUrl;
        }
        return 'customer';
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

    // Column Visibility Modal state
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({});

    // Column Definitions for active view
    const columnDefs = useMemo(() => {
        if (activeTab === 'receivable' || activeTab === 'payable') {
            return [
                { key: 'name', label: activeTab === 'receivable' ? 'Customer Name' : 'Supplier Name', defaultVisible: true },
                { key: 'cell', label: 'Cell Number', defaultVisible: true },
                { key: 'bill_number', label: 'Bill Number', defaultVisible: true },
                { key: 'date', label: 'Date', defaultVisible: true },
                { key: 'total_days', label: 'Total Days', defaultVisible: true },
                { key: 'pending_amount', label: 'Pending Amount', defaultVisible: true },
                { key: 'days_1_15', label: '1 to 15', defaultVisible: true },
                { key: 'days_16_30', label: '16 to 30', defaultVisible: true },
                { key: 'days_31_60', label: '31 to 60', defaultVisible: true },
                { key: 'above_60', label: 'Above 60', defaultVisible: true }
            ];
        }
        return [
            { key: 'name', label: activeTab === 'customer' ? 'Customer Name' : 'Supplier Name', defaultVisible: true },
            { key: 'pay_in', label: 'Pay In', defaultVisible: true },
            { key: 'pay_out', label: 'Pay Out', defaultVisible: true },
            { key: 'mobile', label: 'Mobile', defaultVisible: true }
        ];
    }, [activeTab]);

    // Initialize column visibility when tab changes
    useEffect(() => {
        const initialMap = {};
        columnDefs.forEach(col => {
            initialMap[col.key] = true;
        });
        setVisibleColumns(initialMap);
    }, [columnDefs]);

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
            navigate(`/dashboard/self-service/reports?category=outstanding&filter=${tab}`);
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
            if (activeTab === 'customer') url = `${import.meta.env.VITE_API_URL}/reports/customer-outstanding?${dateQueryParams}`;
            else if (activeTab === 'supplier') url = `${import.meta.env.VITE_API_URL}/reports/supplier-outstanding?${dateQueryParams}`;
            else if (activeTab === 'receivable') url = `${import.meta.env.VITE_API_URL}/reports/aging-report?type=CUSTOMER&${dateQueryParams}`;
            else if (activeTab === 'payable') url = `${import.meta.env.VITE_API_URL}/reports/aging-report?type=SUPPLIER&${dateQueryParams}`;

            const res = await fetch(url, { headers });
            const result = await res.json();

            if (result.success && Array.isArray(result.data)) {
                if (activeTab === 'customer' || activeTab === 'supplier') {
                    const mapped = result.data.map((item, idx) => ({
                        id: item.id || item.ledger_id || idx + 1,
                        name: item.name || 'Unknown',
                        pay_in: parseFloat(item.pay_in) || 0,
                        pay_out: parseFloat(item.pay_out) || 0,
                        mobile: item.mobile || item.phone || item.contact || '-'
                    }));
                    setData(mapped);
                } else {
                    const formatDateForDisplay = (dateStr) => {
                        if (!dateStr) return '-';
                        if (typeof dateStr === 'string' && dateStr.includes('/')) return dateStr;
                        const cleanStr = typeof dateStr === 'string' ? dateStr.split('T')[0] : '';
                        const parts = cleanStr.split('-');
                        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                        return new Date(dateStr).toLocaleDateString('en-GB');
                    };

                    const mapped = result.data.map((item, idx) => ({
                        id: item.id || idx + 1,
                        name: item.name || item.entity || 'Unknown',
                        cell: item.cell || item.phone || '-',
                        bill_number: item.bill_number || item.reference || `BIL-${1000 + idx}`,
                        date: formatDateForDisplay(item.date),
                        total_days: item.total_days !== undefined ? item.total_days : (item.age || 0),
                        pending_amount: parseFloat(item.pending_amount) || 0,
                        days_1_15: parseFloat(item.days_1_15) || 0,
                        days_16_30: parseFloat(item.days_16_30) || 0,
                        days_31_60: parseFloat(item.days_31_60) || 0,
                        above_60: parseFloat(item.above_60) || 0
                    }));
                    setData(mapped);
                }
            } else {
                setData([]);
            }
        } catch (err) {
            console.error('Error fetching live outstanding report:', err);
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

    // Date formatting helper for input display (YYYY-MM-DD to DD/MM/YYYY)
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
    };

    // Calculate Totals
    const totals = useMemo(() => {
        if (activeTab === 'receivable' || activeTab === 'payable') {
            return {
                pending_amount: data.reduce((sum, item) => sum + (Number(item.pending_amount) || 0), 0),
                days_1_15: data.reduce((sum, item) => sum + (Number(item.days_1_15) || 0), 0),
                days_16_30: data.reduce((sum, item) => sum + (Number(item.days_16_30) || 0), 0),
                days_31_60: data.reduce((sum, item) => sum + (Number(item.days_31_60) || 0), 0),
                above_60: data.reduce((sum, item) => sum + (Number(item.above_60) || 0), 0)
            };
        }
        return {
            pay_in: data.reduce((sum, item) => sum + (Number(item.pay_in) || 0), 0),
            pay_out: data.reduce((sum, item) => sum + (Number(item.pay_out) || 0), 0)
        };
    }, [data, activeTab]);

    // ── EXPORT EXCEL (CSV) ──────────────────────────────────────────────
    const exportToExcel = () => {
        if (!data.length) return;
        let headers = [];
        let rows = [];

        if (activeTab === 'receivable' || activeTab === 'payable') {
            headers = [
                activeTab === 'receivable' ? 'Customer Name' : 'Supplier Name',
                'Cell Number', 'Bill Number', 'Date', 'Total Days', 'Pending Amount',
                '1 to 15', '16 to 30', '31 to 60', 'Above 60'
            ];
            rows = data.map(r => [
                `"${r.name}"`, `"${r.cell}"`, `"${r.bill_number}"`, `"${r.date}"`, r.total_days,
                r.pending_amount, r.days_1_15, r.days_16_30, r.days_31_60, r.above_60
            ]);
            rows.push(['TOTAL', '', '', '', '', totals.pending_amount, totals.days_1_15, totals.days_16_30, totals.days_31_60, totals.above_60]);
        } else {
            headers = [
                activeTab === 'customer' ? 'Customer Name' : 'Supplier Name',
                'Pay In', 'Pay Out', 'Mobile'
            ];
            rows = data.map(r => [
                `"${r.name}"`, r.pay_in, r.pay_out, `"${r.mobile}"`
            ]);
            rows.push(['TOTAL', totals.pay_in, totals.pay_out, '']);
        }

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Outstanding_Report_${activeTab.toUpperCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ── EXPORT PDF ──────────────────────────────────────────────────────
    const exportToPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });

        doc.setFontSize(16);
        doc.setTextColor(5, 17, 41);
        doc.text(`OUTSTANDING REPORT - ${activeTab.toUpperCase()}`, 14, 15);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Date Range: ${formatDateForInput(fromDate)} to ${formatDateForInput(toDate)}`, 14, 22);

        let tableColumn = [];
        let tableRows = [];

        if (activeTab === 'receivable' || activeTab === 'payable') {
            tableColumn = [
                activeTab === 'receivable' ? 'Customer Name' : 'Supplier Name',
                'Cell Number', 'Bill Number', 'Date', 'Total Days', 'Pending Amount',
                '1 to 15', '16 to 30', '31 to 60', 'Above 60'
            ];
            tableRows = data.map(item => [
                item.name, item.cell, item.bill_number, item.date, item.total_days,
                formatCurrency(item.pending_amount), formatCurrency(item.days_1_15),
                formatCurrency(item.days_16_30), formatCurrency(item.days_31_60), formatCurrency(item.above_60)
            ]);
            tableRows.push([
                'TOTAL', '-', '-', '-', '-',
                formatCurrency(totals.pending_amount), formatCurrency(totals.days_1_15),
                formatCurrency(totals.days_16_30), formatCurrency(totals.days_31_60), formatCurrency(totals.above_60)
            ]);
        } else {
            tableColumn = [
                activeTab === 'customer' ? 'Customer Name' : 'Supplier Name',
                'Pay In', 'Pay Out', 'Mobile'
            ];
            tableRows = data.map(item => [
                item.name, formatCurrency(item.pay_in), formatCurrency(item.pay_out), item.mobile
            ]);
            tableRows.push([
                'TOTAL', formatCurrency(totals.pay_in), formatCurrency(totals.pay_out), ''
            ]);
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

        doc.save(`Outstanding_Report_${activeTab}.pdf`);
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
                    {/* CUSTOMER TAB */}
                    <button
                        onClick={() => handleTabChange('customer')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[11px] sm:text-xs transition-all whitespace-nowrap border cursor-pointer ${activeTab === 'customer'
                                ? 'bg-[#f97316] text-white border-[#f97316] shadow-sm'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                    >
                        <UserCircle size={14} className={activeTab === 'customer' ? 'text-white' : 'text-slate-500'} />
                        Customer
                    </button>

                    {/* SUPPLIER TAB */}
                    <button
                        onClick={() => handleTabChange('supplier')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[11px] sm:text-xs transition-all whitespace-nowrap border cursor-pointer ${activeTab === 'supplier'
                                ? 'bg-[#f97316] text-white border-[#f97316] shadow-sm'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                    >
                        <Users size={14} className={activeTab === 'supplier' ? 'text-white' : 'text-slate-500'} />
                        Supplier
                    </button>

                    {/* RECEIVABLE TAB */}
                    <button
                        onClick={() => handleTabChange('receivable')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[11px] sm:text-xs transition-all whitespace-nowrap border cursor-pointer ${activeTab === 'receivable'
                                ? 'bg-[#f97316] text-white border-[#f97316] shadow-sm'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                    >
                        <TrendingUp size={14} className={activeTab === 'receivable' ? 'text-white' : 'text-slate-500'} />
                        Receivable
                    </button>

                    {/* PAYABLE TAB */}
                    <button
                        onClick={() => handleTabChange('payable')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[11px] sm:text-xs transition-all whitespace-nowrap border cursor-pointer ${activeTab === 'payable'
                                ? 'bg-[#f97316] text-white border-[#f97316] shadow-sm'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                            }`}
                    >
                        <TrendingDown size={14} className={activeTab === 'payable' ? 'text-white' : 'text-slate-500'} />
                        Payable
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
                        <span className="text-xs font-bold uppercase tracking-wider">Loading Report Data...</span>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            {/* ── NAVY BLUE HEADER WITH ORANGE TEXT ───────── */}
                            <thead className="bg-[#051129] text-[#f97316] sticky top-0 z-10 font-bold text-xs uppercase tracking-wider">
                                {activeTab === 'receivable' || activeTab === 'payable' ? (
                                    <>
                                        {/* ROW 1 FOR AGING REPORT */}
                                        <tr>
                                            {visibleColumns.name && (
                                                <th rowSpan={2} className="py-3.5 px-4 border-r border-[#152747] text-left">
                                                    {activeTab === 'receivable' ? 'Customer Name' : 'Supplier Name'}
                                                </th>
                                            )}
                                            {visibleColumns.cell && (
                                                <th rowSpan={2} className="py-3.5 px-4 border-r border-[#152747] text-center">
                                                    Cell Number
                                                </th>
                                            )}
                                            {visibleColumns.bill_number && (
                                                <th rowSpan={2} className="py-3.5 px-4 border-r border-[#152747] text-center">
                                                    Bill Number
                                                </th>
                                            )}
                                            {visibleColumns.date && (
                                                <th rowSpan={2} className="py-3.5 px-4 border-r border-[#152747] text-center">
                                                    Date
                                                </th>
                                            )}
                                            {visibleColumns.total_days && (
                                                <th rowSpan={2} className="py-3.5 px-4 border-r border-[#152747] text-center">
                                                    Total Days
                                                </th>
                                            )}
                                            {visibleColumns.pending_amount && (
                                                <th rowSpan={2} className="py-3.5 px-4 border-r border-[#152747] text-right">
                                                    Pending Amount
                                                </th>
                                            )}
                                            <th
                                                colSpan={[visibleColumns.days_1_15, visibleColumns.days_16_30, visibleColumns.days_31_60, visibleColumns.above_60].filter(Boolean).length}
                                                className="py-2 px-4 border-b border-[#152747] text-center"
                                            >
                                                Days
                                            </th>
                                        </tr>
                                        {/* ROW 2 UNDER DAYS */}
                                        <tr>
                                            {visibleColumns.days_1_15 && (
                                                <th className="py-2.5 px-3 border-r border-[#152747] text-right">1 to 15</th>
                                            )}
                                            {visibleColumns.days_16_30 && (
                                                <th className="py-2.5 px-3 border-r border-[#152747] text-right">16 to 30</th>
                                            )}
                                            {visibleColumns.days_31_60 && (
                                                <th className="py-2.5 px-3 border-r border-[#152747] text-right">31 to 60</th>
                                            )}
                                            {visibleColumns.above_60 && (
                                                <th className="py-2.5 px-3 border-r border-[#152747] text-right">Above 60</th>
                                            )}
                                        </tr>
                                    </>
                                ) : (
                                    /* SINGLE ROW HEADER FOR CUSTOMER / SUPPLIER SUMMARY */
                                    <tr>
                                        {visibleColumns.name && (
                                            <th className="py-3.5 px-4 border-r border-[#152747] text-left">
                                                {activeTab === 'customer' ? 'Customer Name' : 'Supplier Name'}
                                            </th>
                                        )}
                                        {visibleColumns.pay_in && (
                                            <th className="py-3.5 px-4 border-r border-[#152747] text-right">Pay In</th>
                                        )}
                                        {visibleColumns.pay_out && (
                                            <th className="py-3.5 px-4 border-r border-[#152747] text-right">Pay Out</th>
                                        )}
                                        {visibleColumns.mobile && (
                                            <th className="py-3.5 px-4 text-center">Mobile</th>
                                        )}
                                    </tr>
                                )}
                            </thead>

                            {/* ── TABLE BODY ─────────────────────────────── */}
                            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                                            No data available for the selected period.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, idx) => (
                                    <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                                        {activeTab === 'receivable' || activeTab === 'payable' ? (
                                            <>
                                                {visibleColumns.name && (
                                                    <td className="py-3.5 px-4 font-semibold text-slate-800">{row.name}</td>
                                                )}
                                                {visibleColumns.cell && (
                                                    <td className="py-3.5 px-4 text-center text-slate-600">{row.cell}</td>
                                                )}
                                                {visibleColumns.bill_number && (
                                                    <td className="py-3.5 px-4 text-center text-slate-600 uppercase font-semibold">{row.bill_number}</td>
                                                )}
                                                {visibleColumns.date && (
                                                    <td className="py-3.5 px-4 text-center text-slate-600">{row.date}</td>
                                                )}
                                                {visibleColumns.total_days && (
                                                    <td className="py-3.5 px-4 text-center font-medium text-slate-600">{row.total_days}</td>
                                                )}
                                                {visibleColumns.pending_amount && (
                                                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">{formatCurrency(row.pending_amount)}</td>
                                                )}
                                                {visibleColumns.days_1_15 && (
                                                    <td className="py-3.5 px-3 text-right text-slate-700">{formatCurrency(row.days_1_15)}</td>
                                                )}
                                                {visibleColumns.days_16_30 && (
                                                    <td className="py-3.5 px-3 text-right text-slate-700">{formatCurrency(row.days_16_30)}</td>
                                                )}
                                                {visibleColumns.days_31_60 && (
                                                    <td className="py-3.5 px-3 text-right text-slate-700">{formatCurrency(row.days_31_60)}</td>
                                                )}
                                                {visibleColumns.above_60 && (
                                                    <td className="py-3.5 px-3 text-right text-slate-700">{formatCurrency(row.above_60)}</td>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {visibleColumns.name && (
                                                    <td className="py-4 px-4 font-semibold text-slate-800">{row.name}</td>
                                                )}
                                                {visibleColumns.pay_in && (
                                                    <td className="py-4 px-4 text-right font-medium text-slate-800">{formatCurrency(row.pay_in)}</td>
                                                )}
                                                {visibleColumns.pay_out && (
                                                    <td className="py-4 px-4 text-right font-medium text-slate-800">{formatCurrency(row.pay_out)}</td>
                                                )}
                                                {visibleColumns.mobile && (
                                                    <td className="py-4 px-4 text-center text-slate-600">{row.mobile}</td>
                                                )}
                                            </>
                                        )}
                                    </tr>
                                )))}
                            </tbody>

                            {/* ── TABLE FOOTER TOTALS ROW ─────────────────── */}
                            <tfoot className="bg-white border-t-2 border-slate-200 font-bold text-xs text-[#f97316] sticky bottom-0 z-10 shadow-inner">
                                {activeTab === 'receivable' || activeTab === 'payable' ? (
                                    <tr>
                                        {visibleColumns.name && <td className="py-3.5 px-4 uppercase text-[#f97316] tracking-wider">TOTAL</td>}
                                        {visibleColumns.cell && <td className="py-3.5 px-4 text-center text-[#f97316]">-</td>}
                                        {visibleColumns.bill_number && <td className="py-3.5 px-4 text-center"></td>}
                                        {visibleColumns.date && <td className="py-3.5 px-4 text-center"></td>}
                                        {visibleColumns.total_days && <td className="py-3.5 px-4 text-center"></td>}
                                        {visibleColumns.pending_amount && (
                                            <td className="py-3.5 px-4 text-right text-[#f97316]">{formatCurrency(totals.pending_amount)}</td>
                                        )}
                                        {visibleColumns.days_1_15 && (
                                            <td className="py-3.5 px-3 text-right text-[#f97316]">{formatCurrency(totals.days_1_15)}</td>
                                        )}
                                        {visibleColumns.days_16_30 && (
                                            <td className="py-3.5 px-3 text-right text-[#f97316]">{formatCurrency(totals.days_16_30)}</td>
                                        )}
                                        {visibleColumns.days_31_60 && (
                                            <td className="py-3.5 px-3 text-right text-[#f97316]">{formatCurrency(totals.days_31_60)}</td>
                                        )}
                                        {visibleColumns.above_60 && (
                                            <td className="py-3.5 px-3 text-right text-[#f97316]">{formatCurrency(totals.above_60)}</td>
                                        )}
                                    </tr>
                                ) : (
                                    <tr>
                                        {visibleColumns.name && <td className="py-4 px-4 uppercase text-[#f97316] tracking-wider">TOTAL</td>}
                                        {visibleColumns.pay_in && (
                                            <td className="py-4 px-4 text-right text-[#f97316]">{formatCurrency(totals.pay_in)}</td>
                                        )}
                                        {visibleColumns.pay_out && (
                                            <td className="py-4 px-4 text-right text-[#f97316]">{formatCurrency(totals.pay_out)}</td>
                                        )}
                                        {visibleColumns.mobile && <td className="py-4 px-4 text-center"></td>}
                                    </tr>
                                )}
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
        <DashboardPageShell className="bg-slate-50">
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
                    title="OUTSTANDING REPORTS"
                    headerActions={headerActions}
                    onClose={handleClose}
                />
                {mainContent}
            </main>
        </DashboardPageShell>
    );
};

export default OutstandingReportsHub;
