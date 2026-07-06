import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    Table,
    Clock,
    ChevronRight,
    Trash2,
    ShoppingBag,
    Users,
    X
} from 'lucide-react';

const HoldBillsPage = () => {
    const navigate = useNavigate();
    const [heldBills, setHeldBills] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('pos_held_bills');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setHeldBills(parsed);
                } else {
                    setHeldBills([]);
                }
            }
        } catch (err) {
            console.error("Hold Page storage error", err);
            setLoadError("Failed to load held bills. Storage might be corrupted.");
        }
    }, []);

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Remove this held bill?")) return;
        const updated = heldBills.filter(h => h.id !== id);
        setHeldBills(updated);
        localStorage.setItem('pos_held_bills', JSON.stringify(updated));
    };

    const handleRestore = (hold) => {
        navigate('/dashboard/self-service/billing', { state: { restoreHold: hold } });
    };

    const filtered = heldBills.filter(h => {
        const bNo = String(h.billNumber || "").toLowerCase();
        const tNo = String(h.tableNo || "").toLowerCase();
        const cName = String(h.customerName || h.customer?.name || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return bNo.includes(query) || tNo.includes(query) || cName.includes(query);
    });

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f1f5f9',
            padding: '20px',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#334155'
        }}>
            {/* Header */}
            <div style={{
                background: '#ffffff',
                padding: '24px',
                borderRadius: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/dashboard/self-service/billing')}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            border: 'none',
                            background: '#f8fafc',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Held Transactions</h1>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{heldBills.length} active hold sessions</p>
                    </div>
                </div>

                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search bills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>
            </div>

            {loadError && (
                <div style={{ padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '12px', marginBottom: '20px' }}>
                    {loadError} <button onClick={() => { localStorage.removeItem('pos_held_bills'); setHeldBills([]); setLoadError(null); }}>Clear Storage</button>
                </div>
            )}

            {/* List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {filtered.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', opacity: 0.5 }}>
                        <ShoppingBag size={48} style={{ marginBottom: '16px' }} />
                        <h3>No held bills found</h3>
                        <button onClick={() => navigate('/dashboard/self-service/billing')} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Back to Billing</button>
                    </div>
                ) : (
                    filtered.map(hold => (
                        <div
                            key={hold.id}
                            onClick={() => handleRestore(hold)}
                            style={{
                                background: '#fff',
                                padding: '20px',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ background: '#f0f9ff', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>#{hold.billNumber}</span>
                                <button
                                    onClick={(e) => handleDelete(hold.id, e)}
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.875rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Table size={14} /> <span>{hold.tableNo ? `T-${hold.tableNo}` : (hold.orderMode || 'Order')}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={14} /> <span>{new Date(hold.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                <Users size={14} style={{ marginRight: '6px' }} /> {hold.customerName || hold.customer?.name || 'Walk-in'}
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {(hold.items || []).map(i => i.name).join(', ')}
                            </div>

                            <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>₹{(hold.grandTotal || 0).toFixed(2)}</span>
                                <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700 }}>Restore <ChevronRight size={14} /></span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HoldBillsPage;
