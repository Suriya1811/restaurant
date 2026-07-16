import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { 
    Monitor, Calendar, Search, Filter, RefreshCw, Download, 
    FileText, ChevronLeft, ChevronRight, Eye, CalendarDays, 
    FileCheck, Edit, Printer, XCircle, DollarSign, AlertCircle,
    FileSpreadsheet, FileIcon, X, Settings, CheckSquare, Square, Trash2, MoreVertical, Settings2, Landmark, ClipboardList
} from 'lucide-react';
import './Dashboard.css';

const ALL_COLUMNS = [
    { id: 'sno', label: 'Serial Number' },
    { id: 'type', label: 'Type' },
    { id: 'kot_bill_no', label: 'KOT / Bill No' },
    { id: 'date', label: 'Date' },
    { id: 'customer_name', label: 'Customer Name' },
    { id: 'cell_no', label: 'Cell Number' },
    { id: 'captain', label: 'Captain' },
    { id: 'waiter', label: 'Waiter' },
    { id: 'table', label: 'Table' },
    { id: 'amount', label: 'Amount' },
    { id: 'status', label: 'Status' },
    { id: 'action', label: 'Action' }
];

const DisplayPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Layout State
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Data State
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter State
    const [filterType, setFilterType] = useState('ALL'); // ALL, KOT, SALES_BILL
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCaptain, setSelectedCaptain] = useState('ALL');
    const [selectedWaiter, setSelectedWaiter] = useState('ALL');
    
    // Action Filter State
    const [showColumnFilter, setShowColumnFilter] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('displayPageColumns');
        return saved ? JSON.parse(saved) : ALL_COLUMNS.map(c => c.id);
    });

    // Action Dropdown State
    const [openActionId, setOpenActionId] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    // Staff lists (Fetched from API)
    const [captains, setCaptains] = useState([]);
    const [waiters, setWaiters] = useState([]);

    const columnFilterRef = useRef(null);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    useEffect(() => {
        localStorage.setItem('displayPageColumns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        localStorage.setItem('displayPageColumns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) {
                setOpenActionId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchStaff = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const [captainsRes, waitersRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/captains`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/waiters`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const captainsData = await captainsRes.json();
            const waitersData = await waitersRes.json();

            if (captainsData.success) {
                setCaptains(captainsData.data.map(c => c.name));
            }
            if (waitersData.success) {
                setWaiters(waitersData.data.map(w => w.name));
            }
        } catch (error) {
            console.error("Failed to fetch staff", error);
        }
    };

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.success) {
                const fetchedRecords = data.data.map((bill, index) => {
                    const hasKots = bill.kots && bill.kots.length > 0;
                    const isStrictKot = bill.status === 'DRAFT' || bill.type === 'KOT';
                    
                    let cashAmt = 0, cardAmt = 0, upiAmt = 0;
                    if (bill.payment_modes) {
                        bill.payment_modes.forEach(pm => {
                            if (pm.mode === 'CASH') cashAmt += (parseFloat(pm.amount) || 0);
                            else if (pm.mode === 'CARD') cardAmt += (parseFloat(pm.amount) || 0);
                            else if (pm.mode === 'UPI') upiAmt += (parseFloat(pm.amount) || 0);
                        });
                    }

                    // Backend permission mock (default true)
                    const canAlter = bill.can_alter ?? true;
                    const canCancel = bill.can_cancel ?? true;
                    const canDelete = bill.can_delete ?? true;

                    return {
                        id: bill._id || `rec-${index}`,
                        type: isStrictKot ? 'KOT' : 'BILL',
                        hasKots: hasKots,
                        kot_no: bill.kots && bill.kots.length > 0 ? bill.kots[0].kot_number : (bill.kot_number || (isStrictKot ? bill.bill_number : null) || '-'),
                        bill_no: bill.bill_number,
                        date: bill.createdAt || bill.delivery_date || new Date().toISOString(),
                        time: new Date(bill.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        customer_name: bill.customer_name || '-',
                        cell_no: bill.customer_phone || '-',
                        captain: bill.captain_name || 'N/A',
                        waiter: bill.waiter_name || 'N/A',
                        table: bill.table_no || (bill.type === 'PARTY_ORDER' ? 'Party' : bill.type) || 'N/A',
                        amount: bill.grand_total || bill.sub_total || 0,
                        cashAmt,
                        cardAmt,
                        upiAmt,
                        status: isStrictKot ? 'Saved' : (bill.status === 'PAID' ? 'Paid' : 'Unpaid'),
                        canAlter,
                        canCancel,
                        canDelete
                    };
                });
                
                // Sort newest first
                fetchedRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
                setRecords(fetchedRecords);
            }
        } catch (e) {
            console.error("Failed to fetch records", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStaff();
        fetchRecords();
    }, [fetchRecords]);

    const handleReset = () => {
        setFilterType('ALL');
        setFromDate(new Date().toISOString().split('T')[0]);
        setToDate(new Date().toISOString().split('T')[0]);
        setSelectedCaptain('ALL');
        setSelectedWaiter('ALL');
    };

    const toggleColumn = (colId) => {
        setVisibleColumns(prev => {
            const next = prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId];
            return next;
        });
    };

    // Filter Logic
    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            // Date filtering
            const recordDate = new Date(record.date).toISOString().split('T')[0];
            if (recordDate < fromDate || recordDate > toDate) return false;

            if (filterType === 'KOT' && record.type !== 'KOT' && !record.hasKots) return false;
            if (filterType === 'SALES_BILL' && record.type !== 'BILL') return false;
            if (selectedCaptain !== 'ALL' && record.captain !== selectedCaptain) return false;
            if (selectedWaiter !== 'ALL' && record.waiter !== selectedWaiter) return false;
            return true;
        });
    }, [records, filterType, fromDate, toDate, selectedCaptain, selectedWaiter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage
    );

    // Date Range Summary (uses filteredRecords)
    const rangeKotCount = filteredRecords.filter(r => r.type === 'KOT').length;
    const rangeBillCount = filteredRecords.filter(r => r.type === 'BILL').length;
    const rangePendingKotCount = filteredRecords.filter(r => r.type === 'KOT' && r.status === 'Saved').length; 
    
    const rangeSalesAmount = filteredRecords.filter(r => r.type === 'BILL').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
    const rangeCashAmount = filteredRecords.filter(r => r.type === 'BILL').reduce((acc, r) => acc + (parseFloat(r.cashAmt) || 0), 0);
    const rangeBankAmount = filteredRecords.filter(r => r.type === 'BILL').reduce((acc, r) => acc + (parseFloat(r.cardAmt) || 0) + (parseFloat(r.upiAmt) || 0), 0);

    const headerActions = (
        <div className="flex items-center gap-2">
            <button className="flex items-center justify-center gap-2 bg-white text-green-600 border border-green-500 hover:bg-green-50 px-4 py-2 rounded-xl font-black text-sm transition-all shadow-sm">
                <FileSpreadsheet size={18} /> Excel
            </button>
            <button className="btn-export pdf">
                <FileIcon size={18} /> PDF
            </button>
            <button className="btn-export print">
                <Printer size={18} /> Print
            </button>
        </div>
    );

    return (
        <div className="dashboard-layout bg-slate-50">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            
            <main className="dashboard-main flex flex-col h-screen overflow-hidden relative">
                <Header toggleSidebar={toggleSidebar} title="SALES DISPLAY" actions={headerActions} />
                
                <div className="flex flex-col h-full bg-slate-50 relative flex-1 overflow-y-auto">
                    
                    <div className="p-6 space-y-6 flex-1 w-full mx-auto max-w-[1400px]">
                        
                        {/* Filters Row */}
                        <div className="flex flex-wrap items-end gap-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            {/* Type Filter Dropdown */}
                            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                                <label className="text-[12px] font-bold text-slate-700">Sales Type</label>
                                <select 
                                    value={filterType} 
                                    onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500"
                                >
                                    <option value="ALL">All</option>
                                    <option value="KOT">KOT</option>
                                    <option value="SALES_BILL">Sales Bill</option>
                                </select>
                            </div>

                            {/* Additional Dropdowns */}
                            <div className="flex flex-col gap-1.5 flex-[2] min-w-[250px]">
                                <label className="text-[12px] font-bold text-slate-700">Filter By</label>
                                <div className="flex gap-2">
                                    <select 
                                        value={selectedCaptain} 
                                        onChange={(e) => { setSelectedCaptain(e.target.value); setCurrentPage(1); }}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500"
                                    >
                                        <option value="ALL">All Captain</option>
                                        {captains.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <select 
                                        value={selectedWaiter} 
                                        onChange={(e) => { setSelectedWaiter(e.target.value); setCurrentPage(1); }}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500"
                                    >
                                        <option value="ALL">All Waiter</option>
                                        {waiters.map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                                <label className="text-[12px] font-bold text-slate-700">From Date</label>
                                <input 
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                                <label className="text-[12px] font-bold text-slate-700">To Date</label>
                                <input 
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Action / Refresh Buttons */}
                            <div className="flex items-center gap-3 relative ml-auto">
                                <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-lg text-[12px] font-bold hover:bg-slate-50 transition-colors shadow-sm">
                                    <RefreshCw size={14} /> Refresh
                                </button>
                                
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowColumnFilter(true);
                                    }} 
                                    className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-lg text-[12px] font-bold hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    <Settings size={14} /> Action
                                </button>
                            </div>


                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-center gap-6">
                                <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                    <CalendarDays size={28} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total KOT</span>
                                    <span className="text-3xl font-black text-slate-800 leading-none mt-1">{rangeKotCount}</span>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-center gap-6">
                                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                    <FileText size={28} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Bills</span>
                                    <span className="text-3xl font-black text-slate-800 leading-none mt-1">{rangeBillCount}</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-center gap-6">
                                <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                                    <ClipboardList size={28} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Pending KOT</span>
                                    <span className="text-3xl font-black text-slate-800 leading-none mt-1">{rangePendingKotCount}</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-center gap-6">
                                <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                                    <DollarSign size={28} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Today Sales</span>
                                    <span className="text-2xl font-black text-green-600 leading-none mt-1">₹ {rangeSalesAmount.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                    <Landmark size={28} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest w-10">CASH</span>
                                        <span className="text-sm font-black text-green-600">₹ {rangeCashAmount.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest w-10">BANK</span>
                                        <span className="text-sm font-black text-purple-600">₹ {rangeBankAmount.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col pb-4">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[1200px]">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            {ALL_COLUMNS.filter(c => visibleColumns.includes(c.id)).map(col => (
                                                <th key={col.id} className="py-4 px-4 text-[12px] font-bold text-slate-700 uppercase">
                                                    {col.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={visibleColumns.length} className="py-12 text-center text-slate-400">
                                                    <RefreshCw className="animate-spin mx-auto mb-2 text-blue-500" size={24} />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Loading Records...</span>
                                                </td>
                                            </tr>
                                        ) : paginatedRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={visibleColumns.length} className="py-12 text-center text-slate-400">
                                                    <FileText className="mx-auto mb-2 text-slate-300" size={32} />
                                                    <span className="text-xs font-bold uppercase tracking-widest">No Records Found</span>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedRecords.map((record, index) => (
                                                <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                    {visibleColumns.includes('sno') && (
                                                        <td className="py-3 px-4 text-[12px] font-bold text-slate-700">
                                                            {String((currentPage - 1) * recordsPerPage + index + 1)}
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('type') && (
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded text-[11px] font-bold ${record.type === 'KOT' ? 'bg-orange-50 text-orange-500 border border-orange-100' : 'bg-green-50 text-green-500 border border-green-100'}`}>
                                                                {record.type === 'KOT' ? 'KOT' : 'Sales Bill'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('kot_bill_no') && (
                                                        <td className="py-3 px-4 text-[12px] font-bold text-slate-800 whitespace-nowrap">
                                                            {record.type === 'KOT' ? record.kot_no : record.bill_no}
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('date') && (
                                                        <td className="py-3 px-4 text-[12px] font-bold text-slate-700 whitespace-nowrap">
                                                            {new Date(record.date).toLocaleDateString('en-GB')} {record.time}
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('customer_name') && (
                                                        <td className="py-3 px-4 text-[12px] font-bold text-slate-700">{record.customer_name}</td>
                                                    )}
                                                    {visibleColumns.includes('cell_no') && (
                                                        <td className="py-3 px-4 text-[12px] font-bold text-slate-700">{record.cell_no}</td>
                                                    )}
                                                    {visibleColumns.includes('captain') && (
                                                        <td className="py-3 px-4 text-[12px] font-bold text-slate-700">{record.captain}</td>
                                                    )}
                                                    {visibleColumns.includes('waiter') && (
                                                        <td className="py-3 px-4 text-[12px] font-bold text-slate-700">{record.waiter}</td>
                                                    )}
                                                    {visibleColumns.includes('table') && (
                                                        <td className="py-3 px-4 text-[12px] font-bold text-slate-700">{record.table}</td>
                                                    )}
                                                    {visibleColumns.includes('amount') && (
                                                        <td className="py-3 px-4 text-[13px] font-bold text-slate-800">
                                                            ₹ {parseFloat(record.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('status') && (
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded text-[11px] font-bold ${record.status === 'Paid' ? 'bg-green-50 text-green-500' : record.status === 'Unpaid' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('action') && (
                                                        <td className="py-3 px-4 relative">
                                                            {/* Only show button if at least one action is permitted */}
                                                            {(record.canAlter || record.canCancel || record.canDelete) ? (
                                                                <div className="inline-block action-dropdown-container">
                                                                    <button 
                                                                        onClick={() => setOpenActionId(openActionId === record.id ? null : record.id)}
                                                                        className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-700 rounded-lg text-[12px] font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        Action <ChevronRight size={14} className={`transform transition-transform ${openActionId === record.id ? 'rotate-90' : ''}`} />
                                                                    </button>

                                                                    {openActionId === record.id && (
                                                                        <div className="absolute right-4 top-full mt-1 w-32 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2">
                                                                            {record.canAlter && (
                                                                                <button className="w-full flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                                                                    <Edit size={14} /> Alter
                                                                                </button>
                                                                            )}
                                                                            {record.canCancel && (
                                                                                <button className="w-full flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                                                                    <XCircle size={14} /> Cancel
                                                                                </button>
                                                                            )}
                                                                            {record.canDelete && (
                                                                                <button className="w-full flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                                                                    <Trash2 size={14} /> Delete
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[12px] text-slate-400">No Actions</span>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="py-4 px-6 mt-auto flex items-center justify-between">
                                <span className="text-[13px] font-bold text-slate-700">
                                    Showing {filteredRecords.length > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0} to {Math.min(currentPage * recordsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
                                </span>
                                
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    
                                    {Array.from({ length: totalPages }).map((_, idx) => {
                                        const page = idx + 1;
                                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                            return (
                                                <button 
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-bold transition-colors shadow-sm ${currentPage === page ? 'bg-orange-500 text-white border-transparent' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                                            return <span key={page} className="text-slate-400 px-2 text-sm">...</span>;
                                        }
                                        return null;
                                    })}
                                    
                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </main>
            </div>

            {/* Column Visibility Modal */}
            {showColumnFilter && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">Select Columns</h2>
                            <button 
                                onClick={() => setShowColumnFilter(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50">
                            <div className="grid grid-cols-2 gap-3">
                                {ALL_COLUMNS.map(col => (
                                    <label 
                                        key={col.id} 
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                            visibleColumns.includes(col.id) 
                                                ? 'bg-white border-blue-200 shadow-sm' 
                                                : 'bg-white/50 border-slate-200 opacity-75 hover:opacity-100'
                                        }`}
                                    >
                                        <input 
                                            type="checkbox"
                                            checked={visibleColumns.includes(col.id)}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                setVisibleColumns(prev => 
                                                    isChecked 
                                                        ? [...prev, col.id] 
                                                        : prev.filter(id => id !== col.id)
                                                );
                                            }}
                                            className="w-5 h-5 text-blue-500 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <span className="text-[13px] font-bold text-slate-700">{col.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-white flex gap-3">
                            <button 
                                onClick={() => setVisibleColumns(ALL_COLUMNS.map(c => c.id))}
                                className="flex-1 py-3 text-[14px] font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Select All
                            </button>
                            <button 
                                onClick={() => setShowColumnFilter(false)}
                                className="flex-1 py-3 text-[14px] font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisplayPage;
