import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import './PurchaseInvoices.css';
import {
    Loader2, FileText, AlertTriangle, XCircle, Package
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const getToken = () => {
    try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; }
};

const fmt = (n) => parseFloat(n || 0).toFixed(2);
const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const getDueDays = (dueDate) => {
    if (!dueDate) return null;
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
};

export default function PurchaseInvoices() {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [purchases, setPurchases] = useState([]);
    const [stats, setStats] = useState({ total_purchase: 0, total_paid: 0, total_unpaid: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);
    
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [fetchingDetail, setFetchingDetail] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const params = new URLSearchParams();
            if (fromDate) params.set('startDate', fromDate);
            if (toDate) params.set('endDate', toDate);
            if (searchTerm.trim()) params.set('search', searchTerm.trim());

            const [listRes, statsRes] = await Promise.all([
                fetch(`${API}/purchases?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/purchases/stats?${params}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const listData = await listRes.json();
            const statsData = await statsRes.json();

            if (listData.success) setPurchases(listData.data);
            if (statsData.success) setStats(statsData.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const state = location.state;
        if (state) {
            if (state.date) {
                setFromDate(state.date);
                setToDate(state.date);
            }
            if (state.supplierName) {
                setSearchTerm(state.supplierName);
            }
            if (state.viewId) {
                fetchPurchaseDetail(state.viewId);
            }
        }
        fetchData();
    }, [fromDate, toDate, location.state]);

    const fetchPurchaseDetail = async (id) => {
        setFetchingDetail(true);
        try {
            const token = getToken();
            const res = await fetch(`${API}/purchases/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                setSelectedPurchase(data.data);
                setShowDetail(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingDetail(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchData();
    };

    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            const token = getToken();
            const res = await fetch(`${API}/purchases/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setDeleteConfirm(null);
                fetchData();
            } else {
                alert(data.error || 'Delete failed');
            }
        } catch (err) {
            alert('Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    const handleExport = () => {
        const rows = [['S.NO', 'INVOICE NO', 'INVOICE DT', 'PARTY NAME', 'INVOICE AMOUNT', 'PAID', 'DUE', 'DUE DATE', 'STATUS']];
        purchases.forEach((p, i) => {
            rows.push([
                i + 1,
                p.invoice_number,
                fmtD(p.invoice_date || p.purchase_date),
                p.supplier_id?.name || '',
                fmt(p.grand_total),
                fmt(p.paid_amount),
                fmt(p.due_amount),
                fmtD(p.due_date),
                p.payment_status
            ]);
        });
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `purchase_invoices_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="pi-container">
                    {/* ─── Header ─── */}
                    <div className="pi-header">
                        <h1 className="pi-title">PURCHASE INVOICES</h1>
                        <div className="pi-header-actions">
                            <button className="pi-btn-export" onClick={handleExport}>EXPORT</button>
                            <button className="pi-icon-btn" title="Print" onClick={() => window.print()}>
                                <Printer size={18} />
                            </button>
                            <button className="pi-icon-btn" title="Settings"
                                onClick={() => navigate('/dashboard/self-service/settings')}>
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>

                    {/* ─── Summary Cards ─── */}
                    <div className="pi-stats-row">
                        <div className="pi-stat-card">
                            <div className="pi-stat-label">TOTAL PURCHASE</div>
                            <div className="pi-stat-value">{fmt(stats.total_purchase)}</div>
                        </div>
                        <div className="pi-stat-card">
                            <div className="pi-stat-label">PAID</div>
                            <div className="pi-stat-value">{fmt(stats.total_paid)}</div>
                        </div>
                        <div className="pi-stat-card">
                            <div className="pi-stat-label">UNPAID</div>
                            <div className="pi-stat-value">{fmt(stats.total_unpaid)}</div>
                        </div>
                    </div>

                    {/* ─── Toolbar ─── */}
                    <div className="pi-toolbar">
                        <form className="pi-search-wrap" onSubmit={handleSearch}>
                            <Search size={15} className="pi-search-icon" />
                            <input
                                className="pi-search-input"
                                placeholder="SEARCH BY INVOICE NO"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </form>
                        <div className="pi-date-filter">
                            <span className="pi-label">FROM</span>
                            <input type="date" className="pi-date-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                            <span className="pi-label">TO</span>
                            <input type="date" className="pi-date-input" value={toDate} onChange={e => setToDate(e.target.value)} />
                        </div>
                        <button className="pi-btn-create" onClick={() => navigate('/dashboard/self-service/purchase')}>
                            <Plus size={14} /> CREATE PURCHASE BILL
                        </button>
                    </div>

                    {/* ─── Table ─── */}
                    <div className="pi-table-wrap">
                        <table className="pi-table">
                            <thead>
                                <tr>
                                    <th>S.NO</th>
                                    <th>INVOICE NO</th>
                                    <th>INVOICE DT</th>
                                    <th>PARTY NAME</th>
                                    <th>INVOICE AMOUNT</th>
                                    <th>DUE DAYS</th>
                                    <th>DUE DATE</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} className="pi-empty">
                                        <Loader2 size={32} className="pi-spinner" />
                                        <p>Loading...</p>
                                    </td></tr>
                                ) : purchases.length === 0 ? (
                                    <tr><td colSpan={9} className="pi-empty">
                                        <FileText size={48} style={{ color: '#ddd', marginBottom: 8 }} />
                                        <p>No purchase invoices found</p>
                                    </td></tr>
                                ) : purchases.map((p, idx) => {
                                    const dueDays = getDueDays(p.due_date);
                                    const isOverdue = dueDays !== null && dueDays < 0 && p.payment_status !== 'PAID';
                                    return (
                                        <tr key={p._id} className={isOverdue ? 'pi-row-overdue' : ''}>
                                            <td>{idx + 1}</td>
                                            <td className="pi-invoice-no">{p.invoice_number}</td>
                                            <td>{fmtD(p.invoice_date || p.purchase_date)}</td>
                                            <td>{p.supplier_id?.name || '—'}</td>
                                            <td className="pi-amount">₹{fmt(p.grand_total)}</td>
                                            <td>
                                                {p.due_days > 0
                                                    ? <span className={`pi-due-badge ${isOverdue ? 'overdue' : ''}`}>
                                                        {isOverdue
                                                            ? <><AlertTriangle size={12} /> {Math.abs(dueDays)}d overdue</>
                                                            : `${p.due_days} days`}
                                                    </span>
                                                    : <span className="pi-cash-badge">CASH</span>}
                                            </td>
                                            <td>{fmtD(p.due_date)}</td>
                                            <td>
                                                <span className={`pi-status ${p.payment_status?.toLowerCase()}`}>
                                                    {p.payment_status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="pi-actions">
                                                    <button className="pi-act-btn view"
                                                        title="View"
                                                        onClick={() => fetchPurchaseDetail(p._id)}>
                                                        <Eye size={15} />
                                                    </button>
                                                    <button className="pi-act-btn delete"
                                                        title="Delete"
                                                        onClick={() => setDeleteConfirm(p)}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* ─── Total row ─── */}
                    {purchases.length > 0 && (
                        <div className="pi-footer-total">
                            <span>Total Bills: <strong>{purchases.length}</strong></span>
                            <span>Total Amount: <strong>₹{fmt(stats.total_purchase)}</strong></span>
                            <span>Total Paid: <strong style={{ color: '#22c55e' }}>₹{fmt(stats.total_paid)}</strong></span>
                            <span>Total Due: <strong style={{ color: '#ef4444' }}>₹{fmt(stats.total_unpaid)}</strong></span>
                        </div>
                    )}
                </div>
            </main>

            {/* ─── Delete Confirm Modal ─── */}
            {deleteConfirm && (
                <div className="pi-modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="pi-modal" onClick={e => e.stopPropagation()}>
                        <div className="pi-modal-icon"><Trash2 size={28} /></div>
                        <h3>Delete Purchase?</h3>
                        <p>Invoice <strong>{deleteConfirm.invoice_number}</strong> will be permanently deleted and stock will be reversed.</p>
                        <div className="pi-modal-btns">
                            <button className="pi-modal-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="pi-modal-confirm" disabled={deleting}
                                onClick={() => handleDelete(deleteConfirm._id)}>
                                {deleting ? <Loader2 size={14} className="pi-spinner" /> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Detail View Drawer ─── */}
            {showDetail && selectedPurchase && (
                <>
                    <div className="pi-drawer-overlay" onClick={() => setShowDetail(false)}></div>
                    <div className="pi-drawer animate-in slide-in-from-right duration-300">
                        <div className="pi-drawer-header">
                            <div>
                                <p className="pi-drawer-subtitle">Purchase Bill Details</p>
                                <h3 className="pi-drawer-title">{selectedPurchase.invoice_number}</h3>
                            </div>
                            <button onClick={() => setShowDetail(false)} className="pi-drawer-close">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="pi-drawer-body">
                            <div className="pi-detail-grid">
                                <div className="pi-detail-card">
                                    <label>Supplier</label>
                                    <p>{selectedPurchase.supplier_id?.name || '—'}</p>
                                </div>
                                <div className="pi-detail-card">
                                    <label>Invoice Date</label>
                                    <p>{fmtD(selectedPurchase.invoice_date || selectedPurchase.purchase_date)}</p>
                                </div>
                                <div className="pi-detail-card">
                                    <label>Status</label>
                                    <p className={`pi-status ${selectedPurchase.payment_status?.toLowerCase()}`}>
                                        {selectedPurchase.payment_status}
                                    </p>
                                </div>
                            </div>

                            <div className="pi-items-section">
                                <div className="pi-section-title">
                                    <Package size={16} /> Procured Items
                                </div>
                                <div className="pi-items-table-wrap">
                                    <table className="pi-items-table">
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Qty</th>
                                                <th>Rate</th>
                                                <th>GST %</th>
                                                <th style={{ textAlign: 'right' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedPurchase.items || []).map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.product_id?.name || item.product_id || '—'}</td>
                                                    <td className="font-bold">{item.quantity}</td>
                                                    <td>₹{fmt(item.purchase_rate)}</td>
                                                    <td className="text-amber-600 font-bold">{item.gst_percent}%</td>
                                                    <td style={{ textAlign: 'right' }} className="font-bold">₹{fmt(item.total_amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="pi-summary-calc">
                                <div className="pi-calc-row">
                                    <span>Subtotal</span>
                                    <span>₹{fmt(selectedPurchase.sub_total)}</span>
                                </div>
                                <div className="pi-calc-row text-amber-600">
                                    <span>Tax Amount</span>
                                    <span>₹{fmt(selectedPurchase.tax_amount)}</span>
                                </div>
                                <div className="pi-calc-row">
                                    <span>Other Charges</span>
                                    <span>₹{fmt(selectedPurchase.other_charges)}</span>
                                </div>
                                <div className="pi-calc-total">
                                    <span>Grand Total</span>
                                    <span>₹{fmt(selectedPurchase.grand_total)}</span>
                                </div>
                                <div className="pi-calc-row text-emerald-600 pt-2 border-t border-slate-100 mt-2">
                                    <span className="font-bold uppercase text-[10px]">Paid Amount</span>
                                    <span className="font-black">₹{fmt(selectedPurchase.paid_amount)}</span>
                                </div>
                                {selectedPurchase.due_amount > 0 && (
                                    <div className="pi-calc-row text-rose-600">
                                        <span className="font-bold uppercase text-[10px]">Due Balance</span>
                                        <span className="font-black">₹{fmt(selectedPurchase.due_amount)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {fetchingDetail && (
                <div className="pi-modal-overlay">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="pi-spinner text-white" size={48} />
                        <p className="text-white font-bold tracking-widest uppercase text-xs">Fetching Details...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
