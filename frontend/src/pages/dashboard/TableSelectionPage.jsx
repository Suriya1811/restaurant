import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import './Dashboard.css';
import {
    Loader2, Truck, Package, Users2, RefreshCw,
    Clock, Users, Plus, X, Search,
    CalendarClock, XCircle, CheckCircle2, Printer,
    Eye, ArrowRight, Save, StickyNote
} from 'lucide-react';

/* ─── helpers ─── */
const getToken = () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u).token : '';
};

const headers = () => ({
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
});

/* ─── Live timer hook ─── */
const useLiveTimer = (since) => {
    const [display, setDisplay] = useState('');
    const timerRef = useRef(null);
    useEffect(() => {
        if (!since) { setDisplay(''); return; }
        const calc = () => {
            const diff = Math.floor((Date.now() - new Date(since).getTime()) / 1000);
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            if (h > 0) setDisplay(`${h}h ${String(m).padStart(2, '0')}m`);
            else setDisplay(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        };
        calc();
        timerRef.current = setInterval(calc, 1000);
        return () => clearInterval(timerRef.current);
    }, [since]);
    return display;
};

const LiveTimer = memo(({ since, color = '#1e293b' }) => {
    const display = useLiveTimer(since);
    return (
        <div className="flex items-center gap-1 text-[11px] font-extrabold" style={{ color }}>
            <Clock size={10} strokeWidth={2.5} /> {display || '00:00'}
        </div>
    );
});

/* ─── Single compact table card ─── */
const TableCard = memo(({ table, onSelect, onReserve, onCancelReserve, onReset, showAmount, showTime }) => {
    const isAvail = table.status === 'AVAILABLE';
    const isOccupied = table.status === 'OCCUPIED';
    const isPrinted = table.status === 'PRINTED';
    const isReserved = table.status === 'RESERVED';
    const isReady = table.kot_status === 'READY';
    const isActive = isOccupied || isPrinted;

    // Card styling based on table status matching screenshot
    let cardStyle = {
        bg: 'bg-white',
        border: 'border-slate-200',
        text: 'text-slate-900',
    };

    if (isPrinted || isReady) {
        cardStyle = {
            bg: 'bg-[#dcfce7]',
            border: 'border-emerald-300',
            text: 'text-emerald-950',
        };
    } else if (isOccupied) {
        cardStyle = {
            bg: 'bg-[#fed7aa]',
            border: 'border-orange-300',
            text: 'text-slate-900',
        };
    } else if (isReserved) {
        cardStyle = {
            bg: 'bg-[#f3e8ff]',
            border: 'border-purple-300',
            text: 'text-purple-950',
        };
    }

    const handleClick = () => onSelect(table);

    return (
        <div
            onClick={handleClick}
            className={`relative rounded-xl border ${cardStyle.border} ${cardStyle.bg} p-2.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer min-h-[115px] select-none`}
        >
            {/* Top: Table Number */}
            <div className="text-center font-black text-slate-900 text-base tracking-tight leading-none pt-0.5">
                {table.table_number}
            </div>

            {/* Middle: Amount & Timer */}
            <div className="flex flex-col items-center justify-center my-1 gap-0.5">
                {isAvail ? (
                    <>
                        <span className="font-extrabold text-slate-900 text-sm">₹0</span>
                        <span className="font-bold text-slate-400 text-xs">-</span>
                    </>
                ) : isReserved ? (
                    <>
                        <span className="font-bold text-purple-700 text-xs uppercase tracking-wider">RSV</span>
                        <span className="font-bold text-slate-800 text-xs truncate max-w-full">
                            {table.reservation_name || 'Guest'}
                        </span>
                    </>
                ) : (
                    <>
                        {showAmount && (
                            <span className="font-black text-slate-900 text-sm">
                                ₹{Math.round(table.running_amount || 0)}
                            </span>
                        )}
                        {showTime && table.occupied_since && (
                            <div className="mt-0.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 border border-slate-200/60 shadow-2xs text-[10px] font-bold text-slate-700">
                                <LiveTimer since={table.occupied_since} color="#1e293b" />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Bottom Row: White Pill with Action Buttons */}
            <div
                className="mt-1 bg-white rounded-lg border border-slate-200/80 shadow-2xs py-1 px-1 flex items-center justify-around gap-1"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 1. View Button (Blue Eye) */}
                <button
                    onClick={(e) => { e.stopPropagation(); onSelect(table); }}
                    title="View Table"
                    className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                    <Eye size={13} strokeWidth={2.5} />
                </button>

                {/* 2. Print / Pay Button (Red Printer / Check) */}
                <button
                    onClick={(e) => { e.stopPropagation(); onSelect(table, true); }}
                    title={isActive ? "Print Bill" : "Bill"}
                    className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                    <Printer size={13} strokeWidth={2.5} />
                </button>

                {/* 3. Reserve / Reset Button (Green Refresh) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isAvail) onReserve(table);
                        else onReset(table);
                    }}
                    title={isAvail ? "Reserve Table" : "Clear Table"}
                    className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                    <RefreshCw size={13} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
});

/* ─── Reservation Modal ─── */
const ReservationModal = ({ table, onClose, onConfirm, loading }) => {
    const [form, setForm] = useState({
        reservation_name: '',
        reservation_phone: '',
        reservation_time: '',
        reservation_note: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.reservation_name.trim()) return alert('Customer name is required');
        if (!form.reservation_phone.trim()) return alert('Phone number is required');
        if (!form.reservation_time.trim()) return alert('Reservation time is required');
        onConfirm(table._id, form);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '420px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#1e293b' }}>Reserve Table</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                            Table {table.table_number} · {table.seating_capacity} seats
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                        <X size={22} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                            Customer Name *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Users size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                required
                                type="text"
                                value={form.reservation_name}
                                onChange={e => setForm(p => ({ ...p, reservation_name: e.target.value }))}
                                placeholder="John Doe"
                                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '13px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                            Phone Number *
                        </label>
                        <input
                            required
                            type="tel"
                            value={form.reservation_phone}
                            onChange={e => setForm(p => ({ ...p, reservation_phone: e.target.value }))}
                            placeholder="9876543210"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '13px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                            Reservation Time *
                        </label>
                        <input
                            required
                            type="time"
                            value={form.reservation_time}
                            onChange={e => setForm(p => ({ ...p, reservation_time: e.target.value }))}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '13px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                            Note (Optional)
                        </label>
                        <input
                            type="text"
                            value={form.reservation_note}
                            onChange={e => setForm(p => ({ ...p, reservation_note: e.target.value }))}
                            placeholder="Window table preferred..."
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '13px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '13px', fontWeight: 800, color: '#64748b', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ flex: 1.5, padding: '12px', borderRadius: '10px', border: 'none', background: '#a855f7', fontSize: '13px', fontWeight: 800, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Reservation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TableSelectionPage = () => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Data State
    const [tables, setTables] = useState([]);
    const [tableTypes, setTableTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [reserveTarget, setReserveTarget] = useState(null);
    const [reserveLoading, setReserveLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Settings State
    const [showAmount, setShowAmount] = useState(() => localStorage.getItem('kot_showAmount') !== 'false');
    const [showTime, setShowTime] = useState(() => localStorage.getItem('kot_showTime') !== 'false');

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(p => !p);
        else {
            const n = !isCollapsed;
            setIsCollapsed(n);
            localStorage.setItem('sidebarCollapsed', n);
        }
    };

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const hdr = { 'Authorization': `Bearer ${getToken()}` };
            const [tRes, ttRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/tables`, { headers: hdr }),
                fetch(`${import.meta.env.VITE_API_URL}/table-types`, { headers: hdr })
            ]);
            const tData = await tRes.json();
            const ttData = await ttRes.json();
            if (tData.success) setTables(tData.data);
            if (ttData.success) setTableTypes(ttData.data);
        } catch (e) {
            console.error(e);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Listen for real-time KOT/Order updates from other tabs
        const ch = new BroadcastChannel('restoboard_kot');
        ch.onmessage = (e) => {
            if (e.data?.type === 'KOT_FIRED' || e.data?.type === 'ORDER_READY' || e.data?.type === 'KOT_DELETED') {
                fetchData(true);
            }
        };

        const handleStorage = (e) => {
            if (e.key === 'kot_fired') fetchData(true);
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            ch.close();
            window.removeEventListener('storage', handleStorage);
        };
    }, [fetchData]);

    /* ── Navigate to billing ── */
    const handleSelect = (table, printAction = false) => {
        navigate('/dashboard/self-service/billing', {
            state: {
                fromTable: true,
                tableNo: table.table_number,
                tableId: table._id,
                billId: table.bill_id || null,
                persons: String(table.seating_capacity || ''),
                tableType: table.table_type || '',
                tableStatus: table.status,
                reservationName: table.reservation_name || '',
                reservationPhone: table.reservation_phone || '',
                captainName: table.captain || '',
                waiterName: table.waiter || '',
                actionTrigger: printAction ? 'FINALIZE' : 'TENTATIVE_VIEW'
            }
        });
    };

    /* ── Reserve ── */
    const handleConfirmReservation = async (tableId, form) => {
        setReserveLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/tables/${tableId}/reserve`, {
                method: 'PATCH',
                headers: headers(),
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                setReserveTarget(null);
                fetchData();
            } else {
                alert(data.error || 'Reservation failed');
            }
        } catch (e) {
            alert('Network error');
        } finally {
            setReserveLoading(false);
        }
    };

    /* ── Cancel Reservation ── */
    const handleCancelReserve = async (table) => {
        if (!window.confirm(`Cancel reservation for Table ${table.table_number}?`)) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/tables/${table._id}/cancel-reserve`, {
                method: 'PATCH',
                headers: headers()
            });
            const data = await res.json();
            if (data.success) fetchData();
        } catch (e) { alert('Network error'); }
    };

    /* ── Reset / Free Table ── */
    const handleResetTable = async (table) => {
        if (!window.confirm(`Force clear Table ${table.table_number}? This will mark it as AVAILABLE.`)) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/tables/${table._id}/free`, {
                method: 'PATCH',
                headers: headers()
            });
            const data = await res.json();
            if (data.success) {
                fetchData();
            } else {
                alert(data.error || 'Reset failed');
            }
        } catch (e) { alert('Network error'); }
    };

    /* ── Special order ── */
    const handleSpecialOrder = (mode) => {
        if (mode === 'PARTY_ORDER') {
            navigate('/dashboard/self-service/bills-sales');
        } else {
            navigate('/dashboard/self-service/billing', {
                state: { fromTable: false, orderMode: mode }
            });
        }
    };

    /* ── Group tables by type ── */
    const buildGroups = () => {
        const query = searchQuery.toLowerCase().trim();
        const filtered = tables.filter(t =>
            (t.table_number || '').toString().toLowerCase().includes(query) ||
            (t.table_type || '').toLowerCase().includes(query)
        );

        const map = {};
        tableTypes.forEach(tt => { map[tt.name] = []; });
        filtered.forEach(t => {
            const key = (t.table_type || '').trim() || 'Other';
            if (!map[key]) map[key] = [];
            map[key].push(t);
        });

        Object.keys(map).forEach(key => {
            map[key].sort((a, b) =>
                (a.table_number || '').toString().localeCompare(
                    (b.table_number || '').toString(),
                    undefined,
                    { numeric: true, sensitivity: 'base' }
                )
            );
        });

        return Object.entries(map).filter(([, rows]) => rows.length > 0).map(([zoneName, rows]) => {
            const typeInfo = tableTypes.find(tt => tt.name === zoneName) || {};
            return {
                zoneName,
                zoneTables: rows,
                captain: typeInfo.captain || '',
                waiter: typeInfo.waiter || ''
            };
        });
    };

    const groups = buildGroups();

    const stats = {
        total: tables.length,
        available: tables.filter(t => t.status === 'AVAILABLE').length,
        occupied: tables.filter(t => t.status === 'OCCUPIED').length,
        printed: tables.filter(t => t.status === 'PRINTED').length,
        reserved: tables.filter(t => t.status === 'RESERVED').length,
    };

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const headerActions = (
        <div className="flex items-center gap-2">
            <button
                onClick={() => handleSpecialOrder('PARCEL')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
                <Package size={15} className="text-slate-600" />
                <span>PARCEL</span>
            </button>
            <button
                onClick={() => handleSpecialOrder('DELIVERY')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
                <Truck size={15} className="text-slate-600" />
                <span>DELIVERY</span>
            </button>
            <button
                onClick={() => handleSpecialOrder('PARTY_ORDER')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
                <Users2 size={15} className="text-slate-600" />
                <span>PARTY ORDER</span>
            </button>
            <button
                onClick={() => navigate('/dashboard/self-service/tables')}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold text-white bg-[#ff5a1f] hover:bg-[#ea4c0b] rounded shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
                <Plus size={15} strokeWidth={3} />
                <span>Create Table</span>
            </button>
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-red-500 border border-red-300 bg-white hover:bg-red-50 rounded shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
                <XCircle size={15} className="text-red-500" />
                <span>CLOSE</span>
            </button>
        </div>
    );

    return (
        <DashboardPageShell className="bg-slate-50">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)} />}

            <main className="dashboard-main flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="TABLE DISPLAY"
                    headerActions={headerActions}
                    showClose={false}
                />

                <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-hidden">

                    {/* ── Search, Stats & Legends (Row 2) ── */}
                    <div className="px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
                        {/* Stats Pills */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-black border border-blue-100">
                                <span className="text-sm font-extrabold">{stats.total}</span> TOTAL
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black border border-emerald-100">
                                <span className="text-sm font-extrabold">{stats.available}</span> AVAILABLE
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-black border border-orange-100">
                                <span className="text-sm font-extrabold">{stats.occupied}</span> RUNNING
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black border border-emerald-100">
                                <span className="text-sm font-extrabold">{stats.printed}</span> PRINTED
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-black border border-purple-100">
                                <span className="text-sm font-extrabold">{stats.reserved}</span> RECEIVED
                            </div>
                        </div>

                        {/* Search Box */}
                        <div className="relative w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Table..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#ff5a1f]"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Status Legends */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 bg-white border border-slate-300 rounded-xs" />
                                <span className="text-xs font-extrabold text-slate-800">BLANK</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 bg-[#ff5a1f] rounded-xs" />
                                <span className="text-xs font-extrabold text-slate-800">RUNNING</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 bg-[#16a34a] rounded-xs" />
                                <span className="text-xs font-extrabold text-slate-800">PRINTED</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 bg-[#8b5cf6] rounded-xs" />
                                <span className="text-xs font-extrabold text-slate-800">RECEIVED</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Zone-grouped tables ── */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Loader2 size={36} className="animate-spin text-indigo-600 mb-3" />
                                <p className="font-extrabold text-xs uppercase tracking-widest text-slate-400">Loading Floor Plan...</p>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">
                                <p className="font-bold text-sm">No tables found.</p>
                                <p className="text-xs text-slate-400 mt-1">Go to Master → Table to add tables.</p>
                            </div>
                        ) : (
                            groups.map(({ zoneName, zoneTables, captain, waiter }) => (
                                <div key={zoneName} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                                    {/* Zone header */}
                                    <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
                                            <h3 className="font-extrabold text-slate-800 text-base uppercase tracking-wide">
                                                {zoneName}
                                            </h3>
                                            {(captain || waiter) && (
                                                <span className="text-xs font-semibold text-slate-500 ml-2">
                                                    {captain && `Captain: ${captain}`} {captain && waiter && '·'} {waiter && `Waiter: ${waiter}`}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                                {zoneTables.length} TABLES
                                            </span>
                                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                                {zoneTables.filter(t => t.status === 'AVAILABLE').length} FREE
                                            </span>
                                            {zoneTables.filter(t => t.status === 'OCCUPIED').length > 0 && (
                                                <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                                                    {zoneTables.filter(t => t.status === 'OCCUPIED').length} RUNNING
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Zone tables container: 10 columns grid layout */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-3 p-4 bg-slate-50/40">
                                        {zoneTables.map(table => (
                                            <TableCard
                                                key={table._id}
                                                table={table}
                                                onSelect={handleSelect}
                                                onReserve={t => setReserveTarget(t)}
                                                onCancelReserve={handleCancelReserve}
                                                onReset={handleResetTable}
                                                showAmount={showAmount}
                                                showTime={showTime}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* ── Reservation Modal ── */}
            {reserveTarget && (
                <ReservationModal
                    table={reserveTarget}
                    onClose={() => setReserveTarget(null)}
                    onConfirm={handleConfirmReservation}
                    loading={reserveLoading}
                />
            )}
        </DashboardPageShell>
    );
};

export default TableSelectionPage;
