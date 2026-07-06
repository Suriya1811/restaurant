import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Printer, Clock, Loader2, RefreshCw, ArrowLeft, Monitor,
    AlertCircle, CheckCircle2, Utensils, Timer, UserCheck, Users2, Wifi
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const getToken = () => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } };

/* ─── Elapsed Time Badge ─── */
function TimeBadge({ createdAt }) {
    const [elapsed, setElapsed] = useState('');
    useEffect(() => {
        const tick = () => {
            const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000);
            if (diff < 60) setElapsed(`${diff}s`);
            else if (diff < 3600) setElapsed(`${Math.floor(diff / 60)}m ${diff % 60}s`);
            else setElapsed(`${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [createdAt]);

    const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000);
    const urgent = diff > 600;
    const warn = diff > 300;

    return (
        <span style={{
            padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800,
            background: urgent ? '#fee2e2' : warn ? '#fef3c7' : '#d1fae5',
            color: urgent ? '#ef4444' : warn ? '#d97706' : '#059669',
            display: 'flex', alignItems: 'center', gap: 4
        }}>
            <Timer size={11} /> {elapsed}
        </span>
    );
}

/* ─── Order Card ─── */
function OrderCard({ order, color, onReady, filterCategory, onItemUpdate }) {
    const [loading, setLoading] = useState(''); // 'ready' | 'item_<id>' | ''
    const modeBadge = {
        DINE_IN:      { label: 'Dine In',   bg: '#ede9fe', color: '#7c3aed' },
        TAKEAWAY:     { label: 'Takeaway',  bg: '#fef9c3', color: '#ca8a04' },
        SELF_SERVICE: { label: 'Counter',   bg: '#dcfce7', color: '#16a34a' },
        PARCEL:       { label: 'Parcel',    bg: '#ffedd5', color: '#ea580c' },
        DELIVERY:     { label: 'Delivery',  bg: '#e0f2fe', color: '#0284c7' },
        PARTY:        { label: 'Party',     bg: '#fce7f3', color: '#db2777' }
    };
    const mode = modeBadge[order.order_mode] || modeBadge.SELF_SERVICE;

    const handleReady = async () => {
        setLoading('ready');
        try {
            // 1. Mark the bill as READY
            await fetch(`${API}/bills/${order._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ kitchen_status: 'READY' })
            });

            // 2. If linked to a table, update table KOT status
            if (order.table_no) {
                const res = await fetch(`${API}/tables`, { headers: { Authorization: `Bearer ${getToken()}` } });
                const data = await res.json();
                if (data.success) {
                    const matched = data.data.find(t => String(t.table_number) === String(order.table_no));
                    if (matched) {
                        await fetch(`${API}/tables/${matched._id}/kot-status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                            body: JSON.stringify({ kot_status: 'READY' })
                        });
                    }
                }
            }

            // 3. Broadcast to other tabs
            try {
                const ch = new BroadcastChannel('restoboard_kot');
                ch.postMessage({ type: 'ORDER_READY', billId: order._id, tableNo: order.table_no });
                ch.close();
            } catch(e) {}

            onReady(order._id);
        } catch(e) { console.error('Order ready error', e); }
        setLoading('');
    };

    const handleItemToggle = async (item) => {
        if (loading) return;
        setLoading('item_' + item._id);
        try {
            const newStatus = item.status === 'READY' ? 'PENDING' : 'READY';
            const updatedItems = order.items.map(it =>
                it._id === item._id ? { ...it, status: newStatus } : it
            );

            const res = await fetch(`${API}/bills/${order._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ items: updatedItems })
            });
            const data = await res.json();

            if (data.success) {
                const allReady = updatedItems.every(it => it.status === 'READY');
                if (allReady) {
                    await handleReady();
                } else {
                    onItemUpdate && onItemUpdate(order._id, updatedItems);
                }
            }
        } catch(e) { console.error('Item toggle error', e); }
        setLoading('');
    };

    return (
        <div style={{
            background: '#fff', borderRadius: 16, border: `2px solid ${color}22`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
        }}>
            {/* Card Header */}
            <div style={{ background: color, padding: '0.8rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '0.05em' }}>
                        {order.table_no ? `TABLE ${order.table_no}` : `BILL #${order.bill_number}`}
                    </div>
                    <TimeBadge createdAt={order.createdAt} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: mode.bg, color: mode.color, padding: '0.2rem 0.6rem', borderRadius: 12 }}>
                            {mode.label.toUpperCase()}
                        </span>
                    </div>
                    {(order.captain_name || order.persons) && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', color: 'rgba(255,255,255,0.95)', fontSize: '0.7rem', fontWeight: 700 }}>
                            {order.captain_name && <div style={{display:'flex', alignItems:'center', gap:4}}><UserCheck size={11} /> {order.captain_name.toUpperCase()}</div>}
                            {order.persons && <div style={{display:'flex', alignItems:'center', gap:4}}><Users2 size={11} /> {order.persons} PAX</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* Items */}
            <div style={{ padding: '0.75rem', flex: 1 }}>
                {order.items
                    .filter(item => filterCategory === 'ALL' || (item.category || 'Uncategorized') === filterCategory)
                    .map((item, i, arr) => (
                    <div key={item._id || i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.55rem 0.5rem', borderBottom: i < arr.length - 1 ? '1px solid #e0e7ff' : 'none',
                        opacity: item.status === 'READY' ? 0.6 : 1
                    }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {/* Toggle switch */}
                            <button
                                onClick={() => handleItemToggle(item)}
                                disabled={!!loading}
                                style={{
                                    width: 36, height: 20, borderRadius: 10, border: 'none',
                                    background: item.status === 'READY' ? '#16a34a' : '#cbd5e1',
                                    position: 'relative', transition: 'all 0.3s',
                                    display: 'flex', alignItems: 'center', padding: 2,
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <div style={{
                                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'all 0.3s',
                                    transform: item.status === 'READY' ? 'translateX(16px)' : 'translateX(0)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {loading === 'item_' + item._id ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite', color: '#64748b' }} /> : ''}
                                </div>
                            </button>
                            <div>
                                <div style={{ fontWeight: 800, color: '#1a1333', fontSize: '0.9rem', textDecoration: item.status === 'READY' ? 'line-through' : 'none' }}>
                                    {item.product_name || item.name}
                                </div>
                                {item.category && (
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9b86aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.category}</div>
                                )}
                            </div>
                        </div>
                        <div style={{
                            background: color, color: '#fff', fontWeight: 900, fontSize: '1.1rem',
                            minWidth: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {item.quantity}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', borderTop: '1px solid #f0f0f0' }}>
                <button
                    onClick={handleReady}
                    disabled={!!loading}
                    style={{
                        flex: 1, padding: '0.65rem 0.5rem', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                        background: loading === 'ready' ? '#86efac' : 'linear-gradient(135deg,#16a34a,#22c55e)',
                        color: '#fff', fontWeight: 900, fontSize: '0.75rem', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 5, transition: 'all 0.2s',
                        boxShadow: '0 3px 10px rgba(22,163,74,0.3)'
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    <CheckCircle2 size={14} />
                    {loading === 'ready' ? 'UPDATING...' : '✅ ORDER READY'}
                </button>
                <button
                    onClick={() => window.print()}
                    style={{
                        padding: '0.65rem 0.9rem', borderRadius: 10, border: 'none',
                        background: `${color}22`, color: color, fontWeight: 800, fontSize: '0.72rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                    }}
                >
                    <Printer size={14} /> PRINT
                </button>
            </div>
        </div>
    );
}

/* ─── Printer Selector View ─── */
export function PrinterDisplayList() {
    const navigate = useNavigate();
    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}/printers`, { headers: { Authorization: `Bearer ${getToken()}` } });
                const data = await res.json();
                if (data.success) setPrinters(data.data);
            } catch { }
            finally { setLoading(false); }
        })();
    }, []);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', padding: '2rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                    <button onClick={() => navigate('/dashboard/self-service/printer-management')}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: '0.6rem 1rem', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ArrowLeft size={14} /> BACK
                    </button>
                    <div>
                        <h1 style={{ color: '#fff', fontWeight: 900, margin: 0, fontSize: '1.8rem' }}>Printer Feeds</h1>
                        <p style={{ color: '#888', margin: 0, fontWeight: 600, fontSize: '0.82rem' }}>Select a routing gateway station to monitor and print KOTs</p>
                    </div>
                </div>
                {printers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem', color: '#666' }}>
                        <Printer size={64} style={{ marginBottom: 16, opacity: 0.3 }} />
                        <p style={{ fontWeight: 700, fontSize: '1rem' }}>No printers configured yet</p>
                        <button onClick={() => navigate('/dashboard/self-service/printer-management')}
                            style={{ marginTop: 16, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, padding: '0.7rem 1.5rem', fontWeight: 800, cursor: 'pointer' }}>
                            Configure Printers
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                        {printers.map(p => (
                            <button key={p._id} onClick={() => navigate(`/dashboard/self-service/printer-display/${p._id}`)}
                                style={{ background: 'rgba(255,255,255,0.05)', border: `2px solid ${p.color || '#3b82f6'}44`, borderRadius: 16, padding: '1.5rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                                <div style={{ width: 48, height: 48, background: p.color || '#3b82f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                    <Printer size={24} color="white" />
                                </div>
                                <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem', marginBottom: 4 }}>{p.name}</div>
                                <div style={{ color: '#888', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {p.ip_address || 'Local Printer'}
                                </div>
                                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: p.color || '#3b82f6', fontWeight: 800, fontSize: '0.75rem' }}>
                                    <Monitor size={14} /> OPEN LIVE FEED
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

/* ─── Main Printer Feed Screen ─── */
export default function PrinterDisplay() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [printer, setPrinter] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState('');
    const [newOrderFlash, setNewOrderFlash] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('ALL');

    // Optimistic update handlers
    const handleOrderReady = (billId) => {
        setOrders(prev => prev.filter(o => o._id !== billId));
    };
    const handleItemUpdate = (billId, newItems) => {
        setOrders(prev => prev.map(o => o._id === billId ? { ...o, items: newItems } : o));
    };

    const fetchOrders = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await fetch(`${API}/printers/${id}/orders`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.data);
                setPrinter(data.printer);
                setLastUpdated(new Date());
                setError('');
            } else {
                setError(data.error || 'Failed to load orders');
            }
        } catch (err) {
            setError('Connection error - retrying...');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchOrders();
        // Auto-refresh every 5 seconds (same as KitchenDisplay)
        const interval = setInterval(() => fetchOrders(), 5000);

        // === PRIMARY: BroadcastChannel (instant KOT sync) ===
        let kotChannel = null;
        try {
            kotChannel = new BroadcastChannel('restoboard_kot');
            kotChannel.onmessage = (e) => {
                if (e.data?.type === 'KOT_FIRED') {
                    fetchOrders(false);
                    setNewOrderFlash(true);
                    setTimeout(() => setNewOrderFlash(false), 3000);
                }
            };
        } catch(e) {
            console.warn('BroadcastChannel not supported, using localStorage fallback');
        }

        // === FALLBACK: localStorage storage event ===
        const handleStorageEvent = (e) => {
            if (e.key === 'kot_fired') {
                fetchOrders(false);
                setNewOrderFlash(true);
                setTimeout(() => setNewOrderFlash(false), 3000);
            }
        };
        window.addEventListener('storage', handleStorageEvent);

        return () => {
            clearInterval(interval);
            if (kotChannel) kotChannel.close();
            window.removeEventListener('storage', handleStorageEvent);
        };
    }, [fetchOrders]);

    const pColor = printer?.color || '#3b82f6';

    // Category-wise summary for the filter sidebar
    const categorySummary = useMemo(() => {
        const summary = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const cat = item.category || 'Uncategorized';
                if (!summary[cat]) summary[cat] = { total: 0, items: {} };
                summary[cat].total += Number(item.quantity) || 0;
                const itemName = item.product_name || item.name;
                if (!summary[cat].items[itemName]) summary[cat].items[itemName] = 0;
                summary[cat].items[itemName] += Number(item.quantity) || 0;
            });
        });
        return summary;
    }, [orders]);

    const filteredOrders = useMemo(() => {
        if (selectedCategory === 'ALL') return orders;
        return orders.filter(order =>
            order.items.some(item => (item.category || 'Uncategorized') === selectedCategory)
        );
    }, [orders, selectedCategory]);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <Loader2 size={56} style={{ animation: 'spin 1s linear infinite', color: pColor }} />
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#888' }}>Establishing Printer Gateway...</p>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

            {/* ─── NEW KOT Flash Banner ─── */}
            {newOrderFlash && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
                    background: '#3b82f6', color: '#fff',
                    padding: '0.75rem', textAlign: 'center',
                    fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.1em',
                    animation: 'pulse 0.5s ease-in-out infinite alternate',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}>
                    <Printer size={20} /> 🔔 NEW KOT RECEIVED — TICKET QUEUED!
                </div>
            )}

            {/* ─── Top Bar ─── */}
            <div style={{ background: '#1a1a2e', borderBottom: `3px solid ${pColor}`, padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: newOrderFlash ? '48px' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate(-1)}
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '0.5rem 0.9rem', color: '#aaa', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <ArrowLeft size={13} /> BACK
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 40, height: 40, background: pColor, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Printer size={20} color="white" />
                        </div>
                        <div>
                            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>{printer?.name || 'Printer Feed'}</div>
                            <div style={{ color: '#666', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Wifi size={10} /> {printer?.ip_address || 'LOCAL IP BOUND'}
                                {printer?.categories?.length > 0 ? ` · ${printer.categories.join(' · ').toUpperCase()}` : ' · ALL CATEGORIES'}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Order count badge */}
                    <div style={{ background: pColor, color: '#fff', fontWeight: 900, fontSize: '1.4rem', minWidth: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
                        {orders.length}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.68rem', fontWeight: 700 }}>
                        {orders.length === 1 ? 'ACTIVE ORDER' : 'ACTIVE ORDERS'}
                    </div>

                    {/* Last updated */}
                    {lastUpdated && (
                        <div style={{ color: '#555', fontSize: '0.65rem', fontWeight: 700 }}>
                            <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                            {lastUpdated.toLocaleTimeString()}
                        </div>
                    )}

                    {/* Refresh */}
                    <button onClick={() => fetchOrders(true)} disabled={refreshing}
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '0.5rem', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                </div>
            </div>

            {/* ─── Error Bar ─── */}
            {error && (
                <div style={{ background: '#450a0a', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: '0.8rem', fontWeight: 700 }}>
                    <AlertCircle size={15} /> {error}
                </div>
            )}

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* ─── Category Filter Sidebar ─── */}
                <div style={{
                    width: '300px',
                    background: '#111',
                    borderRight: '1px solid #1a1a2e',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    padding: '1.25rem 1rem',
                    overflowY: 'auto'
                }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#666', letterSpacing: '0.12em', padding: '0 0.5rem 0.5rem 0.5rem' }}>FILTER BY CATEGORY</div>
                    <button
                        onClick={() => setSelectedCategory('ALL')}
                        style={{
                            background: selectedCategory === 'ALL' ? pColor : 'transparent',
                            color: selectedCategory === 'ALL' ? '#fff' : '#aaa',
                            border: 'none', borderRadius: 10, padding: '1rem 1.2rem', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                    >
                        ALL ORDERS
                    </button>
                    {Object.entries(categorySummary).map(([cat, data]) => (
                        <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.5rem' }}>
                            <button
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    background: selectedCategory === cat ? pColor : 'transparent',
                                    color: selectedCategory === cat ? '#fff' : '#aaa',
                                    border: 'none', borderRadius: 10, padding: '1rem 1.2rem', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6
                                }}
                            >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.toUpperCase()}</span>
                                <span style={{
                                    background: selectedCategory === cat ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                                    padding: '4px 10px', borderRadius: 12, fontSize: '0.9rem'
                                }}>
                                    {data.total}
                                </span>
                            </button>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 0.5rem' }}>
                                {Object.entries(data.items).map(([itemName, itemCount]) => (
                                    <div key={itemName} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        color: selectedCategory === cat ? 'rgba(255,255,255,0.9)' : '#888',
                                        fontSize: '0.9rem', padding: '0.4rem 0.6rem',
                                        background: selectedCategory === cat ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                                        borderRadius: 8
                                    }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px', fontWeight: 600 }}>{itemName}</span>
                                        <span style={{ fontWeight: 800, background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: 8 }}>{itemCount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ─── Orders Grid ─── */}
                <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', background: '#0a0a0f' }}>
                    {filteredOrders.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#444', textAlign: 'center' }}>
                            <CheckCircle2 size={80} style={{ color: '#22c55e22', marginBottom: 20 }} />
                            <div style={{ color: '#22c55e', fontWeight: 900, fontSize: '1.5rem', marginBottom: 8 }}>Queue Empty</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#555' }}>No pending tickets for {printer?.name}</div>
                            <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#333', fontWeight: 700 }}>Auto-refreshing every 5 seconds...</div>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(auto-fill, minmax(${filteredOrders.length <= 2 ? '360px' : filteredOrders.length <= 4 ? '280px' : '240px'}, 1fr))`,
                            gap: '1rem',
                            alignItems: 'start'
                        }}>
                            {filteredOrders.map(order => (
                                <OrderCard
                                    key={order._id}
                                    order={order}
                                    color={pColor}
                                    onReady={handleOrderReady}
                                    filterCategory={selectedCategory}
                                    onItemUpdate={handleItemUpdate}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Bottom ticker ─── */}
            <div style={{ background: '#111', borderTop: '1px solid #222', padding: '0.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#333', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Utensils size={11} /> RESTOBOARD PRINTER FEED SYSTEM
                </div>
                <div style={{ color: '#333', fontSize: '0.65rem', fontWeight: 700 }}>
                    Auto-refresh: 5s · Instant KOT sync · {new Date().toLocaleDateString()}
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { from { opacity: 1; } to { opacity: 0.7; } }
                @media print {
                    aside, header, .dashboard-main > div:first-child, button, .mobile-overlay {
                        display: none !important;
                    }
                    .dashboard-layout, .dashboard-main, body {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
