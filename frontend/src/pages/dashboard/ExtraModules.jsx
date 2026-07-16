import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { 
    Ticket, Gift, Save, Loader2, AlertCircle, CheckCircle, 
    Plus, Trash2, Edit, CalendarDays, Sliders, ChevronRight,
    Monitor, Printer, Clock, LayoutDashboard, BarChart3, Users, Table, Settings
, Download} from 'lucide-react';
import '../../pages/SettingsPage.css';

const ExtraModules = () => {
    const { user, setModuleSettings } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();
    const initialTab = new URLSearchParams(location.search).get('tab') || 'coupon';
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        const tab = new URLSearchParams(location.search).get('tab');
        if (tab) setActiveTab(tab);
    }, [location.search]);

    const [loading, setLoading] = useState(true);

    // --- Coupon State ---
    const [coupons, setCoupons] = useState([]);
    const [couponForm, setCouponForm] = useState({
        coupon_name: '', num_from: '', num_to: '', start_date: '', end_date: '',
        type: 'DISCOUNT', discount_type: 'PERCENT', discount_value: 0
    });
    const [editingCouponId, setEditingCouponId] = useState(null);
    const [savingCoupon, setSavingCoupon] = useState(false);
    const [couponEnabled, setCouponEnabled] = useState(false);
    const [couponSuccess, setCouponSuccess] = useState(false);
    const [billingCouponActive, setBillingCouponActive] = useState(true);

    // --- Loyalty State ---
    const [loyaltyForm, setLoyaltyForm] = useState({ enabled: false, points_per_100: 1, target_points: 0, point_value: 1 });
    const [savingLoyalty, setSavingLoyalty] = useState(false);
    const [loyaltySuccess, setLoyaltySuccess] = useState(false);
    const [billingLoyaltyActive, setBillingLoyaltyActive] = useState(true);
    
    // --- System Modules State ---
    const [moduleStates, setModuleStates] = useState({
        kitchen: true, printer: true, counter: true, dashboard: true, 
        reports: true, staff: true, table: true, management: true
    });
    const [moduleSuccess, setModuleSuccess] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            // Fetch Coupons
            const coupRes = await fetch(`${import.meta.env.VITE_API_URL}/coupons`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const coupData = await coupRes.json();
            if (coupData.success) setCoupons(coupData.data);

            // Fetch Loyalty (from settings)
            const settingsRes = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const settingsData = await settingsRes.json();
            if (settingsData.success && settingsData.data) {
                if (settingsData.data.loyalty) setLoyaltyForm(settingsData.data.loyalty);
                if (settingsData.data.modules) {
                    setCouponEnabled(settingsData.data.modules.coupon_enabled);
                    setLoyaltyForm(prev => ({ ...prev, enabled: settingsData.data.modules.loyalty_enabled }));
                    setBillingCouponActive(settingsData.data.modules.billing_coupon_active);
                    setBillingLoyaltyActive(settingsData.data.modules.billing_loyalty_active);
                    
                    setModuleStates({
                        kitchen: settingsData.data.modules.kitchen_enabled,
                        printer: settingsData.data.modules.printer_enabled,
                        counter: settingsData.data.modules.counter_enabled,
                        dashboard: settingsData.data.modules.dashboard_enabled,
                        reports: settingsData.data.modules.reports_enabled,
                        staff: settingsData.data.modules.staff_enabled,
                        table: settingsData.data.modules.table_enabled,
                        management: settingsData.data.modules.management_enabled
                    });
                }
            }
        } catch (err) { console.error("Failed to fetch module data", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Coupon Handlers ---
    const handleSaveCoupon = async () => {
        setSavingCoupon(true);
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
                fetchData();
            }
        } catch (err) { console.error("Failed to save coupon", err); }
        finally { setSavingCoupon(false); }
    };

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm('Delete this coupon range?')) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/coupons/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            setCoupons(prev => prev.filter(x => x._id !== id));
        } catch (err) { console.error("Failed to delete coupon", err); }
    };

    const handleToggleCoupon = async (enabled) => {
        setCouponEnabled(enabled);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/settings/modules`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ coupon_enabled: enabled, billing_coupon_active: enabled ? billingCouponActive : false })
            });
            setCouponSuccess(true);
            setTimeout(() => setCouponSuccess(false), 3000);
            
            // Sync AuthContext
            const res = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const sData = await res.json();
            if (sData.success && sData.data.modules) {
                setModuleSettings(sData.data.modules);
                localStorage.setItem('moduleSettings', JSON.stringify(sData.data.modules));
            }
        } catch (err) { console.error("Failed to toggle coupon module", err); }
    };

    // --- Loyalty Handlers ---
    const handleSaveLoyalty = async () => {
        setSavingLoyalty(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/loyalty`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(loyaltyForm)
            });
            const result = await response.json();
            if (result.success) {
                setLoyaltySuccess(true);
                setTimeout(() => setLoyaltySuccess(false), 3000);
            }
        } catch (err) { console.error("Failed to update loyalty", err); }
        finally { setSavingLoyalty(false); }
    };

    const handleToggleLoyalty = async (enabled) => {
        setLoyaltyForm(prev => ({ ...prev, enabled }));
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/settings/modules`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ loyalty_enabled: enabled, billing_loyalty_active: enabled ? billingLoyaltyActive : false })
            });
            setLoyaltySuccess(true);
            setTimeout(() => setLoyaltySuccess(false), 3000);

            // Sync AuthContext
            const res = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const sData = await res.json();
            if (sData.success && sData.data.modules) {
                setModuleSettings(sData.data.modules);
                localStorage.setItem('moduleSettings', JSON.stringify(sData.data.modules));
            }
        } catch (err) { console.error("Failed to toggle loyalty module", err); }
    };

    const handleToggleModule = async (moduleKey, enabled) => {
        setModuleStates(prev => ({ ...prev, [moduleKey]: enabled }));
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const payload = { [`${moduleKey}_enabled`]: enabled };
            await fetch(`${import.meta.env.VITE_API_URL}/settings/modules`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            setModuleSuccess(true);
            setTimeout(() => setModuleSuccess(false), 3000);

            // Sync AuthContext
            const res = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const sData = await res.json();
            if (sData.success && sData.data.modules) {
                setModuleSettings(sData.data.modules);
                localStorage.setItem('moduleSettings', JSON.stringify(sData.data.modules));
            }
        } catch (err) { console.error(`Failed to toggle ${moduleKey} module`, err); }
    };

    const TABS = [
        { id: 'coupon', label: 'Coupons', icon: <Ticket size={18} />, sub: 'Promo ranges' },
        { id: 'loyalty', label: 'Loyalty', icon: <Gift size={18} />, sub: 'Points setup' },
        { id: 'system', label: 'System', icon: <Sliders size={18} />, sub: 'Core modules' }
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <Sliders className="animate-spin text-indigo-600 mx-auto mb-4" size={56} />
                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Loading Modules...</p>
            </div>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main flex flex-col h-screen overflow-hidden">
                <Header toggleSidebar={toggleSidebar} />
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 fade-in">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div>
                            
                            {activeTab === 'coupon' && (
                                <div className="fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Coupons</h3>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Promo ranges</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6">
                                        <div className="flex flex-col md:flex-row items-center justify-between bg-indigo-50/40 p-4 rounded border border-indigo-100 mb-8 gap-4 shadow-sm">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-indigo-600 shadow-sm">
                                                    <Ticket size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-indigo-900 uppercase tracking-tight text-sm">Coupon Checklist</p>
                                                    <p className="text-[10px] font-bold text-indigo-700/60 mt-1 uppercase tracking-wider">Tick to unlock in Billing Settings</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={couponEnabled} onChange={(e) => handleToggleCoupon(e.target.checked)} className="hidden peer" />
                                                <div className="w-16 h-8 bg-slate-200 rounded-full peer peer-checked:after:translate-x-8 peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                                            </label>
                                        </div>

                                        {couponSuccess && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Coupon module status updated!</div>}

                                        <div className={`grid grid-cols-1 xl:grid-cols-2 gap-12 transition-opacity ${!couponEnabled ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                                            {/* Form */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded">
                                                        <Plus size={20} />
                                                    </div>
                                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                                        {editingCouponId ? 'Update Coupon' : 'Create New Coupon'}
                                                    </h3>
                                                </div>

                                                <div className="space-y-5">
                                                    <div className="form-group-premium">
                                                        <label>Coupon Name *</label>
                                                        <input type="text" className="input-premium !rounded" value={couponForm.coupon_name} onChange={(e) => setCouponForm({ ...couponForm, coupon_name: e.target.value })} placeholder="e.g. Summer Festival" />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="form-group-premium">
                                                            <label>Number From *</label>
                                                            <input type="number" className="input-premium !rounded" value={couponForm.num_from} onChange={(e) => setCouponForm({ ...couponForm, num_from: e.target.value })} />
                                                        </div>
                                                        <div className="form-group-premium">
                                                            <label>Number To *</label>
                                                            <input type="number" className="input-premium !rounded" value={couponForm.num_to} onChange={(e) => setCouponForm({ ...couponForm, num_to: e.target.value })} />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="form-group-premium">
                                                            <label>Start Date *</label>
                                                            <input type="date" className="input-premium !rounded" value={couponForm.start_date ? couponForm.start_date.split('T')[0] : ''} onChange={(e) => setCouponForm({ ...couponForm, start_date: e.target.value })} />
                                                        </div>
                                                        <div className="form-group-premium">
                                                            <label>End Date *</label>
                                                            <input type="date" className="input-premium !rounded" value={couponForm.end_date ? couponForm.end_date.split('T')[0] : ''} onChange={(e) => setCouponForm({ ...couponForm, end_date: e.target.value })} />
                                                        </div>
                                                    </div>

                                                    <div className="form-group-premium">
                                                        <label>Coupon Mode</label>
                                                        <select className="input-premium !rounded" value={couponForm.type} onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}>
                                                            <option value="DISCOUNT">Fixed / Percentage Discount</option>
                                                            <option value="BOGO">Buy 1 Get 1 Free (BOGO)</option>
                                                        </select>
                                                    </div>

                                                    {couponForm.type === 'DISCOUNT' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="form-group-premium">
                                                                <label>Disc. Mode</label>
                                                                <select className="input-premium !rounded" value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}>
                                                                    <option value="PERCENT">Percentage (%)</option>
                                                                    <option value="FIXED">Fixed Amount (₹)</option>
                                                                </select>
                                                            </div>
                                                            <div className="form-group-premium">
                                                                <label>Amount / %</label>
                                                                <input type="number" className="input-premium !rounded" value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-3 pt-6">
                                                        {editingCouponId && (
                                                            <button onClick={() => { setEditingCouponId(null); setCouponForm({ coupon_name: '', num_from: '', num_to: '', start_date: '', end_date: '', type: 'DISCOUNT', discount_type: 'PERCENT', discount_value: 0 }); }} 
                                                                className="btn-premium-outline flex-1">CANCEL</button>
                                                        )}
                                                        
                            
                            
                            

                            
                            
                            

                            
                            
                            

                            <button
                                type="button"
                                className="btn-export excel"
                                onClick={() => {}}
                                title="Export to Excel"
                            >
                                <Download size={14} />
                                <span className="text-[10px] uppercase font-black text-emerald-500">Excel</span>
                            </button>
                            <button
                                type="button"
                                className="btn-export pdf"
                                onClick={() => {}}
                                title="Export to PDF"
                            >
                                <Download size={14} />
                                <span className="text-[10px] uppercase font-black text-rose-500">PDF</span>
                            </button>
                            <button
                                type="button"
                                className="btn-export print"
                                onClick={() => window.print()}
                                title="Print"
                            >
                                <Printer size={14} />
                                <span className="text-[10px] uppercase font-black text-blue-500">Print</span>
                            </button>
<button onClick={handleSaveCoupon} disabled={savingCoupon} className="btn-action-add">
                                                            {savingCoupon ? <><Loader2 className="animate-spin" /> ...</> : <><Save size={18} /> {editingCouponId ? 'Update' : 'Create'}</>}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* List */}
                                            <div className="bg-slate-50/50 rounded p-4 border border-slate-100 flex flex-col min-h-[500px]">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Coupon List</p>
                                                <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                                    {coupons.map(c => (
                                                        <div key={c._id} className="bg-white p-5 rounded border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <h4 className="font-black text-slate-800 tracking-tight text-sm mb-1">{c.coupon_name}</h4>
                                                                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">{c.type}</span>
                                                                </div>
                                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                    <button onClick={() => { setEditingCouponId(c._id); setCouponForm(c); }} className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"><Edit size={14} /></button>
                                                                    <button onClick={() => handleDeleteCoupon(c._id)} className="p-2 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-600">
                                                                <div>Range: {c.num_from} - {c.num_to}</div>
                                                                <div className="text-right">Value: {c.type === 'DISCOUNT' ? (c.discount_type === 'PERCENT' ? `${c.discount_value}%` : `₹${c.discount_value}`) : 'BOGO'}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {coupons.length === 0 && (
                                                        <div className="text-center py-20 text-slate-300">No coupons found.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'loyalty' && (
                                <div className="fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Loyalty</h3>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Points setup</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6">
                                        {loyaltySuccess && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Loyalty settings saved!</div>}

                                        <div className="max-w-2xl space-y-8">
                                            <div className="flex flex-col md:flex-row items-center justify-between bg-indigo-50/40 p-4 rounded border border-indigo-100 gap-4 shadow-sm">
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-indigo-600 shadow-sm">
                                                        <Gift size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-indigo-900 uppercase tracking-tight text-sm">Loyalty Checklist</p>
                                                        <p className="text-[10px] font-bold text-indigo-700/60 mt-1 uppercase tracking-wider">Tick to unlock in Billing Settings</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="hidden peer" checked={loyaltyForm.enabled} 
                                                        onChange={e => handleToggleLoyalty(e.target.checked)} />
                                                    <div className="w-16 h-8 bg-slate-200 rounded-full peer peer-checked:after:translate-x-8 peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                                                </label>
                                            </div>

                                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${!loyaltyForm.enabled ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                                                <div className="form-group-premium">
                                                    <label>Points Per ₹100 Spent</label>
                                                    <input type="number" className="input-premium !rounded" value={loyaltyForm.points_per_100} 
                                                        onChange={e => setLoyaltyForm({ ...loyaltyForm, points_per_100: e.target.value })} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Min Points to Redeem</label>
                                                    <input type="number" className="input-premium !rounded" value={loyaltyForm.target_points} 
                                                        onChange={e => setLoyaltyForm({ ...loyaltyForm, target_points: e.target.value })} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Rupee Value per Point (₹)</label>
                                                    <input type="number" className="input-premium !rounded" value={loyaltyForm.point_value} 
                                                        onChange={e => setLoyaltyForm({ ...loyaltyForm, point_value: e.target.value })} />
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-4">
                                                <button onClick={handleSaveLoyalty} disabled={savingLoyalty} className="btn-action-save">
                                                    {savingLoyalty ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Loyalty Config</>}
                                                </button>
                                            </div>

                                            <div className="bg-indigo-50/50 rounded p-4 border border-indigo-50 flex gap-4">
                                                <AlertCircle className="text-indigo-600 shrink-0" size={20} />
                                                <p className="text-[11px] font-bold text-indigo-700/70">
                                                    Note: Point value adjustments will affect all existing points. Minimum redemption limit applies at checkout.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'system' && (
                                <div className="fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">System</h3>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Core modules</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6">
                                        {moduleSuccess && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Module settings synchronized!</div>}

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[
                                                { key: 'reports', label: 'Reports Hub', icon: <BarChart3 size={20} />, sub: 'Advanced sales & stock analysis' },
                                                { key: 'kitchen', label: 'Kitchen Display', icon: <Monitor size={20} />, sub: 'Order tracking for chefs' },
                                                { key: 'printer', label: 'Printer Engine', icon: <Printer size={20} />, sub: 'Receipt & KOT printing gateways' },
                                                { key: 'counter', label: 'Counter System', icon: <Clock size={20} />, sub: 'Shift control & multi-counter' },
                                                { key: 'staff', label: 'Waiter & Captain', icon: <Users size={20} />, sub: 'Staff assignments & tracking' },
                                                { key: 'table', label: 'Table Management', icon: <Table size={18} />, sub: 'Floor plan & availability' },
                                                { key: 'management', label: 'Management Suite', icon: <Settings size={18} />, sub: 'Admin controls & configurations' }
                                            ].map(mod => (
                                                <div key={mod.key} className="bg-slate-50/50 p-4 rounded border border-slate-100 flex flex-col justify-between group hover:border-indigo-100 transition-all">
                                                    <div className="mb-6">
                                                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-indigo-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                                            {mod.icon}
                                                        </div>
                                                        <p className="font-black text-slate-800 uppercase tracking-tight text-sm">{mod.label}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{mod.sub}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${moduleStates[mod.key] ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                            {moduleStates[mod.key] ? 'ENABLED' : 'DISABLED'}
                                                        </span>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input type="checkbox" className="hidden peer" checked={moduleStates[mod.key]} 
                                                                onChange={e => handleToggleModule(mod.key, e.target.checked)} />
                                                            <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ExtraModules;
