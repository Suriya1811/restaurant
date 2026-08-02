import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardPageShell from '@/components/dashboard/DashboardPageShell';
import {
    Loader2, Printer, Settings, X, ChevronDown, FileText, Search, PlusCircle, Save, Download, Layers
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import SearchableSelect from '@/components/common/SearchableSelect';

const PartyMasterHub = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // View mode: 'list' (ORDER DISPLAY) or 'create' (Party Order Creation)
    const [viewMode, setViewMode] = useState('list');

    // Layout states
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // List & Filter states
    const getTodayStr = () => new Date().toISOString().split('T')[0];
    const [fromDate, setFromDate] = useState(getTodayStr);
    const [toDate, setToDate] = useState(getTodayStr);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFunction, setSelectedFunction] = useState('');
    const [selectedHall, setSelectedHall] = useState('');

    const [functionTypes, setFunctionTypes] = useState([]);
    const [rawPartyOrders, setRawPartyOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Column visibility modal
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [visibleColumnKeys, setVisibleColumnKeys] = useState(null);
    const [tempVisibleKeys, setTempVisibleKeys] = useState(null);

    // New Party Form state
    const [newPartyData, setNewPartyData] = useState({
        delivery_date: new Date().toISOString().split('T')[0],
        delivery_time: '12:00',
        customer_name: '',
        delivery_address: '',
        customer_phone: '',
        alternate_phone: '',
        hall: '',
        function_type: '',
        packs: ''
    });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    // ── FETCH METADATA & ORDERS ─────────────────────────────────────
    useEffect(() => {
        const fetchFunctionTypes = async () => {
            try {
                const savedUser = localStorage.getItem('user');
                if (!savedUser) return;
                const { token } = JSON.parse(savedUser);
                const res = await fetch(`${import.meta.env.VITE_API_URL}/function-types`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    setFunctionTypes(data.data.filter(f => f.is_active !== false));
                }
            } catch (e) {
                console.error("Failed to fetch function types", e);
            }
        };
        fetchFunctionTypes();
    }, []);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const url = new URL(`${import.meta.env.VITE_API_URL}/bills`);
            url.searchParams.append('type', 'PARTY_ORDER');
            if (fromDate) url.searchParams.append('startDate', fromDate);
            if (toDate) url.searchParams.append('endDate', toDate);

            const res = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setRawPartyOrders(data.data || []);
            } else {
                setRawPartyOrders([]);
            }
        } catch (e) {
            console.error("Failed to fetch party orders", e);
            setRawPartyOrders([]);
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // ── FILTER ORDERS ──────────────────────────────────────────────
    const processedRows = useMemo(() => {
        if (!rawPartyOrders.length) return [];
        return rawPartyOrders.filter(order => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = (order.customer_name || '').toLowerCase().includes(q);
                const matchPhone = (order.customer_phone || '').toLowerCase().includes(q);
                const matchBill = (order.bill_number || '').toLowerCase().includes(q);
                if (!matchName && !matchPhone && !matchBill) return false;
            }
            if (selectedFunction && order.function_type !== selectedFunction) return false;
            if (selectedHall && order.hall !== selectedHall) return false;
            return true;
        }).map((order, idx) => {
            const d = order.delivery_date ? new Date(order.delivery_date) : null;
            const formattedDate = d ? `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}` : '---';

            return {
                sNo: idx + 1,
                id: order._id,
                date: formattedDate,
                time: order.delivery_time || '---',
                name: order.customer_name || '---',
                address: order.delivery_address || '---',
                cellNumber: order.customer_phone || '---',
                cellNumber1: order.alternate_phone || '---',
                hall: order.hall || '---',
                function: order.function_type || '---',
                packs: order.packs || '---'
            };
        });
    }, [rawPartyOrders, searchQuery, selectedFunction, selectedHall]);

    // ── COLUMNS DEFINITION ──────────────────────────────────────────
    const allColumns = useMemo(() => [
        { key: 'sNo', label: 'S.No' },
        { key: 'date', label: 'Date' },
        { key: 'time', label: 'Time' },
        { key: 'name', label: 'Name' },
        { key: 'address', label: 'Address' },
        { key: 'cellNumber', label: 'Cell Number' },
        { key: 'cellNumber1', label: 'Cell Number 1' },
        { key: 'hall', label: 'Hall' },
        { key: 'function', label: 'Function' },
        { key: 'packs', label: 'Packs' }
    ], []);

    const activeColumns = useMemo(() => {
        if (!visibleColumnKeys) return allColumns;
        return allColumns.filter(c => visibleColumnKeys.includes(c.key));
    }, [allColumns, visibleColumnKeys]);

    // ── CREATE PARTY ORDER SUBMIT ──────────────────────────────────
    const handleCreateParty = async (e) => {
        e.preventDefault();
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token, restaurant_id } = JSON.parse(savedUser);

            const tempBillNumber = `PARTY-${Date.now()}`;

            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    company_id: restaurant_id,
                    type: 'PARTY_ORDER',
                    order_mode: 'PARTY_ORDER',
                    party_status: 'PREPARING',
                    customer_name: newPartyData.customer_name,
                    customer_phone: newPartyData.customer_phone,
                    alternate_phone: newPartyData.alternate_phone,
                    delivery_address: newPartyData.delivery_address,
                    delivery_date: newPartyData.delivery_date,
                    delivery_time: newPartyData.delivery_time,
                    function_type: newPartyData.function_type,
                    hall: newPartyData.hall,
                    packs: newPartyData.packs,
                    items: [],
                    bill_number: tempBillNumber,
                    status: 'DRAFT'
                })
            });
            const data = await res.json();
            if (data.success) {
                setViewMode('list');
                fetchOrders();
                navigate('/dashboard/self-service/billing', {
                    state: {
                        fromTable: false,
                        orderMode: 'PARTY_ORDER',
                        billId: data.data._id,
                        partyDetails: newPartyData
                    }
                });
            } else {
                alert("Failed to create party order: " + (data.error || data.message));
            }
        } catch (err) {
            console.error("Failed to create party order", err);
            alert("Error creating party order");
        }
    };

    // ── EXPORT HANDLERS ────────────────────────────────────────────
    const exportToCSV = () => {
        if (processedRows.length === 0) return;
        const headers = activeColumns.map(c => `"${c.label}"`).join(',');
        const rowData = processedRows.map(r =>
            activeColumns.map(c => `"${r[c.key] ?? ''}"`).join(',')
        );
        const csvContent = [headers, ...rowData].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Party_Orders_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    const exportToPDF = () => {
        if (processedRows.length === 0) return;
        const doc = new jsPDF('l', 'pt');
        doc.setFontSize(16);
        doc.text('Party Order Display Report', 40, 40);

        const tableHeaders = [activeColumns.map(c => c.label)];
        const tableBody = processedRows.map(r => activeColumns.map(c => r[c.key] ?? ''));

        autoTable(doc, {
            head: tableHeaders,
            body: tableBody,
            startY: 60,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [10, 17, 40], textColor: [255, 107, 0] }
        });

        doc.save('Party_Order_Display.pdf');
    };

    const handlePrint = () => {
        window.print();
    };

    const headerActions = (
        <div className="flex items-center gap-2">
            <button
                type="button"
                className="px-3 py-1.5 border border-emerald-500 bg-white text-emerald-600 rounded text-[11px] font-black uppercase flex items-center gap-1.5 hover:bg-emerald-50 transition-colors shadow-sm cursor-pointer"
                onClick={exportToCSV}
                title="Export to Excel"
            >
                <Download size={14} className="text-emerald-500" />
                <span>Excel</span>
            </button>
            <button
                type="button"
                className="px-3 py-1.5 border border-rose-500 bg-white text-rose-600 rounded text-[11px] font-black uppercase flex items-center gap-1.5 hover:bg-rose-50 transition-colors shadow-sm cursor-pointer"
                onClick={exportToPDF}
                title="Export to PDF"
            >
                <Download size={14} className="text-rose-500" />
                <span>PDF</span>
            </button>
            <button
                type="button"
                className="px-3 py-1.5 border border-indigo-500 bg-white text-indigo-600 rounded text-[11px] font-black uppercase flex items-center gap-1.5 hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer"
                onClick={handlePrint}
                title="Print"
            >
                <Printer size={14} className="text-indigo-500" />
                <span>Print</span>
            </button>
            <button onClick={() => setShowColumnModal(!showColumnModal)} className="btn-column-settings">
                <Settings size={14} /> <span>Column Settings</span>
            </button>
            <button
                onClick={() => setViewMode(viewMode === 'list' ? 'create' : 'list')}
                className="btn-action-add"
            >
                <PlusCircle size={18} />
                <span className="text-[10px] uppercase font-black">{viewMode === 'list' ? 'Create Party Order' : 'Order Display'}</span>
            </button>
        </div>
    );

    return (
        <DashboardPageShell className="bg-slate-50">
            {/* Inline stylesheet for spreadsheet layout with custom grid lines matching Item Display Page */}
            <style>{`
                .item-table-grid {
                    width: 100%;
                    border-collapse: collapse;
                }
                .item-table-grid th {
                    background: #0f172a !important;
                    color: #ff7a00 !important;
                    font-weight: 800;
                    font-size: 11px;
                    text-transform: uppercase;
                    border: 1px solid #e2e8f0 !important;
                    padding: 14px 12px !important;
                    text-align: left;
                    white-space: nowrap;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .item-table-grid td {
                    border: 1px solid #e2e8f0 !important;
                    padding: 8px 12px;
                    font-size: 12px;
                    color: #334155;
                    background: white;
                    white-space: nowrap;
                }
                .item-table-grid tr:hover td {
                    background: #f8fafc;
                }
            `}</style>
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
                <Header
                    toggleSidebar={toggleSidebar}
                    title={viewMode === 'create' ? "Party Order Creation" : "ORDER DISPLAY"}
                    headerActions={headerActions}
                />

                <div className="flex-1 flex flex-col min-h-0 m-0 bg-white overflow-hidden relative">

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

                    {/* ── MODE 1: ORDER DISPLAY (LIST VIEW) ── */}
                    {viewMode === 'list' ? (
                        <div className="master-content-layout fade-in !pt-2 flex flex-col h-full overflow-hidden p-4">
                            {/* Premium Toolbar */}
                            <div className="toolbar-premium no-print mb-3">
                                <div className="flex flex-row items-center gap-4 flex-1 flex-wrap">
                                    {/* Search Order */}
                                    <div className="search-premium" style={{ width: '320px', flexShrink: 0 }}>
                                        <Search size={20} />
                                        <input
                                            type="text"
                                            placeholder="Search Order..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="border-orange-500 focus:ring-orange-500"
                                            style={{ borderColor: '#f97316' }}
                                        />
                                    </div>

                                    {/* Filter Controls */}
                                    <div className="flex flex-row items-center gap-2 flex-wrap">
                                        {/* From Date */}
                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            placeholder="From Date"
                                            title="From Date"
                                            className="filter-select-premium font-semibold cursor-pointer"
                                        />

                                        {/* To Date */}
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            placeholder="To Date"
                                            title="To Date"
                                            className="filter-select-premium font-semibold cursor-pointer"
                                        />

                                        {/* Function Type */}
                                        <select
                                            className="filter-select-premium"
                                            value={selectedFunction}
                                            onChange={(e) => setSelectedFunction(e.target.value)}
                                        >
                                            <option value="">ALL FUNCTIONS</option>
                                            {functionTypes.map(ft => (
                                                <option key={ft._id} value={ft.name}>{ft.name}</option>
                                            ))}
                                        </select>

                                        {/* Hall */}
                                        <select
                                            className="filter-select-premium"
                                            value={selectedHall}
                                            onChange={(e) => setSelectedHall(e.target.value)}
                                        >
                                            <option value="">ALL HALLS</option>
                                            <option value="Main Hall">Main Hall</option>
                                            <option value="Banquet Hall">Banquet Hall</option>
                                            <option value="VIP Lounge">VIP Lounge</option>
                                            <option value="Outdoor Terrace">Outdoor Terrace</option>
                                        </select>
                                    </div>

                                    {/* Total Records - right aligned in toolbar */}
                                    <div className="ml-auto flex-shrink-0">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg shadow-xs text-xs font-black uppercase tracking-wider">
                                            <span>TOTAL RECORDS:</span>
                                            <span className="text-sm font-black text-slate-900">{processedRows.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Responsive Scrollable Table Container */}
                            <div
                                className="table-container-premium flex-1"
                                style={{
                                    overflowX: 'auto',
                                    overflowY: 'auto',
                                    maxHeight: 'calc(100vh - 220px)',
                                    maxWidth: '100%',
                                    borderRadius: '1rem',
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                                }}
                            >
                                <table className="item-table-grid">
                                    <thead>
                                        <tr>
                                            {activeColumns.map((col) => (
                                                <th key={col.key}>
                                                    <span>{col.label}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={activeColumns.length} style={{ textAlign: 'center', padding: '80px 0' }}>
                                                    <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                                    <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Querying Archives...</p>
                                                </td>
                                            </tr>
                                        ) : processedRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={activeColumns.length} style={{ textAlign: 'center', padding: '80px 0' }}>
                                                    <Layers size={64} className="text-slate-200 mx-auto mb-4" />
                                                    <p className="font-bold text-slate-400">No party orders found.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            processedRows.map((row) => (
                                                <tr key={row.id} className="group hover:bg-slate-50 transition-all">
                                                    {activeColumns.map(col => (
                                                        <td key={col.key} className={col.key === 'customer_name' ? 'font-black text-slate-900' : ''}>
                                                            {row[col.key] ?? '---'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* ── MODE 2: PARTY ORDER CREATION (MATCHING ITEM CREATION UI STYLE) ── */
                        <div className="flex-1 p-6 lg:p-8 bg-white overflow-hidden flex flex-col justify-between">
                            <form onSubmit={handleCreateParty} className="flex-1 flex flex-col justify-between w-full">
                                <div>
                                    {/* SECTION HEADER */}
                                    <div className="w-full mb-1">
                                        <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider">Party Details</h3>
                                    </div>
                                    <hr className="border-t border-orange-500 mt-1 mb-6" />

                                    {/* 2-COLUMN GRID WITH LEFT LABELS & MIDDLE SEPARATOR LINE */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 relative">
                                        {/* LEFT COLUMN */}
                                        <div className="space-y-3.5">
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-3 text-[13px] font-bold text-slate-800">Date *</label>
                                                <div className="col-span-9">
                                                    <input
                                                        type="date"
                                                        required
                                                        min={new Date().toISOString().split('T')[0]}
                                                        value={newPartyData.delivery_date}
                                                        onChange={e => setNewPartyData({ ...newPartyData, delivery_date: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-3 text-[13px] font-bold text-slate-800">Time *</label>
                                                <div className="col-span-9">
                                                    <input
                                                        type="time"
                                                        required
                                                        value={newPartyData.delivery_time}
                                                        onChange={e => setNewPartyData({ ...newPartyData, delivery_time: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-3 text-[13px] font-bold text-slate-800">Customer Name *</label>
                                                <div className="col-span-9">
                                                    <input
                                                        type="text"
                                                        required
                                                        value={newPartyData.customer_name}
                                                        onChange={e => setNewPartyData({ ...newPartyData, customer_name: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        placeholder="Enter customer name"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-12 items-start gap-2">
                                                <label className="col-span-3 text-[13px] font-bold text-slate-800 pt-2">Address *</label>
                                                <div className="col-span-9">
                                                    <textarea
                                                        required
                                                        value={newPartyData.delivery_address}
                                                        onChange={e => setNewPartyData({ ...newPartyData, delivery_address: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold resize-none h-24"
                                                        placeholder="Enter address"
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </div>

                                        {/* MIDDLE VERTICAL SEPARATOR LINE */}
                                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2" />

                                        {/* RIGHT COLUMN */}
                                        <div className="space-y-3.5">
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-3 text-[13px] font-bold text-slate-800">Cell Number *</label>
                                                <div className="col-span-9">
                                                    <input
                                                        type="text"
                                                        required
                                                        value={newPartyData.customer_phone}
                                                        onChange={e => setNewPartyData({ ...newPartyData, customer_phone: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        placeholder="Enter cell number"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-3 text-[13px] font-bold text-slate-800">Cell Number 1</label>
                                                <div className="col-span-9">
                                                    <input
                                                        type="text"
                                                        value={newPartyData.alternate_phone}
                                                        onChange={e => setNewPartyData({ ...newPartyData, alternate_phone: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                        placeholder="Enter cell number 1"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-3 text-[13px] font-bold text-slate-800">Hall</label>
                                                <div className="col-span-9 flex gap-1 items-center">
                                                    <SearchableSelect
                                                        name="hall"
                                                        value={newPartyData.hall || ''}
                                                        options={[
                                                            'Main Hall',
                                                            'Banquet Hall',
                                                            'VIP Lounge',
                                                            'Outdoor Terrace'
                                                        ]}
                                                        placeholder="Select Hall"
                                                        onChange={e => setNewPartyData({ ...newPartyData, hall: e.target.value })}
                                                    />
                                                    <button type="button" className="w-[38px] h-[38px] bg-orange-500 hover:bg-orange-600 text-white rounded font-bold text-lg flex items-center justify-center transition-colors shadow-sm cursor-pointer flex-shrink-0">+</button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-3 text-[13px] font-bold text-slate-800">Function *</label>
                                                <div className="col-span-9 flex gap-1 items-center">
                                                    <SearchableSelect
                                                        required
                                                        name="function_type"
                                                        value={newPartyData.function_type}
                                                        options={functionTypes.map(ft => ft.name)}
                                                        placeholder="Select Function"
                                                        onChange={e => setNewPartyData({ ...newPartyData, function_type: e.target.value })}
                                                    />
                                                    <button type="button" onClick={() => navigate('/dashboard/self-service/master/function')} className="w-[38px] h-[38px] bg-orange-500 hover:bg-orange-600 text-white rounded font-bold text-lg flex items-center justify-center transition-colors shadow-sm cursor-pointer flex-shrink-0">+</button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-3 text-[13px] font-bold text-slate-800">Packs</label>
                                                <div className="col-span-9">
                                                    <SearchableSelect
                                                        name="packs"
                                                        value={newPartyData.packs || ''}
                                                        options={[
                                                            '50 Packs',
                                                            '100 Packs',
                                                            '200 Packs',
                                                            '500 Packs',
                                                            'Custom Packs'
                                                        ]}
                                                        placeholder="Select Packs"
                                                        onChange={e => setNewPartyData({ ...newPartyData, packs: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end items-center gap-3 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded transition-colors cursor-pointer uppercase shadow-sm"
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 px-8 py-2.5 bg-[#ff6b00] hover:bg-[#e66000] text-white text-sm font-bold rounded shadow-md transition-colors cursor-pointer uppercase"
                                    >
                                        <Save size={18} /> SAVE
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </DashboardPageShell>
    );
};

export default PartyMasterHub;
