import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { Ticket, Plus, Trash2, Edit, Save, Loader2, AlertCircle, CheckCircle, Search, CalendarDays } from 'lucide-react';
import '../../pages/SettingsPage.css';

const MaintainCoupon = () => {
    const { user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [couponForm, setCouponForm] = useState({
        coupon_name: '', num_from: '', num_to: '', start_date: '', end_date: '',
        type: 'DISCOUNT', discount_type: 'PERCENT', discount_value: 0
    });
    const [editingCouponId, setEditingCouponId] = useState(null);
    const [saving, setSaving] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const fetchCoupons = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/coupons`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) setCoupons(result.data);
        } catch (err) { console.error("Failed to fetch coupons", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCoupons(); }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const method = editingCouponId ? 'PUT' : 'POST';
            const url = editingCouponId ? `${import.meta.env.VITE_API_URL}/coupons/${editingCouponId}` : `${import.meta.env.VITE_API_URL}/coupons`;
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(couponForm)
            });
            const data = await res.json();
            if (data.success) {
                setEditingCouponId(null);
                setCouponForm({ coupon_name: '', num_from: '', num_to: '', start_date: '', end_date: '', type: 'DISCOUNT', discount_type: 'PERCENT', discount_value: 0 });
                fetchCoupons();
            }
        } catch (err) {
            console.error("Failed to save coupon", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this coupon range?')) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/coupons/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            setCoupons(prev => prev.filter(x => x._id !== id));
        } catch (err) {
            console.error("Failed to delete coupon", err);
        }
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
                                <Ticket className="text-indigo-600" size={18} />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">Extra Modules</span>
                            </div>
                            <h2>Maintain Coupon</h2>
                            <p>Manage promotional codes, discount ranges, and BOGO offers.</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] p-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Form Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Plus size={20} />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                        {editingCouponId ? 'Update Coupon' : 'Create New Coupon'}
                                    </h3>
                                </div>

                                <div className="space-y-5">
                                    <div className="form-group-premium">
                                        <label>Coupon Name *</label>
                                        <input type="text" className="input-premium" value={couponForm.coupon_name} onChange={(e) => setCouponForm({ ...couponForm, coupon_name: e.target.value })} placeholder="e.g. Summer Festival" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group-premium">
                                            <label>Number From *</label>
                                            <input type="number" className="input-premium" value={couponForm.num_from} onChange={(e) => setCouponForm({ ...couponForm, num_from: e.target.value })} />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Number To *</label>
                                            <input type="number" className="input-premium" value={couponForm.num_to} onChange={(e) => setCouponForm({ ...couponForm, num_to: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group-premium">
                                            <label>Start Date *</label>
                                            <div className="relative">
                                                <input type="date" className="input-premium" value={couponForm.start_date ? couponForm.start_date.split('T')[0] : ''} onChange={(e) => setCouponForm({ ...couponForm, start_date: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="form-group-premium">
                                            <label>End Date *</label>
                                            <div className="relative">
                                                <input type="date" className="input-premium" value={couponForm.end_date ? couponForm.end_date.split('T')[0] : ''} onChange={(e) => setCouponForm({ ...couponForm, end_date: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group-premium">
                                        <label>Coupon Mode</label>
                                        <select className="input-premium" value={couponForm.type} onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}>
                                            <option value="DISCOUNT">Fixed / Percentage Discount</option>
                                            <option value="BOGO">Buy 1 Get 1 Free (BOGO)</option>
                                        </select>
                                    </div>

                                    {couponForm.type === 'DISCOUNT' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="form-group-premium">
                                                <label>Disc. Mode</label>
                                                <select className="input-premium" value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}>
                                                    <option value="PERCENT">Percentage (%)</option>
                                                    <option value="FIXED">Fixed Amount (₹)</option>
                                                </select>
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Amount / %</label>
                                                <input type="number" className="input-premium" value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-6">
                                        {editingCouponId && (
                                            <button onClick={() => { setEditingCouponId(null); setCouponForm({ coupon_name: '', num_from: '', num_to: '', start_date: '', end_date: '', type: 'DISCOUNT', discount_type: 'PERCENT', discount_value: 0 }); }} 
                                                className="btn-premium-outline flex-1">CANCEL</button>
                                        )}
                                        <button onClick={handleSave} disabled={saving} className="btn-premium-primary flex-[2]">
                                            {saving ? <><Loader2 className="animate-spin" /> Saving...</> : <><Save size={18} /> {editingCouponId ? 'Update Coupon' : 'Create Coupon'}</>}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* List Section */}
                            <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col min-h-[600px]">
                                <div className="flex items-center justify-between mb-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Coupon Master List</p>
                                    <div className="flex items-center gap-2 text-indigo-600 bg-white px-3 py-1 rounded-full border border-indigo-50 shadow-sm">
                                        <Ticket size={12} />
                                        <span className="text-[10px] font-black uppercase tracking-tight">{coupons.length} Modules</span>
                                    </div>
                                </div>

                                <div className="space-y-4 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
                                    {coupons.map(c => (
                                        <div key={c._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-black text-slate-800 tracking-tight text-base mb-1">{c.coupon_name}</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-widest">{c.type}</span>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${new Date(c.end_date) < new Date() ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
                                                            {new Date(c.end_date) < new Date() ? 'Expired' : 'Active'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => { setEditingCouponId(c._id); setCouponForm(c); }} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"><Edit size={16} /></button>
                                                    <button onClick={() => handleDelete(c._id)} className="p-2.5 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-50/50">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Voucher Range</p>
                                                    <p className="text-sm font-black text-slate-700">{c.num_from} — {c.num_to}</p>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Benefit Value</p>
                                                    <p className="text-sm font-black text-slate-800">{c.type === 'DISCOUNT' ? (c.discount_type === 'PERCENT' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`) : 'BUY 1 GET 1'}</p>
                                                </div>
                                                <div className="col-span-2 space-y-1 mt-1 border-t border-slate-100 pt-3">
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <CalendarDays size={12} />
                                                        <p className="text-[9px] font-black uppercase tracking-tight">Campaign Validity</p>
                                                    </div>
                                                    <p className="text-[11px] font-black text-slate-600 tracking-tight">{new Date(c.start_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} — {new Date(c.end_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {coupons.length === 0 && (
                                        <div className="text-center py-32 bg-white rounded-3xl border border-slate-50">
                                            <Ticket size={48} className="text-slate-100 mx-auto mb-4" />
                                            <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest">No Coupon Modules Found</h4>
                                            <p className="text-[10px] font-bold text-slate-200 mt-2">Start by creating your first promotional offer range.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MaintainCoupon;
