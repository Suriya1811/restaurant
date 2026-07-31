import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import './Dashboard.css';
import {
    Loader2, Truck, Package, Users2, RefreshCw,
    Clock, Users, IndianRupee, Plus, X, Search,
    Phone, StickyNote, CalendarClock, XCircle, CheckCircle2, Printer,
    ArrowRight, Save, Settings, LogOut, User as UserIcon, Eye, LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/* ─── helpers ─── */
const getToken = () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u).token : '';
};

const headers = () => ({
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
});

/* ─── Table-leg SVG icon ─── */
const TableSVG = ({ color = '#cbd5e1', size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        {/* table top */}
        <rect x="3" y="9" width="22" height="4" rx="2" fill={color} />
        {/* legs */}
        <rect x="6" y="13" width="3" height="8" rx="1.5" fill={color} />
        <rect x="19" y="13" width="3" height="8" rx="1.5" fill={color} />
    </svg>
);

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

const LiveTimer = memo(({ since, color = '#64748b' }) => {
    const display = useLiveTimer(since);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', fontWeight: 800, color }}>
            <Clock size={10} strokeWidth={3} /> {display || '00:00'}
        </div>
    );
});

// Inject readyPulse keyframe once
if (typeof document !== 'undefined' && !document.getElementById('readyPulseStyle')) {
    const s = document.createElement('style');
    s.id = 'readyPulseStyle';
    s.textContent = `@keyframes readyPulse { from { opacity:1; transform: translateX(-50%) scale(1); } to { opacity:0.75; transform: translateX(-50%) scale(1.08); } }`;
    document.head.appendChild(s);
}

/* ─── Single compact table card ─── */
const TableCard = memo(({ table, onSelect, onReserve, onCancelReserve, onReset, showAmount, showTime }) => {
    const isAvail = table.status === 'AVAILABLE';
    const isOccupied = table.status === 'OCCUPIED';
    const isPrinted = table.status === 'PRINTED';
    const isReserved = table.status === 'RESERVED';
    const isActive = isOccupied || isPrinted;

    // Solid colors matching the screenshot, with dark text
    const isReady = table.kot_status === 'READY';
    const colorScheme = (isPrinted || isReady)
        ? { bg: '#bbf7d0', text: '#000000', btnBg: '#ffffff', iconColor: '#22c55e' }
        : isOccupied
            ? { bg: '#fda45c', text: '#000000', btnBg: '#ffffff', iconColor: '#f97316' }
            : isReserved
                ? { bg: '#e9d5ff', text: '#000000', btnBg: '#ffffff', iconColor: '#a855f7' }
                : { bg: '#f1f5f9', text: '#000000', btnBg: '#ffffff', iconColor: '#94a3b8' };

    const { bg, text, btnBg, iconColor } = colorScheme;
    const handleClick = () => onSelect(table);

    return (
        <div 
            onClick={handleClick}
            style={{ 
                position: 'relative', 
                flexShrink: 0, 
                width: '100%', 
                height: '90px', 
                marginBottom: '4px',
                background: bg,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '6px',
                cursor: 'pointer',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
        >
            {/* Top: Table No */}
            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 900, color: text, lineHeight: 1 }}>
                {table.table_number}
            </div>

            {/* Middle: Amount & Time */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                {isAvail ? (
                    <>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: text, lineHeight: 1 }}>₹0</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: text }}>-</span>
                    </>
                ) : isReserved ? (
                    <>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: text }}>RSV</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: text, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {table.reservation_name || 'Guest'}
                        </span>
                    </>
                ) : (
                    <>
                        {showAmount && (
                            <span style={{ fontSize: '13px', fontWeight: 900, color: text, lineHeight: 1 }}>
                                ₹{Math.round(table.running_amount || 0)}
                            </span>
                        )}
                        {showTime && (
                            <span style={{ fontSize: '11px', fontWeight: 800, color: text, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={10} strokeWidth={3} />
                                <LiveTimer since={table.occupied_since} color={text} />
                            </span>
                        )}
                    </>
                )}
            </div>

            {/* Bottom Actions Row: 3 inline buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', width: '100%' }}>
                {isAvail ? (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); onReserve(table); }} title="Reserve" style={{ width: '100%', height: '22px', borderRadius: '4px', background: btnBg, color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <CalendarClock size={12} strokeWidth={2.5} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onSelect(table); }} title="View" style={{ width: '100%', height: '22px', borderRadius: '4px', background: btnBg, color: '#3b82f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <Eye size={12} strokeWidth={2.5} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onReset(table); }} title="Reset" style={{ width: '100%', height: '22px', borderRadius: '4px', background: btnBg, color: '#22c55e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <RefreshCw size={12} strokeWidth={2.5} />
                        </button>
                    </>
                ) : isReserved ? (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); onCancelReserve(table); }} title="Cancel Reserve" style={{ width: '100%', height: '22px', borderRadius: '4px', background: btnBg, color: iconColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <X size={12} strokeWidth={3} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onSelect(table); }} title="Bill" style={{ width: '100%', height: '22px', borderRadius: '4px', background: btnBg, color: iconColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <StickyNote size={12} strokeWidth={2.5} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onReset(table); }} title="Reset" style={{ width: '100%', height: '22px', borderRadius: '4px', background: btnBg, color: iconColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <RefreshCw size={12} strokeWidth={2.5} />
                        </button>
                    </>
                ) : isActive && !isPrinted ? (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); onSelect(table); }} title="View Table" style={{ width: '100%', height: '22px', borderRadius: '4px', background: btnBg, color: iconColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <Eye size={12} strokeWidth={2.5} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onSelect(table, true); }} title="Print Bill" style={{ width: '100%', height: '22px', borderRadius: '4px', background: btnBg, color: iconColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <Printer size={12} strokeWidth={2.5} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Clear table?')) onReset(table); }} title="Clear Table" style={{ width: '100%', height: '22px', borderRadius: '4px', background: btnBg, color: iconColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <RefreshCw size={12} strokeWidth={2.5} />
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); onSelect(table); }} title="View Table" style={{ width: '100%', height: '22px', borderRadius: '4px', background: btnBg, color: iconColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <Eye size={12} strokeWidth={2.5} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onSelect(table, true); }} title="Pay" style={{ width: '100%', height: '22px', borderRadius: '4px', background: btnBg, color: iconColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <CheckCircle2 size={12} strokeWidth={2.5} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onReset(table); }} title="Reset" style={{ width: '100%', height: '22px', borderRadius: '4px', background: btnBg, color: iconColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <RefreshCw size={12} strokeWidth={2.5} />
                        </button>
                    </>
                )}
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
                                onChange={e => setForm(f => ({ ...f, reservation_name: e.target.value }))}
                                placeholder="Enter customer name"
                                style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s ease' }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.1)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                            Phone Number *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                required
                                type="tel"
                                value={form.reservation_phone}
                                onChange={e => setForm(f => ({ ...f, reservation_phone: e.target.value }))}
                                placeholder="10-digit mobile number"
                                style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s ease' }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.1)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                            Reservation Time *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <CalendarClock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                required
                                type="time"
                                value={form.reservation_time}
                                onChange={e => setForm(f => ({ ...f, reservation_time: e.target.value }))}
                                style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s ease' }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.1)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                            Note
                        </label>
                        <div style={{ position: 'relative' }}>
                            <StickyNote size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                            <textarea
                                value={form.reservation_note}
                                onChange={e => setForm(f => ({ ...f, reservation_note: e.target.value }))}
                                placeholder="Any special requirements..."
                                style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, outline: 'none', resize: 'none', minHeight: '80px', boxSizing: 'border-box', transition: 'all 0.2s ease' }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.1)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(124, 58, 237, 0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(124, 58, 237, 0.3)'; }}
                        >
                            {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={20} />}
                            Confirm Reservation
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ flex: 1, padding: '14px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '14px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Main Page ─── */
const TableSelectionPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [tables, setTables] = useState([]);
    const [tableTypes, setTableTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reserveTarget, setReserveTarget] = useState(null);   // table to reserve
    const [reserveLoading, setReserveLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Settings State
    const [showAmount, setShowAmount] = useState(() => localStorage.getItem('kot_showAmount') !== 'false');
    const [showTime, setShowTime] = useState(() => localStorage.getItem('kot_showTime') !== 'false');
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleSetting = (setting) => {
        if (setting === 'amount') {
            const val = !showAmount;
            setShowAmount(val);
            localStorage.setItem('kot_showAmount', val);
        } else if (setting === 'time') {
            const val = !showTime;
            setShowTime(val);
            localStorage.setItem('kot_showTime', val);
        }
    };

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
                fetchData(true); // silent refresh
            }
        };

        // Fallback for older browsers
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
                billId: table.bill_id || null,       // existing bill to load (PRINTED/OCCUPIED)
                persons: String(table.seating_capacity || ''),
                tableType: table.table_type || '',
                tableStatus: table.status,            // AVAILABLE | OCCUPIED | PRINTED | RESERVED
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

    /* ── Reset / Free Table (Customers left) ── */
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


    /* ── Special order (no table) ── */
    const [partyStep, setPartyStep] = useState(0); // 0 = closed, 1 = logistics, 2 = customer
    const [partyForm, setPartyForm] = useState({
        delivery_date: '',
        delivery_time: '',
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        orderMode: 'PARTY_ORDER'
    });

    const handleSpecialOrder = (mode) => {
        if (mode === 'PARTY_ORDER') {
            navigate('/dashboard/self-service/bills-sales');
        } else {
            navigate('/dashboard/self-service/billing', {
                state: { fromTable: false, orderMode: mode }
            });
        }
    };

    const handlePartySubmit = async () => {
        setReserveLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            // 1. Create Ledger for Customer (Party)
            const ledgerRes = await fetch(`${import.meta.env.VITE_API_URL}/ledgers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: partyForm.customer_name,
                    phone: partyForm.customer_phone,
                    billing_address: partyForm.customer_address,
                    group: 'Sundry Debtors',
                    party_type: 'CUSTOMER'
                })
            });
            const ledgerData = await ledgerRes.json();
            // Note: If already exists, we ignore or update, but here we just continue

            // 2. Navigate to billing with state
            navigate('/dashboard/self-service/billing', {
                state: {
                    fromTable: false,
                    orderMode: 'PARTY_ORDER',
                    partyDetails: partyForm
                }
            });
        } catch (e) {
            console.error(e);
            alert('Failed to initiate party order');
        } finally {
            setReserveLoading(false);
            setPartyStep(0);
        }
    };

    /* ── Group tables by type, preserving tableTypes order ── */
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

        // Sort tables naturally within each group
        Object.keys(map).forEach(key => {
            map[key].sort((a, b) => 
                (a.table_number || '').toString().localeCompare(
                    (b.table_number || '').toString(), 
                    undefined, 
                    { numeric: true, sensitivity: 'base' }
                )
            );
        });

        // Add corresponding TableType object for captain/waiter data
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

    // Auto-refresh every 30 seconds to keep live amounts current
    useEffect(() => {
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <DashboardPageShell>
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)} />}

            <main className="dashboard-main" style={{ background: '#f8fafc', padding: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                    {/* ── Top action bar (Row 1) ── */}
                    <div style={{ background: '#fff', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', padding: '12px 24px', gap: '12px', flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                        <button
                            onClick={fetchData}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', 
                                padding: '10px 20px', borderRadius: '6px', 
                                border: '1.5px solid #bfdbfe', background: '#eff6ff', 
                                color: '#2563eb', fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; }}
                        >
                            <LayoutGrid size={16} strokeWidth={2.5} />
                            TABLE DISPLAY
                        </button>
                        
                        <button
                            onClick={() => navigate('/dashboard/self-service/tables')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', 
                                padding: '10px 20px', borderRadius: '6px', 
                                background: '#ff5a1f', border: 'none', 
                                color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ea4c0b'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#ff5a1f'; }}
                        >
                            <Plus size={16} strokeWidth={3} />
                            AR TABLE
                        </button>

                        {[
                            { label: 'PARCEL', icon: <Package size={16} strokeWidth={2.5} />, mode: 'PARCEL' },
                            { label: 'DELIVERY', icon: <Truck size={16} strokeWidth={2.5} />, mode: 'DELIVERY' },
                            { label: 'PARTY ORDER', icon: <Users2 size={16} strokeWidth={2.5} />, mode: 'PARTY_ORDER' },
                        ].map((btn, i) => (
                            <button
                                key={i}
                                onClick={() => handleSpecialOrder(btn.mode)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', 
                                    padding: '10px 20px', borderRadius: '6px', 
                                    border: '1.5px solid #e2e8f0', background: '#fff', 
                                    color: '#1e293b', fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                            >
                                {btn.icon}
                                {btn.label}
                            </button>
                        ))}
                        
                        <div style={{ flex: 1 }} />

                        {/* Settings Button hidden from UI but keeping ref if needed */}
                        <div ref={settingsRef} style={{ display: 'none' }}></div>

                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', 
                                padding: '10px 20px', borderRadius: '6px', 
                                border: '1.5px solid #fecaca', background: '#fef2f2', 
                                color: '#ef4444', fontWeight: 800, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}
                        >
                            <XCircle size={16} strokeWidth={2.5} />
                            CLOSE
                        </button>
                    </div>

                    {/* ── Search, Stats & Legends (Row 2) ── */}
                    <div style={{ background: '#fff', borderBottom: '2px solid #edf2f7', padding: '12px 24px', display: 'flex', gap: '24px', alignItems: 'center', flexShrink: 0 }}>
                        {/* Search */}
                        <div style={{ position: 'relative', width: '280px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Search Table No / Type / Location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 14px 10px 36px',
                                    border: '1.5px solid #e2e8f0', borderRadius: '6px',
                                    fontSize: '13px', fontWeight: 600, color: '#1e293b',
                                    outline: 'none', transition: 'all 0.2s',
                                    background: '#fff', boxSizing: 'border-box'
                                }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {[
                                { label: 'TOTAL', value: stats.total, color: '#3b82f6', bg: '#eff6ff' },
                                { label: 'AVAILABLE', value: stats.available, color: '#16a34a', bg: '#f0fdf4' },
                                { label: 'RUNNING', value: stats.occupied, color: '#ea580c', bg: '#fff7ed' },
                                { label: 'PRINTED', value: stats.printed, color: '#16a34a', bg: '#f0fdf4' },
                                { label: 'RECEIVED', value: stats.reserved, color: '#8b5cf6', bg: '#f5f3ff' }
                            ].map(s => (
                                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: s.bg, padding: '6px 12px', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '15px', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</span>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: s.color }}>{s.label}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ flex: 1 }} />

                        {/* Legends */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {[
                                { color: '#fff', border: '1.5px solid #e2e8f0', label: 'BLANK' },
                                { color: '#ff5a1f', label: 'RUNNING' },
                                { color: '#16a34a', label: 'PRINTED' },
                                { color: '#8b5cf6', label: 'RECEIVED' },
                            ].map(l => (
                                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '16px', height: '16px', borderRadius: '3px', background: l.color, border: l.border || 'none' }} />
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b' }}>{l.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Zone-grouped tables ── */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                                <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#6366f1', marginBottom: '10px' }} />
                                <p style={{ fontWeight: 800, color: '#cbd5e1', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Loading Floor Plan...</p>
                            </div>
                        ) : groups.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
                                <p style={{ fontWeight: 700, fontSize: '14px' }}>No tables found.</p>
                                <p style={{ fontSize: '12px', marginTop: '6px' }}>Go to <strong>Master → Table</strong> to add tables.</p>
                            </div>
                        ) : (
                            groups.map(({ zoneName, zoneTables, captain, waiter }) => (
                                <div key={zoneName} style={{ marginBottom: '24px' }}>
                                    {/* Zone header */}
                                    <div style={{
                                        padding: '12px 20px',
                                        background: 'linear-gradient(to right, #f8fafc, #ffffff)',
                                        borderBottom: '1px solid #f1f5f9',
                                        display: 'flex', alignItems: 'center', gap: '16px'
                                    }}>
                                        <div style={{ width: '4px', height: '24px', background: '#6366f1', borderRadius: '4px' }} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '15px', fontWeight: 900, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{zoneName}</span>
                                            {(captain || waiter) && (
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>
                                                    {captain && `C - ${captain}`} {captain && waiter && '|'} {waiter && `W - ${waiter}`}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>
                                                {zoneTables.length} TABLES
                                            </span>
                                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px' }}>
                                                {zoneTables.filter(t => t.status === 'AVAILABLE').length} FREE
                                            </span>
                                            {zoneTables.filter(t => t.status === 'OCCUPIED').length > 0 && (
                                                <span style={{ fontSize: '10px', fontWeight: 800, color: '#ea580c', background: '#fff7ed', padding: '4px 10px', borderRadius: '20px' }}>
                                                    {zoneTables.filter(t => t.status === 'OCCUPIED').length} RUNNING
                                                </span>
                                            )}
                                            {zoneTables.filter(t => t.status === 'PRINTED').length > 0 && (
                                                <span style={{ fontSize: '10px', fontWeight: 800, color: '#16a34a', background: '#f0fdf4', padding: '4px 10px', borderRadius: '20px' }}>
                                                    {zoneTables.filter(t => t.status === 'PRINTED').length} PRINTED
                                                </span>
                                            )}
                                            {zoneTables.filter(t => t.status === 'RESERVED').length > 0 && (
                                                <span style={{ fontSize: '10px', fontWeight: 800, color: '#9333ea', background: '#faf5ff', padding: '4px 10px', borderRadius: '20px' }}>
                                                    {zoneTables.filter(t => t.status === 'RESERVED').length} RESERVED
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Zone tables container: 10 columns grid layout */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
                                        gap: '12px',
                                        padding: '16px 20px',
                                        background: '#fff',
                                        minHeight: '100px'
                                    }}>
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

            {/* ── Party Order Wizard ── */}
            {partyStep > 0 && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '500px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ padding: '8px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '10px' }}><Users2 size={20} /></div>
                                    Party Order Setup
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Step {partyStep} / 2: {partyStep === 1 ? 'Logistics & Timing' : 'Customer Credentials'}</p>
                            </div>
                            <button onClick={() => setPartyStep(0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
                        </div>

                        {partyStep === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>Delivery Date *</label>
                                    <div style={{ position: 'relative' }}>
                                        <CalendarClock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input
                                            type="date"
                                            value={partyForm.delivery_date}
                                            onChange={e => setPartyForm(f => ({ ...f, delivery_date: e.target.value }))}
                                            style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>Delivery Time *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input
                                            type="time"
                                            value={partyForm.delivery_time}
                                            onChange={e => setPartyForm(f => ({ ...f, delivery_time: e.target.value }))}
                                            style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => partyForm.delivery_date && partyForm.delivery_time ? setPartyStep(2) : alert('Both date and time are mandatory')}
                                    style={{ padding: '16px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)' }}
                                >
                                    Proceed to Customer <ArrowRight size={18} />
                                </button>
                            </div>
                        )}

                        {partyStep === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>Customer Name *</label>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={partyForm.customer_name}
                                        onChange={e => setPartyForm(f => ({ ...f, customer_name: e.target.value }))}
                                        style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>Phone Number *</label>
                                    <input
                                        type="tel"
                                        placeholder="10-digit mobile number"
                                        value={partyForm.customer_phone}
                                        onChange={e => setPartyForm(f => ({ ...f, customer_phone: e.target.value }))}
                                        style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>Delivery Address</label>
                                    <textarea
                                        placeholder="Full address for delivery"
                                        value={partyForm.customer_address}
                                        onChange={e => setPartyForm(f => ({ ...f, customer_address: e.target.value }))}
                                        style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '14px', fontSize: '15px', fontWeight: 600, outline: 'none', minHeight: '80px', boxSizing: 'border-box', resize: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={() => setPartyStep(1)} style={{ flex: 1, padding: '16px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}>Back</button>
                                    <button
                                        onClick={handlePartySubmit}
                                        disabled={reserveLoading || !partyForm.customer_name || !partyForm.customer_phone}
                                        style={{ flex: 2, padding: '16px', background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)' }}
                                    >
                                        {reserveLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                        Finalize & Configure Items
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
