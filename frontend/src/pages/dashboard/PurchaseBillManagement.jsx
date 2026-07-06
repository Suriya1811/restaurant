import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    Search, Trash2, Loader2, FileText, Calendar,
    Eye, XCircle, AlertCircle, Package, Truck,
    ClipboardList, CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';

const PurchaseBillManagement = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const fetchPurchases = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/purchases`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (data.success) setPurchases(data.data);
        } catch (err) { console.error("Failed to fetch purchases", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPurchases(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? Stock and Supplier balance will be adjusted.")) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/purchases/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if ((await response.json()).success) fetchPurchases();
        } catch (err) { alert("Delete failed"); }
    };

    const filteredPurchases = purchases.filter(p => {
        const matchesSearch = p.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.supplier_id?.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const pDate = new Date(p.purchase_date).toISOString().split('T')[0];
        const matchesDate = (!fromDate || pDate >= fromDate) && (!toDate || pDate <= toDate);
        
        return matchesSearch && matchesDate;
    });

    const getStatusConfig = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'paid') return { cls: 'active', icon: <CheckCircle2 size={14} />, label: 'SETTLED' };
        if (s === 'partial') return { cls: '', icon: <Clock size={14} />, label: 'PARTIAL', style: { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' } };
        return { cls: 'disabled', icon: <AlertTriangle size={14} />, label: 'OUTSTANDING' };
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} />
                <div className="master-content-layout fade-in">
                    <div className="master-header-premium">
                        <div className="master-title-premium">
                            <div className="flex items-center gap-2 mb-2">
                                <ClipboardList className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">GRN Archive</span>
                            </div>
                            <h2>Purchase Bills</h2>
                            <p>Complete history and audit trail of vendor purchase invoices.</p>
                        </div>
                    </div>

                    <div className="toolbar-premium !flex-wrap gap-y-4">
                        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                            <div className="search-premium !flex-1">
                                <Search size={20} />
                                <input type="text" placeholder="Search invoice or vendor name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                                <Calendar size={14} className="text-slate-400" />
                                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border-none text-xs font-bold text-slate-600 focus:ring-0 p-0" />
                                <span className="text-slate-300">to</span>
                                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border-none text-xs font-bold text-slate-600 focus:ring-0 p-0" />
                            </div>

                            <button onClick={() => window.location.href = '/dashboard/self-service/purchase'} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all">
                                <PlusCircle size={18} />
                                Create Purchase Bill
                            </button>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Invoice Reference</th>
                                    <th>Vendor Partner</th>
                                    <th>GRN Date</th>
                                    <th>Grand Total</th>
                                    <th>Outstanding Due</th>
                                    <th>Settlement</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '100px 0' }}>
                                        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                        <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Fetching GRN Archive...</p>
                                    </td></tr>
                                ) : filteredPurchases.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '100px 0' }}>
                                        <ClipboardList size={64} className="text-slate-100 mx-auto mb-4" />
                                        <p className="font-bold text-slate-400">No purchase records on file.</p>
                                    </td></tr>
                                ) : filteredPurchases.map((p) => {
                                    const statusCfg = getStatusConfig(p.payment_status);
                                    return (
                                        <tr key={p._id} className="group">
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 tracking-tight">{p.invoice_number}</div>
                                                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ID: {p._id?.slice(-6).toUpperCase()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Truck size={14} className="text-slate-300" />
                                                    <span className="font-black text-slate-600 text-sm uppercase tracking-tighter">{p.supplier_id?.name || '—'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar size={14} className="text-slate-300" />
                                                    <span className="font-bold text-sm">{new Date(p.purchase_date).toLocaleDateString('en-IN')}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-base font-black text-slate-900">₹{parseFloat(p.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </td>
                                            <td>
                                                <span className={`text-sm font-black ${parseFloat(p.due_amount) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    ₹{parseFloat(p.due_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td>
                                                {statusCfg.style ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest" style={statusCfg.style}>
                                                        {statusCfg.icon} {statusCfg.label}
                                                    </span>
                                                ) : (
                                                    <span className={`badge-premium ${statusCfg.cls}`}>{statusCfg.label}</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => { setSelectedPurchase(p); setShowDetail(true); }} className="action-icon-btn edit"><Eye size={18} /></button>
                                                    <button onClick={() => handleDelete(p._id)} className="action-icon-btn delete"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail View Drawer */}
                {showDetail && selectedPurchase && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[999]" onClick={() => setShowDetail(false)}></div>
                        <div className="drawer-premium !max-w-[840px]">
                            <div className="drawer-header-premium !bg-slate-900 !border-none">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Purchase Invoice Review</p>
                                    <h3 className="text-xl font-black text-white tracking-tighter">{selectedPurchase.invoice_number}</h3>
                                </div>
                                <button onClick={() => setShowDetail(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-500 flex items-center justify-center transition-all">
                                    <XCircle size={28} className="text-white" />
                                </button>
                            </div>
                            <div className="drawer-body-premium !bg-slate-50">
                                {/* Meta summary */}
                                <div className="grid grid-cols-3 gap-6 mb-10">
                                    {[
                                        { label: 'Vendor', val: selectedPurchase.supplier_id?.name || '—' },
                                        { label: 'GRN Date', val: new Date(selectedPurchase.purchase_date).toLocaleDateString('en-IN') },
                                        { label: 'Status', val: selectedPurchase.payment_status }
                                    ].map(({ label, val }) => (
                                        <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                                            <p className="font-black text-slate-800 text-base">{val}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Items Table */}
                                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
                                    <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-3">
                                        <Package size={18} className="text-indigo-600" />
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight">Procured SKUs</h4>
                                    </div>
                                    <table className="w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                {['Product', 'Qty', 'Rate', 'GST%', 'Line Total'].map(h => (
                                                    <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {(selectedPurchase.items || []).map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{item.product_id?.name || item.product_id}</td>
                                                    <td className="px-6 py-4 font-black text-slate-800">{item.quantity}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-600">₹{item.purchase_rate}</td>
                                                    <td className="px-6 py-4 font-bold text-amber-600">{item.gst_percent}%</td>
                                                    <td className="px-6 py-4 font-black text-slate-900">₹{parseFloat(item.total_amount).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Financial Summary */}
                                <div className="ml-auto max-w-xs bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-3">
                                    {[
                                        { label: 'Subtotal', val: `₹${selectedPurchase.sub_total}`, style: '' },
                                        { label: 'GST Tax', val: `₹${selectedPurchase.tax_amount}`, style: 'text-amber-600' },
                                        { label: 'Other', val: `₹${selectedPurchase.other_charges}`, style: '' },
                                    ].map(({ label, val, style }) => (
                                        <div key={label} className="flex justify-between text-sm">
                                            <span className="font-bold text-slate-500">{label}</span>
                                            <span className={`font-black text-slate-700 ${style}`}>{val}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-slate-100 pt-3 flex justify-between">
                                        <span className="font-black text-slate-900 uppercase tracking-widest text-xs">Grand Total</span>
                                        <span className="font-black text-indigo-600 text-lg">₹{selectedPurchase.grand_total}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-slate-500">Paid</span>
                                        <span className="font-black text-emerald-600">₹{selectedPurchase.paid_amount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-slate-500">Due</span>
                                        <span className="font-black text-rose-600">₹{selectedPurchase.due_amount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default PurchaseBillManagement;
