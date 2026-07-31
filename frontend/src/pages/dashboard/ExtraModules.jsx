import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
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
        reports: true, staff: true, table: true, management: true,
        coupon: false, loyalty: false, kot: true, party_order: true
    });
    const [moduleSuccess, setModuleSuccess] = useState(false);
    const [saving, setSaving] = useState(false);

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
                        management: settingsData.data.modules.management_enabled,
                        coupon: settingsData.data.modules.coupon_enabled,
                        loyalty: settingsData.data.modules.loyalty_enabled,
                        kot: settingsData.data.modules.kot_enabled,
                        party_order: settingsData.data.modules.party_order_enabled
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
    };

    const handleSaveExtraModules = async () => {
        setSaving(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const payload = {
                coupon_enabled: moduleStates.coupon,
                printer_enabled: moduleStates.printer,
                loyalty_enabled: moduleStates.loyalty,
                kot_enabled: moduleStates.kot,
                reports_enabled: moduleStates.reports,
                party_order_enabled: moduleStates.party_order
            };
            await fetch(`${import.meta.env.VITE_API_URL}/settings/modules`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            setModuleSuccess(true);
            setTimeout(() => setModuleSuccess(false), 3000);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const sData = await res.json();
            if (sData.success && sData.data.modules) {
                setModuleSettings(sData.data.modules);
                localStorage.setItem('moduleSettings', JSON.stringify(sData.data.modules));
            }
        } catch (err) { console.error("Failed to save extra modules", err); }
        finally { setSaving(false); }
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
        <DashboardPageShell>
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main flex flex-col h-screen overflow-hidden">
                <Header toggleSidebar={toggleSidebar} />
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white fade-in">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-wider mb-6" style={{ color: '#ea580c' }}>
                                EXTRA MODULES
                            </h2>

                            {moduleSuccess && (
                                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6">
                                    <CheckCircle size={18} /> Extra modules settings saved successfully!
                                </div>
                            )}

                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                {[
                                    { key: 'coupon', label: 'Coupon Module' },
                                    { key: 'printer', label: 'Printer Settings' },
                                    { key: 'loyalty', label: 'Loyalty Module' },
                                    { key: 'kot', label: 'KOT Module' },
                                    { key: 'reports', label: 'Advanced Reports' },
                                    { key: 'party_order', label: 'Party Order Module' }
                                ].map((mod, index) => (
                                    <label
                                        key={mod.key}
                                        className={`flex items-center gap-5 px-6 py-5 cursor-pointer hover:bg-slate-50 transition-colors ${index !== 5 ? 'border-b border-slate-200' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={moduleStates[mod.key] || false}
                                            onChange={(e) => handleToggleModule(mod.key, e.target.checked)}
                                            className="w-5 h-5 rounded border-2 border-slate-400 text-orange-500 focus:ring-orange-500 focus:ring-2 cursor-pointer"
                                            style={{ accentColor: '#ea580c' }}
                                        />
                                        <span className="text-lg font-bold text-slate-800">
                                            {mod.label}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex justify-end mt-10">
                                <button
                                    onClick={handleSaveExtraModules}
                                    disabled={saving}
                                    className="px-10 py-4 text-white font-black uppercase tracking-widest rounded-md shadow-lg hover:opacity-90 transition-all flex items-center gap-3 disabled:opacity-50"
                                    style={{ backgroundColor: '#ea580c', minWidth: '180px', justifyContent: 'center' }}
                                >
                                    {saving ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            SAVE
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </DashboardPageShell>
    );
};

export default ExtraModules;
