import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    Plus, Search, Trash2, Save, Calendar, Loader2,
    ShoppingCart, Package, ChevronDown, AlertTriangle,
    Truck, FileText, TrendingDown
} from 'lucide-react';

const PurchaseEntry = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [purchaseDetails, setPurchaseDetails] = useState({
        supplier_id: '', invoice_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        items: [], sub_total: 0, tax_amount: 0, other_charges: 0, grand_total: 0, paid_amount: 0
    });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const fetchData = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const [supRes, prodRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/products`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const supData = await supRes.json();
            const prodData = await prodRes.json();
            if (supData.success) setSuppliers(supData.data);
            if (prodData.success) setProducts(prodData.data);
        } catch (err) { console.error("Failed to fetch data", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const addItem = () => {
        setPurchaseDetails(prev => ({
            ...prev,
            items: [...prev.items, { product_id: '', quantity: 1, purchase_rate: 0, gst_percent: 0, total_amount: 0 }]
        }));
    };

    const removeItem = (index) => {
        const newItems = purchaseDetails.items.filter((_, i) => i !== index);
        setPurchaseDetails(prev => ({ ...prev, items: newItems }));
        calculateTotals(newItems, purchaseDetails.other_charges);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...purchaseDetails.items];
        const item = { ...newItems[index] };
        if (field === 'product_id') {
            const product = products.find(p => p._id === value);
            item.product_id = value;
            item.purchase_rate = product ? product.buying_price : 0;
            item.gst_percent = product ? product.gst_purchase : 0;
        } else { item[field] = value; }
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.purchase_rate) || 0;
        const gst = parseFloat(item.gst_percent) || 0;
        const base = qty * rate;
        item.total_amount = base + (base * (gst / 100));
        newItems[index] = item;
        setPurchaseDetails(prev => ({ ...prev, items: newItems }));
        calculateTotals(newItems, purchaseDetails.other_charges);
    };

    const calculateTotals = (items, other) => {
        let sub = 0, tax = 0;
        items.forEach(item => {
            const qty = parseFloat(item.quantity) || 0, rate = parseFloat(item.purchase_rate) || 0, gst = parseFloat(item.gst_percent) || 0;
            sub += (qty * rate); tax += (qty * rate * (gst / 100));
        });
        setPurchaseDetails(prev => ({ ...prev, sub_total: sub, tax_amount: tax, grand_total: sub + tax + (parseFloat(other) || 0) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (purchaseDetails.items.length === 0) return alert("Add at least one item");
        setSubmitting(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/purchases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(purchaseDetails)
            });
            const result = await response.json();
            if (result.success) {
                alert("Purchase recorded successfully!");
                setPurchaseDetails({ supplier_id: '', invoice_number: '', purchase_date: new Date().toISOString().split('T')[0], items: [], sub_total: 0, tax_amount: 0, other_charges: 0, grand_total: 0, paid_amount: 0 });
            } else { alert("Error: " + result.error); }
        } catch (err) { console.error(err); }
        finally { setSubmitting(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={56} />
                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Initializing Procurement Module...</p>
            </div>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    title="Purchase Entry"
                    actions={
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Inventory Inflow</span>
                    }
                />
                <div className="master-content-layout fade-in p-6 lg:p-10 max-w-[1600px] mx-auto w-full">

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Bill Header Card */}
                        <div className="bento-card p-10 mb-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-8 h-8 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Invoice Metadata</h3>
                                    <p className="text-xs font-black text-slate-400 mt-1 uppercase tracking-widest">Global procurement identification</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="form-group-premium">
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 block">Vendor Partner *</label>
                                    <div className="relative">
                                        <Truck size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                        <select required className="input-premium-modern with-icon-left !pl-12 appearance-none cursor-pointer w-full" value={purchaseDetails.supplier_id} onChange={(e) => setPurchaseDetails({ ...purchaseDetails, supplier_id: e.target.value })}>
                                            <option value="">Select Vendor...</option>
                                            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="form-group-premium">
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 block">Invoice Reference Number *</label>
                                    <input type="text" required className="input-premium-modern w-full" placeholder="e.g. INV-2024-ALPHA" value={purchaseDetails.invoice_number} onChange={(e) => setPurchaseDetails({ ...purchaseDetails, invoice_number: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="form-group-premium">
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 block">Inward Date</label>
                                    <div className="relative">
                                        <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                        <input type="date" className="input-premium-modern with-icon-left !pl-12 w-full" value={purchaseDetails.purchase_date} onChange={(e) => setPurchaseDetails({ ...purchaseDetails, purchase_date: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Card */}
                        <div className="bento-card p-0 overflow-hidden mb-10">
                            <div className="flex justify-between items-center p-10 border-b border-slate-50 bg-slate-50/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Systematic Manifest</h3>
                                        <p className="text-xs font-black text-slate-400 mt-1 uppercase tracking-widest">{purchaseDetails.items.length} Unique SKUs identified</p>
                                    </div>
                                </div>
                                <button type="button" onClick={addItem} className="btn-glow bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-indigo-100 hover:scale-105 transition-all">
                                    <Plus size={18} /> Provision Item
                                </button>
                            </div>
                            <div className="p-6">
                                <table className="modern-table-premium">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">
                                            <th className="px-6 py-4 text-left">Strategic SKU</th>
                                            <th className="px-4 py-4 text-left w-32">Quotas</th>
                                            <th className="px-4 py-4 text-left w-40">Tariff (Excl.)</th>
                                            <th className="px-4 py-4 text-left w-32">Tax Load</th>
                                            <th className="px-4 py-4 text-right w-40">Manifest Total</th>
                                            <th className="px-4 py-4 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchaseDetails.items.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-24 opacity-30">
                                                    <ShoppingCart size={80} className="mx-auto mb-6 text-indigo-200" />
                                                    <p className="font-black uppercase tracking-[0.3em] text-sm">Awaiting item provisioning</p>
                                                </td>
                                            </tr>
                                        ) : purchaseDetails.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <select className="input-premium-modern w-full" value={item.product_id} onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}>
                                                        <option value="">Select SKU Architecture...</option>
                                                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input type="number" min="1" className="input-premium-modern w-full text-center" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} />
                                                </td>
                                                <td>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">₹</span>
                                                        <input type="number" min="0" className="input-premium-modern with-icon-left !pl-8 w-full" value={item.purchase_rate} onChange={(e) => handleItemChange(idx, 'purchase_rate', e.target.value)} />
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="relative">
                                                        <input type="number" min="0" className="input-premium-modern with-icon-right !pr-8 text-right" value={item.gst_percent} onChange={(e) => handleItemChange(idx, 'gst_percent', e.target.value)} />
                                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">%</span>
                                                    </div>
                                                </td>
                                                <td className="text-right">
                                                    <span className="text-xl font-black text-slate-900 tracking-tight">₹{item.total_amount.toLocaleString()}</span>
                                                </td>
                                                <td>
                                                    <button type="button" onClick={() => removeItem(idx)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all mx-auto shadow-sm">
                                                        <Trash2 size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer Summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12">
                            <div className="bento-card p-10 bg-slate-900 text-white border-none shadow-2xl rounded-[1.5rem]">
                                <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-10">Fiscal Consolidation</h4>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all hover:border-indigo-400/30 border border-white/5">
                                        <span className="text-sm font-bold text-slate-300">Net Manifest Core</span>
                                        <span className="font-black text-sm tracking-tight text-white">₹{purchaseDetails.sub_total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all hover:border-indigo-400/30 border border-white/5">
                                        <span className="text-sm font-bold text-slate-300">GST Load Vector</span>
                                        <span className="font-black text-sm tracking-tight text-amber-400">₹{purchaseDetails.tax_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all hover:border-indigo-400/30 border border-white/5">
                                        <span className="text-sm font-bold text-slate-300">Service Auxiliaries</span>
                                        <input type="number" className="w-32 bg-slate-800 border border-slate-700 rounded-lg font-black text-white text-right px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={purchaseDetails.other_charges} onChange={(e) => { const v = e.target.value === '' ? '' : parseFloat(e.target.value) || 0; setPurchaseDetails(p => ({ ...p, other_charges: v })); calculateTotals(purchaseDetails.items, v); }} />
                                    </div>
                                    <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">Total Fiscal Outflow</span>
                                            <div className="text-5xl font-black tracking-tighter mt-3 text-white">₹{purchaseDetails.grand_total.toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-10">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Settled Amount</span>
                                            <input type="number" className="w-full bg-emerald-500/15 border border-emerald-500/40 rounded-xl font-black text-emerald-300 text-base px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" value={purchaseDetails.paid_amount} onChange={(e) => setPurchaseDetails(p => ({ ...p, paid_amount: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Outstanding</span>
                                            <div className="w-full bg-rose-500/15 border border-rose-500/40 rounded-xl font-black text-rose-300 text-base px-4 py-3 flex items-center">
                                                ₹{(purchaseDetails.grand_total - purchaseDetails.paid_amount).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center items-center text-center p-12 bg-indigo-600/5 rounded-[2.5rem] border-2 border-dashed border-indigo-100 gap-8 bento-card">
                                <div className="p-8 bg-gradient-to-br from-indigo-50 to-white rounded-full shadow-xl shadow-indigo-200">
                                    <ShoppingCart size={80} className="text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">Finalise Procurement</h4>
                                    <p className="text-slate-600 font-bold text-sm leading-relaxed max-w-xs mx-auto">Clicking commit will broadcast these entries to the distributed ledger and update stock levels in real-time.</p>
                                </div>
                                <button type="submit" disabled={submitting} className="btn-action-save" style={{background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', color: 'white', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1}}>
                                    {submitting ? <><Loader2 className="animate-spin" size={20} /> COMMIT IN PROGRESS...</> : <><Save size={20} /> COMMIT TO LEDGER</>}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default PurchaseEntry;
